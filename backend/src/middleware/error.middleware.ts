import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message, env.IS_PRODUCTION ? undefined : err.stack);
  if (res.headersSent) return;
  res.status(500).json({ message: "Internal server error" });
}
