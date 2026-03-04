# Config reference

This is a reference for `forgeui.config.ts` / `forgeui.config.js`.

If you want a starting point, run:

```bash
forgeui init
```

## Top-level

### `tokensPath`

Path to your Tokens Studio JSON export.

- Type: `string`
- Default: `"./tokens.json"`

### `outDir`

Where ForgeUI writes generated outputs.

- Type: `string`
- Default: `"./forgeui"`

### `plugins`

Plugins to run around generation.

- Type: `Array<{ module: string; name?: string; enabled?: boolean; options?: Record<string, unknown> }>`
- Default: `[]`

### `themes`

Theme wiring and fallbacks.

#### `themes.rootTheme`

The canonical theme name used as the base.

- Type: `string`
- Default: `"Light"`

#### `themes.selectorByTheme`

CSS selectors used for each theme.

- Type: `Record<string, string | string[]>`
- Default:

```ts
{
  Light: ':root',
  Dark: ['[data-theme="dark"]', '.dark'],
}
```

#### `themes.fallbacks`

Theme fallback chain when a token is missing in a theme.

- Type: `Record<string, string[]>`
- Default:

```ts
{ Dark: ['Light'] }
```

## `filter`

Controls which tokens are included.

### `filter.include`

Glob patterns matched against the fully-qualified token name (e.g. `core.color.bg`).

- Type: `string[]`
- Default: `["core.*", "components.*"]`

### `filter.exclude`

Glob patterns to exclude (applied after `include`).

- Type: `string[]`
- Default: `[]`

### `filter.sets`

Token *set* names (from Tokens Studio) to include. Empty means "all enabled".

- Type: `string[]`
- Default: `[]`

### `filter.types`

Token types to include. Empty means "all".

- Type: `Array<"color" | "dimension" | "shadow" | "typography" | "border" | string>`
- Default: `[]`

CLI overrides:

- `--types color,dimension`
- `--sets core,components`
- `--include core.*,components.*`
- `--exclude components.experimental.*`

## `css`

### `css.alsoEmitClassDark`

Also emit a `.dark { ... }` block (in addition to your `selectorByTheme` for Dark).

- Type: `boolean`
- Default: `false`

### `css.dimensions`

Controls how dimension tokens are normalized.

- `unit`: `"preserve" | "px" | "rem"`
- `remBasePx`: number (default `16`)
- `precision`: number (default `4`)

## `tailwind`

Controls preset output.

### `tailwind.cssFile`

Filename for generated CSS vars.

- Default: `"tokens.css"`

### `tailwind.presetFile`

Filename for the Tailwind preset.

- Default: `"forgeui.preset.ts"`

### `tailwind.themeFile` (optional)

If set, ForgeUI emits a separate theme fragment and imports it from the preset.

### `tailwind.presetFormat`

- `"esm"` (default)
- `"cjs"`

### `tailwind.presetUsage`

- `"v4"` (default)
- `"v3"`

### `tailwind.darkThemeName`

Theme name used to drive Tailwind dark-mode values.

- Default: `"Dark"`

### `tailwind.map.colors`

Optional namespace remapping for colors.

```ts
map: {
  colors: {
    // Example: map `bg.*` → `surface.*`
    bg: 'surface',
  },
}
```

## `format`

### `format.prettier`

If `true`, generated TS outputs are prettier-formatted.

- Type: `boolean`
- Default: `false`
