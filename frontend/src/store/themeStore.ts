import { create } from "zustand";
import { ThemeId } from "../types/theme.types";
import { getTheme } from "../lib/theme/themes";

const STORAGE_KEY = "collab-ide:theme";

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "midnight" || stored === "solarized") {
      return stored;
    }
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall back silently
  }
  return "dark";
}

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: readStoredTheme(),
  setTheme: (id) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore persistence failures
    }
    set({ themeId: id });
  },
}));

/**
 * Applies the active theme's CSS variables to the document root. Call once
 * at app mount and on every theme change — components read these vars via
 * Tailwind arbitrary values (e.g. `bg-[var(--c-bg)]`) so no component needs
 * to know about ThemeDefinition directly.
 */
export function applyThemeToDocument(themeId: ThemeId): void {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  root.style.setProperty("--c-bg", theme.vars.bg);
  root.style.setProperty("--c-bg-elevated", theme.vars.bgElevated);
  root.style.setProperty("--c-bg-panel", theme.vars.bgPanel);
  root.style.setProperty("--c-bg-hover", theme.vars.bgHover);
  root.style.setProperty("--c-bg-active", theme.vars.bgActive);
  root.style.setProperty("--c-border-subtle", theme.vars.borderSubtle);
  root.style.setProperty("--c-border", theme.vars.border);
  root.style.setProperty("--c-text", theme.vars.text);
  root.style.setProperty("--c-text-muted", theme.vars.textMuted);
  root.style.setProperty("--c-text-faint", theme.vars.textFaint);
  root.style.setProperty("--c-accent", theme.vars.accent);
  root.style.setProperty("--c-accent-hover", theme.vars.accentHover);
  root.style.setProperty("--c-accent-text", theme.vars.accentText);
  root.style.setProperty("--c-success", theme.vars.success);
  root.style.setProperty("--c-warning", theme.vars.warning);
  root.style.setProperty("--c-danger", theme.vars.danger);
  root.style.setProperty("--c-info", theme.vars.info);
  root.dataset.theme = theme.id;
  root.classList.toggle("dark", theme.isDark);
}
