import { prisma } from "../../utils/prisma";
import { RuntimeId } from "./runtimes";
import { WorkspaceConfig, UpdateWorkspaceConfigDto } from "./workspace.types";

const PRISMA_TO_RUNTIME: Record<string, RuntimeId> = {
  SHELL: "shell",
  NODE: "node",
  PYTHON: "python",
  GO: "go",
};

const RUNTIME_TO_PRISMA: Record<RuntimeId, string> = {
  shell: "SHELL",
  node: "NODE",
  python: "PYTHON",
  go: "GO",
};

function toWorkspaceConfig(row: {
  sessionId: string;
  runtime: string;
  containerName: string | null;
  networkEnabled: boolean;
  lastActiveAt: Date;
}): WorkspaceConfig {
  return {
    sessionId: row.sessionId,
    runtime: PRISMA_TO_RUNTIME[row.runtime] ?? "shell",
    containerName: row.containerName,
    networkEnabled: row.networkEnabled,
    lastActiveAt: row.lastActiveAt,
  };
}

export class WorkspaceService {
  /** Returns the workspace config, creating a default (shell, no network) row if none exists yet. */
  async getOrCreate(sessionId: string): Promise<WorkspaceConfig> {
    const existing = await prisma.workspace.findUnique({ where: { sessionId } });
    if (existing) return toWorkspaceConfig(existing);

    const created = await prisma.workspace.create({
      data: { sessionId, runtime: "SHELL", networkEnabled: false },
    });
    return toWorkspaceConfig(created);
  }

  async updateConfig(sessionId: string, dto: UpdateWorkspaceConfigDto): Promise<WorkspaceConfig> {
    // Ensure a row exists first — updateConfig may be the first touch for a
    // session (e.g. picking a runtime before ever opening the terminal).
    await this.getOrCreate(sessionId);

    const updated = await prisma.workspace.update({
      where: { sessionId },
      data: {
        ...(dto.runtime ? { runtime: RUNTIME_TO_PRISMA[dto.runtime] } : {}),
        ...(dto.networkEnabled !== undefined ? { networkEnabled: dto.networkEnabled } : {}),
      },
    });
    return toWorkspaceConfig(updated);
  }

  async setContainerName(sessionId: string, containerName: string | null): Promise<void> {
    await prisma.workspace.update({
      where: { sessionId },
      data: { containerName },
    });
  }

  async touchLastActive(sessionId: string): Promise<void> {
    await prisma.workspace.update({
      where: { sessionId },
      data: { lastActiveAt: new Date() },
    });
  }

  /** Workspaces whose containers have been idle longer than maxIdleMs — candidates for reaping. */
  async findStale(maxIdleMs: number): Promise<WorkspaceConfig[]> {
    const cutoff = new Date(Date.now() - maxIdleMs);
    const rows = await prisma.workspace.findMany({
      where: {
        containerName: { not: null },
        lastActiveAt: { lt: cutoff },
      },
    });
    return rows.map(toWorkspaceConfig);
  }
}

export const workspaceService = new WorkspaceService();
