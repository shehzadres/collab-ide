import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function copyMonacoAssets(): Plugin {
  return {
    name: "copy-monaco-assets",
    apply: "build",
    closeBundle() {
      const destination = resolve(process.cwd(), "dist/monaco/vs");
      mkdirSync(destination, { recursive: true });
      cpSync(resolve(process.cwd(), "node_modules/monaco-editor/min/vs"), destination, {
        recursive: true,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyMonacoAssets()],
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("monaco-editor") || id.includes("@monaco-editor")) return "monaco";
          if (id.includes("yjs") || id.includes("y-monaco") || id.includes("y-websocket") || id.includes("y-protocols") || id.includes("lib0")) return "collaboration";
          if (id.includes("@xterm")) return "terminal";
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("/react/") || id.includes("scheduler")) return "react-vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
      "/terminal": {
        target: "ws://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
