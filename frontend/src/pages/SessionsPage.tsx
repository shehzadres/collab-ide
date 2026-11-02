import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Braces,
  Code2,
  FileCode2,
  FolderOpen,
  GitBranch,
  LogOut,
  Command,
  Users,
  Globe2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { PROJECT_TEMPLATES, getTemplate } from "../lib/templates/templates";
import { filesApi } from "../lib/api/files.api";
import { executionApi } from "../lib/api/execution.api";

const templateIcons = {
  blank: FolderOpen,
  "node-starter": Braces,
  "python-starter": Code2,
  "html-starter": Globe2,
};

export default function SessionsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sessionInput, setSessionInput] = useState("");
  const [templateId, setTemplateId] = useState(PROJECT_TEMPLATES[0].id);
  const [entering, setEntering] = useState(false);

  const enterSession = async (id: string) => {
    const sessionId = id.trim();
    if (!sessionId || entering) return;

    setEntering(true);
    try {
      const template = getTemplate(templateId);
      if (template.files.length > 0) {
        const existingTree = await filesApi.getTree(sessionId);
        if (existingTree.length === 0) {
          for (const file of template.files) {
            await filesApi.create({
              name: file.path.split("/").pop() ?? file.path,
              path: file.path,
              isFolder: false,
              parentId: null,
              sessionId,
              content: file.content,
            });
          }
          if (template.runtime) await executionApi.updateRuntime(sessionId, template.runtime);
        }
      }
      navigate(`/workspace/${encodeURIComponent(sessionId)}`);
    } catch {
      navigate(`/workspace/${encodeURIComponent(sessionId)}`);
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="sessions-app">
      <aside className="sessions-sidebar">
        <a href="/sessions" className="sessions-brand" aria-label="Collab IDE home">
          <span className="sessions-brand-mark"><Code2 size={19} /></span>
          <span>collab<span>ide</span></span>
        </a>

        <div className="sessions-nav-group">
          <p className="sessions-nav-label">WORKSPACE</p>
          <div className="sessions-nav-item active">
            <FolderOpen size={16} />
            <span>Overview</span>
            <span className="sessions-nav-indicator" />
          </div>
          <div className="sessions-nav-item quiet">
            <Users size={16} />
            <span>Collaboration</span>
          </div>
        </div>

        <div className="sessions-sidebar-note">
          <div className="sessions-note-icon"><GitBranch size={16} /></div>
          <p className="sessions-note-title">One shared workspace</p>
          <p>Open the same session name with your teammates to work in sync.</p>
        </div>

        <div className="sessions-sidebar-footer">
          <div className="sessions-user-avatar">{(user?.username?.[0] ?? "U").toUpperCase()}</div>
          <div className="sessions-user-copy">
            <strong>{user?.username ?? "Developer"}</strong>
            <span>Personal workspace</span>
          </div>
          <button type="button" onClick={logout} className="sessions-logout" title="Sign out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="sessions-main">
        <header className="sessions-topbar">
          <div className="sessions-breadcrumb"><span>WORKSPACE</span><i>/</i> OVERVIEW</div>
          <div className="sessions-topbar-right">
            <span className="sessions-presence-dot" />
            <span>All systems ready</span>
          </div>
        </header>

        <div className="sessions-content">
          <section className="sessions-intro">
            <div>
              <p className="sessions-overline">YOUR WORKSPACE</p>
              <h1>Make room for<br /><span>good work.</span></h1>
              <p className="sessions-intro-copy">
                Start a focused coding session or join one your team has already opened.
                Your files, editor and collaborators stay together.
              </p>
            </div>
            <div className="sessions-intro-mark" aria-hidden="true">
              <div className="sessions-mark-square"><Code2 size={34} strokeWidth={1.35} /></div>
              <span>WRITE</span><span>SYNC</span><span>SHIP</span>
            </div>
          </section>

          <div className="sessions-work-area">
            <section className="session-create-card">
              <div className="session-card-heading">
                <div>
                  <p className="sessions-overline">01 / NEW SESSION</p>
                  <h2>Open a workspace</h2>
                  <p>Choose a session name and a starting point.</p>
                </div>
                <span className="session-card-symbol"><FolderOpen size={20} /></span>
              </div>

              <div className="session-field">
                <label htmlFor="session-name">SESSION NAME</label>
                <input
                  id="session-name"
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enterSession(sessionInput)}
                  placeholder="e.g. product-dashboard"
                  autoComplete="off"
                  maxLength={128}
                />
                <span>Use the same name to invite teammates into this workspace.</span>
              </div>

              <div className="session-template-heading">
                <div>
                  <label>STARTER TEMPLATE</label>
                  <p>{getTemplate(templateId).description}</p>
                </div>
                <span>{PROJECT_TEMPLATES.length} options</span>
              </div>

              <div className="session-template-grid">
                {PROJECT_TEMPLATES.map((template) => {
                  const TemplateIcon = templateIcons[template.id as keyof typeof templateIcons] ?? FileCode2;
                  const selected = templateId === template.id;
                  return (
                    <button
                      type="button"
                      key={template.id}
                      onClick={() => setTemplateId(template.id)}
                      className={`session-template-option ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                    >
                      <span className="session-template-icon"><TemplateIcon size={18} strokeWidth={1.7} /></span>
                      <span className="session-template-copy">
                        <strong>{template.label}</strong>
                        <small>{template.description}</small>
                      </span>
                      <span className="session-template-check" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>

              <div className="session-create-footer">
                <span><ShieldCheckIcon /> Private until you share the session name.</span>
                <button
                  type="button"
                  onClick={() => enterSession(sessionInput)}
                  disabled={entering || !sessionInput.trim()}
                  className="session-open-button"
                >
                  <span>{entering ? "Preparing workspace..." : "Open workspace"}</span>
                  {!entering && <ArrowRight size={16} />}
                </button>
              </div>
            </section>

            <aside className="sessions-aside">
              <section className="sessions-guide-card">
                <p className="sessions-overline">HOW IT WORKS</p>
                <div className="sessions-guide-step">
                  <span>01</span>
                  <div><strong>Name your session</strong><p>Pick a short name your team can remember.</p></div>
                </div>
                <div className="sessions-guide-rule" />
                <div className="sessions-guide-step">
                  <span>02</span>
                  <div><strong>Choose a starting point</strong><p>Begin empty or load a small starter project.</p></div>
                </div>
                <div className="sessions-guide-rule" />
                <div className="sessions-guide-step">
                  <span>03</span>
                  <div><strong>Bring your team in</strong><p>Share the session name so everyone joins the same room.</p></div>
                </div>
              </section>

              <section className="sessions-shortcuts-card">
                <div className="sessions-shortcuts-title"><Command size={15} /><span>QUICK ACCESS</span></div>
                <div><span>Command palette</span><kbd>Ctrl K</kbd></div>
                <div><span>Open workspace</span><kbd>Enter</kbd></div>
              </section>
            </aside>
          </div>

          <footer className="sessions-page-footer">
            <span>COLLAB IDE <i>·</i> BUILT FOR SHARED THINKING</span>
            <span>Every good idea starts somewhere.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function ShieldCheckIcon() {
  return <span className="session-shield" aria-hidden="true">✓</span>;
}
