import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import * as decoding from "lib0/decoding";
import { messageYjsSyncStep2, messageYjsUpdate } from "y-protocols/sync";
import { setupWSConnection, docs } from "y-websocket/bin/utils";
import { verifyAccessToken } from "../../utils/jwt";
import { sessionsService } from "../sessions/sessions.service";
import { permissionsService } from "../permissions/permissions.service";
import { registerYDoc, unregisterYDoc, isRoomRegistered } from "./doc.registry";
import { attachRedisSync, detachRedisSync } from "./redis.sync";
import { ensureSnapshottingIfRecording } from "../sessions/yjs.snapshot";
import { logger } from "../../utils/logger";

const MAX_YJS_PAYLOAD = 5 * 1024 * 1024;
const MAX_ROOM_ID_LENGTH = 128;

// Outer envelope type, per y-websocket's bin/utils.cjs (not exported, so
// mirrored here as the same stable values: 0 = sync sub-protocol message,
// 1 = awareness update). These two constants plus the inner sync-message
// types from y-protocols/sync are what let us distinguish a read-only-safe
// frame (SyncStep1: "here's my state, send me what I'm missing" — no doc
// mutation) from a content-injecting frame (SyncStep2 / Update: "here's
// data, apply it to your doc") without needing to fork or reimplement any
// part of y-websocket's actual sync logic.
const MESSAGE_SYNC = 0;

/**
 * Returns true if this raw Yjs protocol frame would mutate the document if
 * applied (a sync-step-2 reply or an incremental update), as opposed to a
 * read-only frame like sync-step-1 (a state-vector request) or an
 * awareness broadcast. Malformed/undecodable frames are treated as
 * mutating (fail closed) rather than silently passed through.
 */
function frameMutatesDocument(data: Buffer): boolean {
  try {
    const decoder = decoding.createDecoder(data);
    const outerType = decoding.readVarUint(decoder);
    if (outerType !== MESSAGE_SYNC) {
      // Awareness frames (outerType === 1) never mutate the Y.Doc itself.
      return false;
    }
    const innerType = decoding.readVarUint(decoder);
    return innerType === messageYjsSyncStep2 || innerType === messageYjsUpdate;
  } catch {
    return true;
  }
}

function extractRoomId(req: IncomingMessage): string | null {
  const raw = req.url || "/default";
  const path = raw.split("?")[0];
  const id = path.replace(/^\//, "");
  if (!id || id.length > MAX_ROOM_ID_LENGTH || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return null;
  }
  return id;
}

/**
 * Wraps `ws` so any inbound frame that would mutate the shared document is
 * dropped before setupWSConnection's own "message" listener ever sees it.
 * setupWSConnection only reads frames via a "message" event listener (it
 * doesn't poll or read the socket any other way), so intercepting that one
 * registration point is sufficient and doesn't require touching anything
 * inside y-websocket itself. Read-only-safe frames (SyncStep1, awareness)
 * pass through untouched, so a VIEWER still receives the live document and
 * everyone else's cursors — they just can't inject content back into it.
 */
function wrapReadOnlySocket(ws: WebSocket): WebSocket {
  return new Proxy(ws, {
    get(target, prop, receiver) {
      if (prop === "on" || prop === "addListener" || prop === "once") {
        return (event: string, listener: (...args: unknown[]) => void) => {
          if (event !== "message") {
            return (target as any)[prop](event, listener);
          }
          const filtered = (data: Buffer, isBinary: boolean) => {
            if (isBinary && frameMutatesDocument(data)) {
              return; // drop — read-only connection, no document mutations allowed
            }
            listener(data, isBinary);
          };
          return (target as any)[prop](event, filtered);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export function createYjsServer(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_YJS_PAYLOAD });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const roomId = extractRoomId(req);
    if (!roomId) {
      ws.close(1008, "invalid room id");
      return;
    }

    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token") || "";
    let isReadOnly = false;
    try {
      const payload = verifyAccessToken(token);
      const role = await permissionsService.getRole(roomId, payload.userId);
      // No membership row yet (first-time visitor who hasn't hit a REST
      // endpoint that auto-enrolls them) defaults to allowing writes —
      // ensureMembership() elsewhere will create their row as OWNER/EDITOR
      // on first REST call. Only an *explicit* VIEWER role is read-only.
      isReadOnly = role === "VIEWER";
    } catch {
      // Token was already validated once in authenticateYjsUpgrade() before
      // the upgrade was accepted; a failure here just means we couldn't
      // resolve a role, so default to permissive rather than breaking
      // already-authenticated connections.
    }

    const effectiveWs = isReadOnly ? wrapReadOnlySocket(ws) : ws;

    setupWSConnection(effectiveWs, req, { docName: roomId, gc: true });

    const doc = docs.get(roomId);
    if (doc) {
      registerYDoc(roomId, doc);
      // Attach exactly once per (process, room) — attachRedisSync is itself
      // idempotent (checks bindings.has(roomId)), but we only want to do
      // this when the room is newly registered in this process, not on
      // every connection to an already-active room.
      attachRedisSync(roomId, doc);
      // If this room is already being recorded (started via another
      // replica, or before this connection joined) and this is the first
      // local doc registration for it, start snapshotting here too — see
      // yjs.snapshot.ts for why this can't rely solely on the replica that
      // received the original /start call.
      ensureSnapshottingIfRecording(roomId);
    }

    const onMessage = (data: Buffer, isBinary: boolean) => {
      if (isBinary && !isReadOnly && sessionsService.isRecording(roomId)) {
        sessionsService.recordEvent(roomId, "YJS_UPDATE", Buffer.from(data));
      }
    };
    ws.on("message", onMessage);

    ws.on("close", () => {
      ws.removeListener("message", onMessage);
      unregisterYDoc(roomId);
      // Only tear down this process's Redis subscription once no local
      // connections remain for the room — doc.registry's refcount already
      // tracks exactly that.
      if (!isRoomRegistered(roomId)) {
        detachRedisSync(roomId);
      }
    });

    ws.on("error", (err) => {
      logger.warn(`Yjs WS error in room ${roomId}`, err);
    });
  });

  return wss;
}

export function authenticateYjsUpgrade(req: IncomingMessage): boolean {
  try {
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) return false;
    verifyAccessToken(token);
    return true;
  } catch (err) {
    logger.warn("Yjs upgrade auth failed", err);
    return false;
  }
}
