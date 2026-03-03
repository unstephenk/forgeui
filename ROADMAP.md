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
1. **Docs site**: simple VitePress/Docusaurus site consuming `tokens.index.json`.
2. **Token normalization**: normalize units (`px`/`rem`), numeric strings, and common edge cases.
3. **Tailwind v3 compatibility**: optional output mode for legacy projects.
4. **Figma pull (v1)**: optional command to fetch tokens via Figma API and sync.
5. **Plugin system (v1)**: allow custom generators via config + hooks.
6. **Component scaffolding (v1)**: `forgeui scaffold <component>` for React + Tailwind.
7. **Storybook integration (v1)**: auto-generate token docs page + theme switcher.
8. **Type coverage**: tighten token typing + runtime guards for token leaves.
9. **CLI UX**: add `--outDir` override + clearer errors for missing files/sets.
10. **Release UX**: document the release process end-to-end (changeset → tag → publish).
