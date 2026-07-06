import { useState } from "react";

interface InstallPackagesPromptProps {
  onInstall: (packages: string[]) => void;
  onClose: () => void;
  networkEnabled: boolean;
}

export function InstallPackagesPrompt({ onInstall, onClose, networkEnabled }: InstallPackagesPromptProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const packages = input
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (packages.length === 0) return;
    onInstall(packages);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-popover p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-ink mb-2">Install packages</h3>
        {!networkEnabled && (
          <p className="text-xs text-warning mb-2">
            Network access is currently disabled for this workspace — installs will fail until an owner enables it
            in workspace settings.
          </p>
        )}
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. lodash express"
          className="w-full bg-hover border border-border rounded px-3 py-2 text-sm text-ink mb-3"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-xs text-muted hover:text-ink px-3 py-1.5">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="text-xs bg-accent hover:bg-accent-hover text-accent-fg rounded px-3 py-1.5"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
