import { defineConfig } from 'vite'
import { resolve, join } from 'path'
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const pages = { main: resolve(__dirname, 'index.html') }

readdirSync(__dirname, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !['node_modules', 'public', 'src', 'dist'].includes(d.name))
  .forEach((d) => {
    const htmlPath = resolve(__dirname, d.name, 'index.html')
    if (existsSync(htmlPath)) pages[d.name] = htmlPath
  })

// -- append ?v=<content hash> to built css/js links: the version only changes when the file
// -- content changes, so diffing dist against the server copy shows no noise
function cacheVersionPlugin() {
  let outDir
  let base
  return {
    name: 'cache-version',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      base = config.base
    },
    writeBundle() {
      const hashes = {}
      const hashOf = (url) => {
        const file = join(outDir, url.slice(base.length))
        if (!(file in hashes)) {
          hashes[file] = existsSync(file)
            ? createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8)
            : null
        }
        return hashes[file]
      }

      Object.keys(pages).forEach((name) => {
        const htmlFile = join(outDir, name === 'main' ? 'index.html' : `${name}/index.html`)
        if (!existsSync(htmlFile)) return

        const html = readFileSync(htmlFile, 'utf-8').replace(
          /((?:src|href)=")([^"?]+\.(?:css|js))(")/g,
          (match, start, url, end) => {
            if (!url.startsWith(base)) return match
            const hash = hashOf(url)
            return hash ? `${start}${url}?v=${hash}${end}` : match
          }
        )
        writeFileSync(htmlFile, html)
      })
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
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  },
  build: {
    sourcemap: false,
    // -- keep css readable so the client can edit it on the server and diffs stay line-based
    cssMinify: false,
    rolldownOptions: {
      input: pages,
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? ''
          if (name.endsWith('.css')) return 'assets/styles.css'
          if (/\.(png|jpg|jpeg|webp|svg|gif)$/.test(name)) {
            return 'assets/images/[name][extname]'
          }
          return 'assets/[name][extname]'
        }
      }
    }
  }
})
