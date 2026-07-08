import Redis, { RedisOptions } from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

function makeRedisOptions(url: string): RedisOptions {
  const isTLS = url.startsWith("rediss://");
  return {
    // Upstash (and other TLS Redis providers) use the rediss:// scheme.
    // ioredis does not enable TLS automatically from the URL — it must be
    // set explicitly, otherwise the connection is silently rejected.
    ...(isTLS ? { tls: {} } : {}),
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 200, 2000),
    // Prevent an unhandled error from taking down the process before the
    // .on("error") handler is attached.
    lazyConnect: false,
  };
}

// Two separate connections are required by ioredis/Redis pub-sub semantics:
// a connection that's actively subscribed to a channel cannot also issue
// normal commands (GET/SET/etc). Using one client for both would silently
// break either the pub/sub side or the command side under load.
export const redis = new Redis(env.REDIS_URL, makeRedisOptions(env.REDIS_URL));
export const redisSub = new Redis(env.REDIS_URL, makeRedisOptions(env.REDIS_URL));

redis.on("error", (err) => logger.error("Redis client error", err));
redisSub.on("error", (err) => logger.error("Redis subscriber error", err));

redis.on("connect", () => logger.info("Redis client connected"));
redisSub.on("connect", () => logger.info("Redis subscriber connected"));

export async function disconnectRedis(): Promise<void> {
  await Promise.allSettled([redis.quit(), redisSub.quit()]);
}
