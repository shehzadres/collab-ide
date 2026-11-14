# Security Policy

## Supported versions

Security fixes are applied to the current default branch. If you are using an older commit or a fork, update to the latest maintained revision before reporting an issue.

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities in public issues, discussions, pull requests, or screenshots.

Use GitHub's **Report a vulnerability** action on this repository to submit a private report through GitHub Security Advisories, if private vulnerability reporting is enabled. Include:

- A clear description of the affected component and impact.
- The commit, release, or deployment you tested.
- Reproduction steps or a proof of concept that does not expose real user data.
- Any suggested mitigation.

If private vulnerability reporting is unavailable, contact the repository maintainer through the private contact channel listed on the maintainer's GitHub profile. Do not include secrets or personal data in the initial report.

Please allow reasonable time for triage and a fix before public disclosure. Do not access, modify, or delete data belonging to other users while validating a report.

## Security expectations for self-hosters

- Generate unique, high-entropy JWT access and refresh secrets. Keep them different.
- Use strong database credentials and TLS for external database/cache connections.
- Keep `.env` files and backups out of Git.
- Do not expose PostgreSQL, Redis, Docker sockets, or backend diagnostic ports publicly.
- Run the backend with only the Docker permissions it requires.
- Keep executor images and dependencies patched.
- Treat enabling workspace network access as a security-sensitive action; it grants broader outbound connectivity, not a registry-only allowlist.
- Use HTTPS/WSS and restrict CORS to trusted frontend origins.
- Back up PostgreSQL and test restoration procedures.

The project is provided under the MIT License without warranty. Self-hosters are responsible for reviewing and operating the deployment in accordance with their own security requirements.
