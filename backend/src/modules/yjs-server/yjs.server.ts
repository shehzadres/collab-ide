import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import * as decoding from "lib0/decoding";
import * as Y from "yjs";
import { messageYjsSyncStep1, messageYjsSyncStep2, messageYjsUpdate } from "y-protocols/sync";
import { setupWSConnection, docs } from "y-websocket/bin/utils";
import { verifyAccessToken } from "../../utils/jwt";
import { sessionsService } from "../sessions/sessions.service";
import { permissionsService } from "../permissions/permissions.service";
import { onMembershipChanged } from "../permissions/membership.events";
import { registerYDoc, unregisterYDoc, isRoomRegistered } from "./doc.registry";
import { attachRedisSync, detachRedisSync } from "./redis.sync";
import { ensureSnapshottingIfRecording } from "../sessions/yjs.snapshot";
import { logger } from "../../utils/logger";

const MAX_YJS_PAYLOAD = 5 * 1024 * 1024;
const activeConnections = new Map<string, Map<WebSocket, string>>();

onMembershipChanged((sessionId, userId) => {
  const connections = activeConnections.get(sessionId);
  if (!connections) return;
  for (const [socket, connectedUserId] of connections) {
    if (connectedUserId === userId && socket.readyState === WebSocket.OPEN) {
      socket.close(1008, "session membership changed");
    }
  }
});
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
 * Returns true if this raw Yjs protocol frame would mutate the document
 * if applied. SyncStep1, awareness, and empty SyncStep2 handshake replies
 * are safe for viewers; SyncStep2 replies containing structs or delete-set
 * entries and incremental updates are blocked. Malformed frames fail closed.
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
    if (innerType === messageYjsSyncStep1) return false;
    if (innerType !== messageYjsSyncStep2 && innerType !== messageYjsUpdate) return true;

    // SyncStep2 is also used for the initial handshake. A viewer must be
    // allowed to answer with an empty update, but never with document structs
    // or delete-set entries that would change shared state.
    const update = decoding.readVarUint8Array(decoder);
    const decoded = Y.decodeUpdate(update);
    return decoded.structs.length > 0 || decoded.ds.clients.size > 0;
  } catch {
    return true;
  }
}

function extractRoomId(req: IncomingMessage): string | null {
  const raw = req.url || "/default";
  const path = raw.split("?")[0];
  const roomPath = path.startsWith("/ws/") ? path.slice(4) : path.replace(/^\//, "");
  const id = roomPath.split("/")[0];

  if (
    !id ||
    roomPath.includes("/") ||
    id.length > MAX_ROOM_ID_LENGTH ||
    !/^[a-zA-Z0-9_-]+$/.test(id)
  ) {
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

    // The membership lookup below is asynchronous. The Yjs client sends
    // SyncStep1 immediately after the HTTP upgrade, so buffer early frames
    // until setupWSConnection has registered its message listener.
    const pendingMessages: Array<{ data: Buffer; isBinary: boolean }> = [];
    const MAX_PENDING_BYTES = 5 * 1024 * 1024;
    let pendingBytes = 0;
    let connectionClosed = false;
    const bufferIncoming = (data: Buffer, isBinary: boolean) => {
      const frame = Buffer.from(data);
      if (pendingBytes + frame.length > MAX_PENDING_BYTES) {
        pendingMessages.length = 0;
        ws.close(1009, "too much data before session authorization");
        return;
      }
      pendingBytes += frame.length;
      pendingMessages.push({ data: frame, isBinary });
    };
    ws.on("message", bufferIncoming);
    ws.once("close", () => {
      connectionClosed = true;
      pendingMessages.length = 0;
      const connections = activeConnections.get(roomId);
      connections?.delete(ws);
      if (connections?.size === 0) activeConnections.delete(roomId);
    });

    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token") || "";
    let isReadOnly = false;
    let connectedUserId = "";
    try {
      const payload = verifyAccessToken(token);
      connectedUserId = payload.userId;
      // Resolve membership before accepting document traffic. The REST
      // workspace flow also auto-enrols first-time visitors; doing the same
      // here closes the race where the editor WebSocket connects before the
      // file-tree request has created the membership row.
      const role = await permissionsService.ensureMembership(roomId, payload.userId, "VIEWER");
      isReadOnly = role === "VIEWER";
    } catch (error) {
      logger.warn("Yjs membership resolution failed for room " + roomId, error);
      ws.removeListener("message", bufferIncoming);
      ws.close(1011, "membership could not be verified");
      return;
    }
    if (connectionClosed || ws.readyState !== WebSocket.OPEN) {
      ws.removeListener("message", bufferIncoming);
      return;
    }
    const roomConnections = activeConnections.get(roomId) ?? new Map<WebSocket, string>();
    roomConnections.set(ws, connectedUserId);
    activeConnections.set(roomId, roomConnections);
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

    // Replay frames received while membership was being resolved. The Yjs
    // protocol listener is now installed, so the initial sync cannot vanish.
    ws.removeListener("message", bufferIncoming);
    for (const pending of pendingMessages) {
      ws.emit("message", pending.data, pending.isBinary);
    }
    pendingMessages.length = 0;

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
