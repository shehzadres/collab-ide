import { useEffect, useState } from "react";
import { permissionsApi } from "../lib/api/permissions.api";
import { useSessionRoleStore } from "../store/sessionRoleStore";
import { hasAtLeastRole } from "../lib/permissions/roles";
import { Role } from "../types/permission.types";

/**
 * Fetches and caches the caller's role for a given session. Visiting a
 * session's workspace auto-enrolls the caller server-side (see
 * permissions.middleware.ts's attachSessionMembership), so this resolves to
 * a real role on first load rather than null for any authenticated user who
 * has ever opened the workspace — null only really shows up transiently
 * during the initial fetch.
 */
export function useSessionRole(sessionId: string) {
  const role = useSessionRoleStore((s) => s.rolesBySession[sessionId] ?? null);
  const setRole = useSessionRoleStore((s) => s.setRole);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    permissionsApi
      .myRole(sessionId)
      .then((r) => {
        if (!cancelled) setRole(sessionId, r);
      })
      .catch(() => {
        if (!cancelled) setRole(sessionId, null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, setRole]);

  return {
    role,
    loading,
    hasAtLeast: (minimum: Role) => (role ? hasAtLeastRole(role, minimum) : false),
  };
}
