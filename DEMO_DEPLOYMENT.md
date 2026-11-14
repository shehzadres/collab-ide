# Free Hosting Deployment Guide — Demo Mode

This deployment uses:

| Service | Purpose |
|---|---|
| Vercel | React frontend |
| Railway | Node.js API and WebSocket backend |
| Neon | PostgreSQL |
| Upstash | Redis pub/sub |

Demo mode is intentional for hosted free-tier deployment. The backend requires Docker access for isolated code execution, which typical managed application hosts do not expose. Demo mode keeps authentication, collaboration, file management, invites, replay, permissions, notifications, themes, and command palette available while hiding Docker-dependent terminal and execution features.

## 1. Neon PostgreSQL

1. Create a fresh Neon project and production branch.
2. Apply the repository's Prisma migrations during backend startup.
3. Copy the pooled PostgreSQL connection string. Require SSL.
4. Store it only in Railway's `DATABASE_URL` variable.

Do not reuse the previously exposed database password or the archived database branch.

## 2. Upstash Redis

1. Create a Redis database.
2. Copy its TLS Redis URL (usually starts with `rediss://`).
3. Store it only in Railway's `REDIS_URL` variable.

Redis pub/sub carries Yjs document updates between backend processes. Use the same Redis database for every backend replica.

## 3. Railway backend

1. Create a Railway project.
2. Add a service connected to `shehzadres/collab-ide`, branch `main`.
3. Set the service root directory to `/backend`.
4. Build command: `npm install && npx prisma generate && npm run build`.
5. Start command: `npx prisma migrate deploy && node dist/server.js`.
6. Expose the service's HTTP port. The app listens on Railway's `PORT` environment variable (default 4000).
7. Enable WebSocket support for the same service domain.

Set these service variables:

```env
NODE_ENV=production
DATABASE_URL=<Neon pooled PostgreSQL URL>
REDIS_URL=<Upstash TLS Redis URL>
JWT_ACCESS_SECRET=<unique random secret, at least 32 characters>
JWT_REFRESH_SECRET=<different unique random secret, at least 32 characters>
CLIENT_URL=https://<your-vercel-frontend-domain>
DEMO_MODE=true
```

Generate new independent JWT secrets for the hosted environment. Do not reuse local secrets or paste secret values into source files, documentation, or chat.

The backend's `CLIENT_URL` is an exact origin allowlist. If you use more than one frontend domain, separate origins with commas and no quotes.

## 4. Vercel frontend

1. Import `shehzadres/collab-ide`.
2. Set the root directory to `frontend/`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Keep the included `frontend/vercel.json` SPA rewrite so direct navigation to `/login`, `/register`, and workspace routes resolves to `index.html`.

Set these Vercel environment variables for Production and Preview as appropriate:

```env
VITE_API_URL=https://<your-railway-service-domain>/api
VITE_YJS_WS_URL=wss://<your-railway-service-domain>/ws
VITE_TERMINAL_WS_URL=wss://<your-railway-service-domain>/terminal
VITE_DEMO_MODE=true
```

These values are embedded at frontend build time. Redeploy after changing them.

## 5. Post-deployment acceptance

Verify all of the following before sharing the public demo:

- `GET https://<railway-domain>/health` returns HTTP 200.
- Registration, login, refresh, logout, and authenticated profile work from the Vercel origin.
- Two separate browser profiles can join one session and exchange live Yjs edits.
- Editor and viewer roles enforce their read/write restrictions.
- Invite creation, redemption, expiration, max-use, and revocation work.
- Session recording and replay survive backend restarts.
- Direct Vercel navigation to `/login`, `/register`, and `/workspace/<id>` loads the SPA.
- Browser console and network contain no unexpected errors.

Do not describe the hosted service as fully deployed until these checks pass.

## Restoring full execution on a self-hosted Docker host

Set backend `DEMO_MODE=false` and frontend `VITE_DEMO_MODE=false`, then deploy to a host where the backend has the Docker socket and can create isolated executor containers. Managed free-tier application hosts generally do not provide that capability.
