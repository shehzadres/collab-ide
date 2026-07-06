import * as Y from "yjs";
import { ReplayEvent } from "../../types/session.types";

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface ReplayCallbacks {
  onTerminalOutput: (data: string) => void;
  onDocChange?: () => void;
}

export class ReplayEngine {
  doc = new Y.Doc();
  private events: ReplayEvent[];
  private callbacks: ReplayCallbacks;
  private destroyed = false;

  constructor(events: ReplayEvent[], callbacks: ReplayCallbacks) {
    this.events = events
      .map((e, i) => ({ e, i }))
      .sort((a, b) => a.e.offsetMs - b.e.offsetMs || a.i - b.i)
      .map(({ e }) => e);
    this.callbacks = callbacks;
  }

  reset(): void {
    this.doc.destroy();
    this.doc = new Y.Doc();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.doc.destroy();
  }

  apply(index: number): void {
    if (this.destroyed) return;
    const event = this.events[index];
    if (!event) return;

    let bytes: Uint8Array;
    try {
      bytes = base64ToUint8Array(event.payload);
    } catch {
      return;
    }

    switch (event.type) {
      case "YJS_SNAPSHOT":
        this.reset();
        try {
          Y.applyUpdateV2(this.doc, bytes);
        } catch {
          // corrupt/partial snapshot — leave doc empty rather than throwing
        }
        this.callbacks.onDocChange?.();
        break;
      case "YJS_UPDATE":
        try {
          Y.applyUpdateV2(this.doc, bytes);
          this.callbacks.onDocChange?.();
        } catch {
          try {
            Y.applyUpdate(this.doc, bytes);
            this.callbacks.onDocChange?.();
          } catch {
            // handshake/awareness frame — ignore
          }
        }
        break;
      case "TERMINAL_OUTPUT":
        this.callbacks.onTerminalOutput(new TextDecoder().decode(bytes));
        break;
      default:
        break;
    }
  }

  seekTo(targetIndex: number): void {
    const clamped = Math.max(0, Math.min(targetIndex, this.events.length - 1));
    this.reset();

    if (this.events.length === 0) {
      this.callbacks.onDocChange?.();
      return;
    }

    let startIndex = 0;
    for (let i = clamped; i >= 0; i--) {
      if (this.events[i]?.type === "YJS_SNAPSHOT") {
        startIndex = i;
        break;
      }
    }

    for (let i = startIndex; i <= clamped; i++) {
      this.apply(i);
    }
  }

  getFileText(fileId: string): Y.Text {
    return this.doc.getText(fileId);
  }

  get length(): number {
    return this.events.length;
  }
}
