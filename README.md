# Collab IDE

A production-quality, browser-based collaborative code editor. Multiple users open the
same session and edit files together in real time, with conflict-free CRDT synchronization,
live multi-cursor presence, a sandboxed multi-language terminal, session recording/replay,
per-session role-based permissions, and invite-link collaboration.

\---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture overview](#architecture-overview)
4. [Project structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Environment variables](#environment-variables)
7. [Local development](#local-development)
8. [Production deployment](#production-deployment)
9. [First run walkthrough](#first-run-walkthrough)
10. [Roles and permissions](#roles-and-permissions)
11. [Workspace runtimes](#workspace-runtimes)
12. [Session recording and replay](#session-recording-and-replay)
13. [Known limitations](#known-limitations)
14. [Troubleshooting](#troubleshooting)

\---

## Features

|Category|Feature|
|-|-|
|**Collaboration**|Real-time CRDT editing (Yjs), conflict-free concurrent edits|
|**Collaboration**|Multi-cursor presence — colored cursors, selection highlights, username labels|
|**Collaboration**|Online-user avatars with join/leave notifications|
|**Editor**|Monaco Editor (same engine as VS Code), syntax highlighting for 10+ languages|
|**Editor**|Per-file undo/redo stacks, tab management, auto-layout resize|
|**Editor**|4 themes: Dark, Light, Midnight, Solarized|
|**Files**|File explorer with create/rename/move/delete, folder tree, lazy content loading|
|**Files**|Role-gated mutations (VIEWER cannot create or delete)|
|**Terminal**|Real sandboxed shell inside a Docker container per session|
|**Terminal**|Persistent workspaces — container survives disconnect, reattaches on reconnect|
|**Terminal**|4 language runtimes: Shell, Node.js, Python, Go|
|**Terminal**|▶ Run active file in the session's runtime, output streamed into the terminal|
|**Terminal**|Install packages (npm/pip/go get) with streaming output|
|**Auth**|Email/password registration and login|
|**Auth**|JWT access token (15 min, in-memory) + refresh token (7 days, httpOnly cookie)|
|**Auth**|Silent token refresh via axios interceptor|
|**Permissions**|Per-session roles: OWNER, EDITOR, VIEWER|
|**Permissions**|Invite links (token-based, per-role, optional expiry/use-limit)|
|**Permissions**|VIEWER enforced at the Yjs WebSocket protocol level (not just REST)|
|**Recording**|Session recording — captures every CRDT update and terminal byte|
|**Recording**|Yjs snapshots every 10 s for fast seek without full replay|
|**Replay**|Full replay player with scrubber, play/pause, speed (0.5×–4×), seek-to-snapshot|
|**Polish**|Command palette (Cmd/Ctrl+K), fuzzy search across all workspace commands|
|**Polish**|Keyboard shortcuts, theme switching, toast notifications, notification bell|
|**Polish**|Project templates: Blank, Node.js, Python, HTML/CSS/JS|
|**Scaling**|Redis-backed Yjs sync — Yjs updates broadcast across backend replicas|
|**Scaling**|Redis-backed recording state with pub/sub cache invalidation|

\---

## Tech stack

### Backend

|Package|Purpose|
|-|-|
|`express`|HTTP server and REST API|
|`@prisma/client` + `prisma`|ORM + migrations (PostgreSQL)|
|`bcryptjs`|Password hashing (pure JS, no native build required)|
|`jsonwebtoken`|JWT access and refresh token sign/verify|
|`cookie-parser`|httpOnly refresh token cookie|
|`cors` + `helmet`|CORS and HTTP security headers|
|`express-rate-limit`|Auth and file-mutation rate limiting|
|`ioredis`|Redis client (Yjs pub/sub sync, recording state cache)|
|`yjs` + `y-websocket`|CRDT server, WebSocket sync protocol|
|`y-protocols` + `lib0`|Yjs protocol frame decoding (VIEWER enforcement)|
|`ws`|Raw WebSocket server (Yjs + terminal)|
|`dockerode`|Docker API client (create/attach/exec/kill containers)|
|`dotenv`|Environment variable loading|

### Frontend

|Package|Purpose|
|-|-|
|`react` + `react-dom`|UI framework|
|`react-router-dom`|Client-side routing|
|`vite`|Build tool and dev server|
|`tailwindcss`|Utility-first styling|
|`@monaco-editor/react` + `monaco-editor`|VS Code editor engine|
|`yjs` + `y-websocket` + `y-monaco`|CRDT sync and Monaco binding|
|`@xterm/xterm` + `@xterm/addon-fit`|Browser terminal emulator|
|`axios`|HTTP client with interceptors (auth token injection, silent refresh)|
|`zustand`|Lightweight global state (auth, editor, files, theme, notifications)|

### Infrastructure

|Component|Purpose|
|-|-|
|PostgreSQL 16|Users, files, session members, invites, recordings, workspaces|
|Redis 7|Yjs cross-replica sync, recording active-state cache|
|Docker|Sandboxed execution containers per session|
|nginx|Frontend static file serving + SPA fallback + asset caching headers|
|docker-compose|Full-stack local/production orchestration|

\---

## Architecture overview

```
Browser
  │
  ├─ HTTPS/REST ──────────────────► Express API :4000
  │                                      │
  ├─ WebSocket (Yjs sync) ──────────────►│  y-websocket server
  │   token in query param               │    │
  │                                      │    ├─ Y.Doc per room
  │                                      │    ├─ Redis pub/sub broadcast
  ├─ WebSocket (terminal) ─────────────► │    │  (cross-replica sync)
  │   token in query param               │    └─ awareness (multi-cursor)
  │                                      │
  │                               ┌──────┤
  │                               │      │
  │                        PostgreSQL  Redis
  │                        (all data)  (ephemeral sync)
  │
  └─ Docker daemon (via dockerode)
       │
       ├─ ws-<sessionId>  ← persistent workspace container
       │    Shell / Node / Python / Go image
       │    NetworkMode: none (default) or bridge (opt-in)
       │    Memory: 256 MB, CPU: 0.5 core, PIDs: 128, CapDrop: ALL
       └─ ...
```

**Key design decisions:**

* **Single HTTP server** for REST, Yjs WS, and terminal WS (same port 4000, upgrade-routed)
* **Yjs room = sessionId string** — no separate Session DB model, just a string shared between editor and terminal
* **Persistent workspaces** — containers are looked up by deterministic name (`ws-<sessionId>`), not recreated on every connect. Destroyed by the idle reaper after 4 h inactivity
* **VIEWER enforcement at protocol level** — Yjs frames from VIEWER connections are inspected and mutating update packets dropped before they reach the doc
* **Access token in memory, refresh token in httpOnly cookie** — no localStorage, resistant to XSS token theft

\---

## Project structure

```
collab-ide/
├── .env.example                    Root compose vars (Postgres creds, JWT, CLIENT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL)
├── .dockerignore
├── README.md
│
├── backend/
│   ├── .env.example                Backend env vars (all 11 documented below)
│   ├── Dockerfile                  Multi-stage: build → slim runtime image
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma           All 7 models + 3 enums
│   └── src/
│       ├── app.ts                  Express app: middleware, routes, /health
│       ├── server.ts               HTTP server, WS attach, graceful shutdown
│       ├── config/
│       │   └── env.ts              Validates all env vars on startup
│       ├── middleware/
│       │   ├── auth.middleware.ts      JWT verify → req.user, requireRole()
│       │   ├── error.middleware.ts     Centralized 500 handler
│       │   └── rateLimit.middleware.ts Auth / API / file-write limits
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
│       │   ├── execution/          Runtime config, docker runner, workspace reaper
│       │   └── yjs-server/         Y.Doc registry, Redis sync, Yjs WS server
│       └── websocket/
│           ├── ws.server.ts        Wires Yjs + terminal WS onto the HTTP server
│           └── terminal.socket.ts  Per-session Docker container attach/detach
│
├── frontend/
│   ├── .env.example                3 VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ vars
│   ├── Dockerfile                  Build → nginx static serve
│   ├── nginx.conf                  SPA fallback, gzip, asset cache headers
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx                 Routes: /login /register /sessions /workspace/:id /invite/:token
│       ├── main.tsx                React entry
│       ├── index.css               Tailwind base
│       ├── vite-env.d.ts           VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ env var types
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── SessionsPage.tsx    Session ID entry + template picker
│       │   ├── WorkspacePage.tsx   Workspace or replay mode (via ?replay=)
│       │   └── InviteRedeemPage.tsx  POST /permissions/invites/:token/redeem
│       ├── components/
│       │   ├── Auth/               AuthInput, ProtectedRoute (bootstrap + guard)
│       │   ├── Editor/             CollaborativeEditor, EditorTabs, RemoteCursorStyles
│       │   ├── FileExplorer/       FileTree, FileNode (role-gated mutation buttons)
│       │   ├── Terminal/           TerminalPanel (forwardRef write handle)
│       │   ├── Presence/           UserAvatars
│       │   ├── Replay/             SessionReplay, ReplayEditorView, ReplayRoute, RecordingControls
│       │   ├── Permissions/        SessionMembersPanel
│       │   ├── Workspace/          WorkspaceSettingsPanel, InstallPackagesPrompt
│       │   ├── Notifications/      Toast, ToastContainer, NotificationBell
│       │   ├── Theme/              ThemeSwitcher
│       │   ├── CommandPalette/     CommandPalette modal
│       │   └── Layout/             Workspace (main shell), Sidebar
│       ├── hooks/                  useAuth, useYjsProvider, useAwareness, useFileTree,
│       │                           useTerminalSocket, useSessionRole, useWorkspaceConfig,
│       │                           useReplayEngine, useSessionRecording, useTheme,
│       │                           useKeyboardShortcuts, useRegisterCommands
│       ├── lib/
│       │   ├── api/                Typed API clients: auth, files, sessions, permissions, execution
│       │   ├── yjs/                Y.Doc registry (ref-counted), provider registry, bindings, colors
│       │   ├── editor/             languageMap (ext → Monaco language)
│       │   ├── replay/             ReplayEngine class (seek-to-snapshot + incremental apply)
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

\---

## Prerequisites

|Requirement|Minimum version|Notes|
|-|-|-|
|Node.js|20.x|Both backend and frontend|
|Docker|24.x|Must be running; used for sandboxed terminal containers|
|PostgreSQL|14+|Local instance **or** use `docker compose` (includes it)|
|Redis|7+|Local instance **or** use `docker compose` (includes it)|

\---

## Environment variables

### Root `.env` (compose only)

```env
POSTGRES\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_USER=collab\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ide\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_user
POSTGRES\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_PASSWORD=           # required — no default
POSTGRES\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_DB=collab\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ide
JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET=           # required — generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_REFRESH\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET=          # required — must differ from ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET
CLIENT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL=                  # required — e.g. http://localhost or https://your-domain.com
```

### `backend/.env`

|Variable|Default|Required|Description|
|-|-|-|-|
|`NODE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ENV`|`development`|No|Set to `production` for prod|
|`PORT`|`4000`|No|HTTP server port|
|`DATABASE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`|—|**Yes**|PostgreSQL connection string|
|`REDIS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`|—|**Yes**|Redis connection string e.g. `redis://localhost:6379`|
|`JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET`|—|**Yes**|Min 32 chars in production|
|`JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_REFRESH\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET`|—|**Yes**|Min 32 chars, must differ from access secret|
|`ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TOKEN\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TTL`|`15m`|No|Access token lifetime|
|`REFRESH\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TOKEN\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TTL`|`7d`|No|Refresh token lifetime|
|`CLIENT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`|—|**Yes**|Allowed CORS origin (comma-separated for multiple)|
|`MAX\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TERMINAL\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SESSIONS`|`50`|No|Max concurrent terminal container connections|
|`TERMINAL\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_IDLE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TIMEOUT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_MS`|`600000`|No|WS idle timeout (10 min). Does NOT destroy the container|

### `frontend/.env`

|Variable|Default (dev)|Description|
|-|-|-|
|`VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_API\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`|`/api`|Relative — proxied same-origin to the backend by Vite's dev server (see `vite.config.ts`)|
|`VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_YJS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_WS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`|`ws://localhost:5173`|Also same-origin; Vite proxies `/ws` through to the backend|
|`VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TERMINAL\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_WS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`|`ws://localhost:5173/terminal`|Also same-origin; Vite proxies `/terminal` through to the backend|

> \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*Important:\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\* these defaults are same-origin (port `5173`, the Vite dev server) \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*on purpose\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*, not a mistake — the backend's refresh-token cookie is `SameSite=Lax`, which browsers won't attach to a direct cross-origin POST from `5173` to `4000`. Vite's dev proxy makes every request same-origin so the cookie actually gets sent. Don't point these at `http://localhost:4000` directly unless you've also changed the cookie's `SameSite` policy. For a real production deployment (no dev proxy), point these at your actual backend origin — see `frontend/.env.example` for the commented-out production block.

\---

## Local development

### 1\. Clone and copy env files

```bash
git clone <your-repo-url>
cd collab-ide

cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` — set at minimum:

```env
DATABASE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL=postgresql://postgres:postgres@localhost:5432/collab\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ide
REDIS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL=redis://localhost:6379
JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET=<generate with command below>
JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_REFRESH\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET=<generate with command below — must differ>
CLIENT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL=http://localhost:5173
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# run twice — one for ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET, one for REFRESH\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET
```

### 2\. Start PostgreSQL and Redis

If you have them locally already, skip this. Otherwise use compose just for the DB and cache:

```bash
cd docker \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\&\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\& docker compose --env-file ../.env up postgres redis -d \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\&\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\& cd ..
```

> `--env-file ../.env` is required here: Docker Compose only auto-loads a `.env` file from its own working directory, and the file created in step 1 lives at the repo root, one level up from `docker/`.

### 3\. Build the sandbox executor images

All four are needed even for local dev (the backend will fail to create terminal containers without them):

```bash
docker build -t collab-ide-executor-shell:latest  -f docker/executor.shell.Dockerfile  .
docker build -t collab-ide-executor-node:latest   -f docker/executor.node.Dockerfile   .
docker build -t collab-ide-executor-python:latest -f docker/executor.python.Dockerfile .
docker build -t collab-ide-executor-go:latest     -f docker/executor.go.Dockerfile     .
```

### 4\. Run the backend

```bash
cd backend
npm install
npx prisma migrate dev --name init    # creates all tables
npm run dev                           # ts-node-dev, hot reload, :4000
```

### 5\. Run the frontend

```bash
# new terminal
cd frontend
npm install
npm run dev                           # vite dev server, :5173
```

Open `http://localhost:5173`.

\---

## Production deployment

### Docker Compose (single server)

```bash
cp .env.example .env
# Fill in POSTGRES\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_PASSWORD, JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ACCESS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET, JWT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_REFRESH\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SECRET, CLIENT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL

cd docker
docker compose --env-file ../.env build   # builds backend, frontend, all 4 executor images
docker compose --env-file ../.env up -d   # starts postgres, redis, backend, frontend
docker compose --env-file ../.env exec backend npx prisma migrate deploy
```

* Frontend served at `http://localhost:80`
* Backend REST + WebSockets at `http://localhost:4000`
* Postgres (`5432`) and Redis (`6379`) are also published to the host to support the native-backend local-dev workflow above — firewall the host's public interface in a real deployment if they shouldn't be reachable externally

### Manual / cloud deployment

1. Provision PostgreSQL and Redis (managed services work fine — e.g. RDS, ElastiCache, Supabase + Upstash)
2. Build and push the backend Docker image
3. Build and push the frontend Docker image (or serve `frontend/dist/` via any static host)
4. Run `prisma migrate deploy` against your database on first deploy
5. Build all 4 executor images on the Docker host(s) the backend runs on
6. Set all env vars (see table above)

> \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*Important for multi-replica backend:\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\* The Docker daemon must be reachable from every backend replica (same host or shared socket). Terminal containers are created and attached on the same Docker host — this is not a distributed container scheduler.

\---

## First run walkthrough

1. Open `http://localhost:5173` → redirects to `/login`
2. Click "Register" → create an account
3. You land on `/sessions` — type any session ID (e.g. `my-project`) and press Enter
4. The workspace opens — you are auto-enrolled as **OWNER** of this session
5. Create a file from the Explorer (the file+ icon in the Explorer header, or the folder+ icon for a folder)
6. Open it — start typing — the editor is now CRDT-backed
7. Open the same URL in a second browser profile or incognito window, log in as a second user — they see your cursor in real time
8. Press **Cmd/Ctrl+K** to open the command palette
9. Click ⚙ in the top bar to open workspace settings — change the runtime to **Node.js**
10. Click ▶ Run to run the active file
11. Click **Members** → **Create link** to generate an invite URL

\---

## Roles and permissions

Sessions use per-session roles, independent of the global `User.role`.

|Role|Assigned automatically|File create/edit/delete|Run / Install|Start/stop recording|Manage members/invites|Enable network|
|-|-|-|-|-|-|-|
|**OWNER**|First user to open a session|✅|✅|✅|✅|✅|
|**EDITOR**|Invite link with EDITOR role|✅|✅|❌|❌|❌|
|**VIEWER**|Invite link with VIEWER role|❌|❌|❌|❌|❌|

> VIEWER enforcement is applied at the \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*Yjs WebSocket protocol layer\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\* (mutating frames are dropped before they reach the shared doc), not just at the REST API level. This means a VIEWER cannot inject code changes even via direct WebSocket.

\---

## Workspace runtimes

|Runtime|Docker image|Shell cmd|Run cmd|Package manager|
|-|-|-|-|-|
|`shell`|`collab-ide-executor-shell:latest`|`/bin/sh`|`/bin/sh <file>`|None|
|`node`|`collab-ide-executor-node:latest`|`/bin/sh`|`node <file>`|`npm install`|
|`python`|`collab-ide-executor-python:latest`|`/bin/sh`|`python3 <file>`|`pip install --user`|
|`go`|`collab-ide-executor-go:latest`|`/bin/sh`|`go run <file>`|`go get`|

**Sandbox constraints (all runtimes):**

* Memory: 256 MB (hard limit, swap disabled)
* CPU: 0.5 core
* Process limit: 128 PIDs
* Network: **disabled by default** (`NetworkMode: none`)
* All Linux capabilities dropped (`CapDrop: ALL`, `no-new-privileges`)

**Network access for package installs:**
Package managers need internet access (npm registry, PyPI, proxy.golang.org). Enabling it grants general internet access to the container — Docker has no built-in per-domain allowlisting without an egress proxy. It is **disabled by default**, and only session **OWNERs** can enable it from workspace settings.

**Persistent workspaces:**
Containers are named `ws-<sessionId>` and survive client disconnects. Reconnecting reattaches to the existing container with all running processes and installed packages intact. Containers are destroyed by a background idle reaper after **4 hours of inactivity** (no terminal input/output, not `TERMINAL\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_IDLE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TIMEOUT\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_MS` which only closes the WebSocket connection).

\---

## Session recording and replay

**Starting a recording:** Click "Record session" in the workspace header (requires OWNER role).

**What gets recorded:**

* Every Yjs binary update frame (CRDT document mutations)
* Every Yjs snapshot (full doc state, every 10 seconds)
* Every terminal output byte
* Every terminal input byte

**Viewing a replay:** Click "View replays" → latest recording opens at `?replay=<id>`. A file picker (from the existing file tree) selects which file's CRDT history to replay. Scrub the timeline, play/pause, or set speed (0.5×–4×).

**Seeking:** The `ReplayEngine` finds the nearest `YJS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_SNAPSHOT` event before the target position and only replays deltas after it — seeking is O(updates since last snapshot), not O(all updates since recording start).

\---

## Known limitations

* **Single Docker host for terminals:** All workspace containers run on the same Docker daemon. Running multiple backend replicas across different VMs requires shared Docker socket or a proper container scheduler (Kubernetes, Nomad, ECS) — not implemented.
* **No WebRTC voice/video:** Designed for it, not built. The awareness protocol carries the plumbing; the actual RTC signalling and media tracks are absent.
* **No fine-grained network allowlisting:** Package installs require enabling general internet access for the container. An egress proxy sidecar (e.g. Squid) could restrict outbound to registry domains only — not built.
* **RBAC is per-session only:** There's no global admin dashboard, no cross-session user management, no team/org concept above the session level.
* **Single-file Run:** The Run button executes one file in isolation. It doesn't understand project structure (e.g. `npm run start` for a multi-file Node project). Use the interactive terminal for that.
* **Replay does not include file create/rename events:** The file tree state at recording start is preserved, but file-system mutations during a recording are not replayed — only text content mutations via Yjs.
* **`npm audit` on `frontend/`:** flags a moderate advisory in `esbuild` (via Vite's dev-server-only transitive dependency — [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)). It only affects `vite dev`, not production builds (`vite build` output is unaffected), and the fix requires an untested breaking major upgrade to Vite 8. Left as-is deliberately rather than force-upgrading without validating the rest of the toolchain against it — revisit before treating this as stale.

\---

## Troubleshooting

**`prisma generate` fails / "403 Forbidden" from binaries.prisma.sh**
Run `npm install` — Prisma's postinstall hook downloads a native query engine binary. This requires internet access to `binaries.prisma.sh`. In restricted environments (CI without outbound network), use `PRISMA\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_ENGINES\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_CHECKSUM\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_IGNORE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_MISSING=1` or configure `PRISMA\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_BINARY\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TARGETS`.

**Terminal panel shows "disconnected" immediately**

* Confirm Docker is running: `docker ps`
* Confirm all 4 executor images exist: `docker images | grep collab-ide-executor`
* Check backend logs for "no such image" errors

**WebSocket connection errors in browser console**

* In local dev, `VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_YJS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_WS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL`/`VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_TERMINAL\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_WS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL` should stay pointed at `localhost:5173` (the Vite dev server) — Vite's proxy forwards `/ws` and `/terminal` through to the backend on `:4000`. Pointing them straight at `:4000` skips that proxy and reintroduces a cross-origin `SameSite=Lax` cookie problem (see the note under [Environment variables](#environment-variables)).
* In production (no dev proxy in front), these should point at wherever the backend actually listens.
* Both WebSocket endpoints run on the same server as REST — there is no separate port 4001 or dedicated WS server.

**"You don't have permission" when starting a recording**
Recording requires **OWNER** role for the session. Only the first user to open a new session gets OWNER automatically. Others need an OWNER-role invite link.

**Package installs fail with "Network access is disabled"**
An OWNER must open **Workspace Settings** (⚙ button) and enable network access. This is intentionally off by default.

**Login works but workspace shows "No session selected"**
The workspace route requires a `:sessionId` param — navigate to `/sessions` first and enter a session ID, or use a direct URL like `/workspace/my-project`.

**`tsc` fails with "Cannot find type definition file for 'vite/client'"**
Run `npm install` in the `frontend/` directory first — the `vite` package ships this type definition.

**Changes from one user don't appear on another's screen**

* Check both browsers are connected to the same Yjs WS (same `VITE\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_YJS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_WS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL` and same `sessionId`)
* Check backend logs for Yjs upgrade auth failures (expired/missing token)
* Confirm Redis is running and `REDIS\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_URL` is correct (if running multiple backend replicas)

