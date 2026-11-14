# Security Model and Trust Boundaries

This document records the security assumptions contributors and self-hosters must understand. It is not a certification, penetration-test report, or guarantee that arbitrary code execution is safe.

## Assets to protect

- User credentials, access tokens, and refresh tokens.
- Workspace source files and collaboration state.
- Session invitations and membership assignments.
- Terminal input/output and executed code.
- Recording events, which may contain source code and terminal activity.
- PostgreSQL, Redis, Docker daemon, and deployment secrets.

## Trust boundaries

| Boundary | Trust assumption | Required control |
| --- | --- | --- |
| Browser to HTTP API | Browser input is untrusted | Validate inputs, authenticate requests, authorize every protected operation |
| Browser to Yjs WebSocket | WebSocket clients may be modified or scripted | Authenticate the connection and enforce session membership/role server-side |
| Browser to terminal WebSocket | Terminal access is privileged | Require authenticated OWNER/EDITOR authorization; revoke active access after role changes |
| Session member to session | A user's role can differ between sessions | Resolve `SessionMember` for each session-scoped action |
| Backend to PostgreSQL/Redis | Infrastructure credentials are privileged | Private networking, strong credentials, TLS where supported, least privilege |
| Backend to Docker daemon | Docker control is highly privileged | Treat Docker host access as a critical trust boundary; isolate the host and restrict who can reach the backend |
| Executor to external network | Package install may require egress | Network disabled by default; enabling it is a broad outbound-access trade-off |

## Authorization model

The Prisma schema contains platform-level `User.role` and session-level `SessionMember.role`. Session-scoped permissions must use the membership record for the target session. Do not infer workspace ownership from a platform role or from client-provided state.

Current documented roles:

| Capability | OWNER | EDITOR | VIEWER |
| --- | --- | --- | --- |
| Read and collaborate | Yes | Yes | Yes |
| Edit files | Yes | Yes | No |
| Run code / terminal | Yes | Yes | No |
| Manage members and invitations | Yes | No | No |
| Manage recording | Yes | No | No |
| Change workspace network setting | Yes | No | No |

The backend remains authoritative even when the frontend disables controls.

## Docker execution risks

Running untrusted code is inherently high risk. Containerization reduces exposure but does not make a shared host equivalent to a hardened multi-tenant sandbox.

Before enabling execution on a public service, review at minimum:

- Whether the backend process has access to the Docker socket and what that implies for host compromise.
- Container user, Linux capabilities, seccomp/AppArmor profile, filesystem mounts, PID limits, memory/CPU limits, and process cleanup.
- Whether executor containers can reach internal services, cloud metadata endpoints, or other tenants.
- Image provenance, patch cadence, and image digest pinning.
- Workspace data cleanup and isolation between sessions.
- Whether a separate VM/microVM or dedicated execution worker is required for the expected threat model.

Network access is off by default. When enabled, the current documented behavior is general outbound connectivity, not an allowlist for package registries. Do not describe it as restricted egress.

## WebSocket and logging considerations

WebSocket handshakes must be authenticated and authorized. Some clients pass credentials in connection query parameters; if so, reverse proxies, access logs, tracing systems, and error reports must redact those query strings. Never log access tokens, refresh tokens, invite tokens, passwords, or raw terminal contents.

Use TLS for public HTTP and WebSocket traffic. Configure reverse proxies to support WebSocket upgrades and long-lived connections without exposing internal service ports.

## Secrets and configuration

- Use unique, high-entropy access and refresh JWT secrets; never reuse them.
- Keep production secrets in the hosting provider's secret manager.
- Do not commit `.env` files, database dumps, credential-bearing logs, or private QA data.
- Rotate secrets immediately if they are exposed.
- Keep PostgreSQL, Redis, Docker sockets, and backend diagnostic ports private.
- Restrict CORS to exact trusted frontend origins.

## Recording data and privacy

Recordings can contain source code, terminal commands, terminal output, and collaboration metadata. Operators should define retention, access, backup, and deletion policies before enabling recordings for real users. Do not use production recordings as test fixtures.

## Vulnerability reporting

Follow the repository's [SECURITY.md](../SECURITY.md). Do not publish exploit details or user data in public issues.

## Security review checklist for changes

- [ ] Every protected HTTP route authenticates and authorizes on the server.
- [ ] Every protected WebSocket path authenticates and authorizes on connect and on sensitive messages.
- [ ] Role changes revoke or re-evaluate existing privileged connections.
- [ ] Inputs and identifiers are validated; errors do not expose secrets.
- [ ] Logs and telemetry redact credentials and sensitive terminal/document payloads.
- [ ] Tests cover both allowed and denied roles.
- [ ] Docker and network changes include an explicit threat-model review.
- [ ] Environment examples contain placeholders only.
