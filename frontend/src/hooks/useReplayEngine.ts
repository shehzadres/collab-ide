import { useEffect, useRef, useState, useCallback } from "react";
import { sessionsApi } from "../lib/api/sessions.api";
import { ReplayEngine } from "../lib/replay/replayEngine";
import { ReplayEvent } from "../types/session.types";

export function useReplayEngine(recordingId: string, onTerminalOutput: (data: string) => void) {
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [docVersion, setDocVersion] = useState(0);

  const engineRef = useRef<ReplayEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTerminalOutputRef = useRef(onTerminalOutput);
  onTerminalOutputRef.current = onTerminalOutput;

  useEffect(() => {
    let cancelled = false;

    setEvents([]);
    setCursor(0);
    setPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    engineRef.current?.destroy();
    engineRef.current = null;

    sessionsApi.replay(recordingId).then((data) => {
      if (cancelled) return;
      setEvents(data);
      engineRef.current = new ReplayEngine(data, {
        onTerminalOutput: (d) => onTerminalOutputRef.current(d),
        onDocChange: () => setDocVersion((v) => v + 1),
      });
    });

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [recordingId]);

  const play = useCallback(() => {
    setEvents((current) => {
      if (current.length > 0) setPlaying(true);
      return current;
    });
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const seekTo = useCallback(
    (index: number) => {
      pause();
      if (!engineRef.current) return;
      engineRef.current.seekTo(index);
      setCursor(Math.min(index + 1, events.length));
      setDocVersion((v) => v + 1);
    },
    [pause, events.length]
  );

  useEffect(() => {
    if (!playing || !engineRef.current) return;
    if (cursor >= events.length) {
      setPlaying(false);
      return;
    }

    const current = events[cursor];
    const next = events[cursor + 1];
    const delay = next ? Math.max(0, (next.offsetMs - current.offsetMs) / speed) : 0;

    engineRef.current.apply(cursor);

    timerRef.current = setTimeout(() => setCursor((c) => c + 1), delay);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, cursor, events, speed]);

  return {
    events,
    cursor,
    playing,
    speed,
    setSpeed,
    play,
    pause,
    seekTo,
    docVersion,
    getDoc: () => engineRef.current?.doc,
    getFileText: (fileId: string) => engineRef.current?.getFileText(fileId),
  };
}
