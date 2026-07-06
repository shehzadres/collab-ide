import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { TerminalServerMessage } from "../types/terminal.types";

const WS_URL = import.meta.env.VITE_TERMINAL_WS_URL || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/terminal`;

export function useTerminalSocket(sessionId: string, onOutput: (data: string) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(`${WS_URL}?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(accessToken)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg: TerminalServerMessage = JSON.parse(event.data);
        if (msg.type === "output") {
          onOutputRef.current(msg.data);
        } else if (msg.type === "exit") {
          onOutputRef.current(`\r\n[process exited with code ${msg.code}]\r\n`);
        }
      } catch {
        // malformed frame — ignore rather than crash the handler
      }
    };

    return () => {
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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data }));
    }
  }, []);

  const sendResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }, []);

  return { connected, sendInput, sendResize };
}
