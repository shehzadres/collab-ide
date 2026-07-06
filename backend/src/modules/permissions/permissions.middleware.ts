import { Request, Response, NextFunction } from "express";
import { permissionsService, ForbiddenError } from "./permissions.service";
import { Role } from "./permissions.types";

declare global {
  namespace Express {
    interface Request {
      sessionRole?: Role;
    }
  }
}

/**
 * Resolves the caller's sessionId from req.params (checking common param
 * names used across routes) since different routers name it differently
 * (:sessionId directly, or indirectly via :id on a file that belongs to a
 * session — handled by requireFileOwnerOrRole instead, see files.middleware).
 */
function resolveSessionId(req: Request): string | null {
  return req.params.sessionId ?? req.body?.sessionId ?? null;
}

/**
 * Auto-enrolls the caller into the session (as the first member becomes
 * OWNER automatically, everyone else as the route's default role) and
 * attaches their resolved role to req.sessionRole for downstream handlers.
 * This intentionally does not reject anyone — joining a session by visiting
 * its workspace URL is allowed by design; the *role* you get determines
 * what you can subsequently do.
 */
export function attachSessionMembership(defaultRole: Role = "EDITOR") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = resolveSessionId(req);
      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }
      const role = await permissionsService.ensureMembership(sessionId, req.user!.userId, defaultRole);
      req.sessionRole = role;
      next();
    } catch (err) {
      res.status(500).json({ message: "Failed to resolve session membership" });
    }
  };
}

/** Requires the caller already hold at least `minimum` role in the session. */
export function requireSessionRole(minimum: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = resolveSessionId(req);
      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }
      const role = await permissionsService.requireRole(sessionId, req.user!.userId, minimum);
      req.sessionRole = role;
      next();
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return res.status(403).json({ message: err.message });
      }
      res.status(500).json({ message: "Failed to verify session permissions" });
    }
  };
}
