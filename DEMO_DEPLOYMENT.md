# Free Hosting Deployment Guide — Demo Mode

This document covers deploying Collab IDE for free using:

| Service    | Purpose          |
|------------|------------------|
| Vercel     | Frontend         |
| Railway    | Backend          |
| Neon       | PostgreSQL       |
| Upstash    | Redis            |

## What is Demo Mode?

Demo mode disables Docker-dependent features (terminal, Run, Install, workspace
reset) that cannot run on free hosting platforms. All other features remain
fully operational:

✅ Authentication (register / login / JWT / refresh)  
✅ Real-time Yjs CRDT collaboration  
✅ Multi-cursor awareness  
✅ Session replay  
✅ File explorer  
✅ Invite links  
✅ Role-based permissions (OWNER / EDITOR / VIEWER)  
✅ Notifications  
✅ Themes & command palette  
✅ WebSockets / Redis pub-sub  

❌ Terminal panel (requires Docker)  
❌ Run file (requires Docker)  
❌ Install packages (requires Docker)  
❌ Workspace reset (requires Docker)  

A polished in-app notice explains this to users.

---

## 1 — Neon (PostgreSQL)

1. Create a free project at https://neon.tech
2. Copy the connection string — it looks like:
   `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## 2 — Upstash (Redis)

1. Create a free database at https://upstash.com
2. Copy the **Redis URL** (starts with `rediss://`)

---

## 3 — Railway (Backend)

1. Create a Railway project and add a service connected to the `shehzadres/collab-ide` GitHub repository.
2. Set the service root directory to `/backend`.
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && node dist/server.js`
5. Attach PostgreSQL and Redis services, or provide external Neon and Upstash URLs.
6. Set these environment variables:

```
NODE_ENV=production
DATABASE_URL=<your Neon connection string>
REDIS_URL=<your Upstash Redis URL>
JWT_ACCESS_SECRET=<64-char random hex>
JWT_REFRESH_SECRET=<different 64-char random hex>
CLIENT_URL=<your Vercel frontend URL, e.g. https://collab-ide.vercel.app>
DEMO_MODE=true
```

---

## 4 — Vercel (Frontend)

1. Import the repository and set the **root directory** to `frontend/`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set these environment variables:

```
VITE_API_URL=https://<your-render-backend>.onrender.com/api
VITE_YJS_WS_URL=wss://<your-render-backend>.onrender.com
VITE_TERMINAL_WS_URL=wss://<your-render-backend>.onrender.com/terminal
VITE_DEMO_MODE=true
```

---

## Restoring Full Execution (Self-Hosted / Local)

Simply set:

```
# Backend
DEMO_MODE=false

# Frontend
VITE_DEMO_MODE=false
```

No code changes are required. Docker Compose (`docker/docker-compose.yml`)
brings up the full stack locally.
