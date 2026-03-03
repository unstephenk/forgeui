#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

function fail(msg) {
  console.error(`[verify-docs-dist] ${msg}`)
  process.exitCode = 1
}

function usage() {
  console.log('Usage: node scripts/verify-docs-dist.mjs <distDir> <basePath>')
  console.log('  distDir: path to VitePress dist (e.g. docs-site/.vitepress/dist)')
  console.log('  basePath: expected base path (e.g. /forgeui/)')
}

const distDir = process.argv[2]
const basePathRaw = process.argv[3]
if (!distDir || !basePathRaw) {
  usage()
  process.exit(2)
}

const basePath = basePathRaw.startsWith('/') ? basePathRaw : `/${basePathRaw}`
const base = basePath.endsWith('/') ? basePath : `${basePath}/`

const indexHtml = path.join(distDir, 'index.html')
if (!fs.existsSync(indexHtml)) {
  fail(`Missing ${indexHtml}`)
  process.exit(1)
}

const html = fs.readFileSync(indexHtml, 'utf8')

// 1) Ensure base path actually appears in the HTML.
if (!html.includes(JSON.stringify(base))) {
  fail(`index.html does not reference expected base path ${base}`)
}

// 2) Ensure we didn't accidentally emit root-relative assets.
// VitePress should prefix with base. Any "/assets/" is a red flag.
if (/\b(?:src|href)="\/assets\//.test(html)) {
  fail('index.html contains root-relative /assets/... URLs (base path likely broken)')
}

// 3) Verify referenced base-prefixed local assets exist in dist.
const assetUrlRe = new RegExp(`\\b(?:src|href)=\"(${base.replaceAll('/', '\\/')}[^\"]+)\"`, 'g')
const urls = new Set()
for (const m of html.matchAll(assetUrlRe)) urls.add(m[1])

if (urls.size === 0) {
  fail(`No URLs found with base prefix ${base}`)
}

for (const u of urls) {
  // Skip obvious non-file routes.
  if (u.endsWith('/')) continue

  const rel = u.startsWith(base) ? u.slice(base.length) : null
  if (rel == null) continue
  const filePath = path.join(distDir, rel)

  // Links like /forgeui/ or /forgeui/tokens aren't files, so only enforce for assets.
  if (rel.startsWith('assets/')) {
    if (!fs.existsSync(filePath)) fail(`Missing asset file referenced by index.html: ${u} -> ${filePath}`)
  }
}

// 4) Verify tokens.index.json is at site root (used by token pages)
const tokensIndex = path.join(distDir, 'tokens.index.json')
if (!fs.existsSync(tokensIndex)) {
  fail('Missing tokens.index.json in dist root (docs generation output not present)')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('[verify-docs-dist] OK')
