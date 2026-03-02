# ForgeUI v0 Spec (Draft)

## Goal
Consume a Tokens Studio export (Figma Tokens) and generate:

- `tokens.css` (CSS variables, theme selectors)
- `forgeui.preset.ts` (Tailwind v4 preset referencing CSS variables)

## Input
### Expected format
Tokens Studio JSON with:

- `$themes`: list of themes (e.g. `Light`, `Dark`)
- `$sets`: token sets (e.g. `core`, `components`)
- token objects using `$type` and `$value`
- token references in the form `{path.to.token}`

Theme names are **case-sensitive**.

## Themes → CSS selectors
Default mapping (configurable):

- `Light` → `:root`
- any other theme name → `[data-theme="<slug>"]`

Tailwind dark mode recommendation:

```ts
// tailwind.config.ts
export default {
  darkMode: ["class", "[data-theme='dark']"],
}
```

## Output
### `tokens.css`
- Emits variables for all resolved tokens in enabled sets
- Emits one block per theme

### `forgeui.preset.ts`
- Exports a Tailwind v4 preset with `theme.extend` populated
- Colors use `rgb(var(--token) / <alpha-value>)`

## Token mapping (initial)
- `color` → `theme.extend.colors`
- `dimension` → `spacing`, `borderRadius` (by namespace)
- `shadow` → `boxShadow`
- typography tokens (`fontFamily`, `fontSize`, `lineHeight`, `fontWeight`) → corresponding Tailwind theme keys

## Non-goals (v0)
- Pulling tokens directly from Figma API
- Component generation
- Interactive UI
