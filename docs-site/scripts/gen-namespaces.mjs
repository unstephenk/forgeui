import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())
const publicDir = path.join(root, 'public')
const outDir = path.join(root, 'namespaces')

const src = path.join(publicDir, 'tokens.index.json')
if (!fs.existsSync(src)) {
  console.error(`[gen-namespaces] missing ${src}. Generate it (forgeui docs) then copy to docs-site/public.`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(src, 'utf8'))
const tokens = data.tokens ?? []

const namespaces = Array.from(
  new Set(tokens.map((t) => String(t.token ?? '').split('.')[0] || 'other'))
).sort()

fs.mkdirSync(outDir, { recursive: true })

// index page
const indexLines = [
  '# Namespaces',
  '',
  'Auto-generated from `tokens.index.json`.',
  '',
  ...namespaces.map((ns) => `- [${ns}](./${ns})`),
  ''
]
fs.writeFileSync(path.join(outDir, 'index.md'), indexLines.join('\n'))

for (const ns of namespaces) {
  const md = [
    `# ${ns} tokens`,
    '',
    '<ClientOnly>',
    `  <TokensTable ns="${ns}" />`,
    '</ClientOnly>',
    ''
  ].join('\n')
  fs.writeFileSync(path.join(outDir, `${ns}.md`), md)
}

console.log(`[gen-namespaces] wrote ${namespaces.length} namespace pages to ${path.relative(root, outDir)}`)
