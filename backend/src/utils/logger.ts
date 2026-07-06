const ts = () => new Date().toISOString();

function safeStringify(meta: unknown): string {
  if (meta === undefined) return "";
  if (meta instanceof Error) return meta.stack || meta.message;
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => {
    console.log(`[INFO] ${ts()} - ${msg}${meta !== undefined ? " " + safeStringify(meta) : ""}`);
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[ERROR] ${ts()} - ${msg}${meta !== undefined ? " " + safeStringify(meta) : ""}`);
  },
  warn: (msg: string, meta?: unknown) => {
    console.warn(`[WARN] ${ts()} - ${msg}${meta !== undefined ? " " + safeStringify(meta) : ""}`);
  },
};
