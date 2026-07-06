export type Role = "ADMIN" | "OWNER" | "EDITOR" | "VIEWER";

export interface PermissionContext {
  role: Role;
}

export interface SessionMemberInfo {
  id: string;
  sessionId: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface SessionInviteInfo {
  id: string;
  sessionId: string;
  token: string;
  role: Role;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreateInvitePayload {
  role: Role;
  maxUses?: number | null;
  expiresInHours?: number | null;
}

