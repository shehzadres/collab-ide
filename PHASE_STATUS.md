# Collab IDE Completion Plan

Last verified: 2026-11-14
Repository: `shehzadres/collab-ide`
Local path: `C:\Users\Dell\Documents\collab-ide`

## Phase 1: Security remediation

**Status: IN PROGRESS - PUBLIC HISTORY PUSH PENDING**

- Identified the historical Neon database connection from the leaked PostgreSQL URL. It belongs to Neon project `collab-ide`, project ID `gentle-dream-93144955`, archived production branch `br-falling-sunset-ao3a8clw`.
- Reset the Neon `neondb_owner` PostgreSQL role password. The new value was not printed or added to chat.
- Generated new random `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values and updated both local `.env` and `backend/.env`.
- Recreated the local backend container with the new JWT values. Backend health returned HTTP 200, and the full local smoke suite passed afterward.
- Confirmed Vercel `collab-ide-frontend` contains frontend URL/demo variables only. No hosted backend secrets are configured there.
- Confirmed the connected Railway account has no Collab IDE project, so there is no Railway backend environment to rotate.
- Rewrote local Git history with `git filter-repo`. Audited all 13 historical credential strings: zero remain in reachable history. The leaked Neon host is also absent from reachable history.
- A private pre-cleanup Git bundle exists outside the repository for recovery only. Do not publish or share it.
- Remaining: force-push rewritten `main` to GitHub using an exact lease against the previously observed remote SHA, then verify the GitHub branch and CI result.

## Phase 2: Restore local infrastructure

**Status: COMPLETE for the local single-replica environment**

- PostgreSQL and Redis containers are healthy.
- Backend container is healthy; `/health` returns HTTP 200.
- Frontend container is running; `/` returns HTTP 200.
- Shell, Node, Python, and Go executor images are present.
- The full local smoke test successfully executed all four runtimes and the interactive terminal, including after JWT rotation.

## Phase 3: Functional verification

**Status: IN PROGRESS**

- Four backend runtime unit tests pass.
- Local smoke test passes registration, authentication, all four execution runtimes, terminal WebSocket, resets, logout, and cleanup.
- All 16 collaboration smoke checks pass, including owner/editor/viewer access, Yjs sync, invite constraints, concurrent membership operations, and live socket revocation.
- Playwright confirms login/register UI, expected fields, responsive mobile layout, and zero browser errors.
- Remaining: full two-independent-browser-profile UX acceptance, file persistence/replay acceptance, and actual WebSocket revocation across two live backend replicas.

## Phase 4: Engineering quality

**Status: IN PROGRESS**

- Root typecheck and production build pass.
- Backend and frontend npm audits report zero vulnerabilities.
- CI workflow covers installs, audits, unit tests, typecheck, build, Docker Compose integration, local smoke, and collaboration smoke.
- `git diff --check` is clean.
- Monaco is lazy-loaded, but its standalone chunk remains about 2.29 MB uncompressed / 594 KB gzip.
- Remaining: verify the latest CI workflow on GitHub after the history push, add a maintained browser E2E suite rather than relying only on local QA scripts, and complete the outstanding acceptance tests.

## Phase 5: Deployment and presentation

**Status: BLOCKED / INCOMPLETE**

- Vercel frontend project exists; the local SPA rewrite and latest code have not yet been deployed.
- The connected Railway account exposes no Collab IDE project. The configured old backend URL returns `Application not found`.
- Hosted authentication, invites, collaboration, and role revocation cannot be accepted until a backend service is restored or redeployed with new environment variables.
- Recruiter-facing public demo, fresh screenshots, and final presentation walkthrough remain pending.

## Current safe checkpoint

- Local branch: `main`; rewritten local HEAD begins `1e60d36`.
- The previously observed GitHub `main` SHA was `d87bb13ff4088d37f3cf5fa83cf403069690d0e7`; use this exact expected SHA for the force-with-lease push.
- Local `.env` files are ignored and must remain private.
- The pre-cleanup bundle is private recovery material and must never be uploaded.
- Do not reuse old clones containing the exposed history; reclone after the rewritten history is published.
