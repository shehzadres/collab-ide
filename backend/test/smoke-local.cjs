require("dotenv").config();

const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const WebSocket = require("ws");

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:4000";
const suffix = randomUUID();
const email = `collab-smoke-${suffix}@example.test`;
const username = `collab-smoke-${suffix}`;
const password = `Smoke-${randomUUID()}-Aa9!`;
const sessions = [];
const runtimes = [
  {
    runtime: "node",
    filePath: "main.js",
    content: 'console.log("COLLAB_IDE_NODE_OK")',
    marker: "COLLAB_IDE_NODE_OK",
  },
  {
    runtime: "python",
    filePath: "main.py",
    content: 'print("COLLAB_IDE_PYTHON_OK")',
    marker: "COLLAB_IDE_PYTHON_OK",
  },
  {
    runtime: "go",
    filePath: "main.go",
    content: 'package main\nimport "fmt"\nfunc main() { fmt.Println("COLLAB_IDE_GO_OK") }',
    marker: "COLLAB_IDE_GO_OK",
  },
  {
    runtime: "shell",
    filePath: "main.sh",
    content: 'echo "COLLAB_IDE_SHELL_OK"',
    marker: "COLLAB_IDE_SHELL_OK",
  },
];

let userId;
let accessToken;

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();

  let data = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // Text responses are expected from the execution endpoint.
  }

  if (!response.ok) {
    const message = typeof data === "string" ? data : data?.message || response.statusText;
    throw new Error(`${method} ${path} failed (${response.status}): ${message}`);
  }

  return data;
}

async function testRuntime(runtime) {
  const sessionId = randomUUID();
  sessions.push(sessionId);

  const workspace = await request(`/api/execution/${sessionId}`, { token: accessToken });
  if (!workspace?.config) throw new Error(`${runtime.runtime}: workspace config was not created`);

  await request("/api/files", {
    method: "POST",
    token: accessToken,
    body: {
      name: runtime.filePath,
      path: runtime.filePath,
      isFolder: false,
      parentId: null,
      sessionId,
      content: runtime.content,
    },
  });

  await request(`/api/execution/${sessionId}/runtime`, {
    method: "PATCH",
    token: accessToken,
    body: { runtime: runtime.runtime },
  });

  const response = await fetch(`${baseUrl}/api/execution/${sessionId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filePath: runtime.filePath }),
  });
  const output = await response.text();

  if (!response.ok) {
    throw new Error(`${runtime.runtime} execution failed (${response.status}): ${output}`);
  }
  if (!output.includes(runtime.marker) || !output.includes("exited with code 0")) {
    throw new Error(`${runtime.runtime} returned unexpected output: ${output}`);
  }

  console.log(`PASS ${runtime.runtime} execution without opening the terminal`);

  await request(`/api/execution/${sessionId}/reset`, {
    method: "POST",
    token: accessToken,
  });
  console.log(`PASS ${runtime.runtime} workspace reset`);
}

async function testTerminalWebSocket() {
  const sessionId = randomUUID();
  sessions.push(sessionId);
  await request(`/api/execution/${sessionId}`, { token: accessToken });

  const marker = "COLLAB_IDE_TERMINAL_OK";
  await new Promise((resolve, reject) => {
    const wsBaseUrl = baseUrl.replace(/^http/, "ws").replace("localhost", "127.0.0.1");
    const url = new URL("/terminal", wsBaseUrl);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("token", accessToken);
    const socket = new WebSocket(url);
    let markerSeen = false;
    let commandSent = false;

    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Terminal WebSocket timed out"));
    }, 15000);


    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === "ready" && !commandSent) {
          commandSent = true;
          socket.send(JSON.stringify({ type: "input", data: `echo ${marker}\n` }));
          return;
        }
        if (message.type === "output" && String(message.data).includes(marker)) {
          markerSeen = true;
          socket.close();
        } else if (message.type === "exit" && !markerSeen) {
          clearTimeout(timer);
          reject(new Error(message.message || "Terminal exited before returning output"));
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    socket.on("close", () => {
      clearTimeout(timer);
      if (markerSeen) resolve();
      else reject(new Error("Terminal closed before returning expected output"));
    });
  });

  console.log("PASS authenticated interactive terminal WebSocket");
  await request(`/api/execution/${sessionId}/reset`, {
    method: "POST",
    token: accessToken,
  });
  console.log("PASS terminal workspace reset");
}

async function run() {
  const registration = await request("/api/auth/register", {
    method: "POST",
    body: { email, username, password },
  });
  userId = registration.user?.id;
  accessToken = registration.accessToken;

  if (!userId || !accessToken) throw new Error("Registration response is incomplete");
  if ("passwordHash" in registration.user || "refreshToken" in registration.user) {
    throw new Error("Registration response exposed sensitive authentication fields");
  }
  console.log("PASS registration and response sanitization");

  const profile = await request("/api/auth/me", { token: accessToken });
  if (profile.user?.id !== userId) throw new Error("Authenticated profile did not match");
  console.log("PASS authenticated profile");

  if (process.env.SMOKE_TERMINAL_ONLY !== "true") {
    for (const runtime of runtimes) {
      await testRuntime(runtime);
    }
  }

  await testTerminalWebSocket();

  await request("/api/auth/logout", {
    method: "POST",
    token: accessToken,
  });
  console.log("PASS logout");
}

async function cleanup() {
  if (accessToken) {
    for (const sessionId of sessions) {
      try {
        await request(`/api/execution/${sessionId}/reset`, {
          method: "POST",
          token: accessToken,
        });
      } catch {
        // The workspace may already have been reset or never created.
      }
    }
  }

  for (const sessionId of sessions) {
    await prisma.file.deleteMany({ where: { sessionId } });
    await prisma.workspace.deleteMany({ where: { sessionId } });
    await prisma.sessionMember.deleteMany({ where: { sessionId } });
  }

  if (userId) {
    await prisma.user.deleteMany({ where: { id: userId } });
    console.log("CLEANUP temporary user and workspace records removed");
  }
}

(async () => {
  let failed = false;
  try {
    await run();
  } catch (error) {
    failed = true;
    console.error("FAIL", error.message);
  } finally {
    try {
      await cleanup();
    } catch (error) {
      failed = true;
      console.error("CLEANUP FAILED", error.message);
    }
    await prisma.$disconnect();
  }
  if (failed) process.exitCode = 1;
})();
