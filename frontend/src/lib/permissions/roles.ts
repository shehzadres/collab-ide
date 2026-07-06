import { Role } from "../../types/permission.types";

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
  ADMIN: 3,
};

export function hasAtLeastRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canManageRecordings(role: Role): boolean {
  return hasAtLeastRole(role, "OWNER");
}

export function canEditFiles(role: Role): boolean {
  return hasAtLeastRole(role, "EDITOR");
}
