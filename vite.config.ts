import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api/applications": "http://localhost:8080",
      "/api/documents": "http://localhost:8080",
      "/api/copilot": "http://localhost:8080",
      "/api/auth": "http://localhost:8080",
      "/oauth2": "http://localhost:8080",
      "/login": "http://localhost:8080",
      "/api": "http://localhost:8787"
    }
  }
});
