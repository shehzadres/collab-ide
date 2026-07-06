import { Request, Response } from "express";
import { permissionsService, ForbiddenError } from "./permissions.service";
import { logger } from "../../utils/logger";
import { Role } from "./permissions.types";

const VALID_ROLES: Role[] = ["ADMIN", "OWNER", "EDITOR", "VIEWER"];

export class PermissionsController {
  async listMembers(req: Request, res: Response) {
    try {
      const members = await permissionsService.listMembers(req.params.sessionId);
      res.status(200).json({ members });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { role } = req.body;
      if (typeof role !== "string" || !VALID_ROLES.includes(role as Role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await permissionsService.updateMemberRole(
        req.params.sessionId,
        req.params.userId,
        role as Role,
        req.user!.userId
      );
      res.status(200).json({ member: updated });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      await permissionsService.removeMember(req.params.sessionId, req.params.userId, req.user!.userId);
      res.status(204).send();
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async createInvite(req: Request, res: Response) {
    try {
      const { role, maxUses, expiresInHours } = req.body;
      const requestedRole: Role = typeof role === "string" && VALID_ROLES.includes(role as Role) ? (role as Role) : "EDITOR";

      const invite = await permissionsService.createInvite(
        {
          sessionId: req.params.sessionId,
          role: requestedRole,
          maxUses: typeof maxUses === "number" ? maxUses : null,
          expiresInHours: typeof expiresInHours === "number" ? expiresInHours : null,
        },
        req.user!.userId
      );
      res.status(201).json({ invite });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async listInvites(req: Request, res: Response) {
    try {
      const invites = await permissionsService.listInvites(req.params.sessionId, req.user!.userId);
      res.status(200).json({ invites });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async revokeInvite(req: Request, res: Response) {
    try {
      await permissionsService.revokeInvite(req.params.inviteId, req.user!.userId);
      res.status(204).send();
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async redeemInvite(req: Request, res: Response) {
    try {
      const result = await permissionsService.redeemInvite(req.params.token, req.user!.userId);
      res.status(200).json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async myRole(req: Request, res: Response) {
    try {
      const role = await permissionsService.getRole(req.params.sessionId, req.user!.userId);
      res.status(200).json({ role });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof ForbiddenError) {
      return res.status(403).json({ message: err.message });
    }
    const message = err instanceof Error ? err.message : "Unexpected error";
    logger.error(message);
    res.status(400).json({ message });
  }
}

export const permissionsController = new PermissionsController();
