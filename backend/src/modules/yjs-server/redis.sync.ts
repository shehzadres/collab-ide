import * as Y from "yjs";
import { redis, redisSub } from "../../utils/redis";
import { logger } from "../../utils/logger";

const CHANNEL_PREFIX = "yjs:room:";
const subscribedRooms = new Set<string>();
// Tags every update this process publishes so its own subscriber callback
// can ignore the echo — Redis pub/sub delivers to all subscribers including
// the publisher's own connection if it's also subscribed to the channel.
const processId = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

interface RoomBinding {
  doc: Y.Doc;
  onLocalUpdate: (update: Uint8Array, origin: unknown) => void;
}

const bindings = new Map<string, RoomBinding>();

/**
 * Wires a Y.Doc so any local update is published to Redis (for other
 * replicas to pick up) and any update published by another replica is
 * applied locally. This is what makes collaboration correct when requests
 * for the same room land on different backend processes behind a load
 * balancer — without this, each process's Y.Doc is an isolated island.
 */
export function attachRedisSync(roomId: string, doc: Y.Doc): void {
  if (bindings.has(roomId)) return;

  const channel = CHANNEL_PREFIX + roomId;

  const onLocalUpdate = (update: Uint8Array, origin: unknown) => {
    // origin === "redis-remote" marks updates we just applied *from* Redis —
    // republishing those would create an infinite loop across replicas.
    if (origin === "redis-remote") return;

    const envelope = JSON.stringify({
      pid: processId,
      update: Buffer.from(update).toString("base64"),
    });
    redis.publish(channel, envelope).catch((err) => {
      logger.error(`Failed to publish Yjs update for room ${roomId}`, err);
    });
  };

  doc.on("update", onLocalUpdate);
  bindings.set(roomId, { doc, onLocalUpdate });

  if (!subscribedRooms.has(roomId)) {
    subscribedRooms.add(roomId);
    redisSub.subscribe(channel).catch((err) => {
      logger.error(`Failed to subscribe to Redis channel for room ${roomId}`, err);
    });
  }
}

export function detachRedisSync(roomId: string): void {
  const binding = bindings.get(roomId);
  if (binding) {
    binding.doc.off("update", binding.onLocalUpdate);
    bindings.delete(roomId);
  }

  if (subscribedRooms.has(roomId)) {
    subscribedRooms.delete(roomId);
    redisSub.unsubscribe(CHANNEL_PREFIX + roomId).catch((err) => {
      logger.error(`Failed to unsubscribe from Redis channel for room ${roomId}`, err);
    });
  }
}

// Single shared message handler for all rooms — ioredis delivers every
// subscribed channel's messages through this one event, so we dispatch by
// channel name rather than registering a handler per room.
redisSub.on("message", (channel: string, message: string) => {
  if (!channel.startsWith(CHANNEL_PREFIX)) return;
  const roomId = channel.slice(CHANNEL_PREFIX.length);
  const binding = bindings.get(roomId);
  if (!binding) return;

  try {
    const parsed = JSON.parse(message) as { pid: string; update: string };
    if (parsed.pid === processId) return; // our own publish — ignore

    const update = Buffer.from(parsed.update, "base64");
    Y.applyUpdate(binding.doc, update, "redis-remote");
  } catch (err) {
    logger.error(`Failed to apply remote Yjs update for room ${roomId}`, err);
  }
});
