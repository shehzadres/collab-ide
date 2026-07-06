import { Server as HttpServer } from "http";
import { createYjsServer, authenticateYjsUpgrade } from "../modules/yjs-server/yjs.server";
import { attachTerminalSocket } from "./terminal.socket";
import { logger } from "../utils/logger";

export function attachWebSocketServers(httpServer: HttpServer) {
  const yjsWss = createYjsServer();

  httpServer.on("upgrade", (req, socket, head) => {
    const url = req.url || "";
    if (url.startsWith("/terminal")) return;

    if (!authenticateYjsUpgrade(req)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    yjsWss.handleUpgrade(req, socket, head, (ws) => {
      yjsWss.emit("connection", ws, req);
    });
  });

  attachTerminalSocket(httpServer);

  logger.info("WebSocket servers attached");
}
