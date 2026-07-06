export type Role = "ADMIN" | "OWNER" | "EDITOR" | "VIEWER";

export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
  ADMIN: 3,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export interface CreateInviteDto {
  sessionId: string;
  role: Role;
  maxUses?: number | null;
  expiresInHours?: number | null;
}

export interface SessionMembershipInfo {
  userId: string;
  sessionId: string;
  role: Role;
}
