import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

// @types/jsonwebtoken types `expiresIn` as `number | StringValue` (a branded
// template-literal type like "15m" | "7d" | ...), not a plain `string`. Our
// env vars are validated strings read at runtime, so we deliberately assert
// through SignOptions here rather than trying to type env.ts's return value
// as that branded type (which would leak a jsonwebtoken-specific type into
// config/env.ts for no real benefit).
function signOptions(expiresIn: string): SignOptions {
  return { expiresIn: expiresIn as SignOptions["expiresIn"] };
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, signOptions(env.ACCESS_TOKEN_TTL));
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, signOptions(env.REFRESH_TOKEN_TTL));
}

function assertAccessPayload(decoded: string | JwtPayload): AccessTokenPayload {
  if (typeof decoded === "string" || !decoded.userId || !decoded.role) {
    throw new Error("Malformed token payload");
  }
  return { userId: decoded.userId, role: decoded.role };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return assertAccessPayload(decoded);
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return assertAccessPayload(decoded);
}
