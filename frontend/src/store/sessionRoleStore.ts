import { create } from "zustand";
import { Role } from "../types/permission.types";

interface SessionRoleState {
  /** Keyed by sessionId since a user can hold different roles per session. */
  rolesBySession: Record<string, Role | null>;
  setRole: (sessionId: string, role: Role | null) => void;
}

export const useSessionRoleStore = create<SessionRoleState>((set) => ({
  rolesBySession: {},
  setRole: (sessionId, role) =>
    set((state) => ({ rolesBySession: { ...state.rolesBySession, [sessionId]: role } })),
}));
