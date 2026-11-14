# Contributing

Thanks for helping improve Collab IDE. This guide describes the expected workflow for contributions.

## Before you start

- Read the project overview and setup instructions in [README.md](README.md).
- Check existing issues and pull requests before starting substantial work.
- For large changes, open an issue first so the behavior and scope can be discussed.
- Keep pull requests focused. Separate unrelated refactors, features, and documentation changes.

## Development setup

Requirements:

- Node.js 20 or newer
- npm
- Docker for the database/cache and integration tests
- PostgreSQL and Redis (the supplied Docker Compose configuration can provide both)

Follow the development setup in the README. Copy the relevant `.env.example` files and use local-only credentials. Never commit `.env` files, tokens, passwords, database dumps, or production data.

Install dependencies:

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
```

## Checks before opening a pull request

Run the checks relevant to your change:

```bash
npm test
npm run typecheck
npm run build
```

For backend, database, collaboration, permissions, or execution changes, also run the integration suites against a disposable local/test environment:

```bash
npm run smoke:local
npm run smoke:collaboration
```

These smoke tests create temporary accounts, sessions, files, and Docker workspaces. Do not run them against production data.

If you change environment variables, Docker services, routes, permissions, or deployment behavior, update the corresponding examples and documentation.

## Pull request expectations

A useful pull request should:

1. Explain the problem and the behavior being changed.
2. Describe the implementation and important trade-offs.
3. Include screenshots or a short recording for visible UI changes.
4. List the commands/tests run and their results.
5. Call out database migrations, environment changes, deployment steps, or breaking changes.
6. Avoid unrelated formatting churn and generated files.

Use a descriptive title. Conventional prefixes such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, and `chore:` are encouraged.

## Code and security guidelines

- Keep TypeScript types explicit at API and domain boundaries.
- Validate and authorize requests on the backend. Frontend visibility is not an access-control boundary.
- Treat workspace file paths, terminal input, invite tokens, and persisted content as untrusted input.
- Preserve the execution sandbox's resource limits and default-deny network behavior.
- Do not log access tokens, refresh tokens, passwords, secrets, or sensitive user content.
- Add regression tests for bug fixes and security-sensitive behavior.
- Prefer small, reviewable dependencies; explain new runtime dependencies in the pull request.

## Reporting vulnerabilities

Do not open a public issue for a security vulnerability. Follow [SECURITY.md](SECURITY.md).
