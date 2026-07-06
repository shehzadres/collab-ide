import { workspaceService } from "./workspace.service";
import { destroyWorkspaceContainer } from "./docker.runner";
import { logger } from "../../utils/logger";

const REAP_CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
// Deliberately much longer than TERMINAL_IDLE_TIMEOUT_MS (which only closes
// the WebSocket connection). This is the actual container-destruction idle
// window — persistent workspaces are meant to survive disconnects,
// reconnects, and even fairly long absences (closing the laptop overnight),
// so this is measured in hours, not minutes.
const CONTAINER_IDLE_MS = 4 * 60 * 60 * 1000; // 4 hours

let reapTimer: NodeJS.Timeout | null = null;

export function startWorkspaceReaper(): void {
  if (reapTimer) return;

  reapTimer = setInterval(async () => {
    try {
      const stale = await workspaceService.findStale(CONTAINER_IDLE_MS);
      for (const workspace of stale) {
        logger.info(`Reaping idle workspace container for session ${workspace.sessionId}`);
        await destroyWorkspaceContainer(workspace.sessionId);
        await workspaceService.setContainerName(workspace.sessionId, null);
      }
    } catch (err) {
      logger.error("Workspace reaper pass failed", err);
    }
  }, REAP_CHECK_INTERVAL_MS);
}

export function stopWorkspaceReaper(): void {
  if (reapTimer) {
    clearInterval(reapTimer);
    reapTimer = null;
  }
}
