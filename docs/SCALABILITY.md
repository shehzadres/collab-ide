# Scalability and Performance Notes

This document distinguishes what the current architecture supports from what would require additional infrastructure.

## Current scaling model

- The frontend is a static Vite application and can be served through a CDN.
- The backend is a Node.js service exposing HTTP and WebSocket endpoints.
- PostgreSQL stores durable users, memberships, invitations, files, workspace metadata, and recording events.
- Redis supports cross-process collaboration coordination.
- Docker execution currently assumes a Docker daemon reachable by the backend.

Redis can help multiple backend processes coordinate collaboration state. It does not distribute or schedule executor containers across machines.

## Known scaling boundary: execution

A backend replica must be able to find and interact with the container associated with a session. If replicas point to different Docker daemons, a session's container may not be available to the replica receiving a later request.

Before horizontally scaling execution, introduce an explicit execution control plane, for example:

- A workspace-to-worker registry.
- A worker service that owns container lifecycle.
- A durable job/request protocol.
- Health checks and worker draining.
- Per-tenant concurrency and resource quotas.
- Cleanup of orphaned containers and stale workspace records.

Do not treat sticky sessions as a complete solution: they do not solve worker failure or container ownership after a deployment.

## Performance measurements to collect

Avoid publishing guessed throughput or latency claims. Establish a reproducible baseline with:

| Area | Measurement |
| --- | --- |
| HTTP API | p50/p95/p99 latency, request rate, error rate |
| Yjs | update propagation latency, reconnect time, active documents |
| WebSockets | concurrent connections, disconnect rate, memory per connection |
| PostgreSQL | query latency, pool saturation, slow queries |
| Redis | command latency, memory, reconnects, pub/sub delivery |
| Terminal | container startup time, command latency, active processes |
| Recording | event write throughput, buffer depth, flush duration |
| Frontend | initial JS transfer, route chunk size, editor load time, Web Vitals |

Every benchmark should record commit SHA, environment, machine size, test duration, workload shape, warm-up period, and raw output.

## Recommended load-test progression

1. Establish a single-user baseline.
2. Increase concurrent read-only viewers.
3. Increase simultaneous editors on one document.
4. Test multiple sessions with a realistic user distribution.
5. Test reconnect storms after a backend restart.
6. Test Redis interruption and recovery.
7. Test database connection pressure.
8. Test terminal concurrency separately from collaboration.
9. Test recording volume and replay duration.
10. Repeat with two or more backend processes and verify both collaboration and execution routing.

Keep execution load tests isolated from production. Running untrusted commands under load can exhaust host resources.

## Operational safeguards

- Configure database connection pooling and monitor saturation.
- Set explicit request, WebSocket, and terminal timeouts.
- Apply per-user/session concurrency limits.
- Monitor Redis memory and connection health.
- Alert on stale workspace containers and failed cleanup.
- Back up PostgreSQL and regularly test restoration.
- Use graceful shutdown and connection draining during deployments.

## Instrumentation roadmap

A practical next step is structured logs with request/session correlation IDs, followed by OpenTelemetry traces and metrics. Never use raw tokens, source text, terminal input, or invitation tokens as metric labels or log fields.
