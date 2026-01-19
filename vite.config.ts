import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { OutputBundle, OutputOptions } from "rollup";

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
    {
      name: "inline-css",
      apply: "build",
      enforce: "post",
      generateBundle(_: OutputOptions, bundle: OutputBundle) {
        const cssFile = Object.keys(bundle).find((key) => key.endsWith(".css"));
        const htmlFile = bundle["index.html"];

        if (cssFile && htmlFile && htmlFile.type === "asset") {
          const cssPacket = bundle[cssFile];
          if (cssPacket.type !== "asset") return;

          const cssContent = cssPacket.source;
          const htmlSource = htmlFile.source as string;
          
          // Inject style tag before closing head
          const newHtml = htmlSource.replace(
            "</head>",
            `<style>${cssContent}</style></head>`
          );
          
          // Remove the link tag that Vite added
          const cssFileName = cssPacket.fileName;
          // Regex to match the link tag for this specific CSS file
          // e.g. <link rel="stylesheet" crossorigin href="/assets/index-DqY5sGHw.css">
          const linkTagRegex = new RegExp(
            `<link[^>]*?href="[^"]*?${cssFileName}"[^>]*?>`
          );
          
          htmlFile.source = newHtml.replace(linkTagRegex, "");

          // IMPORTANT: keep the CSS file in the bundle so that Vite's
          // runtime can still preload `/assets/index-*.css` for
          // dynamically imported chunks (e.g. ContactModal) on Safari.
          // We no longer delete `bundle[cssFile]` here.
        }
      },
    },
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
  test: {
    environment: "jsdom",
  },
});
