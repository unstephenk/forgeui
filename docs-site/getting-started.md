# Getting started

ForgeUI turns a Tokens Studio export into:

- `tokens.css` (CSS variables)
- a Tailwind preset (`forgeui.preset.*`)

## Tailwind v4 (CSS-first)

Generate outputs:

```bash
npx forgeui sync
```

Then in your global CSS (e.g. `src/index.css`):

```css
@import "tailwindcss";
@config "../forgeui/forgeui.preset.ts";
@import "../forgeui/tokens.css";
```

Notes:
- `@config` is **Tailwind v4** only.
- Adjust paths to match your project.

## Tailwind v3 (classic config)

Tailwind v3 uses `tailwind.config.*` and (commonly) CommonJS. Configure ForgeUI to emit a CJS preset and use the v3 wiring snippet:

```ts
// forgeui.config.ts
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

And import the generated variables somewhere global:

```css
@import "./forgeui/tokens.css";
```

## Next

- Browse tokens: [/tokens](/tokens)
- Troubleshooting: [/troubleshooting](/troubleshooting)
