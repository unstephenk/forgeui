# Getting Started

ForgeUI turns a **Tokens Studio** export (Figma Tokens) into:

- `tokens.css` (theme-scoped CSS variables)
- `forgeui.preset.ts` (Tailwind v4 preset referencing those vars)

## Prereqs
- Node.js >= 20
- Tokens Studio export JSON that includes **`$themes` + `$sets`**

## Install

```bash
npm i -D @forgeui/cli
```

## 1) Add tokens
Export from Tokens Studio and save as `tokens.json` in your repo root.

(You can start from `fixtures/tokens.themesets.json`.)

## 2) Init config

```bash
npx forgeui init
```

This creates `forgeui.config.ts` and `./forgeui/` output folder.

## 3) Sync (generate outputs)

```bash
npx forgeui sync
```

Outputs:
- `forgeui/tokens.css`
- `forgeui/forgeui.preset.ts`
- `forgeui/forgeui.lock.json`
- `forgeui/forgeui.manifest.json`

## 4) Wire Tailwind v4 (CSS-first)
In your app CSS (e.g. `src/index.css`):

```css
@import "tailwindcss";
@config "../forgeui/forgeui.preset.ts";
@import "../forgeui/tokens.css";
```

Adjust paths based on your project layout.

## 5) Dark mode
Default config supports both:
- `class="dark"` (Tailwind classic)
- `data-theme="dark"` selector

So you can toggle either:

```html
<html class="dark">
```

or

```html
<html data-theme="dark">
```

## Common workflows
- Watch tokens:

```bash
npx forgeui watch
```

- Preview changes without writing:

```bash
npx forgeui sync --dry-run --json
```

- Show diffs:

```bash
npx forgeui diff
```

## Troubleshooting
See `docs/TROUBLESHOOTING.md`.
