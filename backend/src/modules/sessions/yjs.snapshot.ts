import * as Y from "yjs";
import { sessionsService } from "./sessions.service";
import { getYDocFromRegistry, isRoomRegistered } from "../yjs-server/doc.registry";
import { logger } from "../../utils/logger";

const SNAPSHOT_INTERVAL_MS = 10_000;
const timers = new Map<string, NodeJS.Timeout>();

function captureSnapshot(sessionId: string): void {
  if (!sessionsService.isRecording(sessionId)) return;
  const doc = getYDocFromRegistry(sessionId);
  if (!doc) return;

  try {
    const snapshot = Y.encodeStateAsUpdateV2(doc);
    sessionsService.recordEvent(sessionId, "YJS_SNAPSHOT", Buffer.from(snapshot));
  } catch (err) {
    logger.error(`Failed to snapshot Yjs doc for session ${sessionId}`, err);
  }
}

/**
 * Snapshotting runs on whichever replica holds the live Y.Doc. Starting a
 * recording captures an immediate baseline before the periodic snapshots,
 * so short recordings can be replayed without waiting for the first timer.
 */
export function startSnapshotting(sessionId: string): void {
  if (timers.has(sessionId)) return;

  captureSnapshot(sessionId);

  const timer = setInterval(() => {
    if (!sessionsService.isRecording(sessionId)) {
      stopSnapshotting(sessionId);
      return;
    }
    captureSnapshot(sessionId);
  }, SNAPSHOT_INTERVAL_MS);

  timers.set(sessionId, timer);
}

/**
 * Called when a Yjs connection joins a room. This also handles the case
 * where recording started on another replica: the local doc captures its
 * own immediate baseline as soon as the shared recording state is known.
 */
export function ensureSnapshottingIfRecording(sessionId: string): void {
  if (timers.has(sessionId)) return;
  if (!isRoomRegistered(sessionId)) return;
  if (!sessionsService.isRecording(sessionId)) return;
  startSnapshotting(sessionId);
}

export function stopSnapshotting(sessionId: string): void {
  const timer = timers.get(sessionId);
  if (timer) {
    clearInterval(timer);
    timers.delete(sessionId);
  }
}
