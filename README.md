# ForgeUI

Design-tokens copilot: **Tokens Studio → Tailwind v4 + CSS variables**, shipped as a CLI.

## Install (dev)

```bash
npm i -D @forgeui/cli
# or pnpm add -D @forgeui/cli
```

## Usage (v0 draft)

```bash
forgeui init
forgeui sync
```

## Contract

- Input: Tokens Studio JSON export using `$themes` + `$sets`
- Output:
  - `tokens.css` (theme-scoped CSS variables)
  - `forgeui.preset.ts` (Tailwind v4 preset that references those vars)

See `docs/SPEC.md`.
ForgeUI — Tokens Studio → Tailwind v4 + CSS variables generator (CLI)
