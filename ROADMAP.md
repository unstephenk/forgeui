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

## Next (keep >= 10)
1. **CLI polish**: better errors + exit codes + `--json` stability.
2. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
3. **Type/runtime guards**: expand guards + validation messages.
4. **Docs site**: generated token docs linkable anchors + permalinks.
5. **Config DX**: support `forgeui.config.(m)js` default exports in more shapes.
6. **Docs site**: add per-theme column toggles.
7. **Docs site**: show per-token “path” breadcrumbs + namespace badges.
8. **Docs site**: render token "type" badges and sortable columns.
9. **Docs**: publish a minimal "Troubleshooting" page for common export issues.
10. **Tailwind**: document v3 config + CJS preset option in GETTING_STARTED.
11. **Figma pull**: support `FIGMA_FILE_KEY` + `FIGMA_NODE_ID` as an alternate fetch mode.
12. **Plugins**: document plugin authoring + provide an example plugin.
