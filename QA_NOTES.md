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
