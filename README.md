<div align="center">

<h1>
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png" alt="laptop" width="35" height="35" />
  Collab IDE
</h1>

<p><strong>A production-grade, real-time collaborative code editor that runs in your browser.</strong></p>

<p>
  Conflict-free CRDT editing &nbsp;·&nbsp; Multi-cursor presence &nbsp;·&nbsp;
  Sandboxed multi-language execution &nbsp;·&nbsp; Session recording &amp; replay &nbsp;·&nbsp;
  Role-based access control
</p>

<br/>

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![Monaco](https://img.shields.io/badge/Monaco-Editor-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-F6821F?style=flat-square)](https://yjs.dev)
[![WebSockets](https://img.shields.io/badge/WebSockets-y--websocket-6366f1?style=flat-square)](https://github.com/yjs/y-websocket)

<br/>

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Last Commit](https://img.shields.io/github/last-commit/shehzadres/collab-ide?style=flat-square)](https://github.com/shehzadres/collab-ide/commits/main)
[![Stars](https://img.shields.io/github/stars/shehzadres/collab-ide?style=flat-square)](https://github.com/shehzadres/collab-ide/stargazers)
[![Issues](https://img.shields.io/github/issues/shehzadres/collab-ide?style=flat-square)](https://github.com/shehzadres/collab-ide/issues)
[![Build](https://img.shields.io/badge/build-passing-22c55e?style=flat-square&logo=githubactions&logoColor=white)](#)

<br/>

</div>

---

## Table of Contents

- [Why Collab IDE](#why-collab-ide)
- [Feature Highlights](#feature-highlights)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
  - [Cloud / Manual Deployment](#cloud--manual-deployment)
- [Environment Variables](#environment-variables)
- [First Run Walkthrough](#first-run-walkthrough)
- [Roles & Permissions](#roles--permissions)
- [Workspace Runtimes](#workspace-runtimes)
- [Session Recording & Replay](#session-recording--replay)
- [Security](#security)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Why Collab IDE

Most collaborative coding tools are cloud-locked, oversimplified, or give you a fake sandbox with no real execution. Collab IDE is different.

| | What Collab IDE does differently |
|---|---|
| 🔄 **Conflict-free** | Powered by Yjs CRDTs — concurrent edits from any number of users, zero conflicts, no "last write wins" data loss |
| 🐳 **Real execution** | Every session runs inside a sandboxed Docker container with CPU, memory, PID, and network limits enforced at the kernel level |
| 🔐 **Protocol-level security** | VIEWER permissions are enforced inside the Yjs WebSocket protocol — a VIEWER cannot inject code changes even via a raw WebSocket client |
| 🏠 **Self-hostable** | One `docker compose up` and you own everything — your data, your infrastructure, your domain |
| 📼 **Session replay** | Full CRDT + terminal recording with snapshot-accelerated O(Δ) seeking, not O(n) replay from scratch |
| 🧱 **Production-grade codebase** | Typed end-to-end (TypeScript everywhere), properly layered, modular, and thoroughly documented |

---

## Feature Highlights

### 🔄 Real-Time Collaboration

| | |
|---|---|
| **CRDT synchronization** | Yjs — concurrent edits from any number of users, zero conflicts |
| **Multi-cursor presence** | Colored cursors, selection highlights, and username labels per connected user |
| **Live presence avatars** | Real-time join/leave notifications with online user indicators |
| **Redis-backed scaling** | Yjs updates broadcast across backend replicas via Redis pub/sub |

### ✏️ Code Editor

| | |
|---|---|
| **Monaco Editor** | The same engine powering VS Code, running entirely in the browser |
| **Syntax highlighting** | 10+ languages via Monaco's built-in language support |
| **Per-file undo/redo** | Independent history stacks per open file — not shared across the session |
| **Themes** | Dark, Light, Midnight, Solarized |
| **Tab management** | Multi-file tabs with auto-layout resize |

### 📁 File System

| | |
|---|---|
| **File explorer** | Create, rename, move, and delete files and folders |
| **Lazy loading** | File content is fetched on open, not pre-loaded for the entire tree |
| **Role-gated mutations** | VIEWER role cannot create or delete files — enforced server-side |
| **Project templates** | Blank, Node.js, Python, and HTML/CSS/JS starter templates |

### 🖥️ Sandboxed Terminal

| | |
|---|---|
| **Real shell** | A genuine shell session inside a per-session Docker container |
| **Persistent workspace** | Container survives disconnects — reconnecting reattaches to the same shell, packages intact |
| **4 runtimes** | Shell, Node.js 20, Python 3.12, Go 1.23 |
| **Run active file** | ▶ Run button executes the currently open file; output streams live into the terminal |
| **Package installs** | `npm install`, `pip install`, `go get` — with streaming output |

### 🔐 Auth & Access Control

| | |
|---|---|
| **Authentication** | Email/password registration and login |
| **Dual-token auth** | JWT access token (15 min, in-memory) + refresh token (7 days, httpOnly cookie) |
| **Silent refresh** | Axios interceptor handles token renewal transparently — no user-visible expiry |
| **Per-session RBAC** | OWNER, EDITOR, VIEWER — each assigned independently per session |
| **Invite links** | Token-based invite URLs, per-role, with optional expiry and use-limit |

### 🎬 Session Recording & Replay

| | |
|---|---|
| **What's recorded** | Every Yjs CRDT update frame, Yjs snapshots (every 10 s), terminal input and output bytes |
| **Seek performance** | O(updates since last snapshot) — not O(all updates) — via snapshot acceleration |
| **Playback controls** | Scrubber, play/pause, 0.5×–4× speed, seek-to-snapshot |

### ⌨️ Developer Experience

| | |
|---|---|
| **Command palette** | `Cmd/Ctrl+K` — fuzzy search across all workspace commands |
| **Keyboard shortcuts** | Full shortcut support throughout the UI |
| **Toast notifications** | Non-blocking feedback for async operations |
| **Notification bell** | Persistent in-session event log |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Browser                               │
│                                                                 │
│  ┌──────────┐  HTTPS/REST   ┌─────────────────────────────┐   │
│  │  React   │ ────────────► │     Express API  :4000      │   │
│  │  + Vite  │               │                             │   │
│  │  + Yjs   │ WS /ws        │  y-websocket server         │   │
│  │  + xterm │ ────────────► │  ├─ Y.Doc per sessionId     │   │
│  └──────────┘               │  ├─ Redis pub/sub broadcast  │   │
│       │       WS /terminal  │  └─ awareness (cursors)      │   │
│       └────────────────────►│                             │   │
│                             │  JWT in WS query param       │   │
│                             └──────────┬──────────────────┘   │
└─────────────────────────────────────── │ ──────────────────────┘
                                         │
                          ┌──────────────┼──────────────┐
                          │              │              │
                    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼──────────┐
                    │PostgreSQL │  │  Redis  │  │  Docker daemon  │
                    │           │  │         │  │                 │
                    │ users     │  │ Yjs     │  │ ws-<sessionId>  │
                    │ files     │  │ pub/sub │  │ ├─ Shell        │
                    │ sessions  │  │         │  │ ├─ Node.js 20   │
                    │ members   │  │ recording│  │ ├─ Python 3.12  │
                    │ invites   │  │ state   │  │ └─ Go 1.23      │
                    │ recordings│  │ cache   │  │                 │
                    └───────────┘  └─────────┘  │ mem: 256 MB    │
                                                │ cpu: 0.5 core  │
                                                │ pids: 128 max  │
                                                │ net: none      │
                                                └────────────────┘
```

### Key Design Decisions

**One HTTP server, two WebSocket endpoints, one port.**  
REST, the Yjs WebSocket (`/ws`), and the terminal WebSocket (`/terminal`) all share port `4000`. The `server.upgrade` event routes by URL path — no separate port, no dedicated process.

**Yjs room = `sessionId` string.**  
There is no separate Session database model. The session ID is just a string shared between editor and terminal. Any user who knows the ID (and holds a role) participates in the same `Y.Doc`.

**Persistent workspace containers.**  
Containers are named `ws-<sessionId>` and looked up by that deterministic name on reconnect — never recreated. An idle reaper destroys containers after 4 hours of no terminal I/O activity.

**VIEWER enforcement at the protocol layer.**  
When a VIEWER's WebSocket sends a mutating Yjs frame, the server decodes it with `y-protocols` and drops it before it reaches the shared `Y.Doc`. REST-level enforcement exists too, but the protocol drop is the actual guarantee — a VIEWER with a raw WebSocket client still cannot mutate the document.

**Tokens out of `localStorage`.**  
The JWT access token lives in JavaScript memory (Zustand store). The refresh token is an `httpOnly` cookie — invisible to JavaScript. This eliminates the most common XSS-based token theft vector.

---

## Tech Stack

<details>
<summary><strong>Backend</strong></summary>

<br/>

| Package | Role |
|---|---|
| `express` | HTTP server and REST API |
| `@prisma/client` + `prisma` | ORM and schema migrations (PostgreSQL) |
| `bcryptjs` | Password hashing — pure JS, no native build step required |
| `jsonwebtoken` | JWT access and refresh token sign / verify |
| `cookie-parser` | Parse the httpOnly refresh-token cookie |
| `cors` + `helmet` | CORS policy and HTTP security headers |
| `express-rate-limit` | Auth endpoint and file-mutation rate limiting |
| `ioredis` | Redis client — Yjs pub/sub sync + recording state cache |
| `yjs` + `y-websocket` | CRDT engine and WebSocket sync server |
| `y-protocols` + `lib0` | Low-level Yjs frame decoding (VIEWER enforcement) |
| `ws` | Raw WebSocket server shared by Yjs and terminal handlers |
| `dockerode` | Docker API client — create, attach, exec, and destroy containers |
| `dotenv` | Environment variable loading |

</details>

<details>
<summary><strong>Frontend</strong></summary>

<br/>

| Package | Role |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `vite` | Build tool and dev server (with proxy for same-origin cookie policy) |
| `tailwindcss` | Utility-first styling |
| `@monaco-editor/react` + `monaco-editor` | VS Code editor engine in the browser |
| `yjs` + `y-websocket` + `y-monaco` | CRDT sync and Monaco editor binding |
| `@xterm/xterm` + `@xterm/addon-fit` | Browser terminal emulator |
| `axios` | HTTP client with interceptors — token injection and silent refresh |
| `zustand` | Lightweight global state — auth, editor, files, theme, notifications |

</details>

<details>
<summary><strong>Infrastructure</strong></summary>

<br/>

| Component | Role |
|---|---|
| PostgreSQL 16 | Persistent storage — users, files, session members, invites, recordings, workspaces |
| Redis 7 | Ephemeral — Yjs cross-replica sync + recording active-state cache |
| Docker | Sandboxed execution containers, one per active session |
| nginx | Frontend static file serving, SPA `index.html` fallback, asset cache headers |
| docker-compose | Full-stack orchestration for local dev and single-server production |

</details>

---

## Project Structure

<details>
<summary><strong>Expand full directory tree</strong></summary>

<br/>

```
collab-ide/
│
├── .env.example                    # Root Compose vars: Postgres creds, JWT secrets, CLIENT_URL
├── .dockerignore
├── README.md
│
├── backend/
│   ├── .env.example                # All 11 backend env vars documented with defaults
│   ├── Dockerfile                  # Multi-stage: tsc build → slim Node runtime image
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── prisma/
│   │   └── schema.prisma           # 7 models + 3 enums (User, File, SessionMember,
│   │                               #   Invite, Recording, RecordingEvent, WorkspaceConfig)
│   └── src/
│       ├── app.ts                  # Express app: middleware stack, route mounting, /health
│       ├── server.ts               # HTTP server, WebSocket attach, graceful shutdown
│       │
│       ├── config/
│       │   └── env.ts              # Validates all required env vars on startup (fail-fast)
│       │
│       ├── middleware/
│       │   ├── auth.middleware.ts  # JWT verify → req.user injection, requireRole() guard
│       │   ├── error.middleware.ts # Centralized 500 / structured error handler
│       │   └── rateLimit.ts        # Auth, file-write, and general API rate limit configs
│       │
│       ├── utils/
│       │   ├── jwt.ts              # Sign / verify access and refresh tokens
│       │   ├── logger.ts           # Structured console logger
│       │   ├── prisma.ts           # Shared PrismaClient singleton
│       │   └── redis.ts            # Shared ioredis command + subscriber clients
│       │
│       ├── types/
│       │   └── y-websocket-utils.d.ts  # Ambient types for untyped y-websocket internals
│       │
│       ├── modules/
│       │   ├── auth/               # Register, login, refresh, logout, /me
│       │   ├── files/              # File tree CRUD — create, rename, move, delete
│       │   ├── permissions/        # Per-session RBAC + invite link management
│       │   ├── sessions/           # Recording start/stop, event buffering, replay API
│       │   ├── execution/          # Runtime config, Docker runner, idle container reaper
│       │   └── yjs-server/         # Y.Doc registry, Redis sync bridge, Yjs WS server
│       │
│       └── websocket/
│           ├── ws.server.ts        # Mounts Yjs + terminal WebSocket handlers onto HTTP server
│           └── terminal.socket.ts  # Per-session Docker container attach / detach / I/O relay
│
├── frontend/
│   ├── .env.example                # 3 VITE_ vars — API URL, Yjs WS URL, terminal WS URL
│   ├── Dockerfile                  # Vite build → nginx static serve
│   ├── nginx.conf                  # SPA fallback, gzip, long-lived asset cache headers
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   │
│   └── src/
│       ├── App.tsx                 # Routes: /login /register /sessions /workspace/:id /invite/:token
│       ├── main.tsx
│       │
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── SessionsPage.tsx    # Session ID entry + template picker
│       │   ├── WorkspacePage.tsx   # Full workspace or replay mode (via ?replay=<id>)
│       │   └── InviteRedeemPage.tsx
│       │
│       ├── components/
│       │   ├── Auth/               # AuthInput, ProtectedRoute
│       │   ├── Editor/             # CollaborativeEditor, EditorTabs, RemoteCursorStyles
│       │   ├── FileExplorer/       # FileTree, FileNode (role-gated mutation buttons)
│       │   ├── Terminal/           # TerminalPanel (forwardRef write handle)
│       │   ├── Presence/           # UserAvatars
│       │   ├── Replay/             # SessionReplay, ReplayEditorView, RecordingControls
│       │   ├── Permissions/        # SessionMembersPanel
│       │   ├── Workspace/          # WorkspaceSettingsPanel, InstallPackagesPrompt
│       │   ├── Notifications/      # Toast, ToastContainer, NotificationBell
│       │   ├── Theme/              # ThemeSwitcher
│       │   ├── CommandPalette/     # CommandPalette modal
│       │   └── Layout/             # Workspace shell, Sidebar
│       │
│       ├── hooks/                  # useAuth, useYjsProvider, useAwareness, useFileTree,
│       │                           # useTerminalSocket, useSessionRole, useWorkspaceConfig,
│       │                           # useReplayEngine, useSessionRecording, useTheme,
│       │                           # useKeyboardShortcuts, useRegisterCommands
│       │
│       ├── lib/
│       │   ├── api/                # Typed API clients: auth, files, sessions, permissions, execution
│       │   ├── yjs/                # Y.Doc registry (ref-counted), provider registry, bindings, colors
│       │   ├── editor/             # languageMap — file extension → Monaco language ID
│       │   ├── replay/             # ReplayEngine — seek-to-snapshot + incremental apply
│       │   ├── templates/          # 4 built-in project templates
│       │   ├── theme/              # Theme definitions and CSS variable injection
│       │   └── permissions/        # hasAtLeastRole(), canEditFiles(), canManageRecordings()
│       │
│       ├── store/                  # Zustand slices: auth, editor, file, session, sessionRole,
│       │                           #   theme, notification, commandPalette
│       └── types/                  # Shared TypeScript interfaces for every domain
│
└── docker/
    ├── docker-compose.yml          # postgres + redis + backend + frontend + 4 executor images
    ├── executor.shell.Dockerfile   # Sandbox: /bin/sh only
    ├── executor.node.Dockerfile    # Sandbox: Node.js 20 + npm
    ├── executor.python.Dockerfile  # Sandbox: Python 3.12 + pip
    ├── executor.go.Dockerfile      # Sandbox: Go 1.23
    └── nginx.conf                  # Frontend nginx config (also used by the frontend container)
```

</details>

---

## Getting Started

### Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 20.x | Required for backend and frontend |
| Docker | 24.x | Must be running; used for sandboxed terminal containers |
| PostgreSQL | 14+ | Local instance **or** via `docker compose` |
| Redis | 7+ | Local instance **or** via `docker compose` |

---

### Local Development

#### 1. Clone and copy environment files

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/collab-ide.git
cd collab-ide

cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Open `backend/.env` and set at minimum:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/collab_ide
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<generate below>
JWT_REFRESH_SECRET=<generate below — must differ from ACCESS_SECRET>
CLIENT_URL=http://localhost:5173
```

Generate secure secrets (run this command twice — once per secret):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

#### 2. Start PostgreSQL and Redis

Skip this step if you already have them running locally. Otherwise, spin up only the database and cache:

```bash
cd docker && docker compose --env-file ../.env up postgres redis -d && cd ..
```

> **Note:** `--env-file ../.env` is required. Docker Compose only auto-loads a `.env` from its own working directory, and the root `.env` lives one level up.

#### 3. Build the sandbox executor images

All four images are required — the backend will fail to start a terminal without them:

```bash
docker build -t collab-ide-executor-shell:latest  -f docker/executor.shell.Dockerfile  .
docker build -t collab-ide-executor-node:latest   -f docker/executor.node.Dockerfile   .
docker build -t collab-ide-executor-python:latest -f docker/executor.python.Dockerfile .
docker build -t collab-ide-executor-go:latest     -f docker/executor.go.Dockerfile     .
```

#### 4. Start the backend

```bash
cd backend
npm install
npx prisma migrate dev --name init   # creates all tables
npm run dev                           # ts-node-dev with hot reload on :4000
```

#### 5. Start the frontend

```bash
# in a separate terminal
cd frontend
npm install
npm run dev                           # Vite dev server on :5173
```

Open [http://localhost:5173](http://localhost:5173).

---

### Docker Deployment

#### Full stack via Docker Compose

```bash
cp .env.example .env
# Required: POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

cd docker
docker compose --env-file ../.env build    # builds backend, frontend, all 4 executor images
docker compose --env-file ../.env up -d    # starts postgres, redis, backend, frontend
```

Run the initial database migration:

```bash
docker compose --env-file ../.env exec backend npx prisma migrate deploy
```

| Service | Default address |
|---|---|
| Frontend | `http://localhost:80` |
| Backend REST + WebSockets | `http://localhost:4000` |
| PostgreSQL | `localhost:5432` _(host-published — firewall this in production)_ |
| Redis | `localhost:6379` _(host-published — firewall this in production)_ |

---

### Cloud / Manual Deployment

1. Provision PostgreSQL and Redis — managed services work (e.g. Supabase + Upstash, RDS + ElastiCache)
2. Build and push the backend Docker image to your registry
3. Build and push the frontend image, or serve `frontend/dist/` from any static host (Vercel, Cloudflare Pages, S3+CloudFront)
4. Run `npx prisma migrate deploy` against your production database on first deploy
5. Build all 4 executor images on the Docker host(s) where the backend will run
6. Set all required environment variables (see [Environment Variables](#environment-variables))

> **Multi-replica backends:** The Docker daemon must be reachable from every backend replica. Terminal containers are created and attached on the same Docker host — Collab IDE is not a distributed container scheduler. If you need multi-replica terminal support, see [Known Limitations](#known-limitations).

---

## Environment Variables

<details>
<summary><strong>Root <code>.env</code> — used by Docker Compose only</strong></summary>

<br/>

```env
POSTGRES_USER=collab_ide_user
POSTGRES_PASSWORD=            # required — no default
POSTGRES_DB=collab_ide

# Generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_ACCESS_SECRET=            # required
JWT_REFRESH_SECRET=           # required — must differ from JWT_ACCESS_SECRET

CLIENT_URL=                   # required — e.g. http://localhost or https://yourdomain.com
```

</details>

<details>
<summary><strong><code>backend/.env</code></strong></summary>

<br/>

| Variable | Default | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | No | Set to `production` in prod |
| `PORT` | `4000` | No | HTTP server port |
| `DATABASE_URL` | — | **Yes** | PostgreSQL connection string |
| `REDIS_URL` | — | **Yes** | Redis URL, e.g. `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | — | **Yes** | Minimum 32 characters in production |
| `JWT_REFRESH_SECRET` | — | **Yes** | Minimum 32 characters; must differ from access secret |
| `ACCESS_TOKEN_TTL` | `15m` | No | Access token lifetime |
| `REFRESH_TOKEN_TTL` | `7d` | No | Refresh token lifetime |
| `CLIENT_URL` | — | **Yes** | Allowed CORS origin (comma-separated list for multiple) |
| `MAX_TERMINAL_SESSIONS` | `50` | No | Max concurrent terminal container connections |
| `TERMINAL_IDLE_TIMEOUT_MS` | `600000` | No | Idle WebSocket timeout (10 min). Closes the connection — does **not** destroy the container. |

</details>

<details>
<summary><strong><code>frontend/.env</code></strong></summary>

<br/>

| Variable | Default (dev) | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Relative path — Vite dev proxy forwards this to the backend |
| `VITE_YJS_WS_URL` | `ws://localhost:5173` | Same-origin; Vite proxies `/ws` to the backend |
| `VITE_TERMINAL_WS_URL` | `ws://localhost:5173/terminal` | Same-origin; Vite proxies `/terminal` to the backend |

> **Why same-origin defaults?**  
> The refresh-token cookie is `SameSite=Lax`. A cross-origin request from `:5173` directly to `:4000` will not carry the cookie — authentication silently breaks. Vite's proxy makes every request same-origin so the cookie is sent correctly.  
>  
> In production (no Vite proxy), set these to your actual backend origin. See the commented-out production block in `frontend/.env.example`.

</details>

---

## First Run Walkthrough

1. Open `http://localhost:5173` — you are redirected to `/login`
2. Click **Register** and create an account
3. On the `/sessions` page, type any session ID (e.g. `my-project`) and press **Enter**
4. The workspace opens — you are automatically enrolled as **OWNER** of this session
5. Click the **file+** icon in the Explorer header to create a new file
6. Open the file and start typing — the editor is now CRDT-backed and sync-ready
7. Open the same URL in a second browser profile or incognito window, log in as a different user — you will see their cursor appear in real time
8. Press `Cmd/Ctrl+K` to open the command palette
9. Click **⚙** in the top bar → Workspace Settings → change the runtime to **Node.js**
10. Click **▶ Run** to execute the active file; output streams live into the terminal panel
11. Click **Members → Create link** to generate a per-role invite URL

---

## Roles & Permissions

Sessions use per-session roles, fully independent of the global `User.role` field in the database.

| Role | Assigned by | Edit files | Run / Install | Record | Manage members | Enable network |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **OWNER** | First user to open the session | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EDITOR** | Invite link with EDITOR role | ✅ | ✅ | ❌ | ❌ | ❌ |
| **VIEWER** | Invite link with VIEWER role | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Protocol-level VIEWER enforcement**  
> REST-level permission checks exist, but they are not the primary defence. When a VIEWER's WebSocket connection sends a mutating Yjs update frame, the server decodes the raw packet using `y-protocols` and drops it before it can reach the shared `Y.Doc`. A VIEWER using a raw WebSocket client — bypassing the UI entirely — still cannot modify the document.

---

## Workspace Runtimes

| Runtime | Docker image | Default shell | Run command | Package manager |
|---|---|---|---|---|
| `shell` | `collab-ide-executor-shell:latest` | `/bin/sh` | `/bin/sh <file>` | — |
| `node` | `collab-ide-executor-node:latest` | `/bin/sh` | `node <file>` | `npm install` |
| `python` | `collab-ide-executor-python:latest` | `/bin/sh` | `python3 <file>` | `pip install --user` |
| `go` | `collab-ide-executor-go:latest` | `/bin/sh` | `go run <file>` | `go get` |

### Sandbox Resource Limits

All runtimes share the same hard limits, enforced by Docker at the kernel level:

| Limit | Value |
|---|---|
| Memory | 256 MB hard cap, swap disabled |
| CPU | 0.5 core |
| Process IDs | 128 PIDs max |
| Network | Disabled (`NetworkMode: none`) by default |
| Linux capabilities | All dropped (`CapDrop: ALL`, `no-new-privileges: true`) |

### Network Access for Package Installs

`npm install`, `pip install`, and `go get` all require outbound internet access to their registries. Enabling network access grants **general** internet access to the container — Docker has no built-in per-domain egress filtering without an external proxy sidecar. Network is therefore **off by default** and can only be toggled on by a session **OWNER** from Workspace Settings.

### Persistent Workspaces

Containers are named `ws-<sessionId>` and survive client disconnects. On reconnect the backend looks up the container by this deterministic name and reattaches — packages installed in a previous connection are still present. A background idle reaper destroys containers after **4 hours** of no terminal I/O activity.

> `TERMINAL_IDLE_TIMEOUT_MS` closes the WebSocket connection on inactivity — it does **not** destroy the container. Container lifetime is managed exclusively by the 4-hour idle reaper.

---

## Session Recording & Replay

### How to Start a Recording

Click **"Record session"** in the workspace header. This action requires **OWNER** role.

### What Is Recorded

| Data | Detail |
|---|---|
| Yjs update frames | Every binary CRDT mutation, in order |
| Yjs snapshots | Full `Y.Doc` state captured every 10 seconds |
| Terminal output | Every byte written to the terminal by the process |
| Terminal input | Every keystroke sent by the user |

### Viewing a Replay

Click **"View replays"** — the latest recording opens at `?replay=<recordingId>`. Select which file's CRDT history to replay using the existing file tree. The replay controls expose:

- Timeline scrubber — seek to any point freely
- Play / pause
- Playback speed — 0.5×, 1×, 2×, 4×
- Seek-to-snapshot — jump to the nearest stored snapshot

### Seek Performance

The `ReplayEngine` finds the nearest `YJS_SNAPSHOT` event before the target timestamp and applies only the delta updates after it. Seek complexity is **O(updates since last snapshot)** — not O(all updates from the recording start). On a recording with snapshots every 10 seconds, seeking anywhere in a multi-hour session is nearly instant.

---

## Security

| Area | Implementation |
|---|---|
| **Token storage** | JWT access token lives in Zustand (JS memory). Refresh token is `httpOnly` — JS cannot read it. Eliminates the most common XSS token theft vector. |
| **VIEWER enforcement** | Yjs mutating frames from VIEWER connections are decoded via `y-protocols` and dropped before reaching the shared `Y.Doc` — not just blocked at the REST layer. |
| **Rate limiting** | Auth endpoints and file mutation routes are rate-limited via `express-rate-limit`. |
| **HTTP security headers** | `helmet` applies a strict header set on every response. |
| **Container isolation** | All Linux capabilities dropped (`CapDrop: ALL`), `no-new-privileges`, 256 MB memory cap, 0.5 CPU core, 128 PID limit, no network by default. |
| **Known advisory** | `npm audit` on `frontend/` reports a moderate advisory in `esbuild` ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)) — a Vite dev-server-only transitive dependency. This does not affect production builds (`vite build` output is clean). Fixing it requires an untested Vite 8 major upgrade; left as-is deliberately. |

---

## Design Decisions

<details>
<summary><strong>Why Yjs CRDTs instead of operational transforms?</strong></summary>

<br/>

OT requires a central transformation server to coordinate concurrent edits — if two users edit the same document simultaneously, the server must transform both operations against each other before applying them. This creates a bottleneck and makes the algorithm hard to reason about at scale.

Yjs's CRDT model is mathematically convergent. Every peer can apply updates independently in any order and always converge to the same state. There is no transformation server, no ordering dependency, and no risk of divergence. The tradeoff is slightly larger update payloads (each update carries a vector clock) — acceptable for a code editor where document size is bounded.

</details>

<details>
<summary><strong>Why one HTTP server for REST and both WebSocket endpoints?</strong></summary>

<br/>

Routing all three protocols through a single port (`4000`) simplifies deployment significantly — one load balancer rule, one firewall port, one TLS certificate. The Node.js `server.upgrade` event dispatches WebSocket upgrades by URL path: `/ws` → Yjs handler, `/terminal` → terminal handler. REST requests are handled normally by Express. There is no separate process, no port `4001`, and no additional service to configure.

</details>

<details>
<summary><strong>Why persistent containers instead of ephemeral ones?</strong></summary>

<br/>

If the backend destroyed and recreated a container on every reconnect, users would lose all installed packages, running processes, and shell history on every refresh. That is not a usable development environment.

Containers are named `ws-<sessionId>` so the backend can look them up deterministically without storing state. The 4-hour idle reaper handles cleanup automatically. The result is an environment that behaves like a persistent remote development machine — refreshing the browser is equivalent to closing and reopening a terminal window, not destroying the machine.

</details>

<details>
<summary><strong>Why snapshot-accelerated replay seeking?</strong></summary>

<br/>

Naive replay seeking requires replaying every Yjs update from the beginning of the recording to reconstruct the document state at the target timestamp. For a multi-hour session with thousands of updates, that is O(n) work on every seek — unacceptably slow.

Every 10 seconds during a recording, the server serializes a full `Y.Doc` snapshot into the recording event stream. The `ReplayEngine` finds the nearest snapshot before the target timestamp and replays only the delta updates after it. Seek cost is O(updates since last snapshot) — typically a few hundred events at most — making seeks feel instant regardless of recording length.

</details>

---

## Known Limitations

**Single Docker host for terminal containers.**  
All workspace containers run on one Docker daemon. Deploying multiple backend replicas across different VMs requires a shared Docker socket or a proper container scheduler (Kubernetes, Nomad, ECS). This is not built in to the current architecture.

**No WebRTC voice or video.**  
The Yjs awareness protocol carries the plumbing needed for peer discovery, but the RTC signalling layer and media tracks are not implemented.

**No fine-grained egress filtering.**  
Enabling network access grants general internet access to the container. Per-registry filtering would require an egress proxy sidecar (e.g. Squid) — not currently built.

**RBAC is per-session only.**  
There is no global admin panel, no cross-session user management, and no organization or team concept above the session level.

**Single-file execution.**  
The ▶ Run button executes one file in isolation. It does not understand project structure. Use the interactive terminal directly for multi-file projects (`npm run start`, `python main.py`, etc.).

**File system mutations are not replayed.**  
The file tree state at recording start is preserved in replay, but file create and rename events that occur during a recording are not captured — only text content mutations via Yjs.

---

## Troubleshooting

<details>
<summary><code>prisma generate</code> fails with "403 Forbidden" from binaries.prisma.sh</summary>

<br/>

Prisma's postinstall hook downloads a native query engine binary from `binaries.prisma.sh`. This requires outbound internet access. Run `npm install` in a network-connected environment. In restricted CI environments, set `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` or configure `PRISMA_BINARY_TARGETS` to pre-download the binary.

</details>

<details>
<summary>Terminal panel shows "disconnected" immediately on open</summary>

<br/>

1. Confirm Docker is running: `docker ps`
2. Confirm all 4 executor images are present: `docker images | grep collab-ide-executor`
3. Check backend logs for a `"no such image"` error — if any image is missing, rebuild it using the commands in [Getting Started → Step 3](#3-build-the-sandbox-executor-images)

</details>

<details>
<summary>WebSocket connection errors in the browser console</summary>

<br/>

In local development, `VITE_YJS_WS_URL` and `VITE_TERMINAL_WS_URL` must point at `localhost:5173` (the Vite dev server) — not directly at `localhost:4000`. Vite's proxy forwards `/ws` and `/terminal` to the backend. Pointing them directly at `:4000` bypasses the proxy, which breaks the `SameSite=Lax` cookie policy and causes silent authentication failures on the WebSocket upgrade.

In production (no Vite proxy), point both variables at your actual backend origin.

</details>

<details>
<summary>"You don't have permission" when starting a recording</summary>

<br/>

Recording requires **OWNER** role. Only the first user to open a new session is automatically assigned OWNER. All other users need an invite link with the OWNER role, generated by the current OWNER from the Members panel.

</details>

<details>
<summary>Package installs fail with "Network access is disabled"</summary>

<br/>

An OWNER must open **Workspace Settings** (⚙ button in the top bar) and toggle network access on. This is intentionally disabled by default — see [Workspace Runtimes → Network Access](#network-access-for-package-installs) for the rationale.

</details>

<details>
<summary>Login succeeds but workspace shows "No session selected"</summary>

<br/>

The workspace route requires a `:sessionId` URL parameter. Navigate to `/sessions` first and enter a session ID, or go directly to `/workspace/your-session-id`.

</details>

<details>
<summary><code>tsc</code> fails with "Cannot find type definition file for 'vite/client'"</summary>

<br/>

Run `npm install` inside the `frontend/` directory. The `vite` package ships this type definition and must be installed before TypeScript can resolve it.

</details>

<details>
<summary>One user's edits are not appearing on another user's screen</summary>

<br/>

- Confirm both browser tabs are connecting to the same `sessionId` and the same `VITE_YJS_WS_URL`
- Check backend logs for Yjs WebSocket upgrade failures (expired token, missing token, or role not found)
- Confirm Redis is running and `REDIS_URL` is correctly set — Redis is required for Yjs update propagation when more than one backend process is running

</details>

---

## Roadmap

- [ ] Multi-replica terminal support via shared Docker socket or Kubernetes exec backend
- [ ] WebRTC voice and video using the existing Yjs awareness peer-discovery layer
- [ ] Egress proxy sidecar for per-registry package install network allowlisting
- [ ] Global admin dashboard for cross-session user and session management
- [ ] Project-aware multi-file execution (e.g. `npm run start`, `go build ./...`)
- [ ] File system mutation events captured in session recordings
- [ ] OAuth login — GitHub, Google
- [ ] Persistent file storage backend — S3 or compatible object store

---

## Contributing

Contributions are welcome. Please open an issue before submitting a large pull request so the change can be discussed first. For bug fixes and small improvements, PRs are appreciated directly.

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_GITHUB_USERNAME/collab-ide.git

# 3. Create a feature branch
git checkout -b feat/your-feature-name

# 4. Make your changes, then commit using conventional commits
git commit -m "feat: describe what you added"
git commit -m "fix: describe what you fixed"

# 5. Push and open a Pull Request
git push origin feat/your-feature-name
```

Please follow the existing code style — TypeScript strict mode is enforced in both workspaces. Run `tsc --noEmit` in both `backend/` and `frontend/` before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [Yjs](https://yjs.dev) — the CRDT library that makes conflict-free collaboration possible
- [y-websocket](https://github.com/yjs/y-websocket) — WebSocket provider and server for Yjs
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — the VS Code editor engine
- [xterm.js](https://xtermjs.org) — the browser terminal emulator
- [Prisma](https://www.prisma.io) — the TypeScript ORM for PostgreSQL
- [Vite](https://vitejs.dev) — the frontend build tool
- [dockerode](https://github.com/apocas/dockerode) — Node.js Docker API client

---

<div align="center">

Built by [**Shahzad**](https://github.com/YOUR_GITHUB_USERNAME) &nbsp;·&nbsp; Final Year CS Project &nbsp;·&nbsp; NED University of Engineering & Technology

<br/>

If this project was useful or interesting, consider leaving a ⭐

</div>
