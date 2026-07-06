import * as Y from "yjs";
import { sessionsService } from "./sessions.service";
import { getYDocFromRegistry, isRoomRegistered } from "../yjs-server/doc.registry";
import { logger } from "../../utils/logger";

const SNAPSHOT_INTERVAL_MS = 10_000;
const timers = new Map<string, NodeJS.Timeout>();

/**
 * Snapshotting must run on whichever replica actually holds the live Y.Doc
 * for a room, not on whichever replica happened to receive the HTTP
 * /start call — with multiple backend replicas behind a load balancer those
 * are frequently different processes. startSnapshotting/stopSnapshotting
 * are therefore called from two places: sessions.service.ts on the
 * replica that processes start/stop (a no-op there if it holds no doc for
 * the room, since the interval below checks isRoomRegistered itself), and
 * yjs.server.ts whenever a connection joins/leaves a room on this replica,
 * so the replica that's actually hosting the doc picks up snapshotting
 * even if recording was started elsewhere.
 */
export function startSnapshotting(sessionId: string): void {
  if (timers.has(sessionId)) return;

  const timer = setInterval(() => {
    if (!sessionsService.isRecording(sessionId)) {
      stopSnapshotting(sessionId);
      return;
    }

    const doc = getYDocFromRegistry(sessionId);
    if (!doc) {
      // No live doc on this replica for this room — nothing to snapshot
      // here. Another replica that does hold a connection for this room
      // will have its own timer (started via yjs.server.ts's connection
      // hook) actually producing snapshots.
      return;
    }

    try {
      const snapshot = Y.encodeStateAsUpdateV2(doc);
      sessionsService.recordEvent(sessionId, "YJS_SNAPSHOT", Buffer.from(snapshot));
    } catch (err) {
      logger.error(`Failed to snapshot Yjs doc for session ${sessionId}`, err);
    }
  }, SNAPSHOT_INTERVAL_MS);

  timers.set(sessionId, timer);
}

/**
 * Starts snapshotting for a room on this replica if (a) the room is
 * currently being recorded per the shared Redis-backed state, and (b) this
 * replica actually holds a live doc for it. Called whenever a connection
 * joins a room so a replica that picks up the first connection for an
 * already-recording session begins snapshotting immediately, rather than
 * waiting for some other replica's start() call that may never come on
 * this process.
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
