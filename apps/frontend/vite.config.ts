import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import pkg from "../../package.json";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@finplan/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0", // Listen on all interfaces for Docker
    hmr: {
      host: "localhost",
      clientPort: 3000,
    },
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://localhost:3001",
        changeOrigin: true,
      },
      "/ws": {
        target: (process.env.BACKEND_URL || "ws://localhost:3001").replace(/^http/, "ws"),
        ws: true,
      },
    },
  },
});
