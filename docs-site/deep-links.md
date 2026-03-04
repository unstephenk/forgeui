# Deep links

ForgeUI’s docs site supports shareable filtered token views.

## Token table filters

On token list pages (e.g. `/tokens`), you can use query params:

- `?q=<text>` — search filter
- `?ns=<namespace>` — namespace filter (only on the All Tokens page)

Examples:
- `/tokens?q=brand.500`
- `/tokens?ns=core&q=color`

Tip: token detail pages include a **View in table** link that uses `?q=`.
