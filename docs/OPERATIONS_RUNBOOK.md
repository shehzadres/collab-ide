# Operations and Troubleshooting Runbook

This guide describes operational checks for a self-hosted or deployed Collab IDE instance. Use deployment-provider logs and metrics alongside these steps. Never paste secrets, cookies, JWTs, invitation tokens, or full environment files into an issue.

## Service lifecycle

The backend process creates an HTTP server, attaches the WebSocket servers, starts the workspace reaper, and uses application utilities for database and Redis access.

The backend shutdown handler attempts to stop the workspace reaper, close the HTTP server, flush and stop the recording buffer, disconnect Prisma, and disconnect Redis. This is best-effort graceful shutdown. Confirm actual behavior against the process manager and deployment platform.

## First-response checklist

1. Record the UTC timestamp, deployment ID, commit SHA, and affected URL.
2. Check frontend and backend deployment status independently.
3. Request the backend health endpoint.
4. Inspect backend logs around the same timestamp.
5. Check database and Redis connectivity using provider health tools.
6. Check browser console and network requests from a fresh session.
7. Compare deployed environment variable names with the relevant example files without exposing values.
8. Check whether demo mode is enabled before treating unavailable terminal functionality as a defect.

Collect logs before repeatedly restarting services. Repeated restarts can destroy useful evidence.

## Common symptoms

### Frontend loads, but API requests fail

- Confirm the frontend API base URL points to the intended backend.
- Confirm the backend allows the exact deployed frontend origin.
- Inspect CORS preflight responses.
- Check backend health and deployed commit.
- Verify cookie and credential settings in the browser network panel.

### Login or authenticated WebSocket requests fail

- Confirm frontend and backend use the intended authentication flow.
- Check cookie domain, path, Secure, and SameSite settings where cookies are used.
- Verify the reverse proxy supports WebSocket upgrades.
- Check token expiry and server-side authentication logs.
- Never place raw tokens in screenshots or issue reports.

### Collaboration stops updating

- Confirm both clients joined the same workspace and document.
- Inspect WebSocket upgrade status and close codes.
- Check backend logs for authentication or authorization rejections.
- Verify Redis availability and that all replicas use the intended Redis instance.
- Test with two independent browser profiles to avoid accidentally sharing one login session.

### Terminal is unavailable

- Check whether demo mode is enabled. In demo mode, terminal and container-dependent controls are intentionally unavailable.
- If execution is enabled, inspect runtime image availability, Docker daemon access, container startup failures, and workspace cleanup logs.
- Verify resource limits and runtime permissions.
- Do not weaken container isolation or expose the Docker socket publicly as a quick fix.

### Recording or replay is incomplete

- Inspect recording-buffer errors and database write failures.
- Check whether the process was terminated before graceful shutdown completed.
- Verify recording ownership and authorization.
- Reproduce with a disposable workspace before attempting data repair.

## Deployment and rollback procedure

1. Identify the last known healthy deployment and its commit SHA.
2. Review the new deployment's build output and runtime logs.
3. Verify required environment variables are present by name, not by copying their values.
4. Check whether the release includes database migrations.
5. Confirm migration compatibility with the currently deployed application version.
6. Deploy to the intended environment.
7. Run health, authentication, and two-browser collaboration checks in PRODUCTION_ACCEPTANCE.md.
8. If critical behavior regresses, roll back to the last known healthy application deployment using the hosting provider's supported mechanism.
9. Treat database migrations separately. An application rollback does not automatically reverse a schema migration.
10. Record the incident, affected commit, symptoms, mitigation, and follow-up action.

## Minimum monitoring recommendations

| Signal | Why it matters |
|---|---|
| HTTP request rate, latency, and status codes | Detect API degradation |
| WebSocket active connections and close codes | Detect collaboration failures |
| Redis connection state and operation latency | Detect cross-instance synchronization issues |
| Database connection pool and query latency | Detect persistence bottlenecks |
| Active workspaces and runtime/container count | Detect resource growth |
| Recording buffer flush failures | Detect possible recording loss |
| Workspace reaper activity and failures | Detect stale runtime accumulation |
| Process restarts and memory usage | Detect instability |

Use structured logs with a request or correlation ID where possible. Avoid logging document contents, source code, passwords, access tokens, invite secrets, or other user data.

## Backup and recovery

Before production use, define and test:

- Database backup frequency and retention.
- Point-in-time recovery availability.
- Restore procedure into an isolated environment.
- Redis persistence expectations, if any.
- Which data is authoritative in the database versus transient in Redis.
- Recovery time and recovery point objectives.

A backup that has never been restored is merely an optimistic file.