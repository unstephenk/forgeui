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

## Next (keep >= 10)
1. **Figma pull (v1)**: `forgeui figma pull` stub (env vars + clear errors).
2. **Plugin system (v1)**: config + hooks interface scaffolding.
3. **CLI polish**: better errors + exit codes + `--json` stability.
4. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
5. **Type/runtime guards**: expand guards + validation messages.
6. **Docs site**: generated token docs linkable anchors + permalinks.
7. **Config DX**: support `forgeui.config.(m)js` default exports in more shapes.
8. **Docs site**: add per-theme column toggles.
9. **Docs site**: show per-token “path” breadcrumbs + namespace badges.
10. **Docs site**: render token "type" badges and sortable columns.
11. **Docs**: publish a minimal "Troubleshooting" page for common export issues.
12. **Tailwind**: document v3 config + CJS preset option in GETTING_STARTED.
