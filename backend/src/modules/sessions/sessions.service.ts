import { prisma } from "../../utils/prisma";
import { redis, redisSub } from "../../utils/redis";
import { recordingBuffer } from "./recording.buffer";
import { startSnapshotting, stopSnapshotting, ensureSnapshottingIfRecording } from "./yjs.snapshot";
import { RecordingEventType, ReplayEvent } from "./sessions.types";

const RECORDING_KEY_PREFIX = "session:recording:";
const RECORDING_INVALIDATE_CHANNEL = "session:recording:invalidate";
// Source of truth lives in Redis (RECORDING_KEY_PREFIX + sessionId →
// JSON {recordingId, startedAt}) so every backend replica agrees on whether
// a session is recording. recordEvent() is called on the hot path (every
// Yjs update, every terminal byte) and cannot afford a Redis round-trip per
// call, so each process keeps a local synchronous cache, refreshed
// immediately on its own start/stop calls and invalidated via pub/sub when
// another replica starts/stops a recording for the same session.
const localCache = new Map<string, { recordingId: string; startedAt: number } | null>();

redisSub.subscribe(RECORDING_INVALIDATE_CHANNEL).catch(() => {
  // Connection-level errors are already logged by the shared redisSub
  // client's "error" handler in utils/redis.ts.
});

redisSub.on("message", (channel: string, message: string) => {
  if (channel !== RECORDING_INVALIDATE_CHANNEL) return;
  try {
    const { sessionId } = JSON.parse(message) as { sessionId: string };
    localCache.delete(sessionId);
    // Eagerly refresh (rather than waiting for the next isRecording() call
    // to lazily do it) specifically so we can act on the fresh state right
    // away below — a replica that already holds connections for this room
    // needs to start/stop its own snapshot timer immediately when another
    // replica toggles recording, not whenever the next Yjs message happens
    // to arrive and trigger a lazy cache warm.
    sessionsServiceRefreshAndReactToRecordingChange(sessionId);
  } catch {
    // malformed invalidation message — safest fallback is to drop the
    // entire local cache so the next isRecording() call re-fetches from
    // Redis rather than risk operating on stale state indefinitely.
    localCache.clear();
  }
});

async function sessionsServiceRefreshAndReactToRecordingChange(sessionId: string): Promise<void> {
  try {
    const raw = await redis.get(RECORDING_KEY_PREFIX + sessionId);
    const entry = raw ? (JSON.parse(raw) as { recordingId: string; startedAt: number }) : null;
    localCache.set(sessionId, entry);

    if (entry) {
      ensureSnapshottingIfRecording(sessionId);
    } else {
      stopSnapshotting(sessionId);
    }
  } catch {
    // Redis unreachable — leave cache as cleared above; next explicit
    // isRecording() call will retry the fetch.
  }
}

async function publishInvalidation(sessionId: string): Promise<void> {
  try {
    await redis.publish(RECORDING_INVALIDATE_CHANNEL, JSON.stringify({ sessionId }));
  } catch {
    // best-effort — other replicas' caches will still self-correct next
    // time they call refreshCache() after a miss, just not instantly.
  }
}


export class SessionsService {
  async startRecording(sessionId: string, startedById: string) {
    const existing = await this.getRecordingState(sessionId);
    if (existing) return existing;

    const recording = await prisma.sessionRecording.create({
      data: { sessionId, startedById },
    });

    const entry = { recordingId: recording.id, startedAt: Date.now() };
    await redis.set(RECORDING_KEY_PREFIX + sessionId, JSON.stringify(entry));
    localCache.set(sessionId, entry);
    await publishInvalidation(sessionId);
    startSnapshotting(sessionId);
    return entry;
  }

  async stopRecording(sessionId: string) {
    const entry = await this.getRecordingState(sessionId);
    if (!entry) return null;

    stopSnapshotting(sessionId);
    await redis.del(RECORDING_KEY_PREFIX + sessionId);
    localCache.set(sessionId, null);
    await publishInvalidation(sessionId);
    await recordingBuffer.flush();

    const recording = await prisma.sessionRecording.update({
      where: { id: entry.recordingId },
      data: { endedAt: new Date() },
    });

    return recording;
  }

  /** Authoritative check against Redis — used for start/stop, not the hot path. */
  private async getRecordingState(sessionId: string): Promise<{ recordingId: string; startedAt: number } | null> {
    const raw = await redis.get(RECORDING_KEY_PREFIX + sessionId);
    if (!raw) {
      localCache.set(sessionId, null);
      return null;
    }
    const parsed = JSON.parse(raw) as { recordingId: string; startedAt: number };
    localCache.set(sessionId, parsed);
    return parsed;
  }

  /**
   * Hot-path event recording. Reads the local cache synchronously — if this
   * process hasn't seen a start/stop or invalidation for this session yet,
   * worst case it misses recording a few early events until the cache is
   * warmed by an explicit isRecording() call, which is an acceptable
   * trade-off for not blocking every keystroke on a network round-trip.
   */
  recordEvent(sessionId: string, type: RecordingEventType, payload: Buffer, fileId?: string) {
    const entry = localCache.get(sessionId);
    if (!entry) return;

    recordingBuffer.push({
      recordingId: entry.recordingId,
      type,
      fileId,
      payload,
      offsetMs: Date.now() - entry.startedAt,
    });
  }

  /**
   * Synchronous, cache-first check for the hot path (called once per
   * inbound WS message). Falls back to treating an unknown session as "not
   * recording" rather than blocking — callers needing a guaranteed-fresh
   * answer should use startRecording/stopRecording's return values instead.
   */
  isRecording(sessionId: string): boolean {
    if (!localCache.has(sessionId)) {
      // Fire-and-forget warm-up; this call's result reflects pre-warm state
      // (false), but subsequent calls within the same connection's lifetime
      // will be accurate once the promise resolves.
      this.getRecordingState(sessionId).catch(() => {
        // Redis unreachable — leave uncached; next call retries.
      });
      return false;
    }
    return localCache.get(sessionId) !== null;
  }

  async listRecordings(sessionId: string) {
    return prisma.sessionRecording.findMany({
      where: { sessionId },
      orderBy: { startedAt: "desc" },
    });
  }

  async getReplayEvents(recordingId: string): Promise<ReplayEvent[]> {
    const events = await prisma.recordingEvent.findMany({
      where: { recordingId },
      orderBy: [{ offsetMs: "asc" }, { createdAt: "asc" }],
    });

    return events.map((e: {
      id: string;
      type: string;
      fileId: string | null;
      payload: Buffer;
      offsetMs: number;
    }) => ({
      id: e.id,
      type: e.type as RecordingEventType,
      fileId: e.fileId,
      payload: e.payload.toString("base64"),
      offsetMs: e.offsetMs,
    }));
  }

  async deleteRecording(recordingId: string) {
    return prisma.recordingEvent.deleteMany({ where: { recordingId } }).then(() =>
      prisma.sessionRecording.delete({ where: { id: recordingId } })
    );
  }
}

export const sessionsService = new SessionsService();
