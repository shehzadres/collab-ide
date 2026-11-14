require("dotenv").config();

const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const WebSocket = require("ws");
const Y = require("yjs");
const { WebsocketProvider } = require("y-websocket");

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:4000";
const wsBaseUrl = baseUrl.replace(/^http/, "ws").replace("localhost", "127.0.0.1");
const suffix = randomUUID();
const createdUsers = [];
const sessionIds = [randomUUID(), randomUUID()];
const sockets = [];
const providers = [];
let cleanupOwnerToken = null;

async function request(path, { method = "GET", token, body, allowFailure = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let data = raw;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok && !allowFailure) {
    throw new Error(method + " " + path + " failed (" + response.status + "): " + (data?.message || raw));
  }
  return { status: response.status, data };
}

async function createUser(label) {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: {
      email: label + "-" + suffix + "@example.test",
      username: label + "-" + suffix.slice(0, 8),
      password: "Collab-" + randomUUID() + "-Aa9!",
    },
  });
  const user = { id: result.data.user.id, token: result.data.accessToken };
  createdUsers.push(user);
  return user;
}

function connectYjs(sessionId, token, doc) {
  return new Promise((resolve, reject) => {
    const provider = new WebsocketProvider(wsBaseUrl + "/ws", sessionId, doc, {
      params: { token },
      WebSocketPolyfill: WebSocket,
      disableBc: true,
      maxBackoffTime: 1000,
    });
    providers.push(provider);
    const timeout = setTimeout(() => {
      const state = { connected: provider.wsconnected, synced: provider.synced, readyState: provider.ws?.readyState };
      provider.destroy();
      reject(new Error("Yjs provider did not synchronize: " + JSON.stringify(state)));
    }, 10000);
    provider.on("sync", (synced) => {
      if (!synced) return;
      clearTimeout(timeout);
      resolve(provider);
    });
    provider.on("connection-error", (event) => {
      clearTimeout(timeout);
      reject(new Error("Yjs WebSocket connection failed: " + (event?.message || "unknown error")));
    });
  });
}

async function waitForText(doc, expected, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (doc.getText("source").toString().includes(expected)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Yjs peer did not receive expected update: " + expected);
}

async function expectTerminalDenied(sessionId, token) {
  await new Promise((resolve, reject) => {
    const url = new URL("/terminal", wsBaseUrl);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("token", token);
    const socket = new WebSocket(url);
    sockets.push(socket);
    let denialSeen = false;
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Viewer terminal denial timed out"));
    }, 10000);
    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === "exit" && /editor access/i.test(message.message || "")) denialSeen = true;
      } catch {}
    });
    socket.on("close", (code) => {
      clearTimeout(timer);
      if (denialSeen && code === 1008) resolve();
      else reject(new Error("Viewer terminal was not rejected with policy close (code " + code + ")"));
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function expectTerminalAllowed(sessionId, token) {
  await new Promise((resolve, reject) => {
    const marker = "COLLAB_EDITOR_TERMINAL_" + suffix.slice(0, 8);
    const url = new URL("/terminal", wsBaseUrl);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("token", token);
    const socket = new WebSocket(url);
    sockets.push(socket);
    let markerSeen = false;
    let commandSent = false;
    let output = "";
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Editor terminal test timed out; output=" + output.slice(-300)));
    }, 15000);
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type === "ready" && !commandSent) {
        commandSent = true;
        socket.send(JSON.stringify({ type: "input", data: "echo " + marker + "\n" }));
      } else if (message.type === "output") {
        output += String(message.data);
        if (output.includes(marker)) {
          markerSeen = true;
          socket.close();
        }
      } else if (message.type === "exit" && !markerSeen) {
        clearTimeout(timer);
        reject(new Error(message.message || "Editor terminal exited unexpectedly"));
      }
    });
    socket.on("close", () => {
      clearTimeout(timer);
      if (markerSeen) resolve();
      else reject(new Error("Editor terminal closed before command output"));
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function openEditorTerminal(sessionId, token) {
  return new Promise((resolve, reject) => {
    const url = new URL("/terminal", wsBaseUrl);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("token", token);
    const socket = new WebSocket(url);
    sockets.push(socket);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Editor terminal did not become ready"));
    }, 10000);
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type === "ready") {
        clearTimeout(timer);
        resolve(socket);
      } else if (message.type === "exit") {
        clearTimeout(timer);
        reject(new Error(message.message || "Editor terminal exited"));
      }
    });
    socket.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function expectPolicyClose(socket) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Active terminal was not revoked after role change"));
    }, 5000);
    socket.on("close", (code) => {
      clearTimeout(timer);
      if (code === 1008) resolve();
      else reject(new Error("Expected policy close 1008, got " + code));
    });
  });
}

function watchProviderReconnect(provider) {
  return new Promise((resolve, reject) => {
    let disconnected = false;
    const timeout = setTimeout(() => {
      provider.off("status", onStatus);
      provider.off("sync", onSync);
      reject(new Error("Yjs provider did not reconnect after role change"));
    }, 10000);
    const onStatus = (event) => {
      if (event.status === "disconnected") disconnected = true;
    };
    const onSync = (synced) => {
      if (!disconnected || !synced) return;
      clearTimeout(timeout);
      provider.off("status", onStatus);
      provider.off("sync", onSync);
      resolve();
    };
    provider.on("status", onStatus);
    provider.on("sync", onSync);
  });
}

async function cleanup() {
  for (const provider of providers) {
    const socket = provider.ws;
    try { provider.destroy(); } catch {}
    try { socket?.terminate(); } catch {}
    try { provider.doc.destroy(); } catch {}
  }
  for (const socket of sockets) {
    try { socket.terminate(); } catch {}
  }
  if (cleanupOwnerToken) {
    try {
      await request("/api/execution/" + sessionIds[0] + "/reset", {
        method: "POST", token: cleanupOwnerToken,
      });
    } catch {}
  }
  for (const sessionId of sessionIds) {
    await prisma.recordingEvent.deleteMany({ where: { recording: { sessionId } } });
    await prisma.sessionRecording.deleteMany({ where: { sessionId } });
    await prisma.sessionInvite.deleteMany({ where: { sessionId } });
    await prisma.file.deleteMany({ where: { sessionId } });
    await prisma.workspace.deleteMany({ where: { sessionId } });
    await prisma.sessionMember.deleteMany({ where: { sessionId } });
  }
  if (createdUsers.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUsers.map((user) => user.id) } } });
  }
}

async function run() {
  const owner = await createUser("owner");
  cleanupOwnerToken = owner.token;
  const viewer = await createUser("viewer");
  const editor = await createUser("editor");
  const raceA = await createUser("racea");
  const raceB = await createUser("raceb");
  const sessionId = sessionIds[0];
  const raceSessionId = sessionIds[1];

  await request("/api/execution/" + sessionId, { token: owner.token });
  const ownerRole = await request("/api/permissions/" + sessionId + "/me", { token: owner.token });
  assert.equal(ownerRole.data.role, "OWNER");
  console.log("PASS first participant becomes session owner");

  const fileResult = await request("/api/files", {
    method: "POST",
    token: owner.token,
    body: {
      name: "main.js",
      path: "main.js",
      isFolder: false,
      parentId: null,
      sessionId,
      content: "console.log('owner')",
    },
  });
  const fileId = fileResult.data.file.id;

  await request("/api/files/tree/" + sessionId, { token: viewer.token });
  await request("/api/execution/" + sessionId, { token: viewer.token });
  const viewerRole = await request("/api/permissions/" + sessionId + "/me", { token: viewer.token });
  assert.equal(viewerRole.data.role, "VIEWER");
  console.log("PASS read-only workspace and runtime-config requests preserve VIEWER role");

  const deniedFileWrite = await request("/api/files/" + fileId, {
    method: "PATCH", token: viewer.token, body: { content: "unauthorized" }, allowFailure: true,
  });
  assert.equal(deniedFileWrite.status, 403);
  const deniedRun = await request("/api/execution/" + sessionId + "/run", {
    method: "POST", token: viewer.token, body: { filePath: "main.js" }, allowFailure: true,
  });
  assert.equal(deniedRun.status, 403);
  const deniedInvite = await request("/api/permissions/" + sessionId + "/invites", {
    method: "POST", token: viewer.token, body: { role: "EDITOR" }, allowFailure: true,
  });
  assert.equal(deniedInvite.status, 403);
  console.log("PASS viewer cannot edit files, execute code, or create invites");

  await expectTerminalDenied(sessionId, viewer.token);
  console.log("PASS viewer terminal WebSocket rejected with policy close");

  const inviteResponse = await request("/api/permissions/" + sessionId + "/invites", {
    method: "POST", token: owner.token, body: { role: "EDITOR", maxUses: 1 },
  });
  const invite = inviteResponse.data.invite;
  const redeemed = await request("/api/permissions/invites/" + invite.token + "/redeem", {
    method: "POST", token: editor.token, body: {},
  });
  assert.equal(redeemed.data.role, "EDITOR");
  console.log("PASS invite redemption grants requested EDITOR role");

  const exhausted = await request("/api/permissions/invites/" + invite.token + "/redeem", {
    method: "POST", token: viewer.token, body: {}, allowFailure: true,
  });
  assert.equal(exhausted.status, 400);
  const storedInvite = await prisma.sessionInvite.findUnique({ where: { id: invite.id } });
  assert.equal(storedInvite.useCount, 1);
  console.log("PASS invite maxUses enforced");

  const invalidInvite = await request("/api/permissions/" + sessionId + "/invites", {
    method: "POST", token: owner.token, body: { role: "EDITOR", maxUses: 0 }, allowFailure: true,
  });
  assert.equal(invalidInvite.status, 400);
  const revokedInviteResponse = await request("/api/permissions/" + sessionId + "/invites", {
    method: "POST", token: owner.token, body: { role: "EDITOR" },
  });
  const revokedInvite = revokedInviteResponse.data.invite;
  const viewerRevokeAttempt = await request("/api/permissions/invites/" + revokedInvite.id, {
    method: "DELETE", token: viewer.token, allowFailure: true,
  });
  assert.equal(viewerRevokeAttempt.status, 403);
  await request("/api/permissions/invites/" + revokedInvite.id, {
    method: "DELETE", token: owner.token,
  });
  const revokedRedemption = await request("/api/permissions/invites/" + revokedInvite.token + "/redeem", {
    method: "POST", token: raceA.token, body: {}, allowFailure: true,
  });
  assert.equal(revokedRedemption.status, 400);
  console.log("PASS invite validation, owner-only revocation, and revoked-link rejection");

  const raceInviteResponse = await request("/api/permissions/" + sessionId + "/invites", {
    method: "POST", token: owner.token, body: { role: "EDITOR", maxUses: 1 },
  });
  const raceInvite = raceInviteResponse.data.invite;
  const redemptions = await Promise.all([
    request("/api/permissions/invites/" + raceInvite.token + "/redeem", {
      method: "POST", token: raceA.token, body: {}, allowFailure: true,
    }),
    request("/api/permissions/invites/" + raceInvite.token + "/redeem", {
      method: "POST", token: raceB.token, body: {}, allowFailure: true,
    }),
  ]);
  assert.equal(redemptions.filter((result) => result.status === 200).length, 1);
  assert.equal(redemptions.filter((result) => result.status === 400).length, 1);
  const storedRaceInvite = await prisma.sessionInvite.findUnique({ where: { id: raceInvite.id } });
  assert.equal(storedRaceInvite.useCount, 1);
  console.log("PASS concurrent invite redemption cannot exceed maxUses");

  const ownerDoc = new Y.Doc();
  const editorDoc = new Y.Doc();
  const viewerDoc = new Y.Doc();
  ownerDoc.getText("source").insert(0, "seed");
  await connectYjs(sessionId, owner.token, ownerDoc);
  const editorProvider = await connectYjs(sessionId, editor.token, editorDoc);
  await connectYjs(sessionId, viewer.token, viewerDoc);
  await waitForText(editorDoc, "seed");
  await waitForText(viewerDoc, "seed");

  ownerDoc.getText("source").insert(4, "-owner");
  await waitForText(editorDoc, "seed-owner");
  await waitForText(viewerDoc, "seed-owner");
  console.log("PASS owner edits synchronize to editor and viewer clients");

  editorDoc.getText("source").insert(editorDoc.getText("source").length, "-editor");
  await waitForText(ownerDoc, "seed-owner-editor");
  await waitForText(viewerDoc, "seed-owner-editor");
  console.log("PASS invited editor edits synchronize to other participants");

  const beforeViewerAttempt = ownerDoc.getText("source").toString();
  viewerDoc.getText("source").insert(viewerDoc.getText("source").length, "-viewer-forbidden");
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(ownerDoc.getText("source").toString(), beforeViewerAttempt);
  assert.equal(editorDoc.getText("source").toString(), beforeViewerAttempt);
  console.log("PASS viewer Yjs mutation is dropped server-side");

  const recordingStart = await request("/api/sessions/" + sessionId + "/start", {
    method: "POST", token: owner.token,
  });
  const recordingId = recordingStart.data.recordingId;
  assert.ok(recordingId);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const recordedMarker = "-recorded";
  ownerDoc.getText("source").insert(ownerDoc.getText("source").length, recordedMarker);
  await new Promise((resolve) => setTimeout(resolve, 700));
  const recordingStop = await request("/api/sessions/" + sessionId + "/stop", {
    method: "POST", token: owner.token,
  });
  assert.equal(recordingStop.data.recording.id, recordingId);

  const replayResult = await request("/api/sessions/recordings/" + recordingId + "/replay", {
    token: owner.token,
  });
  const replayEvents = replayResult.data.events;
  assert.ok(replayEvents.some((event) => event.type === "YJS_SNAPSHOT"));
  assert.ok(replayEvents.some((event) => event.type === "YJS_UPDATE"));
  const replayDoc = new Y.Doc();
  for (const event of replayEvents) {
    const update = Buffer.from(event.payload, "base64");
    if (event.type === "YJS_SNAPSHOT") {
      Y.applyUpdateV2(replayDoc, update);
    } else if (event.type === "YJS_UPDATE") {
      Y.applyUpdateV2(replayDoc, update);
    }
  }
  assert.ok(replayDoc.getText("source").toString().includes("seed-owner-editor" + recordedMarker));
  replayDoc.destroy();
  console.log("PASS recording captures an immediate snapshot and Yjs updates; replay reconstructs shared content");

  await expectTerminalAllowed(sessionId, editor.token);
  console.log("PASS invited editor can use terminal");

  const activeEditorTerminal = await openEditorTerminal(sessionId, editor.token);
  const terminalRevoked = expectPolicyClose(activeEditorTerminal);
  const providerReconnected = watchProviderReconnect(editorProvider);
  const demotion = await request("/api/permissions/" + sessionId + "/members/" + editor.id, {
    method: "PATCH", token: owner.token, body: { role: "VIEWER" },
  });
  assert.equal(demotion.status, 200);
  await Promise.all([terminalRevoked, providerReconnected]);
  const beforeDemotedEdit = ownerDoc.getText("source").toString();
  editorDoc.getText("source").insert(editorDoc.getText("source").length, "-demoted-editor");
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(ownerDoc.getText("source").toString(), beforeDemotedEdit);
  await expectTerminalDenied(sessionId, editor.token);
  console.log("PASS role changes revoke active terminal and Yjs sockets; reconnect uses viewer permissions");

  const firstTouches = await Promise.all([
    request("/api/permissions/" + raceSessionId + "/me", { token: raceA.token }),
    request("/api/permissions/" + raceSessionId + "/me", { token: raceB.token }),
  ]);
  const roles = firstTouches.map((result) => result.data.role);
  assert.equal(roles.filter((role) => role === "OWNER").length, 1);
  assert.equal(roles.filter((role) => role === "VIEWER").length, 1);
  console.log("PASS concurrent first touches create exactly one OWNER");

  const raceMembers = await prisma.sessionMember.findMany({ where: { sessionId: raceSessionId } });
  const raceOwner = raceMembers.find((member) => member.role === "OWNER");
  const raceViewer = raceMembers.find((member) => member.role === "VIEWER");
  const raceOwnerUser = raceOwner.userId === raceA.id ? raceA : raceB;
  const raceViewerUser = raceViewer.userId === raceA.id ? raceA : raceB;
  const promotion = await request("/api/permissions/" + raceSessionId + "/members/" + raceViewer.userId, {
    method: "PATCH", token: raceOwnerUser.token, body: { role: "OWNER" },
  });
  assert.equal(promotion.status, 200);
  const concurrentDemotions = await Promise.all([
    request("/api/permissions/" + raceSessionId + "/members/" + raceOwner.userId, {
      method: "PATCH", token: raceOwnerUser.token, body: { role: "VIEWER" }, allowFailure: true,
    }),
    request("/api/permissions/" + raceSessionId + "/members/" + raceViewer.userId, {
      method: "PATCH", token: raceViewerUser.token, body: { role: "VIEWER" }, allowFailure: true,
    }),
  ]);
  assert.equal(concurrentDemotions.filter((result) => result.status === 200).length, 1);
  assert.equal(concurrentDemotions.filter((result) => result.status === 403).length, 1);
  assert.equal(await prisma.sessionMember.count({ where: { sessionId: raceSessionId, role: "OWNER" } }), 1);
  console.log("PASS concurrent owner demotions cannot orphan a session");

  const lastOwnerDemotion = await request("/api/permissions/" + sessionId + "/members/" + owner.id, {
    method: "PATCH", token: owner.token, body: { role: "VIEWER" }, allowFailure: true,
  });
  assert.equal(lastOwnerDemotion.status, 403);
  const lastOwnerRemoval = await request("/api/permissions/" + sessionId + "/members/" + owner.id, {
    method: "DELETE", token: owner.token, allowFailure: true,
  });
  assert.equal(lastOwnerRemoval.status, 403);
  console.log("PASS last session owner cannot demote or remove themselves");
}

(async () => {
  let failed = false;
  try {
    await run();
  } catch (error) {
    failed = true;
    console.error("FAIL", error.stack || error.message);
  } finally {
    try { await cleanup(); } catch (error) {
      failed = true;
      console.error("CLEANUP FAILED", error.message);
    }
    await prisma.$disconnect();
  }
  if (failed) process.exitCode = 1;
})();
