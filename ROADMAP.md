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

## Next (keep >= 10)
1. **GitHub Pages**: base-path + deploy verification tweaks.
2. **Release UX**: one-command release helper + docs.
3. **Tailwind v3 compatibility**: optional preset output format (CJS + v3 usage).
4. **Figma pull (v1)**: `forgeui figma pull` stub (env vars + clear errors).
5. **Plugin system (v1)**: config + hooks interface scaffolding.
6. **CLI polish**: better errors + exit codes + `--json` stability.
7. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
8. **Type/runtime guards**: expand guards + validation messages.
9. **Docs site**: generated token docs linkable anchors + permalinks.
10. **Config DX**: support `forgeui.config.(m)js` default exports in more shapes.
11. **Docs site**: add per-theme column toggles.
12. **Docs site**: show per-token “path” breadcrumbs + namespace badges.
