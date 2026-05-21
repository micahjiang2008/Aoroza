import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  build: {
    target: ["es2021", "chrome105", "safari14"],
    minify: "esbuild",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("beautiful-mermaid") || id.includes("mermaid")) {
              return "mermaid";
            }
            if (id.includes("katex")) {
              return "katex";
            }
            if (id.includes("highlight.js") || id.includes("lowlight")) {
              return "highlight";
            }
          }
        },
      },
    },
  },
}));
