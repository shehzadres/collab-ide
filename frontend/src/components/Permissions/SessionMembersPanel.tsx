import { useEffect, useState, useCallback } from "react";
import { permissionsApi } from "../../lib/api/permissions.api";
import { SessionMemberInfo, SessionInviteInfo, Role } from "../../types/permission.types";
import { useAuthStore } from "../../store/authStore";

interface SessionMembersPanelProps {
  sessionId: string;
  canManage: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: Role[] = ["VIEWER", "EDITOR", "OWNER"];

export function SessionMembersPanel({ sessionId, canManage, onClose }: SessionMembersPanelProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<SessionMemberInfo[]>([]);
  const [invites, setInvites] = useState<SessionInviteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteRole, setInviteRole] = useState<Role>("EDITOR");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const memberList = await permissionsApi.listMembers(sessionId);
      setMembers(memberList);
      if (canManage) {
        const inviteList = await permissionsApi.listInvites(sessionId);
        setInvites(inviteList.filter((i) => !i.revokedAt));
      }
    } catch {
      setError("Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await permissionsApi.updateMemberRole(sessionId, userId, role);
      await load();
    } catch {
      setError("Failed to update role. You may not have permission, or this would remove the last owner.");
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member from the session?")) return;
    try {
      await permissionsApi.removeMember(sessionId, userId);
      await load();
    } catch {
      setError("Failed to remove member.");
    }
  };

  const handleCreateInvite = async () => {
    try {
      const invite = await permissionsApi.createInvite(sessionId, { role: inviteRole });
      setInvites((prev) => [invite, ...prev]);
    } catch {
      setError("Failed to create invite.");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await permissionsApi.revokeInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      setError("Failed to revoke invite.");
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard?.writeText(url).catch(() => {
      // Clipboard API unavailable (e.g. insecure context) — the link is
      // still visible in the list for manual copy.
    });
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-panel border border-border rounded-lg shadow-popover max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
          <h2 className="text-sm font-semibold text-ink">Session members</h2>
          <button onClick={onClose} className="text-faint hover:text-ink text-sm">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && <p className="text-xs text-danger mb-3">{error}</p>}
          {loading ? (
            <p className="text-xs text-faint">Loading...</p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-ink truncate">
                      {m.user.username}
                      {m.userId === currentUser?.id && <span className="text-faint text-xs"> (you)</span>}
                    </span>
                    {canManage && m.userId !== currentUser?.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.userId, e.target.value as Role)}
                          className="text-xs bg-hover text-ink rounded px-1.5 py-1 border border-border"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(m.userId)}
                          className="text-xs text-danger hover:opacity-80"
                          title="Remove member"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-faint flex-shrink-0">{m.role}</span>
                    )}
                  </li>
                ))}
              </ul>

              {canManage && (
                <div className="mt-5 pt-4 border-t border-subtle">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Invite links
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className="text-xs bg-hover text-ink rounded px-2 py-1.5 border border-border"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          Invite as {r}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateInvite}
                      className="text-xs bg-accent hover:bg-accent-hover text-accent-fg rounded px-3 py-1.5"
                    >
                      Create link
                    </button>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {invites.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between gap-2 text-xs bg-hover/60 rounded px-2 py-1.5"
                      >
                        <span className="text-muted truncate">
                          {inv.role} · used {inv.useCount}
                          {inv.maxUses !== null ? `/${inv.maxUses}` : ""}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => copyInviteLink(inv.token)} className="text-accent hover:opacity-80">
                            Copy link
                          </button>
                          <button onClick={() => handleRevokeInvite(inv.id)} className="text-danger hover:opacity-80">
                            Revoke
                          </button>
                        </div>
                      </li>
                    ))}
                    {invites.length === 0 && (
                      <li className="text-xs text-faint px-2 py-1">No active invite links.</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
