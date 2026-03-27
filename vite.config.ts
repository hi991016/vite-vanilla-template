// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Fix __dirname cho ESM
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const pages: Record<string, string> = {
  main: resolve(__dirname, "index.html"),
};

readdirSync(__dirname, { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() && !["node_modules", "public", "src", "dist"].includes(d.name),
  )
  .forEach((d) => {
    const htmlPath = resolve(__dirname, d.name, "index.html");
    if (existsSync(htmlPath)) {
      pages[d.name] = htmlPath;
    }
  });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: pages,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    },
  },
});
