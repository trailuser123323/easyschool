import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, ".."),
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  },
  build: {
    outDir: path.join(__dirname, "dist"),
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
