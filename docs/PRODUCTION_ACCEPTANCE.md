# Production Acceptance Checklist

This checklist separates local automated coverage from behavior that must be verified against a deployed environment. Passing local tests is not proof that production networking, cookies, reverse proxies, Redis, or browser behavior are correct.

## Test environment record

| Field | Value |
|---|---|
| Frontend URL | |
| Backend URL | |
| Backend deployment / commit | |
| Database environment | |
| Redis configuration | |
| Browser and version | |
| Test date (UTC) | |
| Tester | |

Never put passwords, access tokens, invite secrets, or private connection strings in this document or screenshots.

## 1. Availability and deployment

- [ ] Frontend loads over HTTPS.
- [ ] Backend health endpoint returns the documented healthy response.
- [ ] Frontend API requests reach the intended backend origin.
- [ ] CORS preflight succeeds for the production frontend origin.
- [ ] Browser console has no uncaught application errors on the primary flow.
- [ ] No unexpected 4xx/5xx responses occur during the primary flow.
- [ ] A deployment restart does not leave the service permanently unhealthy.

Record request URL, status, timestamp, and deployment identifier for failures. Redact cookies and authorization headers.

## 2. Authentication and workspace lifecycle

Use two independent browser profiles, not two tabs sharing the same session.

- [ ] User A can register or sign in.
- [ ] User A can create a workspace.
- [ ] User A can refresh and reopen the workspace.
- [ ] User B can authenticate independently.
- [ ] User A can create an invitation for User B.
- [ ] User B can redeem the invitation and join the intended workspace.
- [ ] Expired, exhausted, revoked, or malformed invitations are rejected.
- [ ] Signing out and back in produces the expected session behavior.

Use disposable test accounts and workspaces. Record identifiers in a private test log, not in this public repository.

## 3. Collaborative editing

With User A and User B connected to the same workspace:

- [ ] Both clients see the same file tree.
- [ ] User A edits a file and User B sees the change without refreshing.
- [ ] User B edits a different section while User A is typing.
- [ ] Concurrent edits converge to the same document state.
- [ ] Cursor and selection presence is visible when enabled.
- [ ] File creation, rename, move, and deletion synchronize as permitted.
- [ ] A newly opened third client receives the current document state.
- [ ] Disconnect one client, continue editing in the other, then reconnect.
- [ ] Reconnecting client converges without duplicating or losing committed content.
- [ ] Refresh both clients and verify persisted state.

Capture a short screen recording with test data only. Include both browser windows and a visible timestamp.

## 4. Authorization and security boundaries

Run each action as OWNER, EDITOR, and VIEWER. Verify at the API/WebSocket boundary, not only by checking whether a button is hidden.

| Action | OWNER | EDITOR | VIEWER |
|---|---:|---:|---:|
| Read workspace content | Verify | Verify | Verify |
| Edit shared files | Verify | Verify | Must be denied |
| Create or delete files | Verify | Verify | Must be denied |
| Invite or manage members | Verify policy | Verify policy | Must be denied unless explicitly granted |
| Start terminal execution | Verify policy | Verify policy | Must be denied unless explicitly granted |
| Access another workspace | Must be denied | Must be denied | Must be denied |

- [ ] Expired or invalid authentication is rejected.
- [ ] A user cannot access a workspace by changing its ID.
- [ ] A revoked member loses access on existing connections, not only after reconnect.
- [ ] Invitation secrets are not exposed in logs or analytics.
- [ ] Error responses do not disclose secrets, stack traces, or internal infrastructure details.

Expected permissions must match the current authorization policy. Update this table if the policy changes.

## 5. Terminal and execution runtime

Only test in a controlled environment with disposable workspaces and non-sensitive data.

- [ ] Hosted demo mode clearly communicates that execution is unavailable.
- [ ] When execution is enabled, each workspace receives the intended isolated runtime.
- [ ] Runtime image and language availability match published documentation.
- [ ] Unauthorized users cannot create, attach to, or control another user's terminal.
- [ ] Idle workspace cleanup behaves as configured.
- [ ] Container resource limits and execution timeouts are enforced.
- [ ] Container filesystem and process isolation are tested against the actual deployment host.
- [ ] Network access behavior is explicitly verified and documented.
- [ ] Runtime failures are surfaced without leaking host details.

Do not describe the runtime as a security boundary until host-level isolation, resource controls, privilege settings, and network policy have been independently reviewed.

## 6. Recording and replay

- [ ] Recording starts and stops according to the configured lifecycle.
- [ ] Collaborative edits are represented in the recording.
- [ ] Replay reconstructs the expected state at selected points.
- [ ] Recording survives a normal application restart.
- [ ] Shutdown flushes pending recording data.
- [ ] Unauthorized users cannot read another workspace's recordings.

## 7. Multi-instance and recovery checks

These checks require the production-like multi-replica configuration:

- [ ] Two clients connected to different backend replicas still synchronize.
- [ ] Redis connectivity loss produces observable errors and recovers cleanly.
- [ ] Database interruption does not silently acknowledge writes that were not persisted.
- [ ] Restarting one replica does not permanently disconnect healthy clients.
- [ ] Workspace cleanup does not remove active workspaces.
- [ ] A documented database backup can be restored into an isolated environment.

Do not claim horizontal scalability based solely on a successful single-replica deployment.

## 8. Evidence and sign-off

For every run, attach or link:

- [ ] Test report and exact commit SHA.
- [ ] Browser/version and environment record.
- [ ] Redacted browser console and network evidence for failures.
- [ ] Two-browser collaboration recording.
- [ ] Authorization matrix results.
- [ ] Runtime isolation results, if execution is enabled.
- [ ] Multi-replica results, if multiple replicas are deployed.
- [ ] Open defects with severity, reproduction steps, and owner.

### Result

| Area | Status | Evidence |
|---|---|---|
| Availability | Not run | |
| Authentication | Not run | |
| Collaboration | Not run | |
| Authorization | Not run | |
| Execution runtime | Not run | |
| Recording/replay | Not run | |
| Multi-instance recovery | Not run | |

Use only Pass, Fail, Blocked, or Not run. An untested item must not be reported as passed.