// Awareness is handled per-connection by y-websocket's setupWSConnection,
// which wires each socket's awareness updates through the shared Y.Doc's
// awareness protocol automatically. No separate server-side awareness store
// is needed beyond what doc.registry.ts exposes for snapshotting.
export {};
