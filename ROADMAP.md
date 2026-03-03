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

## Next (keep >= 10)
1. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
2. **Tailwind v3 compatibility**: optional output mode for legacy projects.
3. **Figma pull (v1)**: optional command to fetch tokens via Figma API and sync.
4. **Plugin system (v1)**: allow custom generators via config + hooks.
5. **Component scaffolding (v1)**: `forgeui scaffold <component>` for React + Tailwind.
6. **Type coverage**: tighten token typing + runtime guards for token leaves.
7. **Docs site polish**: search, grouping by namespace, theming.
8. **Docs site polish**: token group pages (core vs components) and copy-to-clipboard.
9. **Docs publishing**: GitHub Pages deploy for docs-site.
10. **Release UX**: add a one-command release helper (optional) + docs.
