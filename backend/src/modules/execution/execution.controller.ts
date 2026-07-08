import { Request, Response } from "express";
import { workspaceService } from "./workspace.service";
import { execInWorkspace, destroyWorkspaceContainer } from "./docker.runner";
import { isValidRuntimeId, getRuntime } from "./runtimes";
import { logger } from "../../utils/logger";
import { env } from "../../config/env";

const MAX_PACKAGES_PER_INSTALL = 20;
const PACKAGE_NAME_PATTERN = /^[a-zA-Z0-9@][a-zA-Z0-9@./_-]{0,127}$/;

const DEMO_MESSAGE =
  "Code execution is disabled in the hosted demo. " +
  "Free hosting platforms do not support Docker sandbox execution. " +
  "Clone the repository and run it locally (or self-host) to enable the full execution environment.";

export class ExecutionController {
  async getConfig(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const config = await workspaceService.getOrCreate(sessionId);
      res.status(200).json({ config, demoMode: env.DEMO_MODE });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async updateRuntime(req: Request, res: Response) {
    if (env.DEMO_MODE) {
      return res.status(503).json({ message: DEMO_MESSAGE, demoMode: true });
    }
    try {
      const { sessionId } = req.params;
      const { runtime } = req.body;

      if (!runtime || !isValidRuntimeId(runtime)) {
        return res.status(400).json({ message: "Invalid runtime" });
      }

      const config = await workspaceService.updateConfig(sessionId, { runtime });
      res.status(200).json({ config });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * Enabling network access is intentionally a separate, more restricted
   * endpoint from updateRuntime — it's the one config change with a real
   * security trade-off (see docker.runner.ts), so it requires OWNER+ while
   * runtime selection only requires EDITOR+.
   */
  async updateNetworkAccess(req: Request, res: Response) {
    if (env.DEMO_MODE) {
      return res.status(503).json({ message: DEMO_MESSAGE, demoMode: true });
    }
    try {
      const { sessionId } = req.params;
      const { networkEnabled } = req.body;

      if (typeof networkEnabled !== "boolean") {
        return res.status(400).json({ message: "networkEnabled must be a boolean" });
      }

      const config = await workspaceService.updateConfig(sessionId, { networkEnabled });
      res.status(200).json({ config });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * Resets a workspace by destroying its container — the next terminal
   * connection or run/install call creates a fresh one. Distinct from the
   * idle reaper: this is an explicit, user-initiated action (e.g. "my
   * container is stuck, give me a clean one"), not an automatic cleanup.
   */
  async resetWorkspace(req: Request, res: Response) {
    if (env.DEMO_MODE) {
      return res.status(503).json({ message: DEMO_MESSAGE, demoMode: true });
    }
    try {
      const { sessionId } = req.params;
      await destroyWorkspaceContainer(sessionId);
      await workspaceService.setContainerName(sessionId, null);
      res.status(204).send();
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * Streams a one-off command's output over a chunked HTTP response rather
   * than WebSocket — keeps "Run" and "Install" independent of whether the
   * interactive terminal panel happens to be open, and avoids overloading
   * the terminal WS message protocol with a second, different kind of
   * output stream.
   */
  async runFile(req: Request, res: Response) {
    if (env.DEMO_MODE) {
      return res.status(503).json({ message: DEMO_MESSAGE, demoMode: true });
    }
    const { sessionId } = req.params;
    const { filePath } = req.body;

    if (typeof filePath !== "string" || !filePath.trim()) {
      return res.status(400).json({ message: "filePath is required" });
    }

    try {
      const config = await workspaceService.getOrCreate(sessionId);
      const runtimeDef = getRuntime(config.runtime);
      const command = runtimeDef.runCommand(filePath);

      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      });

      const { exitCode } = await execInWorkspace(sessionId, command, (chunk) => {
        res.write(chunk);
      });

      res.write(`\n[exited with code ${exitCode}]`);
      res.end();
    } catch (err) {
      logger.error(`runFile failed for session ${sessionId}`, err);
      if (!res.headersSent) {
        this.handleError(res, err);
      } else {
        res.end(`\n[error: ${err instanceof Error ? err.message : "unknown error"}]`);
      }
    }
  }

  async installPackages(req: Request, res: Response) {
    if (env.DEMO_MODE) {
      return res.status(503).json({ message: DEMO_MESSAGE, demoMode: true });
    }
    const { sessionId } = req.params;
    const { packages } = req.body;

    if (!Array.isArray(packages) || packages.length === 0 || packages.length > MAX_PACKAGES_PER_INSTALL) {
      return res.status(400).json({ message: `Provide 1-${MAX_PACKAGES_PER_INSTALL} package names` });
    }
    if (!packages.every((p) => typeof p === "string" && PACKAGE_NAME_PATTERN.test(p))) {
      return res.status(400).json({ message: "Invalid package name" });
    }

    try {
      const config = await workspaceService.getOrCreate(sessionId);

      if (!config.networkEnabled) {
        return res.status(403).json({
          message:
            "Package installs require network access for this workspace, which is off by default for security. Enable it from workspace settings first.",
        });
      }

      const runtimeDef = getRuntime(config.runtime);
      const command = runtimeDef.installCommand(packages);

      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      });

      const { exitCode } = await execInWorkspace(sessionId, command, (chunk) => {
        res.write(chunk);
      });

      res.write(`\n[exited with code ${exitCode}]`);
      res.end();
    } catch (err) {
      logger.error(`installPackages failed for session ${sessionId}`, err);
      if (!res.headersSent) {
        this.handleError(res, err);
      } else {
        res.end(`\n[error: ${err instanceof Error ? err.message : "unknown error"}]`);
      }
    }
  }

  private handleError(res: Response, err: unknown, status = 400) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    logger.error(message);
    res.status(status).json({ message });
  }
}

export const executionController = new ExecutionController();
