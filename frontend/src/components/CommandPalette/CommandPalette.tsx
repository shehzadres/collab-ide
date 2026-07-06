import { useState, useEffect, useMemo, useRef } from "react";
import { Search, LayoutGrid, Play, Palette, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useCommandPaletteStore } from "../../store/commandPaletteStore";
import { PaletteCommand } from "../../types/command.types";

function matchesQuery(command: PaletteCommand, query: string): boolean {
  if (!query) return true;
  const haystack = [command.label, command.category, ...(command.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

// Small, deliberately generic icon per category rather than one icon per
// command — commands are free-text and app-defined, so per-command icons
// would either be guessed or need a second registration field. A category
// icon still gives the list visual rhythm without inventing meaning.
const CATEGORY_ICONS: Record<string, typeof LayoutGrid> = {
  Workspace: LayoutGrid,
  Execution: Play,
  Appearance: Palette,
};

export function CommandPalette() {
  const { isOpen, commands, close } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(
    () => commands.filter((c) => matchesQuery(c, query)),
    [commands, query]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Defer focus until after the modal has actually painted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  const runCommand = (command: PaletteCommand) => {
    close();
    command.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = filtered[activeIndex];
      if (command) runCommand(command);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-panel border border-border rounded-lg shadow-popover overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-subtle">
          <Search size={15} strokeWidth={2} className="text-faint shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="w-full py-3 bg-transparent text-ink text-sm outline-none placeholder:text-faint"
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-faint">No matching commands</div>
          ) : (
            filtered.map((command, idx) => {
              const Icon = CATEGORY_ICONS[command.category] ?? LayoutGrid;
              const isActive = idx === activeIndex;
              return (
                <button
                  key={command.id}
                  ref={isActive ? activeItemRef : undefined}
                  type="button"
                  onClick={() => runCommand(command)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`relative w-full flex items-center gap-2.5 pl-3.5 pr-4 py-2 text-left text-sm ${
                    isActive ? "bg-accent/10 text-ink" : "text-ink hover:bg-hover"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1 bottom-1 w-0.5 rounded-full ${
                      isActive ? "bg-accent" : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                  <Icon size={14} strokeWidth={1.75} className="text-faint shrink-0" />
                  <span className="flex-1 truncate">
                    <span className="text-faint text-xs mr-2">{command.category}</span>
                    {command.label}
                  </span>
                  {command.shortcut && (
                    <span className="text-xs text-faint font-mono shrink-0">{command.shortcut}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-subtle text-[11px] text-faint">
          <span className="flex items-center gap-1">
            <ArrowUp size={11} strokeWidth={2} />
            <ArrowDown size={11} strokeWidth={2} />
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft size={11} strokeWidth={2} />
            Select
          </span>
          <span className="ml-auto">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
