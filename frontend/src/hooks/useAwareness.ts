import { useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import { AwarenessState } from "../types/presence.types";
import { useAuthStore } from "../store/authStore";
import { colorForUserId } from "../lib/yjs/colors";
import { injectRemoteCursorStyle, removeRemoteCursorStyle } from "../components/Editor/RemoteCursorStyles";
import { useNotificationStore } from "../store/notificationStore";

export function useAwareness(provider: WebsocketProvider | null) {
  const user = useAuthStore((s) => s.user);
  const pushNotification = useNotificationStore((s) => s.push);
  const [peers, setPeers] = useState<Map<number, AwarenessState>>(new Map());

  useEffect(() => {
    if (!provider || !user) {
      setPeers(new Map());
      return;
    }

    provider.awareness.setLocalState({
      user: {
        userId: user.id,
        username: user.username,
        color: colorForUserId(user.id),
      },
    } as AwarenessState);

    const knownClients = new Set<number>();
    // Tracks whether we've completed the very first onChange pass — joins
    // already present when *we* connect shouldn't fire a flood of "X joined"
    // notifications, only genuinely new arrivals after that.
    let initialized = false;
    const usernameByClient = new Map<number, string>();

    const onChange = () => {
      const states = provider.awareness.getStates() as Map<number, AwarenessState>;
      const next = new Map(states);
      next.delete(provider.awareness.clientID);

      next.forEach((state, clientId) => {
        if (!state.user) return;
        if (!knownClients.has(clientId)) {
          injectRemoteCursorStyle(clientId, state.user.color, state.user.username);
          knownClients.add(clientId);
          usernameByClient.set(clientId, state.user.username);
          if (initialized) {
            pushNotification("info", `${state.user.username} joined the session`);
          }
        }
      });

      Array.from(knownClients).forEach((clientId) => {
        if (!next.has(clientId)) {
          removeRemoteCursorStyle(clientId);
          knownClients.delete(clientId);
          const leftUsername = usernameByClient.get(clientId);
          usernameByClient.delete(clientId);
          if (initialized && leftUsername) {
            pushNotification("info", `${leftUsername} left the session`);
          }
        }
      });

      initialized = true;
      setPeers(next);
    };

    provider.awareness.on("change", onChange);
    onChange();

    return () => {
      provider.awareness.off("change", onChange);
      knownClients.forEach((clientId) => removeRemoteCursorStyle(clientId));
      if (provider.awareness.getLocalState() !== null) {
        provider.awareness.setLocalState(null);
      }
    };
  }, [provider, user, pushNotification]);

  return peers;
}
