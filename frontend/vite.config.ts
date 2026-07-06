import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    proxy: {
      // All REST API calls proxied same-origin — eliminates SameSite=Lax
      // cross-origin POST restriction that prevents refresh cookies being sent.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      // Yjs WebSocket
      "/ws": {
        target: "ws://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
      // Terminal WebSocket
      "/terminal": {
        target: "ws://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
