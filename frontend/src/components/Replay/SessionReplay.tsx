import { useRef, useState, useEffect } from "react";
import { Terminal } from "@xterm/xterm";
import { useReplayEngine } from "../../hooks/useReplayEngine";
import { ReplayEditorView } from "./ReplayEditorView";
import { getLanguageFromPath } from "../../lib/editor/languageMap";
import "@xterm/xterm/css/xterm.css";

interface SessionReplayProps {
  recordingId: string;
  activeFileId: string;
  activeFilePath: string;
}

export function SessionReplay({ recordingId, activeFileId, activeFilePath }: SessionReplayProps) {
  const termContainerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const [fileContent, setFileContent] = useState("");

  const { events, cursor, playing, speed, setSpeed, play, pause, seekTo, docVersion, getFileText } =
    useReplayEngine(recordingId, (data) => termRef.current?.write(data));

  useEffect(() => {
    if (!termContainerRef.current) return;
    const term = new Terminal({ fontSize: 13, theme: { background: "#0a0a0a" } });
    term.open(termContainerRef.current);
    termRef.current = term;
    return () => term.dispose();
  }, []);

  useEffect(() => {
    const yText = getFileText(activeFileId);
    setFileContent(yText ? yText.toString() : "");
  }, [docVersion, activeFileId]);

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center gap-3 px-3 py-2 bg-panel border-b border-subtle">
        <button onClick={playing ? pause : play} className="text-xs bg-accent hover:bg-accent-hover px-3 py-1 rounded text-accent-fg">
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => seekTo(0)} className="text-xs text-muted hover:text-ink">
          Reset
        </button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="text-xs bg-hover text-ink rounded px-1 py-0.5"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
        <input
          type="range"
          min={0}
          max={Math.max(0, events.length - 1)}
          value={cursor}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-faint w-16 text-right">
          {cursor}/{events.length}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-subtle">
          <ReplayEditorView content={fileContent} language={getLanguageFromPath(activeFilePath)} />
        </div>
        <div className="w-96 flex flex-col">
          <div ref={termContainerRef} className="flex-1 p-2" />
        </div>
      </div>
    </div>
  );
}
