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

## 4b) Tailwind v3 (classic config)
If you’re on Tailwind v3, generate a **CommonJS** preset and use the classic `tailwind.config.*` wiring.

In `forgeui.config.*`:

```ts
export default {
  tailwind: {
    presetFile: "forgeui.preset.cjs",
    presetFormat: "cjs",
    presetUsage: "v3"
  }
}
```

Then in `tailwind.config.cjs`:

```js
module.exports = {
  presets: [require("./forgeui/forgeui.preset.cjs")],
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
};
```

And make sure you’re importing the generated CSS variables somewhere global:

```css
@import "./forgeui/tokens.css";
```

## 5) Dark mode
Default config supports both:
- `class="dark"` (Tailwind classic)
- `data-theme="dark"` selector

## 6) Dimension normalization (px/rem)
ForgeUI can normalize dimension tokens (spacing/radius/etc) into a consistent unit.

In `forgeui.config.*`:

```ts
export default {
  css: {
    dimensions: {
      // "preserve" | "px" | "rem"
      unit: "rem",
      // only used when unit="rem"
      remBasePx: 16,
      // rounding precision for rem conversion
      precision: 4
    }
  }
}
```

Notes:
- `preserve` keeps whatever Tokens Studio exported (recommended if you already standardize units upstream).
- `px` forces numeric strings like `"16"` to `"16px"`.
- `rem` converts px-ish values to rem for Tailwind-friendly sizing.

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

## Plugins
See `docs/PLUGINS.md`.

## How it works
See `docs/HOW_IT_WORKS.md`.

## Plugin authoring
See `docs/PLUGIN_AUTHORING.md`.

## Troubleshooting
See `docs/TROUBLESHOOTING.md`.
