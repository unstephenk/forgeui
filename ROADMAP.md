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
1. **Better CLI UX**: global flags (`--quiet`, `--json`, consistent exit codes), `--dry-run`.
2. **Token filtering**: include/exclude by set/namespace/glob and `$type`.
3. **Theme strategy**: multi-selector themes + explicit theme→selector mapping (array support).
4. **Tailwind mapping config**: configurable mapping/renames (e.g. map `core.color.bg.*` → `colors.surface.*`).
5. **Validation + warnings**: actionable errors for unsupported types, missing theme values, dangling refs.
6. **Incremental perf**: cache resolved token graph; only rewrite changed outputs.
7. **Prettier integration**: optional formatting pass for generated TS + stable ordering guarantees.
8. **Import modes**: output both preset and “theme fragment” (`forgeui.theme.ts`).
9. **Docs + troubleshooting**: export options, common Tokens Studio quirks, Tailwind v4 setup guide.
10. **NPM smoke test**: add `npm pack` + install test in CI to catch broken publishes.
