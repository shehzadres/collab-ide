# Collab IDE

<div align="center">

<img src="./assets/images/banner.png" alt="Collab IDE Banner" width="100%" />

<br />

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](#license)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Monaco Editor](https://img.shields.io/badge/Monaco-VS%20Code%20Engine-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-F5A623?style=for-the-badge)](https://yjs.dev)

<br />

**A production-grade, browser-based collaborative code editor.**

Real-time CRDT synchronization · Multi-cursor presence · Sandboxed multi-language execution · Session recording & replay · Role-based access control

[Live Demo](https://your-live-demo.vercel.app) · [Documentation](https://yourdomain.dev/docs) · [Report a Bug](https://github.com/shehzadres/collab-ide/issues) · [Request a Feature](https://github.com/shehzadres/collab-ide/issues)

</div>

---

## Table of Contents

- [Why Collab IDE](#why-collab-ide)
- [Feature Highlights](#feature-highlights)
- [Screenshots](#screenshots)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
  - [Manual / Cloud Deployment](#manual--cloud-deployment)
- [Environment Variables](#environment-variables)
- [First Run Walkthrough](#first-run-walkthrough)
- [Roles & Permissions](#roles--permissions)
- [Workspace Runtimes](#workspace-runtimes)
- [Session Recording & Replay](#session-recording--replay)
- [Security Considerations](#security-considerations)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Why Collab IDE

Most collaborative coding tools are either cloud-locked, oversimplified, or don't give you access to real execution environments. Collab IDE is different:

- 🔀 **Conflict-free by design.** Powered by Yjs CRDTs — no operational-transform hacks, no "last write wins" data loss.
- 🐳 **Real execution, real isolation.** Every session gets a sandboxed Docker container with memory, CPU, and network limits enforced at the kernel level.
- 🔒 **Security at the protocol layer.** VIEWER permissions are enforced inside the Yjs WebSocket protocol — a VIEWER cannot inject code changes even via a raw WebSocket client.
- 🏠 **Self-hostable.** One `docker compose up` and you own everything — your data, your infrastructure, your domain.
- 📚 **Built to be studied.** The codebase is intentionally production-grade: typed end-to-end, modular, properly layered, and extensively documented.

---

## Feature Highlights

### 🔄 Conflict-Free Real-Time Collaboration

| Feature | Details |
|---|---|
| CRDT synchronization | Yjs — concurrent edits from any number of users, zero conflicts |
| Multi-cursor presence | Colored cursors, selection highlights, and username labels per user |
| Online-user avatars | Real-time join/leave notifications with presence indicators |
| Redis-backed scaling | Yjs updates broadcast across backend replicas via Redis pub/sub |

### ✏️ Editor

| Feature | Details |
|---|---|
| Monaco Editor | The same engine that powers VS Code, running in the browser |
| Syntax highlighting | 10+ languages supported via Monaco's built-in language support |
| Per-file undo/redo | Independent history stacks per open file |
| Themes | Dark, Light, Midnight, Solarized |
| Tab management | Multi-file tabs with auto-layout resize |

### 📁 File System

| Feature | Details |
|---|---|
| File explorer | Create, rename, move, and delete files and folders |
| Lazy loading | File content fetched on open, not all at once |
| Role-gated mutations | VIEWER role cannot create or delete files — enforced server-side |
| Project templates | Blank, Node.js, Python, HTML/CSS/JS starter templates |

### 🖥️ Sandboxed Terminal

| Feature | Details |
|---|---|
| Real shell | A genuine shell session inside a per-session Docker container |
| Persistent workspaces | Container survives disconnect; reconnection reattaches to the same shell with all installed packages intact |
| 4 language runtimes | Shell, Node.js 20, Python 3.12, Go 1.23 |
| Run active file | ▶ Run button executes the current file in the session's runtime, output streamed into the terminal |
| Package installs | `npm install`, `pip install`, `go get` — with streaming output |

### 🔐 Auth & Permissions

| Feature | Details |
|---|---|
| Auth | Email/password registration and login |
| Dual-token auth | JWT access token (15 min, in-memory) + refresh token (7 days, httpOnly cookie) |
| Silent refresh | Axios interceptor handles token renewal transparently |
| Per-session RBAC | OWNER, EDITOR, VIEWER roles — each assigned independently per session |
| Invite links | Token-based invite URLs, per-role, with optional expiry and use-limit |

### 🎬 Session Recording & Replay

| Feature | Details |
|---|---|
| What's recorded | Every Yjs CRDT update frame, Yjs snapshots (every 10s), terminal input and output bytes |
| Seeking | O(updates since last snapshot), not O(all updates) — snapshot-accelerated seeking |
| Replay controls | Scrubber, play/pause, 0.5×–4× speed, seek-to-snapshot |

### ⌨️ Developer Experience

| Feature | Details |
|---|---|
| Command palette | Cmd/Ctrl+K — fuzzy search across all workspace commands |
| Keyboard shortcuts | Full shortcut support throughout the UI |
| Toast notifications | Non-blocking feedback for async operations |
| Notification bell | Persistent in-session event log |

---

## Screenshots

<br />

**Login Page**

![Login](./assets/images/screenshots/login.png)

**Session Dashboard**

![Dashboard](./assets/images/screenshots/dashboard.png)

**Collaborative Editor — Monaco with File Explorer & Terminal**

![Editor](./assets/images/screenshots/editor.png)

**Multi-Cursor Editing — Two Users, Live**

![Multi-cursor](./assets/images/screenshots/multicursor.png)

**Sandboxed Terminal — Running a Node.js Script**

![Terminal](./assets/images/screenshots/terminal.png)

**Members & Invite Management**

![Members](./assets/images/screenshots/members.png)

**Command Palette — Fuzzy Search**

![Command Palette](./assets/images/screenshots/command-palette.png)

---

## Architecture Overview

```
Browser
  │
  ├─ HTTPS / REST ─────────────────────► Express API :4000
  │                                           │
  ├─ WebSocket (Yjs sync) ────────────────────►  y-websocket server
  │   JWT token in query param                │    │
  │                                           │    ├─ Y.Doc per room (sessionId)
  │                                           │    ├─ Redis pub/sub broadcast
  ├─ WebSocket (terminal) ────────────────────►    │  (cross-replica sync)
  │   JWT token in query param                │    └─ awareness (multi-cursor)
  │                                           │
  │                                    ┌──────┤
  │                                    │      │
  │                             PostgreSQL  Redis
  │                             (all data)  (ephemeral sync + recording state)
  │
  └─ Docker daemon (via dockerode)
       │
       ├─ ws-<sessionId>  ← persistent workspace container
       │    Shell / Node.js / Python / Go
       │    NetworkMode: none (default) or bridge (opt-in by OWNER)
       │    Memory: 256 MB hard limit, swap disabled
       │    CPU: 0.5 core
       │    PIDs: 128 max
       │    CapDrop: ALL, no-new-privileges
       └─ ...
```

<img src="./assets/images/diagrams/architecture.png" alt="Architecture Diagram" width="860" />

<details>
<summary><strong>Backend & frontend layer diagrams</strong></summary>

<br />

![Backend Architecture](./assets/images/diagrams/backend.png)

![Frontend Architecture](./assets/images/diagrams/frontend.png)

</details>

### Key Design Decisions

**Single HTTP server for REST + both WebSocket endpoints.**
REST, the Yjs WebSocket, and the terminal WebSocket all share port 4000. The server upgrade event routes connections by URL path — no separate port 4001, no dedicated WS process.

**Yjs room = `sessionId` string.**
There is no separate Session database model. The session ID is just a string shared between the editor and the terminal. Any user who knows the session ID (and has been granted a role) participates in the same Y.Doc.

**Persistent workspace containers.**
Containers are named `ws-<sessionId>` and looked up by that deterministic name on reconnect — not recreated. An idle reaper destroys containers after 4 hours of no terminal I/O activity.

**VIEWER enforcement at the protocol layer.**
When a VIEWER's Yjs WebSocket sends a mutating update packet, the server inspects the raw frame using `y-protocols` and drops it before it reaches the shared `Y.Doc`. REST-level enforcement is also present, but the protocol-level drop is the real guarantee.

**Tokens out of `localStorage`.**
The JWT access token lives in JavaScript memory (Zustand store). The refresh token lives in an `httpOnly` cookie, invisible to JavaScript. This eliminates the most common XSS-based token theft vector.

---

## Tech Stack

<details>
<summary><strong>Backend</strong></summary>

<br />

| Package | Purpose |
|---|---|
| `express` | HTTP server and REST API |
| `@prisma/client` + `prisma` | ORM and migrations (PostgreSQL) |
| `bcryptjs` | Password hashing (pure JS — no native build required) |
| `jsonwebtoken` | JWT access and refresh token sign/verify |
| `cookie-parser` | httpOnly refresh token cookie |
| `cors` + `helmet` | CORS and HTTP security headers |
| `express-rate-limit` | Auth and file-mutation rate limiting |
| `ioredis` | Redis client (Yjs pub/sub sync, recording state cache) |
| `yjs` + `y-websocket` | CRDT server and WebSocket sync protocol |
| `y-protocols` + `lib0` | Yjs protocol frame decoding (used for VIEWER enforcement) |
| `ws` | Raw WebSocket server (Yjs + terminal) |
| `dockerode` | Docker API client (create/attach/exec/kill containers) |
| `dotenv` | Environment variable loading |

</details>

<details>
<summary><strong>Frontend</strong></summary>

<br />

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `vite` | Build tool and dev server |
| `tailwindcss` | Utility-first styling |
| `@monaco-editor/react` + `monaco-editor` | VS Code editor engine in the browser |
| `yjs` + `y-websocket` + `y-monaco` | CRDT sync and Monaco binding |
| `@xterm/xterm` + `@xterm/addon-fit` | Browser terminal emulator |
| `axios` | HTTP client with interceptors (auth token injection, silent refresh) |
| `zustand` | Lightweight global state (auth, editor, files, theme, notifications) |

</details>

<details>
<summary><strong>Infrastructure</strong></summary>

<br />

| Component | Purpose |
|---|---|
| PostgreSQL 16 | Users, files, session members, invites, recordings, workspaces |
| Redis 7 | Yjs cross-replica sync, recording active-state cache |
| Docker | Sandboxed execution containers per session |
| nginx | Frontend static file serving, SPA fallback, asset caching headers |
| docker-compose | Full-stack local and production orchestration |

</details>

---

## Project Structure

<details>
<summary><strong>Expand full directory tree</strong></summary>

<br />

```
collab-ide/
├── .env.example                    Root compose vars (Postgres creds, JWT secrets, CLIENT_URL)
├── .dockerignore
├── README.md
│
├── backend/
│   ├── .env.example                All 11 backend env vars documented
│   ├── Dockerfile                  Multi-stage: build → slim runtime image
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma           All 7 models + 3 enums
│   └── src/
│       ├── app.ts                  Express app: middleware, routes, /health
│       ├── server.ts               HTTP server, WS attach, graceful shutdown
│       ├── config/
│       │   └── env.ts              Validates all env vars on startup (fail-fast)
│       ├── middleware/
│       │   ├── auth.middleware.ts      JWT verify → req.user, requireRole()
│       │   ├── error.middleware.ts     Centralized 500 handler
│       │   └── rateLimit.middleware.ts Auth / API / file-write rate limits
│       ├── utils/
│       │   ├── jwt.ts              Sign/verify access + refresh tokens
│       │   ├── logger.ts           Structured console logger
│       │   ├── prisma.ts           Shared PrismaClient singleton
│       │   └── redis.ts            Shared ioredis clients (cmd + sub)
│       ├── types/
│       │   └── y-websocket-utils.d.ts  Ambient types for untyped bin/utils
│       ├── modules/
│       │   ├── auth/               Register, login, refresh, logout, /me
│       │   ├── files/              File tree CRUD (create/rename/move/delete)
│       │   ├── permissions/        Per-session RBAC, invite links
│       │   ├── sessions/           Recording start/stop, event buffering, replay
│       │   ├── execution/          Runtime config, Docker runner, workspace reaper
│       │   └── yjs-server/         Y.Doc registry, Redis sync, Yjs WS server
│       └── websocket/
│           ├── ws.server.ts        Wires Yjs + terminal WS onto the HTTP server
│           └── terminal.socket.ts  Per-session Docker container attach/detach
│
├── frontend/
│   ├── .env.example                3 VITE_ vars
│   ├── Dockerfile                  Build → nginx static serve
│   ├── nginx.conf                  SPA fallback, gzip, asset cache headers
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx                 Routes: /login /register /sessions /workspace/:id /invite/:token
│       ├── main.tsx                React entry point
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── SessionsPage.tsx    Session ID entry + template picker
│       │   ├── WorkspacePage.tsx   Workspace or replay mode (via ?replay=)
│       │   └── InviteRedeemPage.tsx
│       ├── components/
│       │   ├── Auth/               AuthInput, ProtectedRoute
│       │   ├── Editor/             CollaborativeEditor, EditorTabs, RemoteCursorStyles
│       │   ├── FileExplorer/       FileTree, FileNode (role-gated mutation buttons)
│       │   ├── Terminal/           TerminalPanel (forwardRef write handle)
│       │   ├── Presence/           UserAvatars
│       │   ├── Replay/             SessionReplay, ReplayEditorView, RecordingControls
│       │   ├── Permissions/        SessionMembersPanel
│       │   ├── Workspace/          WorkspaceSettingsPanel, InstallPackagesPrompt
│       │   ├── Notifications/      Toast, ToastContainer, NotificationBell
│       │   ├── Theme/              ThemeSwitcher
│       │   ├── CommandPalette/     CommandPalette modal
│       │   └── Layout/             Workspace shell, Sidebar
│       ├── hooks/                  useAuth, useYjsProvider, useAwareness, useFileTree,
│       │                           useTerminalSocket, useSessionRole, useWorkspaceConfig,
│       │                           useReplayEngine, useSessionRecording, useTheme,
│       │                           useKeyboardShortcuts, useRegisterCommands
│       ├── lib/
│       │   ├── api/                Typed API clients: auth, files, sessions, permissions, execution
│       │   ├── yjs/                Y.Doc registry (ref-counted), provider registry, bindings, colors
│       │   ├── editor/             languageMap (file extension → Monaco language)
│       │   ├── replay/             ReplayEngine (seek-to-snapshot + incremental apply)
│       │   ├── templates/          4 built-in project templates
│       │   ├── theme/              Theme definitions and CSS variable application
│       │   └── permissions/        hasAtLeastRole(), canEditFiles(), canManageRecordings()
│       ├── store/                  Zustand: auth, editor, file, session, sessionRole,
│       │                           theme, notification, commandPalette
│       └── types/                  Shared interfaces for every domain
│
└── docker/
    ├── docker-compose.yml          postgres + redis + backend + frontend + 4 executor images
    ├── executor.shell.Dockerfile   Generic /bin/sh sandbox
    ├── executor.node.Dockerfile    Node 20 + npm
    ├── executor.python.Dockerfile  Python 3.12 + pip
    ├── executor.go.Dockerfile      Go 1.23
    └── nginx.conf                  Frontend nginx config
```

</details>

---

## Getting Started

### Prerequisites

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x | Required for both backend and frontend |
| Docker | 24.x | Must be running; used for sandboxed terminal containers |
| PostgreSQL | 14+ | Local instance **or** provided via `docker compose` |
| Redis | 7+ | Local instance **or** provided via `docker compose` |

---

### Local Development

**1. Clone and copy env files**

```bash
git clone https://github.com/yourusername/collab-ide.git
cd collab-ide

cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` — at minimum, set these four values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collab_ide
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<generate — see below>
JWT_REFRESH_SECRET=<generate — must differ from ACCESS_SECRET>
CLIENT_URL=http://localhost:5173
```

Generate secrets (run twice — one for each):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**2. Start PostgreSQL and Redis**

If you already have them running locally, skip this step. Otherwise, spin up just the database and cache via Docker Compose:

```bash
cd docker && docker compose --env-file ../.env up postgres redis -d && cd ..
```

> **Note:** `--env-file ../.env` is required here. Docker Compose only auto-loads a `.env` from its own working directory, and the file created in step 1 lives at the repo root.

**3. Build the sandbox executor images**

All four images are required — the backend will fail to create terminal containers without them:

```bash
docker build -t collab-ide-executor-shell:latest  -f docker/executor.shell.Dockerfile  .
docker build -t collab-ide-executor-node:latest   -f docker/executor.node.Dockerfile   .
docker build -t collab-ide-executor-python:latest -f docker/executor.python.Dockerfile .
docker build -t collab-ide-executor-go:latest     -f docker/executor.go.Dockerfile     .
```

**4. Start the backend**

```bash
cd backend
npm install
npx prisma migrate dev --name init   # creates all tables
npm run dev                           # ts-node-dev, hot reload on :4000
```

**5. Start the frontend**

```bash
# in a new terminal
cd frontend
npm install
npm run dev                           # Vite dev server on :5173
```

Open [http://localhost:5173](http://localhost:5173).

---

### Docker Deployment

**Single-server Docker Compose**

```bash
cp .env.example .env
# Fill in: POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

cd docker
docker compose --env-file ../.env build    # builds backend, frontend, all 4 executor images
docker compose --env-file ../.env up -d    # starts postgres, redis, backend, frontend
```

Run the initial database migration:

```bash
docker compose --env-file ../.env exec backend npx prisma migrate deploy
```

| Service | Address |
|---|---|
| Frontend | `http://localhost:80` |
| Backend REST + WebSockets | `http://localhost:4000` |
| PostgreSQL | `localhost:5432` (host-published — firewall in production) |
| Redis | `localhost:6379` (host-published — firewall in production) |

---

### Manual / Cloud Deployment

1. Provision PostgreSQL and Redis (managed services work fine — e.g. RDS + ElastiCache, Supabase + Upstash)
2. Build and push the backend Docker image
3. Build and push the frontend Docker image, or serve `frontend/dist/` from any static host
4. Run `prisma migrate deploy` against your database on first deploy
5. Build all 4 executor images on the Docker host(s) where the backend will run
6. Set all required env vars (see [Environment Variables](#environment-variables))

> **Important for multi-replica backend deployments:** The Docker daemon must be reachable from every backend replica (same host or shared socket). Terminal containers are created and attached on the same Docker host — this is not a distributed container scheduler. See [Known Limitations](#known-limitations) for details.

---

## Environment Variables

<details>
<summary><strong>Root <code>.env</code> (Docker Compose only)</strong></summary>

<br />

```env
POSTGRES_USER=collab_ide_user
POSTGRES_PASSWORD=           # required — no default
POSTGRES_DB=collab_ide
JWT_ACCESS_SECRET=           # required — generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_REFRESH_SECRET=          # required — must differ from ACCESS_SECRET
CLIENT_URL=                  # required — e.g. http://localhost or https://your-domain.com
```

</details>

<details>
<summary><strong><code>backend/.env</code></strong></summary>

<br />

| Variable | Default | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | No | Set to `production` for prod |
| `PORT` | `4000` | No | HTTP server port |
| `DATABASE_URL` | — | **Yes** | PostgreSQL connection string |
| `REDIS_URL` | — | **Yes** | Redis connection string, e.g. `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | — | **Yes** | Min 32 chars in production |
| `JWT_REFRESH_SECRET` | — | **Yes** | Min 32 chars; must differ from access secret |
| `ACCESS_TOKEN_TTL` | `15m` | No | Access token lifetime |
| `REFRESH_TOKEN_TTL` | `7d` | No | Refresh token lifetime |
| `CLIENT_URL` | — | **Yes** | Allowed CORS origin (comma-separated for multiple) |
| `MAX_TERMINAL_SESSIONS` | `50` | No | Max concurrent terminal container connections |
| `TERMINAL_IDLE_TIMEOUT_MS` | `600000` | No | WS idle timeout (10 min). Closes the WebSocket connection, but does **not** destroy the container. |

</details>

<details>
<summary><strong><code>frontend/.env</code></strong></summary>

<br />

| Variable | Default (dev) | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Relative path — proxied same-origin to the backend by Vite's dev server |
| `VITE_YJS_WS_URL` | `ws://localhost:5173` | Same-origin; Vite proxies `/ws` through to the backend |
| `VITE_TERMINAL_WS_URL` | `ws://localhost:5173/terminal` | Same-origin; Vite proxies `/terminal` through to the backend |

> **Why same-origin defaults?** The backend's refresh-token cookie is `SameSite=Lax`. Browsers will not attach it to a cross-origin POST from `:5173` directly to `:4000`. Vite's dev proxy makes every request same-origin so the cookie is sent correctly.
>
> Do **not** point `VITE_YJS_WS_URL` or `VITE_TERMINAL_WS_URL` directly at `http://localhost:4000` unless you have also changed the cookie's `SameSite` policy. For production (no dev proxy), point these at your actual backend origin — see `frontend/.env.example` for the commented-out production block.

</details>

---

## First Run Walkthrough

1. Open `http://localhost:5173` → you are redirected to `/login`
2. Click **Register** and create an account
3. You land on `/sessions` — type any session ID (e.g. `my-project`) and press Enter
4. The workspace opens — you are auto-enrolled as **OWNER** of this session
5. Click the file+ icon in the Explorer header to create a file
6. Open it and start typing — the editor is now CRDT-backed
7. Open the same URL in a second browser profile or incognito window, log in as a different user — you will see their cursor in real time
8. Press **Cmd/Ctrl+K** to open the command palette
9. Click **⚙** in the top bar to open Workspace Settings and change the runtime to **Node.js**
10. Click **▶ Run** to execute the active file in the terminal
11. Click **Members → Create link** to generate an invite URL with a specific role

---

## Roles & Permissions

Sessions use per-session roles, fully independent of any global `User.role` field.

| Role | How it's assigned | File create / edit / delete | Run / Install | Start / stop recording | Manage members & invites | Enable network |
|---|---|---|---|---|---|---|
| **OWNER** | First user to open a session | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EDITOR** | Invite link with EDITOR role | ✅ | ✅ | ❌ | ❌ | ❌ |
| **VIEWER** | Invite link with VIEWER role | ❌ | ❌ | ❌ | ❌ | ❌ |

> **VIEWER enforcement is applied at the Yjs WebSocket protocol layer**, not only at the REST API. Mutating Yjs frames sent by a VIEWER connection are inspected using `y-protocols` and dropped before they reach the shared `Y.Doc`. A VIEWER cannot inject code changes even via a direct WebSocket client.

---

## Workspace Runtimes

| Runtime | Docker Image | Shell | Run Command | Package Manager |
|---|---|---|---|---|
| `shell` | `collab-ide-executor-shell:latest` | `/bin/sh` | `/bin/sh <file>` | — |
| `node` | `collab-ide-executor-node:latest` | `/bin/sh` | `node <file>` | `npm install` |
| `python` | `collab-ide-executor-python:latest` | `/bin/sh` | `python3 <file>` | `pip install --user` |
| `go` | `collab-ide-executor-go:latest` | `/bin/sh` | `go run <file>` | `go get` |

### Sandbox Constraints

All runtimes enforce the same resource limits at the Docker level:

- **Memory:** 256 MB hard limit, swap disabled
- **CPU:** 0.5 core
- **Process limit:** 128 PIDs
- **Network:** Disabled by default (`NetworkMode: none`)
- **Capabilities:** All Linux capabilities dropped (`CapDrop: ALL`, `no-new-privileges`)

### Network Access for Package Installs

Package managers (`npm`, `pip`, `go get`) require internet access to their respective registries. Enabling network access grants **general** internet access to the container — Docker has no built-in per-domain allowlisting without an egress proxy sidecar. Network access is therefore **disabled by default** and can only be enabled by a session **OWNER** from Workspace Settings.

### Persistent Workspaces

Containers are named `ws-<sessionId>` and survive client disconnects. Reconnecting reattaches to the existing container with all running processes and installed packages intact. A background idle reaper destroys containers after **4 hours** of no terminal I/O activity.

> **Note:** `TERMINAL_IDLE_TIMEOUT_MS` only closes the WebSocket connection after inactivity — it does **not** destroy the container. Container destruction is controlled exclusively by the 4-hour idle reaper.

---

## Session Recording & Replay

### Starting a Recording

Click **"Record session"** in the workspace header. Requires **OWNER** role.

### What Gets Recorded

- Every Yjs binary update frame (CRDT document mutations)
- Every Yjs snapshot — captured every 10 seconds for fast seeking
- Every terminal output byte
- Every terminal input byte

### Viewing a Replay

Click **"View replays"** → the latest recording opens at `?replay=<id>`. Select which file's CRDT history to replay from the existing file tree. From the replay controls you can:

- Scrub the timeline freely
- Play / pause
- Set playback speed (0.5×, 1×, 2×, 4×)
- Seek to any snapshot

### Seeking Performance

The `ReplayEngine` finds the nearest `YJS_SNAPSHOT` event before the target position and only replays delta updates after it. Seek complexity is **O(updates since last snapshot)**, not O(all updates since recording start).

---

## Security Considerations

- **No `localStorage` token storage.** The JWT access token is kept in JavaScript memory (Zustand). The refresh token is an `httpOnly` cookie, invisible to JavaScript — eliminating the most common XSS-based token theft vector.
- **VIEWER enforcement at the protocol layer.** REST-level checks exist, but mutating Yjs frames are dropped at the WebSocket level before reaching the shared document.
- **Rate limiting.** Auth endpoints and file mutation routes are rate-limited via `express-rate-limit`.
- **Security headers.** `helmet` applies a strict set of HTTP security headers to every response.
- **Container isolation.** Every terminal container drops all Linux capabilities, disables `setuid` escalation, and enforces memory, CPU, and PID limits. Network is disabled by default.
- **Known advisory:** `npm audit` on `frontend/` flags a moderate advisory in `esbuild` (Vite's dev-server-only transitive dependency — [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)). This only affects `vite dev`, not production builds — `vite build` output is unaffected. The fix requires an untested breaking major upgrade to Vite 8 and has been left as-is deliberately.

---

## Design Decisions

<details>
<summary><strong>Why Yjs instead of operational transforms?</strong></summary>

<br />

Yjs's CRDT model eliminates the need for a central transformation server to resolve concurrent edits. Every peer can apply updates independently and converge to the same state. This makes the system more resilient and easier to reason about.

</details>

<details>
<summary><strong>Why a single HTTP server for REST and both WebSocket endpoints?</strong></summary>

<br />

Routing all traffic through one port (4000) simplifies deployment, avoids CORS complications with WebSocket upgrades, and keeps the server topology flat. The upgrade event is routed by URL path: `/ws` for Yjs, `/terminal` for the terminal socket.

</details>

<details>
<summary><strong>Why persistent containers instead of ephemeral ones?</strong></summary>

<br />

Recreating a container on every reconnect would destroy all installed packages and running processes. Persistent containers (named `ws-<sessionId>`) give users a genuine development environment — packages installed in one session are still there after a refresh. The idle reaper handles cleanup automatically after 4 hours of inactivity.

</details>

<details>
<summary><strong>Why snapshot-accelerated replay seeking?</strong></summary>

<br />

Replaying every CRDT update from the start of a recording to reach an arbitrary seek position would be O(n) in the total number of updates. Storing full Y.Doc snapshots every 10 seconds reduces seek cost to O(updates since last snapshot) — typically a much smaller number, making seeks feel instant even for long recordings.

</details>

---

## Known Limitations

- **Single Docker host for terminals.** All workspace containers run on the same Docker daemon. Deploying multiple backend replicas across different VMs requires a shared Docker socket or a proper container scheduler (Kubernetes, Nomad, ECS) — this is not built in.
- **No WebRTC voice/video.** The awareness protocol carries the necessary plumbing, but the actual RTC signalling and media tracks are not implemented.
- **No fine-grained network allowlisting.** Enabling network access for package installs grants general internet access to the container. An egress proxy sidecar (e.g. Squid) could restrict outbound to registry domains only — not built.
- **RBAC is per-session only.** There is no global admin dashboard, no cross-session user management, and no team or organization concept above the session level.
- **Single-file Run.** The Run button executes one file in isolation. It does not understand project structure (e.g. `npm run start` for a multi-file Node project). Use the interactive terminal for multi-file projects.
- **Replay does not capture file system mutations.** The file tree state at recording start is preserved, but file create and rename events that happen during a recording are not replayed — only text content mutations via Yjs.

---

## Troubleshooting

<details>
<summary><strong><code>prisma generate</code> fails / "403 Forbidden" from binaries.prisma.sh</strong></summary>

<br />

Prisma's postinstall hook downloads a native query engine binary, which requires internet access to `binaries.prisma.sh`. Run `npm install` in a network-connected environment. In restricted CI environments, set `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` or configure `PRISMA_BINARY_TARGETS`.

</details>

<details>
<summary><strong>Terminal panel shows "disconnected" immediately after opening</strong></summary>

<br />

1. Confirm Docker is running: `docker ps`
2. Confirm all 4 executor images are built: `docker images | grep collab-ide-executor`
3. Check backend logs for `"no such image"` errors

</details>

<details>
<summary><strong>WebSocket connection errors in the browser console</strong></summary>

<br />

- In local dev, `VITE_YJS_WS_URL` and `VITE_TERMINAL_WS_URL` should point at `localhost:5173` (the Vite dev server) — Vite's proxy forwards `/ws` and `/terminal` to the backend at `:4000`. Pointing them directly at `:4000` skips the proxy and reintroduces a `SameSite=Lax` cookie problem.
- In production (no dev proxy), these should point at wherever the backend actually listens.
- Both WebSocket endpoints run on the same server as REST — there is no separate port 4001.

</details>

<details>
<summary><strong>"You don't have permission" when starting a recording</strong></summary>

<br />

Recording requires **OWNER** role for the session. Only the first user to open a new session is automatically assigned OWNER. Other users need an OWNER-role invite link.

</details>

<details>
<summary><strong>Package installs fail with "Network access is disabled"</strong></summary>

<br />

An OWNER must open **Workspace Settings** (⚙ button) and enable network access. This is intentionally off by default. See [Workspace Runtimes — Network Access](#workspace-runtimes) for the rationale.

</details>

<details>
<summary><strong>Login works but workspace shows "No session selected"</strong></summary>

<br />

The workspace route requires a `:sessionId` parameter. Navigate to `/sessions` first and enter a session ID, or use a direct URL like `/workspace/my-project`.

</details>

<details>
<summary><strong><code>tsc</code> fails with "Cannot find type definition file for 'vite/client'"</strong></summary>

<br />

Run `npm install` inside the `frontend/` directory — the `vite` package ships this type definition and must be installed first.

</details>

<details>
<summary><strong>Changes from one user don't appear on another's screen</strong></summary>

<br />

- Confirm both browsers are connected to the same Yjs WebSocket (same `VITE_YJS_WS_URL` and same `sessionId`)
- Check backend logs for Yjs upgrade auth failures (expired or missing token)
- Confirm Redis is running and `REDIS_URL` is correct (required when running multiple backend replicas)

</details>

---

## Roadmap

- [ ] Multi-replica terminal support (shared Docker socket or Kubernetes backend)
- [ ] WebRTC voice / video via existing awareness protocol plumbing
- [ ] Egress proxy sidecar for fine-grained package registry allowlisting
- [ ] Global admin dashboard for cross-session user management
- [ ] Multi-file Run (project-aware execution, e.g. `npm run start`)
- [ ] File system mutation replay (create / rename events captured in recording)
- [ ] OAuth login (GitHub, Google)
- [ ] Persistent file storage (S3 / object store backend)

---

## Contributing

Contributions are welcome. Please open an issue before submitting a large pull request. For bug fixes and small improvements, PRs are appreciated directly.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
# Make your changes
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [Yjs](https://yjs.dev) — the CRDT library that makes conflict-free collaboration possible
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — the VS Code editor engine
- [xterm.js](https://xtermjs.org) — the browser terminal emulator
- [Prisma](https://www.prisma.io) — the TypeScript ORM
- [Vite](https://vitejs.dev) — the frontend build tool

---

## Assets

Referenced throughout this README and used for the repository's social preview card:

```
assets/
├── images/
│   ├── banner.png
│   ├── social-preview.png
│   └── logo.svg
│
├── demo/
│   └── collab-demo.gif
│
├── screenshots/
│   ├── login.png
│   ├── dashboard.png
│   ├── editor.png
│   ├── multicursor.png
│   ├── terminal.png
│   ├── replay.png
│   ├── settings.png
│   ├── members.png
│   └── command-palette.png
│
└── diagrams/
    ├── architecture.png
    ├── backend.png
    └── frontend.png
```

---

<div align="center">

Built by [**Shahzad**]


</div>
