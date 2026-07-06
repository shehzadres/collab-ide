import { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
}

/**
 * Generic sidebar shell. FileTree currently renders its own width/border
 * directly (w-60, border-r) since it's the only sidebar content in the app.
 * This wrapper exists for the folder-structure contract and for future
 * sidebar sections (e.g. a recordings list) to share consistent framing.
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="h-full bg-panel border-r border-subtle flex flex-col overflow-y-auto">
      {children}
    </aside>
  );
}
