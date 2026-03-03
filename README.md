# ForgeUI

Design-tokens copilot: **Tokens Studio → Tailwind v4 + CSS variables**, shipped as a CLI.

## About

ForgeUI is a CLI that keeps your design tokens and your codebase in sync by turning **Tokens Studio exports** into **CSS variables** and a **Tailwind v4 preset**.

**Mission:** make design-system tokens boringly reliable—one source of truth, deterministic outputs, and zero hand-edited drift.

## Install (dev)

```bash
npm i -D @forgeui/cli
# or pnpm add -D @forgeui/cli
```

## Usage (v0)

```bash
forgeui init          # writes forgeui.config.ts
forgeui init --js     # writes forgeui.config.js
forgeui sync
forgeui diff          # exits non-zero if generated output differs
```

### Tailwind v4 wiring (CSS-first)

In your app CSS (example):

```css
@import "tailwindcss";
@config "./forgeui/forgeui.preset.ts";

@import "./forgeui/tokens.css";
```

## Contract

- Input: Tokens Studio JSON export using `$themes` + `$sets`
- Output:
  - `tokens.css` (theme-scoped CSS variables)
  - `forgeui.preset.ts` (Tailwind v4 preset that references those vars)

See `docs/SPEC.md`.

Getting started: see `docs/GETTING_STARTED.md`.

Recipes: see `docs/RECIPES.md`.

Releasing: see `docs/RELEASING.md`.

Roadmap: see `ROADMAP.md`.

## Next up (features / improvements)

### Top 8 (next)
1. **Config robustness**: support both `forgeui.config.ts` and `forgeui.config.js` cleanly; document behavior and defaults.
2. **Nicer preset output**: generate a readable `forgeui.preset.ts` (no JSON stringification) + add copy/paste Tailwind v4 usage snippet.
3. **Mapping expansion**: add generators for spacing, radius, shadows, and typography (not just colors).
4. **`forgeui diff`**: show what changed since last sync (tokens + generated files).
5. **Lockfile + manifest**: write `forgeui.lock.json` + `forgeui.manifest.json` for deterministic rebuilds + diffs.
6. **Golden tests**: fixture-driven tests that assert `tokens.css` and preset outputs match expected.
7. **Better ref resolution + errors**: clearer diagnostics (full token path, theme, cycle chain).
8. **Example app**: `examples/react-tailwind-v4/` proving preset + CSS work (light/dark toggle).

### Next 7 (after that)
9. **Theme selector config**: allow mapping theme names → selectors (including multiple selectors per theme).
10. **Token filtering**: include/exclude sets and namespaces (e.g. only `core.color.*`).
11. **Formatting**: stable sorting + optional Prettier formatting for generated TS.
12. **Performance**: incremental generation + caching for large token files.
13. **Warnings**: detect unsupported token types and emit actionable warnings.
14. **CI**: GitHub Actions to run tests + publish preview builds.
15. **Docs**: quickstart + troubleshooting for Tokens Studio export quirks.
