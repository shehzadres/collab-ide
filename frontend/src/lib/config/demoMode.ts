/**
 * demoMode — single source of truth for whether the app is running in
 * hosted-demo mode, where Docker execution is unavailable.
 *
 * Affected features when true:
 *   • Terminal panel hidden
 *   • Run button hidden
 *   • Install packages button hidden
 *   • Workspace settings panel shows an informational notice instead of
 *     runtime / network / reset controls
 *
 * Everything else — auth, Yjs collaboration, replay, permissions, file
 * explorer, notifications, themes, command palette — is unaffected.
 *
 * To restore full functionality: set VITE_DEMO_MODE=false (or remove it)
 * and redeploy. No code changes required.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
