import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";
import { THEME_LIST } from "../../lib/theme/themes";
import { useTheme } from "../../hooks/useTheme";

export function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Change theme"
        className="ide-icon-button"
      >
        <Palette size={16} />
      </button>
      {open && (
        <div className="ide-theme-menu absolute right-0 mt-1 w-40 bg-panel border border-border rounded-md shadow-popover z-50 py-1">
          {THEME_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`w-full text-left text-xs px-3 py-1.5 hover:bg-hover flex items-center gap-2 ${
                themeId === t.id ? "text-accent" : "text-ink"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-border inline-block"
                style={{ backgroundColor: t.vars.bg }}
              />
              {t.label}
              {themeId === t.id && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
