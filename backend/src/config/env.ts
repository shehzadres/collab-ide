import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function requireMinLength(key: string, value: string, minLen: number): string {
  if (value.length < minLen) {
    throw new Error(`Env var ${key} must be at least ${minLen} characters (got ${value.length})`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const jwtAccessSecret = required("JWT_ACCESS_SECRET");
const jwtRefreshSecret = required("JWT_REFRESH_SECRET");

if (isProduction) {
  requireMinLength("JWT_ACCESS_SECRET", jwtAccessSecret, 32);
  requireMinLength("JWT_REFRESH_SECRET", jwtRefreshSecret, 32);
  if (jwtAccessSecret === jwtRefreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical");
  }
  if (/changeme/i.test(jwtAccessSecret) || /changeme/i.test(jwtRefreshSecret)) {
    throw new Error("Default placeholder JWT secrets detected in production — set real secrets");
  }
}

export const env = {
  NODE_ENV: nodeEnv,
  IS_PRODUCTION: isProduction,
  PORT: parseInt(process.env.PORT || "4000", 10),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_ACCESS_SECRET: jwtAccessSecret,
  JWT_REFRESH_SECRET: jwtRefreshSecret,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
  CLIENT_URL: required("CLIENT_URL"),
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  MAX_TERMINAL_SESSIONS: parseInt(process.env.MAX_TERMINAL_SESSIONS || "50", 10),
  TERMINAL_IDLE_TIMEOUT_MS: parseInt(process.env.TERMINAL_IDLE_TIMEOUT_MS || "600000", 10),
};
