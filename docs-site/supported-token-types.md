# Supported token types

ForgeUI reads a **Tokens Studio export** and generates:

- `tokens.css` (CSS variables per theme)
- `forgeui.preset.ts` (Tailwind preset)

This page documents which token `$type` values ForgeUI currently understands.

## Token types

### `color`
- CSS: emitted as-is (string values like `#fff`, `rgb(...)`, `oklch(...)`, etc)
- Tailwind: mapped into `theme.extend.colors`

### `dimension`
- CSS: emitted with optional unit normalization (see `css.dimensions`)
- Tailwind: mapped into spacing-ish utilities where applicable (currently primarily CSS vars; Tailwind mapping is conservative)

### `shadow`
- CSS: emitted as box-shadow values
- Tailwind: mapped into `theme.extend.boxShadow`

### `fontFamily`
- CSS: emitted as a raw font-family value
- Tailwind: mapped into `theme.extend.fontFamily`

### `fontSize`
- CSS: emitted as a raw size value
- Tailwind: mapped into `theme.extend.fontSize`

### `lineHeight`
- CSS: emitted as a raw value
- Tailwind: mapped into `theme.extend.lineHeight`

### `fontWeight`
- CSS: emitted as a raw value
- Tailwind: mapped into `theme.extend.fontWeight`

### `typography`
- CSS: emitted as a composite value (object-ish tokens are expanded by ForgeUI)
- Tailwind: **currently limited** (see roadmap; fontSize tuple output is planned)

## Notes

- Unknown `$type` values are ignored (and should be warned on by validation).
- The exact Tailwind mapping evolves over time; check the generated preset for the canonical output.
