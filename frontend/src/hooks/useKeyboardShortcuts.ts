import { useEffect } from "react";
import { useCommandPaletteStore } from "../store/commandPaletteStore";

/**
 * App-wide keyboard shortcuts that should work regardless of which component
 * has focus. Mounted once near the root (see App.tsx). Per-feature shortcuts
 * (e.g. editor save, terminal clear) are registered as palette commands with
 * a `shortcut` label instead — this hook only owns chrome-level bindings
 * that aren't tied to any single feature panel.
 */
export function useKeyboardShortcuts() {
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const close = useCommandPaletteStore((s) => s.close);
  const isOpen = useCommandPaletteStore((s) => s.isOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
        return;
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, close, isOpen]);
}
