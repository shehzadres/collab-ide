import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import filesRoutes from "./modules/files/files.routes";
import sessionsRoutes from "./modules/sessions/sessions.routes";
import permissionsRoutes from "./modules/permissions/permissions.routes";
import executionRoutes from "./modules/execution/execution.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { env } from "./config/env";

export const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);

const allowedOrigins = env.CLIENT_URL.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/execution", executionRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use(errorMiddleware);
