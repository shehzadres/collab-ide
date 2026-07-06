import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SquareTerminal, Eraser } from "lucide-react";
import { useTerminalSocket } from "../../hooks/useTerminalSocket";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  sessionId: string;
}

export interface TerminalPanelHandle {
  /** Writes raw text directly into the terminal display without going through the interactive WS session — used for Run/Install output streams. */
  write: (text: string) => void;
}

// Matches --c-bg-panel / --c-text so the xterm canvas blends into the app
// chrome instead of sitting in its own, slightly-off shade of black.
const XTERM_THEME = {
  background: "#131315",
  foreground: "#e7e6e4",
  cursor: "#5fb98f",
  cursorAccent: "#131315",
  selectionBackground: "#5fb98f59",
  black: "#131315",
  brightBlack: "#636166",
};

export const TerminalPanel = forwardRef<TerminalPanelHandle, TerminalPanelProps>(function TerminalPanel(
  { sessionId },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const { connected, sendInput, sendResize } = useTerminalSocket(sessionId, (data) => {
    xtermRef.current?.write(data);
  });

  useImperativeHandle(ref, () => ({
    write: (text: string) => {
      // \r\n normalizes plain LF output from exec streams to CRLF, which
      // xterm.js needs for correct line breaks (the interactive WS path
      // already gets this for free from the container's own TTY).
      xtermRef.current?.write(text.replace(/\r?\n/g, "\r\n"));
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: "'IBM Plex Mono', SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      theme: XTERM_THEME,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const dataListener = term.onData((data) => sendInput(data));

    const resizeObserver = new ResizeObserver(() => {
      if (xtermRef.current !== term) return;
      try {
        fitAddon.fit();
        sendResize(term.cols, term.rows);
      } catch {
        // terminal mid-teardown — ignore
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      dataListener.dispose();
      xtermRef.current = null;
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="flex flex-col h-full bg-panel border-t border-subtle">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-subtle">
        <div className="flex items-center gap-1.5 text-muted">
          <SquareTerminal size={13} strokeWidth={1.75} />
          <span className="text-xs font-semibold uppercase tracking-wide">Terminal</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Clear terminal"
            onClick={() => xtermRef.current?.clear()}
            className="flex items-center justify-center w-5 h-5 rounded text-faint hover:text-ink hover:bg-hover transition-colors"
          >
            <Eraser size={13} strokeWidth={1.75} />
          </button>

          <span className="flex items-center gap-1.5 text-xs text-faint">
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`}
              aria-hidden
            />
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 px-2 py-1.5" />
    </div>
  );
});
