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

## Next (keep >= 10)
1. **Docs site**: add proper dark mode + theme switcher polish.
2. **Figma pull**: add pagination/caching (ETag) for large files.
3. **Docs**: document token normalization options (px/rem conversion).
4. **Plugins**: add a "prettier" example plugin + docs on option validation.
5. **Docs site**: auto-generate namespace pages from tokens.index.json.
6. **Docs site**: add namespace filters to search.
7. **Plugins**: add hook coverage tests + example plugin that mutates outputs.
8. **Figma pull**: handle 429 rate limits (Retry-After) gracefully.
9. **Release**: improve helper (preflight checks + dry-run + clearer output).
10. **Docs site**: add a CI job that builds Pages output on PRs.
11. **Docs**: polish tokens.md output (group sections + anchors).
12. **Validate**: unsupported leaf reporting w/ JSON paths.
