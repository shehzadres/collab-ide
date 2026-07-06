import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

// Two separate connections are required by ioredis/Redis pub-sub semantics:
// a connection that's actively subscribed to a channel cannot also issue
// normal commands (GET/SET/etc). Using one client for both would silently
// break either the pub/sub side or the command side under load.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

export const redisSub = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redis.on("error", (err) => logger.error("Redis client error", err));
redisSub.on("error", (err) => logger.error("Redis subscriber error", err));

redis.on("connect", () => logger.info("Redis client connected"));
redisSub.on("connect", () => logger.info("Redis subscriber connected"));

export async function disconnectRedis(): Promise<void> {
  await Promise.allSettled([redis.quit(), redisSub.quit()]);
}
