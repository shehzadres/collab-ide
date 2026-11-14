import { redis, redisSub } from "../../utils/redis";
import { logger } from "../../utils/logger";

const CHANNEL = "session:membership:changed";
type MembershipChangeHandler = (sessionId: string, userId: string) => void;
const handlers = new Set<MembershipChangeHandler>();

function notifyLocalHandlers(sessionId: string, userId: string) {
  for (const handler of handlers) {
    try {
      handler(sessionId, userId);
    } catch (error) {
      logger.warn("Membership change handler failed", error);
    }
  }
}

redisSub.subscribe(CHANNEL).catch((error) => {
  logger.warn("Could not subscribe to membership change events", error);
});

redisSub.on("message", (channel: string, message: string) => {
  if (channel !== CHANNEL) return;
  try {
    const event = JSON.parse(message) as { sessionId: string; userId: string };
    if (event.sessionId && event.userId) {
      notifyLocalHandlers(event.sessionId, event.userId);
    }
  } catch {
    logger.warn("Received malformed membership change event");
  }
});

export function onMembershipChanged(handler: MembershipChangeHandler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export async function publishMembershipChanged(sessionId: string, userId: string) {
  // Close sockets on this replica immediately, even if Redis is unavailable.
  notifyLocalHandlers(sessionId, userId);
  try {
    await redis.publish(CHANNEL, JSON.stringify({ sessionId, userId }));
  } catch (error) {
    logger.warn("Could not publish membership change event", error);
  }
}
