# Contributing to Collab IDE

Thanks for taking the time to contribute. This project is a full-stack
collaborative IDE (React/TypeScript frontend, Node/Express backend, Yjs CRDT
sync, Dockerized sandboxed execution) — see the [README](./README.md) for the
full architecture and local setup instructions.

## Getting set up

Follow [Local development](./README.md#local-development) in the README.
That covers cloning, environment variables, database migrations, building the
sandbox executor images, and running both apps.

## Before opening a PR

1. **Type-check both apps:**
   ```bash
   cd backend && npx tsc --noEmit
   cd ../frontend && npx tsc --noEmit
   ```
2. **Build both apps:**
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```
3. Keep changes scoped — prefer several small, reviewable PRs over one large
   one.
4. If you touch authentication, permissions, or the Yjs sync protocol, please
   describe the security implications in the PR description (these are the
   most sensitive parts of the codebase).
5. Match the existing design-token system in `frontend/src/index.css` and
   `frontend/tailwind.config.ts` (`bg`, `panel`, `ink`, `muted`, `accent`,
   `danger`, etc.) rather than raw Tailwind palette classes (`gray-900`,
   `blue-600`, ...) — this keeps the UI visually consistent across
   components.

## Reporting bugs

Open an issue with:
- Steps to reproduce
- What you expected vs. what happened
- Backend/frontend console output if relevant (redact tokens/secrets)
- Whether it reproduces with `docker compose` or only in manual local dev

## Reporting security issues

Please **do not** open a public issue for security vulnerabilities
(especially anything involving authentication, the Docker sandbox, or
permission enforcement). Instead, open a private security advisory on the
repository's Security tab, or contact a maintainer directly.

## Code style

There's no enforced linter configured yet (see `README.md` if you'd like to
add one). In the meantime:
- Match the formatting of surrounding code.
- Prefer explicit types over `any` in TypeScript.
- Keep comments to the "why", not the "what" — the code should already say
  what it does.
