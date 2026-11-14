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


## Security remediation update (2026-11-14)

- Located the exposed PostgreSQL connection in historical example configuration. The hostname resolved to the user's Neon `collab-ide` project and its archived production branch.
- Reset the Neon PostgreSQL owner-role password. The rotated value was withheld from chat and was not added to the repository.
- Generated new JWT access/refresh secrets and updated both local environment files. Recreated the backend container using the new root environment values.
- Verified backend health (HTTP 200) and reran `npm run smoke:local`: registration, profile, Node/Python/Go/Shell execution, workspace resets, authenticated terminal WebSocket, logout, and cleanup all passed.
- Vercel frontend environment inspection showed only frontend URLs and demo mode. Connected Railway account contains no Collab IDE backend project, so there were no hosted backend secrets available to rotate there.
- Rewrote local reachable Git history with `git filter-repo`. A targeted audit checked all 13 historical credential strings: zero remained in reachable history, and the leaked Neon hostname was absent.
- Public GitHub history has not yet been force-pushed. The push is the remaining security-remediation step; it must use an exact force-with-lease expectation against the remote SHA recorded in `PHASE_STATUS.md`.
- Keep the private pre-cleanup Git bundle off GitHub and out of shared folders. Anyone with an old clone should reclone after publication.


## Public history cleanup published (2026-11-14)

- Completed the atomic force-with-lease update of GitHub `main`, `demo`, and `v1.0.0` after rewriting the local history.
- Verified remote refs: `main` points to `4e5d1df6cf59ec509b461178bbecf50b1c3a72da`, `demo` points to the cleaned `674a88c` history, and `v1.0.0` points to the rewritten tag object.
- The 13 exact historical credential strings checked by the local audit had zero matches in reachable rewritten history; the exposed Neon hostname was also absent.
- GitHub Actions CI started on the rewritten main commit. Its result is still pending at the time of this note.
- Old clones/forks and cached GitHub commit views are outside the rewritten branch/tag refs. Reclone old working copies; contact GitHub Support if cached old commit pages remain accessible.


## Continued phase work (2026-11-14)

### CI and engineering quality
- GitHub Actions run for commit `1f754af2557f33ef7909e58a889cd75a4089db55` completed successfully. All 20 job steps, including Docker Compose startup, backend health, local integration smoke, and multi-user collaboration/authorization tests, passed.
- Current uncommitted frontend changes lazy-load route components, add an accessible route loading fallback, copy Monaco AMD loader assets into `dist/monaco/vs`, and split Monaco/collaboration/terminal/React vendor chunks.
- Local root typecheck and production build passed with those changes. Monaco loader asset exists in production dist. Initial app JS is approximately 79 KB (30 KB gzip); Monaco is approximately 2.30 MB (598 KB gzip) but remains lazy-loaded.
- Production preview QA passed direct `/login` and `/register` routes, expected form fields, no initial Monaco request on login, and Monaco mounting with zero failed network requests or page errors.

### Functional acceptance follow-up
- Found local test-environment CORS rejection: Docker backend initially allowed only `http://localhost`, while the Playwright QA origin was `http://localhost:5176`. Updated the ignored local root `.env` allowlist and recreated the backend. Health check returned HTTP 200.
- A direct Yjs browser diagnostic confirmed WebSocket connection and sync state become true, with no browser errors or failed HTTP responses.
- Independent-user browser acceptance is still not passed. Several attempts were blocked by the configured registration rate limit or by test-harness session setup/Monaco focus. The collaboration smoke suite and CI remain green, but they are not a substitute for this browser acceptance test.
- File persistence/replay and two-live-backend-replica WebSocket revocation remain outstanding.

### Deployment readiness
- Rewrote `DEMO_DEPLOYMENT.md` to use the correct Railway backend host, `/api` REST base, `/ws` Yjs base, and `/terminal` WebSocket path, plus a post-deployment acceptance checklist.
- No new Neon, Upstash, or Railway resources were created. A fresh hosted database and Redis instance are required; do not claim hosted deployment readiness yet.


## Local infrastructure hardening (2026-11-14)

- Updated Docker Compose published ports for PostgreSQL, Redis, and backend to bind to `127.0.0.1` only.
- Updated both Nginx configuration copies to serve the SPA and reverse-proxy `/api`, `/ws`, and `/terminal` to the backend, including WebSocket upgrade headers and long-lived connection timeouts.
- Added gzip tuning and security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), plus immutable caching and explicit static asset 404 handling.
- Updated README local networking notes to describe same-origin proxying and loopback-only database/backend ports.
- Rebuilt Docker Compose successfully. PostgreSQL and Redis reported healthy; backend reported healthy; frontend started successfully.
- Verified frontend root, login, and registration routes return HTTP 200. Unauthenticated `/api/auth/me` through Nginx returns expected HTTP 401, proving the API proxy reaches the backend.
- Verified both Yjs and terminal WebSocket upgrades through the Nginx reverse proxy using a test owner token. Secret values were not printed.
- Local Docker single-replica stack is now using the hardened Nginx proxy path; no production hosting resources were provisioned.


## Monaco worker bootstrap verification (2026-11-14)

- Added a local worker URL override to the Monaco lazy-loader, pointing Monaco workers at the copied `/monaco/vs/base/worker/workerMain.js` asset.
- Rebuilt the frontend production bundle successfully.
- Ran a production-preview browser test using an existing local QA owner identity. Monaco mounted; worker URL was configured; workerMain and TypeScript worker assets returned HTTP 200; zero browser errors and zero failed requests.
- The worker-loader change was published in commit `3dde13a4dc1c9873ce1075697b8869a3eb8b1f57`; GitHub Actions and the subsequent `3bd0e8e` retest passed, and Vercel production deployment is READY.

## Latest completion checkpoint (2026-11-14)

- Production-style Docker/Nginx browser acceptance passed account registration, session creation, Node starter file, Monaco editor and worker startup, Yjs sync, terminal connection, and mobile layout. The run reported zero browser page errors and zero failed requests.
- The Monaco AMD worker bootstrap now uses an absolute same-origin worker URL. Production Vercel assets include the loader, workspace chunk, and workerMain asset; all returned HTTP 200.
- Local backend unit tests (4), local integration smoke, collaboration/authorization checks, and recording/replay regression checks passed after the Nginx and loopback-only port changes.
- Local frontend/backend builds and typechecks passed. Production dependency audits found zero vulnerabilities. Production Vercel assets: entry about 79 KB, React vendor about 181 KB, workspace page about 40.5 KB, and Monaco about 2.30 MB (deferred). Sizes are raw asset sizes.
- Temporary QA accounts (5), their 4 sessions, and the `ws-prod-smoke-*` Docker containers were cleaned up.
- GitHub Actions on `3dde13a` failed in `smoke:local`; the CI workflow now pins service/test URLs to `127.0.0.1` to match loopback-only Docker port bindings. The retest for `3bd0e8e` passed all steps, including both local runtime smoke and multi-user collaboration/authorization tests.
- Vercel frontend deployment for `c59d584` is READY and the public SPA/Monaco assets return HTTP 200. The hosted demo intentionally sets `VITE_DEMO_MODE=true`, so Docker-dependent execution is hidden.
- Hosted backend remains blocked: the configured Railway backend domain returns Railway's generic 404, and the connected Railway account has no Collab IDE project. Hosted auth/collaboration are not verified. The correct Railway workspace must be connected before backend recovery or redeployment.
- The two-browser UX, file persistence/replay, and WebSocket revocation across two live backend replicas were subsequently completed successfully; only the production backend deployment remains blocked.

## Final verification checkpoint (2026-11-14 10:52 UTC)

- Replay pipeline defect fixed in `c59d584`: snapshots are captured immediately, and actual Yjs document `updateV2` payloads are recorded instead of raw WebSocket protocol frames.
- Browser recording/replay test passed: a recorded editor change was reconstructed and displayed in the replay editor. The backend collaboration smoke test now includes a regression assertion for snapshot + update replay.
- Two independent browser contexts passed owner/editor invitation, live edit synchronization, and file persistence after reload.
- A separate two-backend-container test passed cross-replica Yjs synchronization through Redis, terminal and Yjs socket revocation after demotion, viewer reconnect, and continued read-only synchronization.
- Local runtime smoke passed all four runtimes and terminal checks. Four backend unit tests pass. Backend typecheck/build pass. Frontend build passed. Production dependency audits found zero vulnerabilities.
- GitHub Actions run `43587070241` for `c59d584` completed successfully, including audits, builds, Docker startup/health, runtime smoke, collaboration, and replay regression tests.
- Vercel production deployment for `c59d584` is READY. The public root, SPA deep route, Monaco loader, and Monaco worker assets return HTTP 200.
- Hosted backend remains blocked: `collab-ide-backend-production.up.railway.app` returns Railway's generic 404, and the connected Railway workspace has no Collab IDE backend service. Do not create resources in that unrelated workspace. Connect the correct Railway account/workspace to complete Phase 5.
