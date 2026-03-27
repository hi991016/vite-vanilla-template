// vite.config.ts
import { defineConfig, Plugin } from "vite";
import { resolve } from "path";
import { readdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

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

function cssVersionPlugin(): Plugin {
  const version = Date.now();
  return {
    name: "css-version",
    transformIndexHtml(html: string): string {
      return html.replace(/(<link[^>]+\.css)(")/g, `$1?v=${version}$2`);
    },
  };
}

export default defineConfig({
  plugins: [cssVersionPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: pages,
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        assetFileNames: (assetInfo): string => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name].css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});