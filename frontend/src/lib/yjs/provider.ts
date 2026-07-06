import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

interface ProviderEntry {
  provider: WebsocketProvider;
  refCount: number;
}

const providers = new Map<string, ProviderEntry>();

const WS_URL = import.meta.env.VITE_YJS_WS_URL || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;

export function getYProvider(roomId: string, doc: Y.Doc, token: string): WebsocketProvider {
  let entry = providers.get(roomId);
  if (!entry) {
    const provider = new WebsocketProvider(WS_URL, roomId, doc, {
      params: { token },
      connect: true,
    });
    entry = { provider, refCount: 0 };
    providers.set(roomId, entry);
  }
  entry.refCount += 1;
  return entry.provider;
}

export function releaseYProvider(roomId: string): void {
  const entry = providers.get(roomId);
  if (!entry) return;

  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    entry.provider.awareness.setLocalState(null);
    entry.provider.disconnect();
    entry.provider.destroy();
    providers.delete(roomId);
  }
}
