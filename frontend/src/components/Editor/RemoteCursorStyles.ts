const injectedStyles = new Map<number, HTMLStyleElement>();

export function injectRemoteCursorStyle(clientId: number, color: string, username: string): void {
  if (injectedStyles.has(clientId)) return;

  const safeUsername = username.replace(/["\\]/g, "");

  const style = document.createElement("style");
  style.id = `yjs-cursor-style-${clientId}`;
  style.textContent = `
    .yRemoteSelection-${clientId} {
      background-color: ${color}33;
    }
    .yRemoteSelectionHead-${clientId} {
      position: absolute;
      border-left: 2px solid ${color};
      border-top: 2px solid ${color};
      height: 100%;
    }
    .yRemoteSelectionHead-${clientId}::after {
      content: "${safeUsername}";
      position: absolute;
      top: -1.2em;
      left: -2px;
      background-color: ${color};
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      padding: 0 4px;
      border-radius: 2px;
      white-space: nowrap;
      line-height: 1.4;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
  injectedStyles.set(clientId, style);
}

export function removeRemoteCursorStyle(clientId: number): void {
  const style = injectedStyles.get(clientId);
  style?.remove();
  injectedStyles.delete(clientId);
}
