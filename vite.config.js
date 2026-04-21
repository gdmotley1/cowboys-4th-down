import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from /<repo>/, so the base path needs to match.
export default defineConfig({
  base: "/cowboys-4th-down/",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
