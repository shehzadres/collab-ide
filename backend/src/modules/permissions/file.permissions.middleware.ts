import { Request, Response, NextFunction } from "express";
import { prisma } from "../../utils/prisma";
import { permissionsService, ForbiddenError } from "./permissions.service";
import { Role } from "./permissions.types";

/**
 * For routes keyed by file id (PATCH/DELETE /files/:id, /files/:id/move),
 * the session a file belongs to isn't in the URL — it's a column on the
 * File row itself. This loads the file first, then re-uses the same
 * session-role check used everywhere else, so file permissions and session
 * permissions are always the same source of truth instead of two parallel
 * systems that could drift out of sync.
 */
export function requireFileSessionRole(minimum: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await prisma.file.findUnique({ where: { id: req.params.id } });
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const role = await permissionsService.requireRole(file.sessionId, req.user!.userId, minimum);
      req.sessionRole = role;
      // Stash the loaded file so the controller doesn't have to fetch it
      // again immediately after this middleware already did.
      (req as Request & { loadedFile?: typeof file }).loadedFile = file;
      next();
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return res.status(403).json({ message: err.message });
      }
      res.status(500).json({ message: "Failed to verify file permissions" });
    }
  };
}

/**
 * Read-oriented counterpart to requireFileSessionRole: auto-enrolls the
 * caller as `defaultRole` (typically VIEWER) instead of rejecting when they
 * have no existing membership row, then attaches their resulting role.
 * Used for GET routes where "you can look, but can't touch without a
 * higher role" is the desired behavior for first-time visitors.
 */
export function attachFileSessionMembership(defaultRole: Role = "VIEWER") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.sessionId ?? null;
      let resolvedSessionId = sessionId;

      if (!resolvedSessionId && req.params.id) {
        const file = await prisma.file.findUnique({ where: { id: req.params.id } });
        if (!file) {
          return res.status(404).json({ message: "File not found" });
        }
        resolvedSessionId = file.sessionId;
        (req as Request & { loadedFile?: typeof file }).loadedFile = file;
      }

      if (!resolvedSessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }

      const role = await permissionsService.ensureMembership(resolvedSessionId, req.user!.userId, defaultRole);
      req.sessionRole = role;
      next();
    } catch (err) {
      res.status(500).json({ message: "Failed to resolve session membership" });
    }
  };
}
