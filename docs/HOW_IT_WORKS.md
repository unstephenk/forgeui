# How ForgeUI Works

ForgeUI is a small compiler for design tokens.

## Pipeline

1) **Source of truth**: Tokens Studio export (`tokens.json`)
2) **Compile**: `forgeui sync`
3) **Artifacts**:
- `forgeui/tokens.css` — CSS variables scoped per theme selector
- `forgeui/forgeui.preset.*` — Tailwind preset that references the vars
- `forgeui/forgeui.lock.json` + `forgeui/forgeui.manifest.json` — determinism + diffs
4) **Consumers**:
- apps
- component libraries
- Storybook

## Why this matters
Design systems usually fail from drift. ForgeUI makes token changes:
- deterministic
- reviewable (via `forgeui diff`)
- CI-enforceable (via `forgeui check --warnings-as-errors`)

## Common commands
- `forgeui sync`
- `forgeui diff`
- `forgeui validate`
- `forgeui check`
