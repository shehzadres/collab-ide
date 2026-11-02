import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { Terminal as XTerm } from "@xterm/xterm";
import type { FitAddon as FitAddonType } from "@xterm/addon-fit";
import { Eraser, SquareTerminal } from "lucide-react";
import { useTerminalSocket } from "../../hooks/useTerminalSocket";
import "@xterm/xterm/css/xterm.css";

interface TerminalPanelProps {
  sessionId: string;
}

export interface TerminalPanelHandle {
  write: (text: string) => void;
}

const XTERM_THEME = {
  background: "#15191d",
  foreground: "#d8dedb",
  cursor: "#a8c69a",
  cursorAccent: "#15191d",
  selectionBackground: "#a8c69a44",
  black: "#15191d",
  brightBlack: "#737d79",
  green: "#a8c69a",
  brightGreen: "#c4d9b8",
};

export const TerminalPanel = forwardRef<TerminalPanelHandle, TerminalPanelProps>(function TerminalPanel(
  { sessionId },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddonType | null>(null);

  const { connected, sendInput, sendResize } = useTerminalSocket(sessionId, (data) => {
    xtermRef.current?.write(data);
  });

  useImperativeHandle(ref, () => ({
    write: (text: string) => {
      xtermRef.current?.write(text.replace(/\r?\n/g, "\r\n"));
    },
  }));

  useEffect(() => {
    let disposed = false;
    let terminal: XTerm | null = null;
    let fitAddon: FitAddonType | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let dataListener: { dispose: () => void } | null = null;
    let fitFrame = 0;

    const fitTerminal = () => {
      const container = containerRef.current;
      if (!terminal || !fitAddon || !container || !container.clientWidth || !container.clientHeight) return;
      try {
        fitAddon.fit();
        sendResize(terminal.cols, terminal.rows);
      } catch {
        // The renderer can still be initializing during the first layout pass.
      }
    };

    Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(([xtermModule, fitModule]) => {
      if (disposed || !containerRef.current) return;

      terminal = new xtermModule.Terminal({
        fontFamily: "'IBM Plex Mono', SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        lineHeight: 1.5,
        theme: XTERM_THEME,
        cursorBlink: true,
        cursorStyle: "bar",
        scrollback: 5000,
        allowProposedApi: false,
      });
      fitAddon = new fitModule.FitAddon();
      terminal.loadAddon(fitAddon);
      terminal.open(containerRef.current);

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;
      dataListener = terminal.onData((data) => sendInput(data));

      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(fitFrame);
        fitFrame = requestAnimationFrame(fitTerminal);
      });
      resizeObserver.observe(containerRef.current);
      fitFrame = requestAnimationFrame(fitTerminal);
    }).catch((error) => {
      if (!disposed) {
        console.error("Could not initialize terminal", error);
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(fitFrame);
      resizeObserver?.disconnect();
      dataListener?.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      terminal?.dispose();
    };
  }, [sessionId, sendInput, sendResize]);

  return (
    <section className="ide-terminal-panel" aria-label="Terminal">
      <div className="ide-terminal-header">
        <div className="ide-terminal-title">
          <SquareTerminal size={15} strokeWidth={1.7} />
          <span>TERMINAL</span>
          <span className="ide-terminal-session">/ {sessionId}</span>
        </div>
        <div className="ide-terminal-controls">
          <span className={"ide-terminal-connection " + (connected ? "connected" : "")}>
            <i />
            {connected ? "Connected" : "Connecting"}
          </span>
          <button type="button" title="Clear terminal" aria-label="Clear terminal" onClick={() => xtermRef.current?.clear()}>
            <Eraser size={14} />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="ide-terminal-screen" />
    </section>
  );
});
