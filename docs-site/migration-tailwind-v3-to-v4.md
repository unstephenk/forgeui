# Migration: Tailwind v3 → v4

Tailwind v4 is **CSS-first**. The big change is that your Tailwind config is (usually) pulled in via **`@config` in CSS**, instead of being discovered from `tailwind.config.*`.

If you’re using ForgeUI, the good news is: you already have a preset file — you just change how you *wire it up*.

## 1) Update ForgeUI config (recommended)

For Tailwind v4, ForgeUI’s default preset format/usage is already correct:

- `tailwind.presetFormat: "esm"`
- `tailwind.presetUsage: "v4"`

If you previously set Tailwind v3 compatibility options, remove them (or switch back):

```ts
// forgeui.config.ts
export default {
  tailwind: {
    presetFile: "forgeui.preset.ts",
    presetFormat: "esm",
    presetUsage: "v4",
  },
}
```

Then regenerate:

```bash
npx forgeui sync
```

## 2) Switch to Tailwind v4 CSS wiring

In your global CSS (e.g. `src/index.css`):

```css
@import "tailwindcss";
@config "../forgeui/forgeui.preset.ts";
@import "../forgeui/tokens.css";
```

Notes:
- `@config` is **Tailwind v4 only**.
- Adjust paths to match your project.
- `tokens.css` should be imported after Tailwind so the variables exist at runtime.

## 3) Remove Tailwind v3 preset wiring

If you had this in `tailwind.config.cjs`:

```js
module.exports = {
  presets: [require("./forgeui/forgeui.preset.cjs")],
}
```

…you can delete it (or stop using `tailwind.config.*` entirely), depending on your app/build tooling.

## 4) Common “gotchas”

- **CJS preset files** (`.cjs`) won’t work with v4 `@config` the way you expect. Use the ESM preset output (`.ts`/`.js`).
- If you’re migrating your app build too, verify your Tailwind v4 installation and your bundler’s CSS pipeline first.

## 5) Sanity checks

- Run `npx forgeui diff` to confirm outputs are stable.
- Open [/tokens](/tokens) to confirm docs outputs are current.
