import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import viteCompression from 'vite-plugin-compression'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const pages = { main: resolve(__dirname, 'index.html') }

readdirSync(__dirname, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !['node_modules', 'public', 'src', 'dist'].includes(d.name))
  .forEach((d) => {
    const htmlPath = resolve(__dirname, d.name, 'index.html')
    if (existsSync(htmlPath)) pages[d.name] = htmlPath
  })

function cacheVersionPlugin() {
  const version = Date.now()
  return {
    name: 'cache-version',
    transformIndexHtml(html) {
      return html
        .replace(/(<link[^>]+\.css)(">)/g, `$1?v=${version}$2`)
        .replace(/(<script[^>]+\.js)(")/g, `$1?v=${version}$2`)
    }
  }
}

export default defineConfig({
  plugins: [
    cacheVersionPlugin(),
    ViteImageOptimizer({
      jpg: { quality: 80 },
      png: { quality: 80 },
      webp: { quality: 80 },
      includePublic: true
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      filter: /\.(js|css)$/i
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      input: pages,
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/styles.css'
          if (/\.(png|jpg|jpeg|webp|svg|gif)$/.test(assetInfo.name)) {
            return 'assets/images/[name][extname]'
          }
          return 'assets/[name][extname]'
        },
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        }
      }
    }
  }
})
