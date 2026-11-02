import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { getYDoc, releaseYDoc } from "../lib/yjs/ydoc";
import { getYProvider, releaseYProvider } from "../lib/yjs/provider";
import { useAuthStore } from "../store/authStore";

interface UseYjsProviderResult {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  connected: boolean;
  synced: boolean;
}

export function useYjsProvider(roomId: string): UseYjsProviderResult {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!accessToken) {
      setDoc(null);
      setProvider(null);
      setConnected(false);
      setSynced(false);
      return;
    }

    const d = getYDoc(roomId);
    const p = getYProvider(roomId, d, accessToken);

    setDoc(d);
    setProvider(p);
    setConnected(p.wsconnected);
    setSynced(p.synced === true);

    const onStatus = (e: { status: string }) => {
      if (mountedRef.current) setConnected(e.status === "connected");
    };
    const onSync = (isSynced: boolean) => {
      if (mountedRef.current) setSynced(isSynced);
    };
    p.on("status", onStatus);
    p.on("sync", onSync);

    return () => {
      mountedRef.current = false;
      p.off("status", onStatus);
      p.off("sync", onSync);
      setProvider(null);
      setDoc(null);
      setConnected(false);
      setSynced(false);
      releaseYProvider(roomId);
      releaseYDoc(roomId);
    };
  }, [roomId, accessToken]);

  return { doc, provider, connected, synced };
}
