# ForgeUI Roadmap

This file is the source of truth for what’s next.
Rule: **every commit must keep at least 10 upcoming items** in the “Next” list.

## Recently completed (high level)
- Tokens Studio ($themes/$sets) → `tokens.css`
- Tailwind v4 preset generation
- `init`, `sync`, `watch`, `diff`
- lockfile + manifest
- golden tests
- example React + Tailwind v4 app
- docs-site: local search + basic theme polish
- docs-site: token table UI (filter/search + grouping + copy-to-clipboard)
- docs-site: token group pages (core vs components)
- GitHub Pages: base-path + deploy verification tweaks
- Release UX: one-command release helper + docs
- Tailwind v3 compatibility: optional preset output format (CJS + v3 usage)
- Figma pull (v1): `forgeui figma pull` stub (env vars + clear errors)
- Plugin system (v1): config + hooks interface scaffolding
- CLI polish: better errors + exit codes + `--json` stability
- Type/runtime guards: expand guards + validation messages
- Token normalization: dimensions unit normalization + optional px/rem conversion
- docs-site: token table permalinks + linkable anchors
- Config DX: unwrap more config export shapes (default, nested default, factory)
- docs-site: per-theme column toggles (URL-driven)
- docs-site: token breadcrumbs + namespace badges in tables
- docs-site: token type badges + sortable columns
- docs: publish troubleshooting page in docs-site
- docs: document Tailwind v3 wiring (CJS preset + classic config)
- figma pull: support FIGMA_FILE_KEY + FIGMA_NODE_ID mode (Figma REST)
- plugins: docs + example plugin (banner)
- CLI: add --debug to print stacks for errors
- Validate: warn on tokens with missing $value
- Tailwind: add Tailwind v3 preset output golden tests
- Validation: schema-check config at runtime (Ajv)
- docs-site: dark mode variables + enable appearance toggle
- figma pull: add ETag caching (If-None-Match + 304 unchanged)
- plugins: add hook coverage tests + example plugin that mutates outputs
- figma pull: retry 429 rate limits (Retry-After)
- validate: warn on token-like objects missing $type/$value (paths)
- docs-site: add namespace filter chips + ns:... search hint
- docs-site: fix tokens index fetch under GitHub Pages base path + add robust dist verification script
- docs-site: add token detail page + deep links from token tables
- docs: polish tokens.md markdown output (grouped sections + index)
- docs-site: add Getting Started page with clear Tailwind v4 vs v3 wiring + preset usage
- plugins: config schema supports name/enabled + better load/hook error context

## Next (keep >= 10)
1. **Docs**: document token normalization options (px/rem conversion).
2. **Plugins**: add a "prettier" example plugin + docs on option validation.
3. **Docs site**: auto-generate namespace pages from tokens.index.json.
4. **Release**: improve helper (preflight checks + dry-run + clearer output).
5. **Docs site**: add a CI job that builds Pages output on PRs.
6. **CI**: add docs-site build + base-path verification to the main CI workflow.
7. **Docs site**: improve search UX (namespace filter chips + keyboard focus).
8. **Tailwind**: add v3 mode golden tests for themeFile split output.
9. **CLI**: allow `forgeui docs --md` to pick group ordering options.
10. **Figma pull**: persist cache snapshots to disk to enable true no-fetch runs.
11. **CLI**: validate should return non-zero when warnings exist (or provide a flag), plus a summary line.
12. **Plugins**: validate plugin `options` against an optional plugin-provided schema (nice errors).
13. **Release**: helper should create + push git tag, and print post-release next steps.
