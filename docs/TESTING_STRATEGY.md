# Testing Strategy

The goal of this guide is to make test evidence repeatable and to prevent local, CI, and production results from being conflated.

## Test layers

| Layer | What it should prove | Current repository entry point |
| --- | --- | --- |
| Backend unit tests | Isolated backend behavior | `npm test` |
| Type checking | TypeScript contracts compile | `npm run typecheck` |
| Production builds | Backend and frontend compile for deployment | `npm run build` |
| Runtime smoke | Auth, runtime execution, terminal, cleanup | `npm run smoke:local` |
| Collaboration integration | Invitations, roles, Yjs, recording, revocation | `npm run smoke:collaboration` |
| Browser acceptance | Real UI flows through the deployed frontend shell | `npx playwright test` (Chromium) |
| Multi-process acceptance | Redis coordination across backend processes | Dedicated local acceptance setup |
| Hosted production acceptance | Deployed registration, invites, editing, persistence | Must be explicitly run against the deployed environment |

## Safe local setup

The smoke suites create temporary users, sessions, files, and execution workspaces. Use only a disposable local/test database and a test backend.

Never point destructive or data-creating smoke tests at production unless the test plan explicitly uses isolated test accounts and the user has approved the run.

Install dependencies and run static checks:

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm test
npm run typecheck
npm run build
```

Run integration suites only after the full local Docker Compose environment, PostgreSQL, Redis, and executor images are available:

```bash
npm run smoke:local
npm run smoke:collaboration
```

## CI workflow

The current GitHub Actions workflow runs:

1. Install root, backend, and frontend dependencies.
2. Audit backend and frontend dependencies.
3. Run backend unit tests.
4. Typecheck and build both applications.
5. Start the Docker Compose stack.
6. Wait for backend health.
7. Run runtime and collaboration smoke suites.
8. Run the Chromium registration-to-workspace acceptance test and upload its report, screenshots, trace, and video artifacts.\n9. Stop the stack and remove CI volumes even when earlier steps fail.

The CI workflow provides backend/infrastructure integration coverage plus one Chromium UI acceptance path: registration, session overview, and workspace creation as OWNER. A passing run proves only that path. It does not yet prove invitation redemption or two independent browser windows collaborating through the actual UI. The backend collaboration smoke suite separately verifies Yjs synchronization, role enforcement, invite lifecycle, and recording/replay at the service/WebSocket layer.

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
- Each supported runtime starts and executes a small deterministic command.
- Workspace reset and cleanup are correct.
- Viewer terminal access is rejected.
- Network access defaults to disabled.
- Resource limits and process cleanup are verified.

### Recording
- Initial snapshot and incremental events are captured.
- Replay reconstructs expected document content.
- Graceful shutdown flushes pending recording events.

## Reporting improvements to implement

The next testing improvements should be evidence-producing, not just more green checkmarks:

- Add a Playwright suite for registration, workspace creation, invitation redemption, two-user editing, and persistence.
- Upload JUnit/HTML test reports as CI artifacts.
- Publish coverage summaries with explicit scope and thresholds.
- Save browser screenshots and traces on failure.
- Add a separate multi-process Redis test job if CI capacity permits.
- Keep production acceptance results in a dated QA record, with test environment and commit SHA.

## Evidence language

Use precise labels:

- **Unit passed:** a named unit test command completed successfully.
- **Integration passed:** the relevant service stack and integration suite completed successfully.
- **Browser E2E passed:** an automated or documented browser scenario completed against the stated environment.
- **Production verified:** the exact scenario was run against the deployed URL and commit.
- **Not tested:** no evidence exists yet.

A successful local test is not production verification. A health endpoint is not proof that registration, collaboration, or execution works end to end.
