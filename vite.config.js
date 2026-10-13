import { defineConfig, normalizePath } from 'vite'
import { resolve, join } from 'path'
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const pages = { main: resolve(__dirname, 'index.html') }

// -- folders starting with `_` or `.` are never pages (e.g. _server/ holds the server copy)
readdirSync(__dirname, { withFileTypes: true })
  .filter(
    (d) =>
      d.isDirectory() &&
      !/^[_.]/.test(d.name) &&
      !['node_modules', 'public', 'src', 'dist', 'scripts'].includes(d.name)
  )
  .forEach((d) => {
    const htmlPath = resolve(__dirname, d.name, 'index.html')
    if (existsSync(htmlPath)) pages[d.name] = htmlPath
  })

// -- <include src="header.html" title="..." /> pulls in src/partials/header.html, in dev and build.
// -- attributes become props for the partial and any partial it includes. inside a partial:
// --   {{ key }}                     print a prop
// --   {{#if key}} ... {{/if}}       also: !key, key='value', key!='value', and {{else}}
// -- use single quotes in conditions: inside class="..." double quotes break Prettier.
// -- `page` is always set: 'home' for the root index.html, otherwise the page folder name
function htmlIncludePlugin() {
  const dir = normalizePath(resolve(__dirname, 'src/partials'))
  const IF =
    /\{\{#if\s+(!?)([\w-]+)(?:\s*(!?=)\s*(["'])\s*(.*?)\s*\4)?\s*\}\}((?:(?!\{\{#if)[\s\S])*?)\{\{\/if\}\}/

  const pageOf = (path) => path.split('/').filter(Boolean).slice(0, -1)[0] ?? 'home'

  const conditions = (html, props) => {
    // -- a tag alone on its line takes the line with it, so no blank lines are left behind
    html = html.replace(/^[ \t]*(\{\{(?:#if [^}]*|else|\/if)\}\})[ \t]*\n/gm, '$1')
    // -- resolve the innermost block first, so blocks can nest
    while (IF.test(html)) {
      html = html.replace(IF, (_, not, key, op, quote, value, body) => {
        const [yes, no = ''] = body.split('{{else}}')
        let pass = op ? (props[key] === value) === (op === '=') : Boolean(props[key])
        if (not) pass = !pass
        return pass ? yes : no
      })
    }
    return html
  }

  const expand = (html, props, depth = 0) =>
    html.replace(/([ \t]*)<include\s+src="([^"]+)"([^>]*?)\/>/g, (_, indent, file, attrs) => {
      if (depth > 10) throw new Error(`[html-include] includes nested too deep at ${file}`)
      const own = [...attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? true])
      const childProps = { ...props, ...Object.fromEntries(own) }

      let src = readFileSync(join(dir, file), 'utf-8').replace(/\r\n/g, '\n').replace(/\n$/, '')
      src = conditions(src, childProps).replace(
        /\{\{\s*([\w-]+)\s*\}\}/g,
        (m, k) => childProps[k] ?? ''
      )
      src = expand(src, childProps, depth + 1)

      // -- indent every line like the <include> tag so the output html stays readable
      return src
        .split('\n')
        .map((line) => line && indent + line)
        .join('\n')
    })

  return {
    name: 'html-include',
    // -- 'pre' so Vite still bundles the <link>/<script> tags that partials bring in
    transformIndexHtml: {
      order: 'pre',
      handler: (html, ctx) => expand(html, { page: pageOf(ctx.path) })
    },
    // -- partials are not in the module graph, so reload the page when one changes
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (normalizePath(file).startsWith(dir)) server.ws.send({ type: 'full-reload' })
      })
    }
  }
}

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
    htmlIncludePlugin(),
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
  // -- only scan the real pages for deps and ignore the server copy in dev
  optimizeDeps: {
    entries: Object.values(pages)
  },
  server: {
    watch: { ignored: ['**/_server/**', '**/.diff/**'] }
  },
  build: {
    sourcemap: false,
    // -- keep css readable so it can be edited by hand on the server and diffs stay line-based
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
