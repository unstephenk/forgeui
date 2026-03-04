# Plugin authoring

ForgeUI plugins are a small hook system to tweak generated outputs.

## Keep plugins deterministic
- Don’t add timestamps/randomness
- Don’t hit the network
- Prefer pure string transforms

## Outputs model
Plugins receive `ctx.outputs` keyed by **output filename** (in `outDir`):
- `tokens.css`
- `forgeui.preset.ts`
- `forgeui.theme.ts` (optional)

Modify `ctx.outputs[file]` to change what gets written.

## Hooks
- `beforeGenerate(ctx)` — runs before generation
- `afterGenerate(ctx)` — runs after generation, before files are written

## Options
Plugins can provide:
- `validateOptions(options)`
- `optionsSchema` (JSON Schema validated by ForgeUI)

## Example
See:
- `examples/plugins/forgeui-plugin-banner.ts`
- `examples/plugins/forgeui-plugin-prettier.ts`
