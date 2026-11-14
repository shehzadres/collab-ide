# Testing Strategy

The goal is to make test evidence repeatable and to prevent local, CI, and production results from being conflated.

## Test layers

| Layer | What it proves | Entry point |
| --- | --- | --- |
| Backend unit | Isolated backend behavior | `npm test` |
| Type checking and builds | Both applications compile | `npm run typecheck`, `npm run build` |
| Runtime integration | Registration, execution runtimes, terminal, cleanup | `npm run smoke:local` |
| Collaboration integration | Roles, invites, Yjs sync, recording, revocation | `npm run smoke:collaboration` |
| Browser acceptance | Registration, sessions overview, OWNER workspace creation | `npx playwright test` (Chromium) |
| Multi-process acceptance | Redis coordination across backend processes | Dedicated local acceptance setup |
| Hosted production acceptance | Registration, invites, editing, persistence on deployed URLs | Must be explicitly run against production |

## Safe local setup

The smoke suites create temporary users, sessions, files, and execution workspaces. Use only a disposable local/test database and backend. Never point data-creating smoke tests at production data.

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm test
npm run typecheck
npm run build
```

Run integration suites only after PostgreSQL, Redis, Docker, and all executor images are available:

```bash
npm run smoke:local
npm run smoke:collaboration
```

## CI workflow

The GitHub Actions workflow:

1. Installs root, backend, and frontend dependencies.
2. Audits backend and frontend dependencies.
3. Runs backend unit tests, typechecks, and production builds.
4. Starts the Docker Compose stack and waits for backend health.
5. Runs runtime and collaboration integration smoke suites.
6. Runs a Chromium registration-to-workspace browser acceptance test.
7. Uploads Playwright HTML, screenshots, traces, and video artifacts, including on failure.
8. Stops the stack and removes CI volumes even when earlier steps fail.

A passing browser test proves only registration, the session overview, and workspace creation as OWNER. It does not yet prove invitation redemption or two independent browser windows collaborating through the UI. The backend collaboration suite separately verifies Yjs synchronization, role enforcement, invite lifecycle, and recording/replay at the service/WebSocket layer.

## Required regression areas

### Authentication and sessions
- Registration and login success/failure.
- Password handling and response sanitization.
- Session membership and invitation boundaries.
- Logout and token invalidation behavior.

### Collaboration
- Two independent clients converge after concurrent edits.
- Reconnect receives the latest document state.
- Viewer writes are rejected server-side.
- Role changes revoke active privileged sockets.
- Redis-backed collaboration works across separate backend processes.

### Execution
- Each supported runtime starts and executes a deterministic command.
- Workspace reset and cleanup are correct.
- Viewer terminal access is rejected.
- Network access defaults to disabled.
- Resource limits and process cleanup are verified.

### Recording
- Initial snapshot and incremental events are captured.
- Replay reconstructs expected document content.
- Graceful shutdown flushes pending recording events.

## Remaining quality improvements

- Extend Playwright to invitation redemption, two-user editing, and persistence through independent browser contexts.
- Add frontend component/unit tests for high-risk state and permission behavior.
- Establish coverage reporting and thresholds from a measured baseline.
- Add axe-based accessibility checks for authentication, sessions, invitations, and workspace screens, followed by manual keyboard/reflow review.
- Measure Yjs propagation and reconnect behavior in a controlled local/staging environment; do not treat health-route timing as collaboration performance.
- Keep a dated QA record with commit SHA, workflow run, test layers, pass/fail counts, environment, and artifact links.

## Evidence language

- **Unit passed:** the named unit test command completed successfully.
- **Integration passed:** the relevant service stack and integration suite completed successfully.
- **Browser E2E passed:** the exact browser scenario completed in the stated environment.
- **Production verified:** the exact scenario was run against the deployed URL and commit.
- **Not tested:** no evidence exists yet.

A successful local test is not production verification. A health endpoint is not proof that registration, collaboration, or execution works end to end.