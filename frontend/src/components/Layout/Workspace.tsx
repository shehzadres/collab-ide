import { useState, useMemo, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  Command,
  History,
  PackagePlus,
  PanelBottom,
  Play,
  Settings2,
  Users,
} from "lucide-react";
import { FileTree } from "../FileExplorer/FileTree";
import { EditorTabs } from "../Editor/EditorTabs";
import { CollaborativeEditor } from "../Editor/CollaborativeEditor";
import type { TerminalPanelHandle } from "../Terminal/TerminalPanel";
import { RecordingControls } from "../Replay/RecordingControls";
import { ThemeSwitcher } from "../Theme/ThemeSwitcher";
import { NotificationBell } from "../Notifications/NotificationBell";
import { SessionMembersPanel } from "../Permissions/SessionMembersPanel";
import { WorkspaceSettingsPanel } from "../Workspace/WorkspaceSettingsPanel";
import { InstallPackagesPrompt } from "../Workspace/InstallPackagesPrompt";
import { DemoNotice } from "../Demo/DemoNotice";
import { sessionsApi } from "../../lib/api/sessions.api";
import { executionApi } from "../../lib/api/execution.api";
import { filesApi } from "../../lib/api/files.api";
import { useRegisterCommands } from "../../hooks/useRegisterCommands";
import { useSessionRole } from "../../hooks/useSessionRole";
import { useWorkspaceConfig } from "../../hooks/useWorkspaceConfig";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { THEME_LIST } from "../../lib/theme/themes";
import { DEMO_MODE } from "../../lib/config/demoMode";

const LazyTerminalPanel = lazy(() => import("../Terminal/TerminalPanel").then((module) => ({ default: module.TerminalPanel })));

interface WorkspaceProps {
  roomId: string;
}

export function Workspace({ roomId }: WorkspaceProps) {
  const [terminalOpen, setTerminalOpen] = useState(!DEMO_MODE);
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

  const canManageRecording = hasAtLeast("OWNER");
  const canManageMembers = hasAtLeast("OWNER");
  const canManageNetwork = hasAtLeast("OWNER");
  const canRunOrInstall = hasAtLeast("EDITOR");

  const handleViewRecordings = async () => {
    try {
      const recordings = await sessionsApi.list(roomId);
      const latest = recordings[0];
      if (latest) {
        navigate(`/workspace/${encodeURIComponent(roomId)}?replay=${latest.id}`);
      } else {
        alert("No recordings yet for this session.");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not load recordings.");
    }
  };

  const ensureTerminalVisible = () => {
    if (!terminalOpen) setTerminalOpen(true);
  };

  const handleRunActiveFile = async () => {
    if (!activeFile || running || DEMO_MODE) return;
    ensureTerminalVisible();
    setRunning(true);
    terminalRef.current?.write(`\n$ run ${activeFile.path}\n`);
    try {
      await filesApi.updateContent(activeFile.id, activeFile.content);
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
    if (DEMO_MODE) return;
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
      ...(!DEMO_MODE
        ? [{
            id: "workspace.toggle-terminal",
            label: terminalOpen ? "Hide terminal" : "Show terminal",
            category: "Workspace",
            shortcut: "Ctrl+`",
            run: () => setTerminalOpen((v) => !v),
          }]
        : []),
      ...(!DEMO_MODE && canRunOrInstall
        ? [
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
          ]
        : []),
      {
        id: "workspace.settings",
        label: "Workspace settings",
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
        label: "Back to workspaces",
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
    [terminalOpen, roomId, activeFile?.id, running, canRunOrInstall]
  );
  useRegisterCommands(commands);

  return (
    <div className="ide-frame">
      <header className="ide-topbar">
        <a href="/sessions" className="ide-brand" aria-label="Collab IDE home">
          <span className="ide-brand-mark"><Code2 size={17} /></span>
          <span>collab<span>ide</span></span>
        </a>
        <span className="ide-topbar-divider" />
        <button type="button" onClick={() => navigate("/sessions")} className="ide-back-button" title="Back to workspaces">
          <ArrowLeft size={16} />
        </button>
        <div className="ide-session-meta">
          <span>WORKSPACE</span>
          <strong>{roomId}</strong>
        </div>
        <div className="ide-topbar-spacer" />
        <div className="ide-session-presence"><i /> <span>SHARED SESSION</span></div>
        <div className="ide-topbar-actions">
          {!DEMO_MODE && canRunOrInstall && activeFile && (
            <button type="button" onClick={handleRunActiveFile} disabled={running} className="ide-run-button" title={`Run ${activeFile.path} with the ${workspaceConfig?.runtime ?? ""} runtime`}>
              <Play size={13} fill="currentColor" />
              <span>{running ? "Running" : "Run"}</span>
            </button>
          )}
          {!DEMO_MODE && canRunOrInstall && (
            <button type="button" onClick={() => setInstallOpen(true)} className="ide-icon-button" title="Install packages">
              <PackagePlus size={16} />
            </button>
          )}
          <button type="button" onClick={() => setSettingsOpen(true)} className="ide-icon-button" title={DEMO_MODE ? "Workspace settings (demo mode)" : `Runtime: ${workspaceConfig?.runtime ?? "Settings"}`}>
            <Settings2 size={16} />
          </button>
          {canManageRecording && <RecordingControls sessionId={roomId} />}
          <button type="button" onClick={handleViewRecordings} className="ide-icon-button" title="View recordings">
            <History size={16} />
          </button>
          <button type="button" onClick={() => setMembersOpen(true)} className="ide-members-button" title={role ? `Your role: ${role}` : "Session members"}>
            <Users size={15} /><span>Members</span>
          </button>
          <NotificationBell />
          <ThemeSwitcher />
          <button type="button" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))} className="ide-icon-button ide-command-button" title="Command palette">
            <Command size={16} />
          </button>
        </div>
      </header>

      <div className="ide-body">
        <FileTree sessionId={roomId} />
        <main className="ide-main-panel">
          <div className="ide-editor-chrome">
            <div className="ide-tabs-area"><EditorTabs /></div>
            <div className="ide-editor-meta">
              <span>{activeFile ? activeFile.path : "No file selected"}</span>
              <span className="ide-editor-meta-separator">·</span>
              <span>{activeFile?.language ?? "Plain text"}</span>
            </div>
          </div>

          {DEMO_MODE && <DemoNotice />}

          <div className="ide-editor-region">
            <div className="ide-editor-stage">
              <CollaborativeEditor roomId={roomId} />
            </div>
            {!DEMO_MODE && terminalOpen && (
              <div className="ide-terminal-region">
                <Suspense fallback={<div className="ide-terminal-loading">Loading terminal…</div>}><LazyTerminalPanel ref={terminalRef} sessionId={roomId} /></Suspense>
              </div>
            )}
          </div>

          <footer className="ide-statusbar">
            <div className="ide-status-left">
              <span className="ide-status-branch"><GitBranchIcon /> {roomId}</span>
              <span className="ide-status-role">{role ?? "Joining"} ACCESS</span>
            </div>
            <div className="ide-status-right">
              <span>{activeFile?.language ?? "Plain text"}</span>
              {!DEMO_MODE && (
                <button type="button" onClick={() => setTerminalOpen((v) => !v)} className={`ide-terminal-toggle ${terminalOpen ? "active" : ""}`}>
                  <PanelBottom size={14} />
                  <span>{terminalOpen ? "Hide terminal" : "Show terminal"}</span>
                </button>
              )}
            </div>
          </footer>
        </main>
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

      {!DEMO_MODE && installOpen && (
        <InstallPackagesPrompt
          networkEnabled={Boolean(workspaceConfig?.networkEnabled)}
          onInstall={handleInstall}
          onClose={() => setInstallOpen(false)}
        />
      )}
    </div>
  );
}

function GitBranchIcon() {
  return <span className="ide-branch-mark">⑂</span>;
}
