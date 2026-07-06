import { RuntimeId } from "./runtimes";

export interface WorkspaceConfig {
  sessionId: string;
  runtime: RuntimeId;
  containerName: string | null;
  networkEnabled: boolean;
  lastActiveAt: Date;
}

export interface UpdateWorkspaceConfigDto {
  runtime?: RuntimeId;
  networkEnabled?: boolean;
}
