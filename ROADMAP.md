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

## Next (keep >= 10)
1. **Docs site polish**: token table UI (filter/search + grouping by namespace + copy-to-clipboard).
2. **Docs site**: token group pages (core vs components).
3. **GitHub Pages**: base-path + deploy verification tweaks.
4. **Release UX**: one-command release helper + docs.
5. **Tailwind v3 compatibility**: optional preset output format (CJS + v3 usage).
6. **Figma pull (v1)**: `forgeui figma pull` stub (env vars + clear errors).
7. **Plugin system (v1)**: config + hooks interface scaffolding.
8. **CLI polish**: better errors + exit codes + `--json` stability.
9. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
10. **Type/runtime guards**: expand guards + validation messages.
11. **Docs site**: generated token docs linkable anchors + permalinks.
12. **Config DX**: support `forgeui.config.(m)js` default exports in more shapes.
