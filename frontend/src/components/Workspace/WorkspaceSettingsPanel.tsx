import { useState } from "react";
import { useWorkspaceConfig } from "../../hooks/useWorkspaceConfig";
import { RUNTIME_OPTIONS } from "../../types/execution.types";

interface WorkspaceSettingsPanelProps {
  sessionId: string;
  canManageNetwork: boolean;
  onClose: () => void;
}

export function WorkspaceSettingsPanel({ sessionId, canManageNetwork, onClose }: WorkspaceSettingsPanelProps) {
  const { config, loading, error, setRuntime, setNetworkEnabled, resetWorkspace } = useWorkspaceConfig(sessionId);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm("This stops and deletes the current workspace container, including any running processes and installed packages. Continue?")) {
      return;
    }
    setResetting(true);
    try {
      await resetWorkspace();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-panel border border-border rounded-lg shadow-popover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
          <h2 className="text-sm font-semibold text-ink">Workspace settings</h2>
          <button onClick={onClose} className="text-faint hover:text-ink text-sm">
            ✕
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-5">
          {error && <p className="text-xs text-danger">{error}</p>}
          {loading || !config ? (
            <p className="text-xs text-faint">Loading...</p>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-2">
                  Runtime
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RUNTIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setRuntime(opt.id)}
                      className={`text-sm px-3 py-2 rounded border ${
                        config.runtime === opt.id
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-ink hover:bg-hover"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-faint mt-2">
                  Changing this takes effect the next time the workspace container is created (e.g. after a reset, or
                  if it's currently idle and gets recreated).
                </p>
              </div>

              <div>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink">Allow network access</span>
                  <input
                    type="checkbox"
                    checked={config.networkEnabled}
                    disabled={!canManageNetwork}
                    onChange={(e) => setNetworkEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                <p className="text-xs text-faint mt-1">
                  Required for package installs (npm/pip/go get). Off by default — enabling it gives the workspace
                  container general internet access, not just package registries, since fine-grained domain
                  allowlisting isn't implemented.
                  {!canManageNetwork && " Only session owners can change this."}
                </p>
              </div>

              <div className="pt-3 border-t border-subtle">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="text-xs text-danger hover:opacity-80 disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Reset workspace container"}
                </button>
                <p className="text-xs text-faint mt-1">
                  Destroys the current container (running processes, installed packages). A fresh one is created
                  next time the terminal connects or a command runs.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
