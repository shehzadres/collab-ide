import { prisma } from "../../utils/prisma";
import { Role, roleAtLeast, CreateInviteDto } from "./permissions.types";

export class PermissionsService {
  /**
   * The first person to touch a session (create a file, open the workspace,
   * start a recording — whatever happens first) becomes its OWNER
   * automatically. Everyone else must be invited. This avoids needing a
   * separate "create session" step while still giving every session
   * exactly one initial authority.
   */
  async ensureMembership(sessionId: string, userId: string, defaultRole: Role = "EDITOR"): Promise<Role> {
    const existing = await prisma.sessionMember.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) return existing.role as Role;

    const anyMemberExists = await prisma.sessionMember.findFirst({ where: { sessionId } });
    const role: Role = anyMemberExists ? defaultRole : "OWNER";

    const created = await prisma.sessionMember.create({
      data: { sessionId, userId, role },
    });
    return created.role as Role;
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
    // Only OWNER/ADMIN can change roles, and nobody can demote the last
    // remaining OWNER (would orphan the session with no one able to manage
    // membership or invites going forward).
    await this.requireRole(sessionId, actingUserId, "OWNER");

    if (newRole !== "OWNER") {
      const target = await prisma.sessionMember.findUnique({
        where: { sessionId_userId: { sessionId, userId: targetUserId } },
      });
      if (target?.role === "OWNER") {
        const ownerCount = await prisma.sessionMember.count({ where: { sessionId, role: "OWNER" } });
        if (ownerCount <= 1) {
          throw new ForbiddenError("Cannot demote the last owner of a session");
        }
      }
    }

    return prisma.sessionMember.update({
      where: { sessionId_userId: { sessionId, userId: targetUserId } },
      data: { role: newRole },
    });
  }

  async removeMember(sessionId: string, targetUserId: string, actingUserId: string) {
    await this.requireRole(sessionId, actingUserId, "OWNER");
    return prisma.sessionMember.delete({
      where: { sessionId_userId: { sessionId, userId: targetUserId } },
    });
  }

  async createInvite(dto: CreateInviteDto, createdById: string) {
    await this.requireRole(dto.sessionId, createdById, "OWNER");

    const expiresAt = dto.expiresInHours
      ? new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000)
      : null;

    return prisma.sessionInvite.create({
      data: {
        sessionId: dto.sessionId,
        role: dto.role,
        maxUses: dto.maxUses ?? null,
        expiresAt,
        createdById,
      },
    });
  }

  async redeemInvite(token: string, userId: string): Promise<{ sessionId: string; role: Role }> {
    const invite = await prisma.sessionInvite.findUnique({ where: { token } });
    if (!invite) throw new Error("Invite not found");
    if (invite.revokedAt) throw new Error("This invite has been revoked");
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new Error("This invite has expired");
    }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      throw new Error("This invite has reached its maximum number of uses");
    }

    const existing = await prisma.sessionMember.findUnique({
      where: { sessionId_userId: { sessionId: invite.sessionId, userId } },
    });

    if (existing) {
      // Already a member — redeeming again doesn't consume a use or change
      // their existing role (an OWNER clicking an EDITOR invite link they
      // generated themselves shouldn't get demoted).
      return { sessionId: invite.sessionId, role: existing.role as Role };
    }

    await prisma.$transaction([
      prisma.sessionMember.create({
        data: { sessionId: invite.sessionId, userId, role: invite.role },
      }),
      prisma.sessionInvite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      }),
    ]);

    return { sessionId: invite.sessionId, role: invite.role as Role };
  }

  async revokeInvite(inviteId: string, actingUserId: string) {
    const invite = await prisma.sessionInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new Error("Invite not found");
    await this.requireRole(invite.sessionId, actingUserId, "OWNER");
    return prisma.sessionInvite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() },
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
