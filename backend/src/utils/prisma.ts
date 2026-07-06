import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

export const prisma = new PrismaClient({
  log: env.IS_PRODUCTION ? ["error", "warn"] : ["query", "error", "warn"],
});
