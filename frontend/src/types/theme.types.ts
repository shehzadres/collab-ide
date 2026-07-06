export type ThemeId = "dark" | "light" | "midnight" | "solarized";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  monacoTheme: string;
  isDark: boolean;
  vars: {
    /** App-level background, behind all panels */
    bg: string;
    /** Slightly raised surface — modals, dropdowns, popovers */
    bgElevated: string;
    /** Recessed surface — sidebar, panel chrome, status bar */
    bgPanel: string;
    /** Hover state fill for list rows, menu items, buttons */
    bgHover: string;
    /** Active/selected state fill (rows, tabs) */
    bgActive: string;
    /** Low-contrast hairline, panel separators */
    borderSubtle: string;
    /** Standard border — inputs, cards, dividers that need to read clearly */
    border: string;
    /** Primary reading text */
    text: string;
    /** Secondary text — labels, metadata, timestamps */
    textMuted: string;
    /** Tertiary text — disabled, placeholder, decorative icons */
    textFaint: string;
    /** Single restrained brand accent — focus rings, active tab, primary actions */
    accent: string;
    /** Hover/pressed variant of accent */
    accentHover: string;
    /** Text color safe to place on top of a solid accent fill */
    accentText: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
}
