import { Request, Response, NextFunction } from "express";
import { prisma } from "../../utils/prisma";
import { permissionsService, ForbiddenError } from "./permissions.service";
import { Role } from "./permissions.types";

/**
 * Recording routes are keyed by recordingId, not sessionId — the same
 * "resolve the parent, then check role" pattern as file.permissions.middleware,
 * applied to SessionRecording instead of File.
 */
export function requireRecordingSessionRole(minimum: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recording = await prisma.sessionRecording.findUnique({
        where: { id: req.params.recordingId },
      });
      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      const role = await permissionsService.requireRole(recording.sessionId, req.user!.userId, minimum);
      req.sessionRole = role;
      (req as Request & { loadedRecording?: typeof recording }).loadedRecording = recording;
      next();
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return res.status(403).json({ message: err.message });
      }
      res.status(500).json({ message: "Failed to verify recording permissions" });
    }
  };
}
