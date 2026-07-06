export type RuntimeId = "shell" | "node" | "python" | "go";

export interface RuntimeDefinition {
  id: RuntimeId;
  label: string;
  /** Docker image tag this runtime executes inside. Built by docker/executor.*.Dockerfile. */
  image: string;
  /** Default interactive shell command for the terminal. */
  shellCmd: string[];
  /** How to run a given entry file's content for the "Run" button. */
  runCommand: (entryFilePath: string) => string[];
  /** Package manager install command, given a list of package names. */
  installCommand: (packages: string[]) => string[];
  /** File extensions this runtime is the default "Run" target for. */
  fileExtensions: string[];
}

const RUNTIMES: Record<RuntimeId, RuntimeDefinition> = {
  shell: {
    id: "shell",
    label: "Shell",
    image: "collab-ide-executor-shell:latest",
    shellCmd: ["/bin/sh"],
    runCommand: (path) => ["/bin/sh", path],
    installCommand: () => {
      throw new Error("The shell runtime has no package manager — use node or python instead.");
    },
    fileExtensions: [".sh"],
  },
  node: {
    id: "node",
    label: "Node.js",
    image: "collab-ide-executor-node:latest",
    shellCmd: ["/bin/sh"],
    runCommand: (path) => ["node", path],
    installCommand: (packages) => ["npm", "install", "--no-audit", "--no-fund", ...packages],
    fileExtensions: [".js", ".mjs", ".cjs"],
  },
  python: {
    id: "python",
    label: "Python",
    image: "collab-ide-executor-python:latest",
    shellCmd: ["/bin/sh"],
    runCommand: (path) => ["python3", path],
    installCommand: (packages) => ["pip", "install", "--user", ...packages],
    fileExtensions: [".py"],
  },
  go: {
    id: "go",
    label: "Go",
    image: "collab-ide-executor-go:latest",
    shellCmd: ["/bin/sh"],
    runCommand: (path) => ["go", "run", path],
    installCommand: (packages) => ["go", "get", ...packages],
    fileExtensions: [".go"],
  },
};

export function getRuntime(id: RuntimeId): RuntimeDefinition {
  return RUNTIMES[id] ?? RUNTIMES.shell;
}

export function listRuntimes(): RuntimeDefinition[] {
  return Object.values(RUNTIMES);
}

export function isValidRuntimeId(id: string): id is RuntimeId {
  return id in RUNTIMES;
}
