import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server as HttpServer } from "http";
import {
  createOrAttachTerminalSession,
  resizeTerminal,
  detachTerminalSession,
  RunningSession,
} from "../modules/execution/docker.runner";
import { workspaceService } from "../modules/execution/workspace.service";
import { TerminalClientMessage } from "../modules/execution/execution.types";
import { sessionsService } from "../modules/sessions/sessions.service";
import { verifyAccessToken } from "../utils/jwt";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const sessions = new Map<WebSocket, RunningSession>();
const MAX_INPUT_BYTES = 64 * 1024;

export function attachTerminalSocket(httpServer: HttpServer, path = "/terminal") {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_INPUT_BYTES });

  httpServer.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith(path)) return;

    // In demo mode, reject terminal WebSocket upgrades gracefully before any
    // Docker interaction — the frontend checks env.DEMO_MODE and hides the
    // terminal panel entirely, so this is a belt-and-suspenders guard.
    if (env.DEMO_MODE) {
      socket.write("HTTP/1.1 503 Service Unavailable\r\nX-Demo-Mode: true\r\n\r\n");
      socket.destroy();
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const token = url.searchParams.get("token");

    try {
      if (!token) throw new Error("Missing token");
      verifyAccessToken(token);
    } catch {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", "http://localhost");
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId || sessionId.length > 128) {
      ws.send(JSON.stringify({ type: "exit", code: 1 }));
      ws.close();
      return;
    }

    let closed = false;
    let running: RunningSession | null = null;
    let idleTimer: NodeJS.Timeout | null = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // This only closes the WebSocket connection on inactivity — it does
        // NOT destroy the underlying container (that's the whole point of
        // persistent workspaces). The container is reaped separately, much
        // later, by workspace.reaper.ts if truly abandoned.
        logger.info(`Terminal connection for session ${sessionId} idle timeout — disconnecting`);
        ws.close();
      }, env.TERMINAL_IDLE_TIMEOUT_MS);
    };

    ws.on("close", () => {
      closed = true;
      if (idleTimer) clearTimeout(idleTimer);
    });

    try {
      const config = await workspaceService.getOrCreate(sessionId);
      running = await createOrAttachTerminalSession({
        sessionId,
        runtime: config.runtime,
        networkEnabled: config.networkEnabled,
      });
      await workspaceService.touchLastActive(sessionId);
    } catch (err) {
      logger.error("Failed to start or attach terminal container", err);
      if (ws.readyState === ws.OPEN) {
        const message = err instanceof Error ? err.message : "Failed to start terminal";
        ws.send(JSON.stringify({ type: "exit", code: 1, message }));
        ws.close();
      }
      return;
    }

    if (closed) {
      // Connection dropped while we were attaching — detach (don't destroy;
      // the container may be shared by the next reconnect attempt or other
      // viewers of the same session).
      await detachTerminalSession();
      return;
    }

    sessions.set(ws, running);
    const activeSession = running;
    resetIdleTimer();

    if (activeSession.resumed) {
      ws.send(JSON.stringify({ type: "output", data: "\r\n\x1b[2m[reattached to existing workspace]\x1b[0m\r\n" }));
    }

    activeSession.stream.on("data", (chunk: Buffer) => {
      if (sessionsService.isRecording(sessionId)) {
        sessionsService.recordEvent(sessionId, "TERMINAL_OUTPUT", Buffer.from(chunk));
      }
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data: chunk.toString("utf8") }));
      }
    });

    activeSession.stream.on("end", () => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "exit", code: 0 }));
        ws.close();
      }
    });

    activeSession.stream.on("error", (err) => {
      logger.error(`Terminal stream error for session ${sessionId}`, err);
    });

    ws.on("message", async (raw) => {
      resetIdleTimer();
      try {
        const msg: TerminalClientMessage = JSON.parse(raw.toString());
        if (msg.type === "input") {
          if (typeof msg.data !== "string" || msg.data.length > MAX_INPUT_BYTES) return;
          if (sessionsService.isRecording(sessionId)) {
            sessionsService.recordEvent(sessionId, "TERMINAL_INPUT", Buffer.from(msg.data));
          }
          activeSession.stream.write(msg.data);
          await workspaceService.touchLastActive(sessionId);
        } else if (msg.type === "resize") {
          await resizeTerminal(activeSession.container, msg.cols, msg.rows);
        }
      } catch (err) {
        logger.error("Bad terminal message", err);
      }
    });

    ws.on("close", async () => {
      sessions.delete(ws);
      // Detach only — the container keeps running so the next connection
      // (this tab reopening, or another collaborator) resumes the same
      // shell state instead of starting from scratch.
      await detachTerminalSession();
    });

    ws.on("error", (err) => {
      logger.warn(`Terminal WS error for session ${sessionId}`, err);
    });
  });

  logger.info(`Terminal WebSocket server attached at ${path}`);
}
