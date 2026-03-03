import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd())
const publicDir = path.join(root, 'public')
const outDir = path.join(root, 'types')

const src = path.join(publicDir, 'tokens.index.json')
if (!fs.existsSync(src)) {
  console.error(`[gen-types] missing ${src}. Generate it (forgeui docs) then copy to docs-site/public.`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(src, 'utf8'))
const tokens = data.tokens ?? []

const types = Array.from(new Set(tokens.map((t) => String(t.type ?? 'unknown')))).sort()

fs.mkdirSync(outDir, { recursive: true })

// index
const indexLines = [
  '# Token types',
  '',
  'Auto-generated from `tokens.index.json`.',
  '',
  ...types.map((t) => `- [${t}](./${t})`),
  ''
]
fs.writeFileSync(path.join(outDir, 'index.md'), indexLines.join('\n'))

for (const t of types) {
  // Use TokensTable with a pre-filter via query param hint.
  // (We keep TokensTable simple; it can be extended later to accept type filter directly.)
  const md = [
    `# ${t} tokens`,
    '',
    `<p><a href=\"../tokens\">← Back to Tokens</a></p>`,
    '',
    '<ClientOnly>',
    `  <TokensTable />`,
    '</ClientOnly>',
    '',
    '',
    `<!-- Tip: use the search box and type: type:${t} -->`,
    ''
  ].join('\n')
  fs.writeFileSync(path.join(outDir, `${t}.md`), md)
}

console.log(`[gen-types] wrote ${types.length} type pages to ${path.relative(root, outDir)}`)
