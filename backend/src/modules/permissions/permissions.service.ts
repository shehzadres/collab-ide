import { prisma } from "../../utils/prisma";
import { Role, roleAtLeast, CreateInviteDto } from "./permissions.types";
import { publishMembershipChanged } from "./membership.events";

export class PermissionsService {
  /**
   * The first person to touch a session (create a file, open the workspace,
   * start a recording — whatever happens first) becomes its OWNER
   * automatically. Later visitors receive the caller-selected default
   * role (normally VIEWER); invite redemption can grant elevated access.
   * This avoids a separate "create session" step while preserving one
   * initial authority for each session.
   */
  async ensureMembership(sessionId: string, userId: string, defaultRole: Role = "VIEWER"): Promise<Role> {
    // Serialize first-member selection per session. Without this lock, two
    // different users opening a new room simultaneously could both observe
    // an empty membership table and both become OWNER.
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${sessionId})::bigint)) AS lock_result`;

      const existing = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId } },
      });
      if (existing) return existing.role as Role;

      const firstMember = await tx.sessionMember.findFirst({ where: { sessionId } });
      const role: Role = firstMember ? defaultRole : "OWNER";
      const created = await tx.sessionMember.create({
        data: { sessionId, userId, role },
      });
      return created.role as Role;
    });
  }

  async getRole(sessionId: string, userId: string): Promise<Role | null> {
    const member = await prisma.sessionMember.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    return (member?.role as Role) ?? null;
  }

  async requireRole(sessionId: string, userId: string, minimum: Role): Promise<Role> {
    const role = await this.getRole(sessionId, userId);
    if (!role) throw new ForbiddenError("Not a member of this session");
    if (!roleAtLeast(role, minimum)) throw new ForbiddenError("Insufficient role for this action");
    return role;
  }

  async listMembers(sessionId: string) {
    return prisma.sessionMember.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    });
  }

  async updateMemberRole(sessionId: string, targetUserId: string, newRole: Role, actingUserId: string) {
    // Serialize ownership changes so concurrent role edits/removals cannot
    // demote or delete every owner at once.
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${sessionId})::bigint)) AS lock_result`;
      const actor = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId: actingUserId } },
      });
      if (!actor || !roleAtLeast(actor.role as Role, "OWNER")) {
        throw new ForbiddenError("Insufficient role for this action");
      }

      const target = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId: targetUserId } },
      });
      if (!target) throw new Error("Session member not found");
      if (target.role === "OWNER" && newRole !== "OWNER") {
        const ownerCount = await tx.sessionMember.count({ where: { sessionId, role: "OWNER" } });
        if (ownerCount <= 1) {
          throw new ForbiddenError("Cannot demote the last owner of a session");
        }
      }

      return tx.sessionMember.update({
        where: { sessionId_userId: { sessionId, userId: targetUserId } },
        data: { role: newRole },
      });
    });
    await publishMembershipChanged(sessionId, targetUserId);
    return updated;
  }

  async removeMember(sessionId: string, targetUserId: string, actingUserId: string) {
    const removed = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${sessionId})::bigint)) AS lock_result`;
      const actor = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId: actingUserId } },
      });
      if (!actor || !roleAtLeast(actor.role as Role, "OWNER")) {
        throw new ForbiddenError("Insufficient role for this action");
      }
      const target = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId: targetUserId } },
      });
      if (!target) throw new Error("Session member not found");
      if (target.role === "OWNER") {
        const ownerCount = await tx.sessionMember.count({ where: { sessionId, role: "OWNER" } });
        if (ownerCount <= 1) {
          throw new ForbiddenError("Cannot remove the last owner of a session");
        }
      }
      return tx.sessionMember.delete({
        where: { sessionId_userId: { sessionId, userId: targetUserId } },
      });
    });
    await publishMembershipChanged(sessionId, targetUserId);
    return removed;
  }

  async createInvite(dto: CreateInviteDto, createdById: string) {
    if (dto.maxUses !== undefined && dto.maxUses !== null &&
        (!Number.isInteger(dto.maxUses) || dto.maxUses < 1)) {
      throw new Error("maxUses must be a positive integer");
    }
    if (dto.expiresInHours !== undefined && dto.expiresInHours !== null &&
        (!Number.isFinite(dto.expiresInHours) || dto.expiresInHours <= 0)) {
      throw new Error("expiresInHours must be a positive number");
    }

    const expiresAt = dto.expiresInHours
      ? new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000)
      : null;

    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${dto.sessionId})::bigint)) AS lock_result`;
      const actor = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId: dto.sessionId, userId: createdById } },
      });
      if (!actor || !roleAtLeast(actor.role as Role, "OWNER")) {
        throw new ForbiddenError("Insufficient role for this action");
      }
      return tx.sessionInvite.create({
        data: {
          sessionId: dto.sessionId,
          role: dto.role,
          maxUses: dto.maxUses ?? null,
          expiresAt,
          createdById,
        },
      });
    });
  }

  async redeemInvite(token: string, userId: string): Promise<{ sessionId: string; role: Role }> {
    return prisma.$transaction(async (tx) => {
      // Serialize redemptions for a single invite so maxUses cannot be
      // exceeded by simultaneous requests.
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${token})::bigint)) AS lock_result`;
      const invite = await tx.sessionInvite.findUnique({ where: { token } });
      if (!invite) throw new Error("Invite not found");
      if (invite.revokedAt) throw new Error("This invite has been revoked");
      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
        throw new Error("This invite has expired");
      }
      if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
        throw new Error("This invite has reached its maximum number of uses");
      }

      const existing = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId: invite.sessionId, userId } },
      });
      if (existing) {
        return { sessionId: invite.sessionId, role: existing.role as Role };
      }

      await tx.sessionMember.create({
        data: { sessionId: invite.sessionId, userId, role: invite.role },
      });
      await tx.sessionInvite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      });
      return { sessionId: invite.sessionId, role: invite.role as Role };
    });
  }

  async revokeInvite(inviteId: string, actingUserId: string) {
    const invite = await prisma.sessionInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new Error("Invite not found");
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${invite.token})::bigint)) AS lock_result`;
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${invite.sessionId})::bigint)) AS lock_result`;
      const actor = await tx.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId: invite.sessionId, userId: actingUserId } },
      });
      if (!actor || !roleAtLeast(actor.role as Role, "OWNER")) {
        throw new ForbiddenError("Insufficient role for this action");
      }
      return tx.sessionInvite.update({
        where: { id: inviteId },
        data: { revokedAt: new Date() },
      });
    });
  }

  async listInvites(sessionId: string, actingUserId: string) {
    await this.requireRole(sessionId, actingUserId, "OWNER");
    return prisma.sessionInvite.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export const permissionsService = new PermissionsService();
