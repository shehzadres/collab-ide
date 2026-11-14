# Recruiter Showcase Guide

A recruiter should be able to understand the product and see its hardest engineering behavior without reading the entire codebase.

This guide defines the visual evidence to capture. It intentionally does not fabricate screenshots or claim a demo behavior that has not been recorded.

## Recommended README sequence

1. Hero screenshot showing the actual workspace.
2. One-sentence value proposition.
3. Live demo link and hosted-demo limitations.
4. Short collaboration GIF showing two independent users editing the same document.
5. Three to five feature screenshots.
6. Architecture diagram.
7. Technical highlights and measured test evidence.
8. Local setup and contribution links.

## Capture checklist

| Asset | What it must prove | Suggested filename |
| --- | --- | --- |
| Workspace hero | Editor, file explorer, terminal/workspace layout | `docs/screenshots/workspace.png` |
| Two-user editing | Same document visible in two independent browser contexts | `docs/screenshots/live-collaboration.gif` |
| Presence | Distinct collaborator cursors or presence indicators, if enabled in the current UI | `docs/screenshots/collaborator-presence.png` |
| Permissions | Owner/editor/viewer roles and denied viewer action | `docs/screenshots/permissions.png` |
| Recording replay | A recording timeline and reconstructed document state | `docs/screenshots/recording-replay.png` |
| Runtime support | Runtime selector and a successful local command per supported runtime | `docs/screenshots/runtime-execution.png` |

Capture the real running application. Do not create mock UI screenshots and present them as product evidence.

## Short demo script (60–90 seconds)

1. Open the deployed application and explain that hosted demo mode has execution features disabled.
2. Show the editor and file explorer.
3. In a local full-stack environment, open a second independent browser context and join through an invitation.
4. Edit the same file from both contexts and show the changes converging.
5. Demonstrate viewer read-only behavior.
6. Show recording and replay if the environment has recording enabled.
7. Close by showing the architecture diagram and test evidence.

For a public demo that cannot run Docker, use a separate local recording for terminal execution and label it clearly as local execution.

## Evidence captions

Use concise captions that state what the screenshot proves. Examples:

- "Two authenticated browser contexts editing the same Yjs document."
- "Viewer receives document updates but cannot modify the session."
- "Session replay reconstructs the final recorded editor state."

Avoid claims such as "zero latency", "unbreakable security", "unlimited scale", or "production-ready sandbox" unless independently measured and justified.

## README evidence block

When real assets are available, use relative paths so they render on GitHub:

```md
## Product walkthrough

![Collab IDE workspace](docs/screenshots/workspace.png)

![Two users editing the same document](docs/screenshots/live-collaboration.gif)
```

Keep screenshots compressed and legible. Prefer a small number of high-signal assets over a gallery of redundant screens.
