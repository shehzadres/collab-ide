import * as Y from "yjs";

interface RegistryEntry {
  doc: Y.Doc;
  refCount: number;
}

const registry = new Map<string, RegistryEntry>();

export function registerYDoc(sessionId: string, doc: Y.Doc): void {
  const existing = registry.get(sessionId);
  if (existing && existing.doc === doc) {
    existing.refCount += 1;
    return;
  }
  registry.set(sessionId, { doc, refCount: 1 });
}

export function getYDocFromRegistry(sessionId: string): Y.Doc | undefined {
  return registry.get(sessionId)?.doc;
}

export function unregisterYDoc(sessionId: string): void {
  const entry = registry.get(sessionId);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    registry.delete(sessionId);
  }
}

export function isRoomRegistered(sessionId: string): boolean {
  return registry.has(sessionId);
}
