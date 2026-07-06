import http from "http";
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { attachWebSocketServers } from "./websocket/ws.server";
import { prisma } from "./utils/prisma";
import { recordingBuffer } from "./modules/sessions/recording.buffer";
import { disconnectRedis } from "./utils/redis";
import { startWorkspaceReaper, stopWorkspaceReaper } from "./modules/execution/workspace.reaper";

const server = http.createServer(app);
attachWebSocketServers(server);
startWorkspaceReaper();

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  stopWorkspaceReaper();

  server.close(() => {
    logger.info("HTTP server closed");
  });

  try {
    await recordingBuffer.flush();
    recordingBuffer.shutdown();
  } catch (err) {
    logger.error("Error flushing recording buffer during shutdown", err);
  }

  try {
    await prisma.$disconnect();
  } catch (err) {
    logger.error("Error disconnecting Prisma during shutdown", err);
  }

  try {
    await disconnectRedis();
  } catch (err) {
    logger.error("Error disconnecting Redis during shutdown", err);
  }

  setTimeout(() => process.exit(0), 3000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — exiting", err);
  process.exit(1);
});
