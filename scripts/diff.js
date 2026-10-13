// -- compare the local build (dist/) with a copy downloaded from the server (_server/ by default)
// -- usage: yarn diff [serverDir] [git diff options, e.g. --stat]
// -- text files are normalized first (CRLF -> LF, ?v=<hash> removed) so only real edits show up
/* eslint-disable no-console */
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  copyFileSync
} from 'fs'
import { join, dirname, extname } from 'path'
import { spawnSync } from 'child_process'

const args = process.argv.slice(2)
const serverDir = args[0] && !args[0].startsWith('-') ? args.shift() : '_server'
const distDir = 'dist'
const tmpDir = '.diff'

const TEXT_EXT = ['.html', '.css', '.js', '.svg', '.json', '.txt', '.xml', '.htaccess', '']
const SKIP_EXT = ['.br', '.gz']

for (const dir of [distDir, serverDir]) {
  if (!existsSync(dir)) {
    console.error(
      `Not found: ${dir}/ ${dir === distDir ? '(run yarn build first)' : '(download the server files here)'}`
    )
    process.exit(1)
  }
}

const normalize = (src, dest) => {
  readdirSync(src, { withFileTypes: true }).forEach((entry) => {
    const from = join(src, entry.name)
    const to = join(dest, entry.name)
    if (entry.isDirectory()) return normalize(from, to)

    const ext = extname(entry.name).toLowerCase()
    if (SKIP_EXT.includes(ext)) return

    mkdirSync(dirname(to), { recursive: true })
    if (TEXT_EXT.includes(ext)) {
      const text = readFileSync(from, 'utf-8')
        .replace(/\r\n?/g, '\n')
        .replace(/\?v=[\w.-]+(?=["')])/g, '')
      writeFileSync(to, text)
    } else {
      copyFileSync(from, to)
    }
  })
}

rmSync(tmpDir, { recursive: true, force: true })
normalize(distDir, join(tmpDir, 'dist'))
normalize(serverDir, join(tmpDir, 'server'))

const { status } = spawnSync(
  'git',
  ['diff', '--no-index', ...args, `${tmpDir}/dist`, `${tmpDir}/server`],
  { stdio: 'inherit' }
)

if (status === 0) console.log('No differences between dist/ and the server copy.')
process.exit(status > 1 ? status : 0)
