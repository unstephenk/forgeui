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

## Next (keep >= 10)
1. **Plugins**: document plugin authoring + provide an example plugin.
2. **CLI**: add `--debug` to print stacks for errors.
3. **Validate**: detect tokens with missing `$value` and emit a warning.
4. **CI**: run tests on Ubuntu + Windows in GitHub Actions.
5. **Tailwind**: add Tailwind v3 preset output golden tests.
6. **Validation**: schema-check config at runtime (helpful errors).
7. **Docs site**: add proper dark mode + theme switcher polish.
8. **Figma pull**: add pagination/caching (ETag) for large files.
9. **Docs**: document token normalization options (px/rem conversion).
10. **Plugins**: add a "prettier" example plugin + docs on option validation.
