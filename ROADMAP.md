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
1. **Figma pull (v1)**: optional command to fetch tokens via Figma API and sync.
2. **Component scaffolding (v1)**: `forgeui scaffold <component>` for React + Tailwind.
3. **Storybook integration (v1)**: auto-generate token docs page + theme switcher.
4. **Plugin system (v1)**: allow custom generators via config + hooks.
5. **Tailwind v3 compatibility**: optional output mode for legacy projects.
6. **Docs site**: simple VitePress/Docusaurus site consuming `tokens.index.json`.
7. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
8. **Release hardening**: tighten `files`/exports; ensure dist is built before publish.
9. **Docs site**: simple VitePress/Docusaurus site consuming `tokens.index.json`.
10. **Figma pull (v1)**: optional command to fetch tokens via Figma API and sync.
