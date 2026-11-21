// GitHub Pages serves /404.html for unknown URLs. vite-prerender-plugin emits
// the not-found page as dist/404/index.html (queued via additionalPrerenderRoutes),
// so move it to dist/404.html.
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const source = join(dist, '404', 'index.html')
const target = join(dist, '404.html')

if (existsSync(source)) {
  mkdirSync(dist, { recursive: true })
  renameSync(source, target)
  rmSync(join(dist, '404'), { recursive: true, force: true })
}

if (!existsSync(target)) {
  console.error('postbuild: dist/404.html was not generated')
  process.exit(1)
}
console.log('postbuild: dist/404.html ready')
