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
6. **Config schema**: emit JSON schema + editor intellisense for config.
7. **Theme fallbacks**: allow theme value fallback chain (e.g. Dark→Light) when missing.
8. **Token normalization**: normalize units (`px`/`rem`) and handle numeric dimensions consistently.
9. **Docs: token index markdown**: optional `tokens.md` output in addition to JSON index.
10. **Docs site**: simple Docusaurus/VitePress site consuming `tokens.index.json`.
