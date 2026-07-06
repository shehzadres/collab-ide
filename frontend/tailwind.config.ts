import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--c-bg)",
        elevated: "var(--c-bg-elevated)",
        panel: "var(--c-bg-panel)",
        hover: "var(--c-bg-hover)",
        active: "var(--c-bg-active)",
        subtle: "var(--c-border-subtle)",
        border: "var(--c-border)",
        ink: "var(--c-text)",
        muted: "var(--c-text-muted)",
        faint: "var(--c-text-faint)",
        accent: {
          DEFAULT: "var(--c-accent)",
          hover: "var(--c-accent-hover)",
          fg: "var(--c-accent-text)",
        },
        success: "var(--c-success)",
        warning: "var(--c-warning)",
        danger: "var(--c-danger)",
        info: "var(--c-info)",
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.4rem" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0, 0, 0, 0.3)",
        popover:
          "0 4px 12px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3)",
        focus: "0 0 0 2px var(--c-accent)",
      },
      transitionDuration: {
        DEFAULT: "120ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
        "slide-up": "slide-up 140ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
