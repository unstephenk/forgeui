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
1. **Token filtering**: include/exclude by set/namespace/glob and `$type`.
2. **Theme strategy**: multi-selector themes + explicit theme→selector mapping (array support).
3. **Tailwind mapping config**: configurable mapping/renames (e.g. map `core.color.bg.*` → `colors.surface.*`).
4. **Validation + warnings**: actionable errors for unsupported types, missing theme values, dangling refs.
5. **Incremental perf**: cache resolved token graph; only rewrite changed outputs.
6. **Prettier integration**: optional formatting pass for generated TS + stable ordering guarantees.
7. **Import modes**: output both preset and “theme fragment” (`forgeui.theme.ts`).
8. **Docs + troubleshooting**: export options, common Tokens Studio quirks, Tailwind v4 setup guide.
9. **NPM smoke test**: add `npm pack` + install test in CI to catch broken publishes.
10. **Windows support**: path handling + newline stability + CI job on windows-latest.
