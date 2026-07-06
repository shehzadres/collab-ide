// y-websocket@2.x exports "./bin/utils" as a valid runtime subpath (see its
// package.json "exports" map) but ships no TypeScript declarations for it —
// only the client-facing "y-websocket" entry point is typed. This ambient
// module fills that gap so `tsc` can type-check yjs.server.ts without
// resorting to `any`/`@ts-ignore` at the call site.
declare module "y-websocket/bin/utils" {
  import { WebSocket } from "ws";
  import { IncomingMessage } from "http";
  import * as Y from "yjs";

  export interface SetupWSConnectionOptions {
    docName?: string;
    gc?: boolean;
  }

  export const docs: Map<string, Y.Doc>;

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    opts?: SetupWSConnectionOptions
  ): void;

  export function getYDoc(docname: string, gc?: boolean): Y.Doc;
  export function setPersistence(persistence: unknown): void;
  export function getPersistence(): unknown;
  export function setContentInitializor(f: (doc: Y.Doc) => Promise<void>): void;
}
