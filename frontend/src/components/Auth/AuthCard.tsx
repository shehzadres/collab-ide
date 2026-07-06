import { FormEvent, ReactNode } from "react";

interface AuthCardProps {
  title: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}

export function AuthCard({ title, onSubmit, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-6">
      <div className="flex items-center gap-2 text-muted">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 4L2 9L6 14M12 4L16 9L12 14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xs font-medium tracking-wide uppercase">Collab IDE</span>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-panel border border-subtle rounded-lg p-8 shadow-popover flex flex-col gap-5"
      >
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {children}
      </form>
    </div>
  );
}
