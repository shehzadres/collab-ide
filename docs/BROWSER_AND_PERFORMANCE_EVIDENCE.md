# Browser acceptance and performance evidence

## Browser end-to-end test

The Playwright smoke test covers one deterministic path:

1. Register a disposable user.
2. Confirm the authenticated session overview loads.
3. Create a named workspace using the blank template.
4. Confirm the workspace shell, Members control, and OWNER role render.
5. Fail on uncaught browser page errors.

Run locally after starting the complete Docker Compose stack:

    npm install --no-save --no-package-lock @playwright/test
    npx playwright install chromium
    npx playwright test

The CI workflow installs the test runner and Chromium on its ephemeral runner. CI uploads the Playwright HTML report, traces, screenshots, and video evidence even when a browser test fails. This test does not claim multi-browser CRDT correctness; the backend collaboration smoke test covers the server-side Yjs and authorization behavior it explicitly exercises.

## Recruiter-ready product visuals

Capture these views at 1440×900 or larger from a real deployment or local stack with demo data:

- sessions-overview.png: overview screen with the session form visible.
- workspace-owner.png: editor shell with file tree, editor, terminal, role, and member controls visible.
- two-browser-collaboration.gif: two independent browser contexts editing the same file, with synchronized text or cursors visible.

Do not include real email addresses, tokens, private source code, production workspace names, or user data. Keep screenshots unaltered except for cropping/redaction. The CI browser test produces the first two screenshots as workflow artifacts. The two-browser GIF must be captured from a real two-client session, not fabricated from static frames.

## Low-volume HTTP latency sampling

The built-in script measures sequential response time for one HTTP endpoint. It is a basic health-route baseline, not a capacity test or a measure of concurrent users, database throughput, WebSocket latency, or editor synchronization.

Local example:

    PERF_BASE_URL=http://127.0.0.1:4000 PERF_PATH=/health PERF_SAMPLES=30 node scripts/measure-http.mjs

For an authorized production health endpoint:

    PERF_BASE_URL=https://YOUR-BACKEND-HOST PERF_PATH=/health PERF_SAMPLES=30 node scripts/measure-http.mjs

Run a few samples at different times and report the target, date, region/network, sample count, and p50/p95. Do not run aggressive loops against a free-tier production service. Capacity testing belongs in an isolated staging environment with a controlled load plan.

## Evidence boundaries

- A passing browser smoke test proves the tested registration-to-workspace path only.
- The collaboration smoke test proves only the server-side Yjs/role/terminal behaviors it explicitly exercises.
- A health endpoint timing is not an application benchmark.
- Production screenshots and a two-browser recording must come from a real session.
