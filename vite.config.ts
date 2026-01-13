import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Base path is configurable for different deploy targets (prod, dev preview, local)
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // NOTE: The previous "inline-css" plugin has been removed because it
    // deleted the emitted CSS file Vite expects to preload for dynamic
    // imports (e.g., the lazy-loaded ContactModal). That caused Safari to
    // fail preloading `/assets/index-*.css` and reject the dynamic import,
    // so the modal never appeared.
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      treeshake: true,
    },
    modulePreload: false, // Performance optimization to reduce initial load blocking
  },
});
