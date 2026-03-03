# Troubleshooting

## Tokens Studio export doesn’t include `$themes` / `$sets`
ForgeUI expects the **Themes + Sets** style export.
In Tokens Studio, export JSON with themes enabled.

## “Token is a theme map but has no value for theme …”
A token like:

```json
{ "$value": { "Light": "#fff" } }
```

is missing a value for another theme (e.g. `Dark`).

Fix options:
- add the missing theme value
- or make the token a single value

## Dangling refs (`{path.to.token}`)
ForgeUI warns when a token references another token that can’t be resolved.
Fix the path or ensure the referenced token exists in an enabled set.

## Tailwind v4 wiring
In CSS-first Tailwind v4, add:

```css
@import "tailwindcss";
@config "./forgeui/forgeui.preset.ts";
@import "./forgeui/tokens.css";
```

If you generate `forgeui.theme.ts`, it will be imported by the preset automatically.
