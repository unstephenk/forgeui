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
- Plugins: builtin plugin registry (short names like `banner`, no module paths)
- docs-site: token detail page "Copy JSON" action
- docs-site: token detail page "Copy path" action
- docs-site: token detail page "View in table" link
- CLI: add `--types` shorthand for config.filter.types
- docs: add Tailwind v3 → v4 migration page (docs-site)
- tokens: add `border` token type mapping (CSS vars + Tailwind preset)
- figma pull: support `--cache-dir` override (cache location control)
- docs-site: show data freshness (generatedAt) hint on token table
- docs-site: token table sticky header + horizontal scroll hint
- CLI: add `forgeui fmt` to format generated outputs (prettier)
- plugins: improve registry DX (builtin list + better load error hints)
- CLI: add `forgeui check` (schema+validate+diff)
- figma pull: support writing multiple outputs (extracted + raw payload)
- docs: add Supported token types page (docs-site)
- tokens: typography tokens emit Tailwind fontSize tuples (themeable via CSS vars)
- docs-site: auto-generate token type pages (with pre-filtered TokensTable)
- docs-site: token table keyboard navigation (j/k, enter to open)
- CLI: add `forgeui doctor` to print environment + config summary
- figma pull: retry 429 rate limits (Retry-After)
- validate: warn on token-like objects missing $type/$value (paths)
- docs-site: add namespace filter chips + ns:... search hint
- docs-site: fix tokens index fetch under GitHub Pages base path + add robust dist verification script
- docs-site: add token detail page + deep links from token tables
- docs: polish tokens.md markdown output (grouped sections + index)
- docs-site: add Getting Started page with clear Tailwind v4 vs v3 wiring + preset usage
- plugins: config schema supports name/enabled + better load/hook error context
- figma pull: persist cached snapshots to disk + materialize output on 304 when missing
- validate: exit non-zero when warnings exist + print a summary line
- release: helper now does preflight + build + pack smoke + annotated tag + push (with --dry-run/--no-push)
- ci: build docs-site + verify Pages base path/assets on ubuntu+windows
- docs-site: Tokens page now has jump links to namespace sections

## Next (keep >= 10)
1. **Tokens**: add typography → `theme.extend.typography` mapping (future).
2. **Docs**: document plugin authoring best practices + examples.
3. **Docs site**: support deep links to tokens table via `?q=` (and document it).
4. **CLI**: add `--sets` shorthand for config.filter.sets (comma-separated).
5. **Docs**: add a "How it works" page (Tokens Studio → outputs pipeline).
6. **Tokens**: add `gradient` token type mapping + tests.
7. **Docs site**: show token count + filtered count in table footer.
8. **Docs-site**: show "last generated" on token detail page too.
9. **CLI**: add `--include/--exclude` shorthand flags for filter globs.
10. **CLI**: add `forgeui clean` to remove generated files + caches.
11. **Plugins**: add plugin execution timing info under --debug.
