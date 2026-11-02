import { FormEvent, ReactNode } from "react";
import { Code2, GitBranch, ShieldCheck, Users } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, eyebrow, onSubmit, children }: AuthCardProps) {
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <div className="auth-story-inner">
          <a className="auth-brand" href="/login" aria-label="Collab IDE home">
            <span className="auth-brand-mark"><Code2 size={19} strokeWidth={1.9} /></span>
            <span>collab<span>ide</span></span>
          </a>

          <div className="auth-story-copy">
            <p className="auth-overline">A workspace for people who build</p>
            <h2>Good work gets<br />better <span>together.</span></h2>
            <p className="auth-story-description">
              One focused place to write, review and run code with your team.
              Your editor stays yours. Your changes stay in sync.
            </p>
          </div>

          <div className="auth-preview" aria-label="Collaborative editor preview">
            <div className="auth-preview-top">
              <div className="auth-preview-dots"><i /><i /><i /></div>
              <span>src / app.ts</span>
              <span className="auth-preview-live"><i /> 2 online</span>
            </div>
            <div className="auth-preview-code">
              <div><span>01</span><code><b>const</b> workspace = {'{'}</code></div>
              <div><span>02</span><code>&nbsp;&nbsp;team: <em>"together"</em>,</code></div>
              <div><span>03</span><code>&nbsp;&nbsp;ideas: <strong>true</strong>,</code></div>
              <div><span>04</span><code>&nbsp;&nbsp;shipping: <strong>true</strong></code></div>
              <div><span>05</span><code>{'}'};</code></div>
              <div className="auth-preview-cursor"><span>06</span><code><i /></code></div>
            </div>
            <div className="auth-preview-foot">
              <span><GitBranch size={13} /> main</span>
              <span><ShieldCheck size={13} /> Private session</span>
              <span><Users size={13} /> Shared presence</span>
            </div>
          </div>

          <div className="auth-story-foot">
            <span>Built for thoughtful engineering.</span>
            <span>01 — COLLABORATE</span>
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-mobile-brand">
          <span className="auth-brand-mark"><Code2 size={18} /></span>
          <span>collab<span>ide</span></span>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-form-heading">
            <p className="auth-overline">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
          <div className="auth-form-note">
            <ShieldCheck size={14} />
            <span>Your workspace is private by default.</span>
          </div>
        </form>
        <div className="auth-main-foot">
          <span>COLLAB IDE</span>
          <span>Made for the work that matters.</span>
        </div>
      </main>
    </div>
  );
}
