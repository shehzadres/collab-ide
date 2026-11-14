import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { TerminalServerMessage } from "../types/terminal.types";

const WS_URL = import.meta.env.VITE_TERMINAL_WS_URL || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/terminal`;

export function useTerminalSocket(sessionId: string, onOutput: (data: string) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const readyRef = useRef(false);
  const pendingInputRef = useRef<string[]>([]);
  const [connected, setConnected] = useState(false);
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(`${WS_URL}?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(accessToken)}`);
    wsRef.current = ws;
    readyRef.current = false;
    pendingInputRef.current = [];
    setConnected(false);

    // The TCP/WebSocket handshake completes before the backend has attached
    // the Docker stream. Wait for its explicit ready frame before accepting
    // terminal input, otherwise the first keystrokes can be dropped.
    ws.onopen = () => setConnected(false);
    ws.onclose = () => {
      readyRef.current = false;
      pendingInputRef.current = [];
      setConnected(false);
    };
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg: TerminalServerMessage = JSON.parse(event.data);
        if (msg.type === "ready") {
          readyRef.current = true;
          setConnected(true);
          for (const data of pendingInputRef.current) {
            if (ws.readyState !== WebSocket.OPEN) break;
            ws.send(JSON.stringify({ type: "input", data }));
          }
          pendingInputRef.current = [];
        } else if (msg.type === "output") {
          onOutputRef.current(msg.data);
        } else if (msg.type === "exit") {
          readyRef.current = false;
          setConnected(false);
          onOutputRef.current(`\r\n[process exited with code ${msg.code}]\r\n`);
        }
      } catch {
        // malformed frame — ignore rather than crash the handler
      }
    };

    return () => {
      readyRef.current = false;
      pendingInputRef.current = [];
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [sessionId, accessToken]);

  const sendInput = useCallback((data: string) => {
    const ws = wsRef.current;
    if (!ws) return;

    if (ws.readyState === WebSocket.OPEN && readyRef.current) {
      ws.send(JSON.stringify({ type: "input", data }));
    } else if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      const queuedBytes = pendingInputRef.current.reduce((total, item) => total + item.length, 0);
      if (queuedBytes + data.length <= 64 * 1024) {
        pendingInputRef.current.push(data);
      }
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && readyRef.current) {
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  return { connected, sendInput, sendResize };
}
