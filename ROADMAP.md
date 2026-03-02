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
1. **Publish flow**: GitHub Actions CI + release workflow (npm publish on tag).
2. **Better CLI UX**: global flags (`--quiet`, `--json`, consistent exit codes), `--dry-run`.
3. **Token filtering**: include/exclude by set/namespace/glob and `$type`.
4. **Theme strategy**: multi-selector themes + explicit theme→selector mapping (array support).
5. **Tailwind mapping config**: configurable mapping/renames (e.g. map `core.color.bg.*` → `colors.surface.*`).
6. **Validation + warnings**: actionable errors for unsupported types, missing theme values, dangling refs.
7. **Incremental perf**: cache resolved token graph; only rewrite changed outputs.
8. **Prettier integration**: optional formatting pass for generated TS + stable ordering guarantees.
9. **Import modes**: output both preset and “theme fragment” (`forgeui.theme.ts`).
10. **Docs + troubleshooting**: export options, common Tokens Studio quirks, Tailwind v4 setup guide.
