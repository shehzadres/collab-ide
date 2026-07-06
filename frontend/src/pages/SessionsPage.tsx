import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PROJECT_TEMPLATES, getTemplate } from "../lib/templates/templates";
import { filesApi } from "../lib/api/files.api";

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
        // Only seed the template if this session genuinely has no files yet —
        // re-entering an existing session must never silently inject files.
        const existingTree = await filesApi.getTree(sessionId);
        if (existingTree.length === 0) {
          for (const file of template.files) {
            await filesApi.create({
              name: file.path.split("/").pop() ?? file.path,
              path: file.path,
              isFolder: Boolean(file.isFolder),
              parentId: null,
              sessionId,
            });
          }
        }
      }
      navigate(`/workspace/${encodeURIComponent(sessionId)}`);
    } catch {
      // If template seeding fails for any reason, still let the user into
      // the session rather than blocking them — they can create files
      // manually from the explorer.
      navigate(`/workspace/${encodeURIComponent(sessionId)}`);
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-sm bg-panel border border-subtle rounded-lg p-8 shadow-popover flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">
            {user ? `Hi, ${user.username}` : "Sessions"}
          </h1>
          <button onClick={logout} className="text-xs text-faint hover:text-ink">
            Sign out
          </button>
        </div>

        <input
          value={sessionInput}
          onChange={(e) => setSessionInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enterSession(sessionInput)}
          placeholder="Session ID (e.g. project-alpha)"
          className="bg-hover border border-border rounded-md px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Starter template (only applied to new sessions)</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="bg-hover border border-border rounded-md px-3 py-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {PROJECT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-faint">
            {getTemplate(templateId).description}
          </span>
        </div>

        <button
          onClick={() => enterSession(sessionInput)}
          disabled={entering}
          className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg rounded-md py-2 text-sm font-medium transition"
        >
          {entering ? "Setting up..." : "Enter session"}
        </button>
      </div>
    </div>
  );
}
