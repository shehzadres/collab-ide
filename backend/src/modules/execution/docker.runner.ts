import Docker from "dockerode";
import { logger } from "../../utils/logger";
import { env } from "../../config/env";
import { redis } from "../../utils/redis";
import { getRuntime, RuntimeId } from "./runtimes";
import { workspaceService } from "./workspace.service";

// Lazy singleton — Docker is only instantiated when a function that actually
// needs it is called. In DEMO_MODE the execution controller and terminal
// socket return early before calling any function here, so this module is
// imported but Docker() is never constructed and the missing socket never
// causes a crash.
let _docker: Docker | null = null;
function getDocker(): Docker {
  if (!_docker) _docker = new Docker();
  return _docker;
}

export interface RunningSession {
  container: Docker.Container;
  // dockerode's attach() resolves to NodeJS.ReadWriteStream, not stream.Duplex
  // (per @types/dockerode) — using Duplex here caused a structural-typing
  // mismatch at the assignment in createTerminalSession below, since
  // ReadWriteStream doesn't expose Duplex's internal-only members.
  // ReadWriteStream is all we actually use (.on, .write, .end) so it's the
  // correct, narrower type.
  stream: NodeJS.ReadWriteStream;
  /** True if this call attached to an already-running persistent container rather than creating a new one. */
  resumed: boolean;
}

const ACTIVE_SESSIONS_KEY = "terminal:active_sessions";

// IMPORTANT SCOPE NOTE: this counter is correct for "multiple Node processes
// sharing one Docker host" (e.g. a few backend replicas on the same VM all
// talking to the same Docker daemon over the same socket). It does NOT make
// terminal sessions schedulable across multiple *hosts* — a container
// created via this host's Docker daemon is only attachable from this host's
// process. True multi-host container scheduling is a container-orchestration
// problem (Kubernetes Jobs, Nomad, ECS tasks, etc.) and is out of scope here.
export async function getActiveSessionCount(): Promise<number> {
  const val = await redis.get(ACTIVE_SESSIONS_KEY);
  return val ? parseInt(val, 10) : 0;
}

async function incrementActiveSessions(): Promise<number> {
  return redis.incr(ACTIVE_SESSIONS_KEY);
}

async function decrementActiveSessions(): Promise<void> {
  const next = await redis.decr(ACTIVE_SESSIONS_KEY);
  if (next < 0) {
    // Guard against drift from any double-decrement (e.g. a kill call that
    // races with a failed-create cleanup) — never let the counter go
    // negative, which would otherwise let unlimited sessions through.
    await redis.set(ACTIVE_SESSIONS_KEY, "0");
  }
}

function sanitizeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "session";
}

/**
 * Deterministic container name for a session's persistent workspace. Same
 * sessionId always maps to the same name, which is what lets any backend
 * replica find and reattach to the same container across reconnects — the
 * lookup goes through the shared Docker daemon, not this process's memory.
 */
export function containerNameForSession(sessionId: string): string {
  return `ws-${sanitizeSessionId(sessionId)}`;
}

interface CreateOrAttachOptions {
  sessionId: string;
  runtime: RuntimeId;
  networkEnabled: boolean;
}

/**
 * Finds an existing, still-running container for this session and attaches
 * to it (persistent workspace reconnect), or creates a fresh one if none
 * exists. Containers are NOT auto-removed on stop (unlike the old
 * disposable-per-connection design) — they're only removed by the explicit
 * idle-reaper (see workspace.reaper.ts) or an explicit "reset workspace"
 * action, since the entire point is surviving a disconnect.
 */
export async function createOrAttachTerminalSession(opts: CreateOrAttachOptions): Promise<RunningSession> {
  const docker = getDocker();
  const containerName = containerNameForSession(opts.sessionId);

  const existing = await findContainerByName(containerName);
  if (existing) {
    const info = await existing.inspect();
    if (info.State.Running) {
      const stream = await existing.attach({ stream: true, stdin: true, stdout: true, stderr: true });
      await workspaceService.setContainerName(opts.sessionId, containerName);
      logger.info(`Reattached to persistent workspace container for session ${opts.sessionId}`);
      return { container: existing, stream, resumed: true };
    }

    // Container exists but stopped (e.g. host restarted Docker, or it was
    // OOM-killed) — restart it rather than leaving a dead container behind
    // under the name we need for the next create attempt.
    try {
      await existing.start();
      const stream = await existing.attach({ stream: true, stdin: true, stdout: true, stderr: true });
      await workspaceService.setContainerName(opts.sessionId, containerName);
      logger.info(`Restarted stopped persistent workspace container for session ${opts.sessionId}`);
      return { container: existing, stream, resumed: true };
    } catch (err) {
      logger.warn(`Failed to restart stopped container for session ${opts.sessionId}, recreating`, err);
      await existing.remove({ force: true }).catch(() => {});
    }
  }

  const current = await getActiveSessionCount();
  if (current >= env.MAX_TERMINAL_SESSIONS) {
    throw new Error("Server at maximum terminal session capacity, try again shortly");
  }

  const runtimeDef = getRuntime(opts.runtime);

  const container = await docker.createContainer({
    Image: runtimeDef.image,
    name: containerName,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    Cmd: runtimeDef.shellCmd,
    HostConfig: {
      Memory: 256 * 1024 * 1024,
      MemorySwap: 256 * 1024 * 1024,
      NanoCpus: 500_000_000,
      // Network is fully isolated by default. Enabling it grants the
      // container general internet access (Docker has no built-in way to
      // allowlist just package-registry hosts without an egress-proxy
      // sidecar, which isn't built here) — this is an explicit, visible,
      // per-session opt-in surfaced in the UI, not a silent default change.
      NetworkMode: opts.networkEnabled ? "bridge" : "none",
      AutoRemove: false,
      ReadonlyRootfs: false,
      PidsLimit: 128,
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges"],
    },
  });

  await incrementActiveSessions();

  try {
    await container.start();

    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });

    logger.info(`Created persistent workspace container for session ${opts.sessionId} (runtime=${opts.runtime})`);
    await workspaceService.setContainerName(opts.sessionId, containerName);
    return { container, stream, resumed: false };
  } catch (err) {
    await decrementActiveSessions();
    try {
      await container.remove({ force: true });
    } catch {
      // already gone
    }
    throw err;
  }
}

async function findContainerByName(name: string): Promise<Docker.Container | null> {
  try {
    const docker = getDocker();
    const list = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [name] }) });
    // Docker's name filter is a substring match, not exact — verify exact
    // match ourselves (names are prefixed with "/" in the API response).
    const match = list.find((c) => c.Names.some((n) => n === `/${name}`));
    if (!match) return null;
    return docker.getContainer(match.Id);
  } catch (err) {
    logger.error(`Failed to look up container by name ${name}`, err);
    return null;
  }
}

export async function resizeTerminal(container: Docker.Container, cols: number, rows: number): Promise<void> {
  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols <= 0 || rows <= 0) {
    return;
  }
  await container.resize({ w: Math.floor(cols), h: Math.floor(rows) });
}

/**
 * Detaches from a persistent workspace's container WITHOUT killing it — the
 * normal path on a client disconnect, since the whole point is the
 * container survives to be reattached later. The active-session counter is
 * still decremented because it tracks *connections*, not containers.
 */
export async function detachTerminalSession(): Promise<void> {
  await decrementActiveSessions();
}

/** Actually stops and removes a workspace's container — used by the idle reaper and explicit "reset workspace". */
export async function destroyWorkspaceContainer(sessionId: string): Promise<void> {
  const containerName = containerNameForSession(sessionId);
  const container = await findContainerByName(containerName);
  if (!container) return;

  try {
    await container.kill().catch(() => {
      // already stopped — fine, proceed to remove
    });
    await container.remove({ force: true });
    logger.info(`Destroyed persistent workspace container for session ${sessionId}`);
  } catch (err) {
    logger.warn(`Failed to destroy workspace container for session ${sessionId}`, err);
  }
}

/**
 * Runs a one-off command inside a session's running workspace container
 * (used for the "Run file" and "Install packages" actions) and streams
 * output back via callback. Does not replace or interfere with the
 * interactive shell stream — uses Docker `exec`, a separate process inside
 * the same container/namespace.
 */
export async function execInWorkspace(
  sessionId: string,
  command: string[],
  onOutput: (chunk: Buffer) => void
): Promise<{ exitCode: number }> {
  const containerName = containerNameForSession(sessionId);
  const container = await findContainerByName(containerName);
  if (!container) {
    throw new Error("No active workspace container for this session — open the terminal first.");
  }

  const info = await container.inspect();
  if (!info.State.Running) {
    throw new Error("Workspace container is not running.");
  }

  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });

  const stream = await exec.start({ hijack: true, stdin: false });

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => onOutput(chunk));
    stream.on("error", reject);
    stream.on("end", async () => {
      try {
        const inspectResult = await exec.inspect();
        resolve({ exitCode: inspectResult.ExitCode ?? 0 });
      } catch (err) {
        reject(err);
      }
    });
  });
}
