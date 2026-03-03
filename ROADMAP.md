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

## Next (keep >= 10)
1. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
2. **Type/runtime guards**: expand guards + validation messages.
3. **Docs site**: generated token docs linkable anchors + permalinks.
4. **Config DX**: support `forgeui.config.(m)js` default exports in more shapes.
5. **Docs site**: add per-theme column toggles.
6. **Docs site**: show per-token “path” breadcrumbs + namespace badges.
7. **Docs site**: render token "type" badges and sortable columns.
8. **Docs**: publish a minimal "Troubleshooting" page for common export issues.
9. **Tailwind**: document v3 config + CJS preset option in GETTING_STARTED.
10. **Figma pull**: support `FIGMA_FILE_KEY` + `FIGMA_NODE_ID` as an alternate fetch mode.
11. **Plugins**: document plugin authoring + provide an example plugin.
12. **CLI**: add `--debug` to print stacks for errors.
