# QA and Engineering Notes

## Verification performed

- Backend TypeScript build: passed.
- Frontend TypeScript build and Vite production build: passed.
- Root `npm run build`: passed (exit code 0).
- Root `npm run typecheck`: passed after adding the missing backend/frontend typecheck scripts.
- Playwright: registration/login route reached the sessions dashboard; dashboard rendered the session-creation workflow with no browser page errors in the successful run.
- Playwright: workspace route loaded; file explorer populated; opening `index.js` mounted Monaco and displayed the starter source; Yjs WebSocket exchanged sync and awareness frames.
- Playwright: terminal WebSocket connected and the Run action invoked the execution endpoint. A JavaScript file run while the workspace runtime was explicitly set to Shell correctly produced a shell syntax error. This confirms the command path, but does not constitute a successful Node runtime execution test.
- Docker: local daemon available and all four Collab IDE executor images present.

## Defects addressed

- Corrected the Yjs WebSocket URL path handling so the server receives the expected room route.
- Fixed file creation so template file contents are persisted instead of creating empty records.
- Added runtime metadata to starter templates and apply it when initializing a new template workspace.
- Added shared-document sync gating before binding Monaco, avoiding an empty local model overwriting the initial shared content.
- Added editor save synchronization from local Yjs edits back to persisted file content, with a debounce.
- Added a generation guard to prevent stale asynchronous Monaco bindings from attaching after a file switch.
- Corrected the Docker attach/exec request shape and terminal stream setup.
- Added per-session terminal-container creation locking and Docker 409 conflict recovery.
- Added safe workspace file synchronization into the execution container before running a file or installing packages, with path traversal and size/count limits.
- Set the container working directory to `/workspace` and normalized execution paths.
- Added missing typecheck scripts so the documented root typecheck command works.

## Remaining verification caveat

Repeated automated login attempts triggered the configured authentication rate limit (HTTP 429), so the final fresh-account Node/Python/Go template execution matrix and multi-user live-edit test could not be completed in this run. The production build and typecheck are clean, and the Yjs transport was observed exchanging frames, but those are not substitutes for a complete two-user and all-runtimes acceptance test.

## Local acceptance checklist

1. Create separate accounts in two browser profiles.
2. Open the same session name in both profiles and verify concurrent edits and cursor presence.
3. Create, rename, move, and delete a file/folder; verify persisted contents after reload.
4. Create Node.js, Python, and HTML/CSS/JS template sessions and verify their initial files and runtime selection.
5. Open Workspace Settings, change runtime, reset the container, reconnect, and run a matching source file.
6. Type commands into the interactive terminal and verify input/output plus reconnect persistence.
7. Create an invite link, redeem it as EDITOR and VIEWER, and verify role restrictions.
8. Record a session, make edits, stop recording, and verify replay/seek.
9. Check all four themes and the workspace at desktop and narrow viewport widths.


## Monaco loader follow-up (2026-11-05)

- Configured `@monaco-editor/react` to load the Monaco AMD loader from the locally installed `monaco-editor` package at `/node_modules/monaco-editor/min/vs`, avoiding reliance on the default CDN path.
- Frontend production build passed after the change (`tsc -b && vite build`, 2,268 modules transformed).
- Added and ran `artifacts/monaco-loader-smoke.cjs`: Monaco mounted successfully in Microsoft Edge (`.monaco-editor` present), with zero page errors and zero failed network requests.
- Full workspace integration could not be re-run: the local PostgreSQL database configured in `backend/.env` is unavailable at `localhost:55432`; the Windows PostgreSQL service listens on `5432` but rejects the configured `collab_user` credentials. Redis at `localhost:6379` is also unavailable. Backend starts on port 4000 but repeatedly logs Redis connection errors. Do not mark collaboration, runtime execution, or other backend-dependent acceptance tests as passed until local services are restored.

## Verification update (2026-11-14)

### Local browser and deployment checks
- Local Docker frontend and backend are running; backend `/health` returns HTTP 200 and the frontend root returns HTTP 200.
- Playwright verified the local login and registration screens, required fields, desktop/mobile rendering, and zero browser page errors.
- Mobile registration layout has no horizontal overflow.
- Production preview build verified direct navigation to both `/login` and `/register`; both render their expected forms with zero page errors.
- The login route does not request the Monaco editor bundle. Monaco is now loaded through a shared dynamic-import helper only when an editor view mounts.
- The Monaco chunk remains approximately 2.29 MB uncompressed (594 KB gzip), but it is deferred instead of being pulled into the initial authentication bundle.
- Redis pub/sub delivered a membership-change event between two separate Node processes. This verifies Redis cross-process delivery, but is not a full two-backend-replica WebSocket acceptance test.

### Hosted deployment blockers found
- Vercel project `collab-ide-frontend` has a READY production deployment, but the deployment URL is protected by Vercel sign-in.
- The public project domain `collab-ide-frontend-iota.vercel.app` serves the login page, but direct navigation to `/register` returns Vercel HTTP 404. Added `frontend/vercel.json` SPA fallback rewrites to resolve deep links on the next deployment.
- The configured Railway API host `collab-ide-backend-production.up.railway.app` currently returns HTTP 404 with `Application not found`. The connected Railway account does not list a Collab IDE project, so the backend service must be restored or redeployed before hosted authentication and collaboration can work.
- The latest Vercel production deployment is built from an older Git commit; local changes are not deployed because the branch has four commits ahead and public Git history still contains credentials that must be rotated and removed before pushing.

### Still not verified
- Browser-based collaboration between two independently authenticated browser profiles.
- Actual WebSocket revocation across two running backend replicas (Redis cross-process pub/sub itself passed).
- Hosted API authentication, invite redemption, collaboration, and role revocation.
- GitHub Actions for the latest local changes.


## Verification update (2026-11-14, full local acceptance rerun)

This section supersedes earlier notes in this file that reported local PostgreSQL and Redis as unavailable. The current Docker Compose environment is restored and healthy.

### Infrastructure
- `docker compose -f docker/docker-compose.yml --env-file .env ps`: PostgreSQL and Redis healthy; backend healthy; frontend running.
- Backend `http://localhost:4000/health`: HTTP 200.
- Frontend `http://localhost/`: HTTP 200.
- All four required executor images exist: `collab-ide-executor-shell`, `collab-ide-executor-node`, `collab-ide-executor-python`, and `collab-ide-executor-go`.

### Functional acceptance
- Backend runtime unit tests: 4 passed, 0 failed.
- `npm run smoke:local`: passed registration and response sanitization, authenticated profile, Node execution and workspace reset, Python execution and workspace reset, Go execution and workspace reset, Shell execution and workspace reset, authenticated interactive terminal WebSocket, terminal workspace reset, logout, and temporary-record cleanup.
- `npm run smoke:collaboration`: all 16 checks passed, covering owner/editor/viewer authorization, file and execution restrictions, viewer terminal rejection, invite lifecycle and max-use enforcement, concurrent invite redemption, Yjs synchronization, viewer mutation rejection, editor terminal access, live socket revocation, concurrent owner creation/demotion, and last-owner protection.
- Root `npm run typecheck`: passed.
- Root `npm run build`: passed. Frontend Vite build reports a 2.29 MB Monaco chunk (594 KB gzip); it is lazy-loaded and excluded from the initial authentication route, but remains a bundle-size optimization target.
- `npm audit --prefix backend --omit=dev`: 0 vulnerabilities.
- `npm audit --prefix frontend`: 0 vulnerabilities.
- `git diff --check`: clean.
- Playwright local browser QA: login and registration routes loaded; email/password fields and three registration fields found; mobile viewport has no horizontal overflow; zero page errors or console errors.

### Remaining gaps
- A true two-independent-browser-profile end-to-end collaboration run remains outstanding; the 16-test collaboration smoke suite validates multi-client WebSocket behavior but is not a complete browser UX test.
- Cross-replica WebSocket revocation with two live backend replicas remains outstanding; Redis cross-process pub/sub was verified separately.
- The Railway account currently has no Collab IDE project, and the configured Railway API domain returns `Application not found`.
- The Vercel SPA rewrite is present locally but has not been deployed. Hosted auth/collaboration remain unverified.
- Local `main` is five commits ahead of `origin/main`. Do not push until exposed historical credentials are rotated and the user explicitly approves rewriting public Git history.
- No secrets were printed or copied into this QA record.
