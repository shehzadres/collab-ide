/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_YJS_WS_URL: string;
  readonly VITE_TERMINAL_WS_URL: string;
  /** Set to "true" on free-tier deployments to hide Docker-dependent UI. */
  readonly VITE_DEMO_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
