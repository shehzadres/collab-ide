import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileTree } from "../FileExplorer/FileTree";
import { EditorTabs } from "../Editor/EditorTabs";
import { CollaborativeEditor } from "../Editor/CollaborativeEditor";
import { TerminalPanel, TerminalPanelHandle } from "../Terminal/TerminalPanel";
import { RecordingControls } from "../Replay/RecordingControls";
import { ThemeSwitcher } from "../Theme/ThemeSwitcher";
import { NotificationBell } from "../Notifications/NotificationBell";
import { SessionMembersPanel } from "../Permissions/SessionMembersPanel";
import { WorkspaceSettingsPanel } from "../Workspace/WorkspaceSettingsPanel";
import { InstallPackagesPrompt } from "../Workspace/InstallPackagesPrompt";
import { sessionsApi } from "../../lib/api/sessions.api";
import { executionApi } from "../../lib/api/execution.api";
import { useRegisterCommands } from "../../hooks/useRegisterCommands";
import { useSessionRole } from "../../hooks/useSessionRole";
import { useWorkspaceConfig } from "../../hooks/useWorkspaceConfig";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { THEME_LIST } from "../../lib/theme/themes";

interface WorkspaceProps {
  roomId: string;
}

export function Workspace({ roomId }: WorkspaceProps) {
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();
  const setTheme = useThemeStore((s) => s.setTheme);
  const { role, hasAtLeast } = useSessionRole(roomId);
  const { config: workspaceConfig } = useWorkspaceConfig(roomId);
  const activeFile = useEditorStore((s) => s.activeFile);
  const terminalRef = useRef<TerminalPanelHandle>(null);

  // VIEWER is enforced as genuinely read-only at the Yjs WebSocket layer on
  // the backend (see yjs.server.ts's wrapReadOnlySocket) and at the REST
  // layer for file mutations — this is the UI reflecting that, not the
  // enforcement itself. Removing this check would not let a VIEWER bypass
  // anything; it would just mean they see controls that fail when clicked.
  const canManageRecording = hasAtLeast("OWNER");
  const canManageMembers = hasAtLeast("OWNER");
  const canManageNetwork = hasAtLeast("OWNER");
  const canRunOrInstall = hasAtLeast("EDITOR");

  const handleViewRecordings = async () => {
    const recordings = await sessionsApi.list(roomId);
    const latest = recordings[0];
    if (latest) {
      navigate(`/workspace/${roomId}?replay=${latest.id}`);
    } else {
      alert("No recordings yet for this session.");
    }
  };

  const ensureTerminalVisible = () => {
    if (!terminalOpen) setTerminalOpen(true);
  };

  const handleRunActiveFile = async () => {
    if (!activeFile || running) return;
    ensureTerminalVisible();
    setRunning(true);
    terminalRef.current?.write(`\n$ run ${activeFile.path}\n`);
    try {
      await executionApi.runFile(roomId, activeFile.path, (chunk) => {
        terminalRef.current?.write(chunk);
      });
    } catch (err) {
      terminalRef.current?.write(`\n[run failed: ${err instanceof Error ? err.message : "unknown error"}]\n`);
    } finally {
      setRunning(false);
    }
  };

  const handleInstall = async (packages: string[]) => {
    ensureTerminalVisible();
    terminalRef.current?.write(`\n$ install ${packages.join(" ")}\n`);
    try {
      await executionApi.installPackages(roomId, packages, (chunk) => {
        terminalRef.current?.write(chunk);
      });
    } catch (err) {
      terminalRef.current?.write(`\n[install failed: ${err instanceof Error ? err.message : "unknown error"}]\n`);
    }
  };

  const commands = useMemo(
    () => [
      {
        id: "workspace.toggle-terminal",
        label: terminalOpen ? "Hide terminal" : "Show terminal",
        category: "Workspace",
        shortcut: "Ctrl+`",
        run: () => setTerminalOpen((v) => !v),
      },
      {
        id: "workspace.run-file",
        label: activeFile ? `Run ${activeFile.path.split("/").pop()}` : "Run active file",
        category: "Execution",
        run: handleRunActiveFile,
      },
      {
        id: "workspace.install-packages",
        label: "Install packages...",
        category: "Execution",
        run: () => setInstallOpen(true),
      },
      {
        id: "workspace.settings",
        label: "Workspace settings (runtime, network)",
        category: "Execution",
        run: () => setSettingsOpen(true),
      },
      {
        id: "workspace.view-replays",
        label: "View latest recording",
        category: "Workspace",
        run: handleViewRecordings,
      },
      {
        id: "workspace.members",
        label: "View session members",
        category: "Workspace",
        run: () => setMembersOpen(true),
      },
      {
        id: "workspace.back-to-sessions",
        label: "Back to sessions",
        category: "Workspace",
        run: () => navigate("/sessions"),
      },
      ...THEME_LIST.map((t) => ({
        id: `theme.${t.id}`,
        label: `Theme: ${t.label}`,
        category: "Appearance",
        keywords: ["theme", "color", "appearance"],
        run: () => setTheme(t.id),
      })),
    ],
    [terminalOpen, roomId, activeFile?.id, running]
  );
  useRegisterCommands(commands);

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <FileTree sessionId={roomId} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-panel border-b border-subtle">
          <EditorTabs />
          <div className="flex items-center gap-2 pr-2">
            {canRunOrInstall && activeFile && (
              <button
                onClick={handleRunActiveFile}
                disabled={running}
                title={`Run ${activeFile.path} with the ${workspaceConfig?.runtime ?? ""} runtime`}
                className="text-xs bg-success/20 text-success hover:bg-success/30 disabled:opacity-50 rounded px-2 py-1"
              >
                {running ? "Running..." : "▶ Run"}
              </button>
            )}
            {canRunOrInstall && (
              <button
                onClick={() => setInstallOpen(true)}
                className="text-xs text-muted hover:text-ink px-2 py-1"
              >
                Install
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs text-muted hover:text-ink px-2 py-1"
              title={workspaceConfig ? `Runtime: ${workspaceConfig.runtime}` : undefined}
            >
              ⚙ {workspaceConfig ? workspaceConfig.runtime : ""}
            </button>
            {canManageRecording && <RecordingControls sessionId={roomId} />}
            <button
              onClick={handleViewRecordings}
              className="text-xs text-muted hover:text-ink px-2 py-1"
            >
              View replays
            </button>
            <button
              onClick={() => setMembersOpen(true)}
              className="text-xs text-muted hover:text-ink px-2 py-1"
              title={role ? `Your role: ${role}` : undefined}
            >
              Members{role ? ` (${role})` : ""}
            </button>
            <NotificationBell />
            <ThemeSwitcher />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={terminalOpen ? "flex-1 min-h-0" : "flex-1"}>
            <CollaborativeEditor roomId={roomId} />
          </div>
          {terminalOpen && (
            <div className="h-64 flex-shrink-0">
              <TerminalPanel ref={terminalRef} sessionId={roomId} />
            </div>
          )}
        </div>
        <button
          onClick={() => setTerminalOpen((v) => !v)}
          className="text-xs text-faint hover:text-ink px-3 py-1 bg-panel border-t border-subtle"
        >
          {terminalOpen ? "Hide terminal" : "Show terminal"}
        </button>
      </div>

      {membersOpen && (
        <SessionMembersPanel
          sessionId={roomId}
          canManage={canManageMembers}
          onClose={() => setMembersOpen(false)}
        />
      )}

      {settingsOpen && (
        <WorkspaceSettingsPanel
          sessionId={roomId}
          canManageNetwork={canManageNetwork}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {installOpen && (
        <InstallPackagesPrompt
          networkEnabled={Boolean(workspaceConfig?.networkEnabled)}
          onInstall={handleInstall}
          onClose={() => setInstallOpen(false)}
        />
      )}
    </div>
  );
}
