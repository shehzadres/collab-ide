export type RuntimeId = "shell" | "node" | "python" | "go";

export interface RuntimeOption {
  id: RuntimeId;
  label: string;
}

export const RUNTIME_OPTIONS: RuntimeOption[] = [
  { id: "shell", label: "Shell" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
];

export interface WorkspaceConfig {
  sessionId: string;
  runtime: RuntimeId;
  containerName: string | null;
  networkEnabled: boolean;
  lastActiveAt: string;
}
