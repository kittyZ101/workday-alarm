import { copyFileSync, existsSync, mkdirSync } from 'node:fs'

for (const f of ['sw.js', 'manifest.webmanifest', 'icon.svg']) {
  const from = `public/${f}`
  const to = `dist/${f}`
  if (existsSync(from)) copyFileSync(from, to)
}
console.log('public assets copied to dist')
