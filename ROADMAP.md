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
1. **Validation + warnings**: actionable errors for unsupported types, missing theme values, dangling refs.
2. **Incremental perf**: cache resolved token graph; only rewrite changed outputs.
3. **Prettier integration**: optional formatting pass for generated TS + stable ordering guarantees.
4. **Import modes**: output both preset and “theme fragment” (`forgeui.theme.ts`).
5. **Docs + troubleshooting**: export options, common Tokens Studio quirks, Tailwind v4 setup guide.
6. **NPM smoke test**: add `npm pack` + install test in CI to catch broken publishes.
7. **Windows support**: path handling + newline stability + CI job on windows-latest.
8. **Figma pull (v1)**: optional command to fetch tokens via Figma API and sync.
9. **Component scaffolding (v1)**: `forgeui scaffold <component>` for React + Tailwind.
10. **Storybook integration (v1)**: auto-generate token docs page + theme switcher.
