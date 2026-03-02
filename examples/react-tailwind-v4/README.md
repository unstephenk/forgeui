# react-tailwind-v4 example

Minimal Vite + React + Tailwind v4 (CSS-first) example wired to ForgeUI outputs.

## Quickstart

```bash
cd examples/react-tailwind-v4
npm i

# generate forgeui outputs (writes ../../forgeui/tokens.css + ../../forgeui/forgeui.preset.ts)
cd ../..
npx tsx src/index.ts sync --config examples/react-tailwind-v4/forgeui.config.ts

# run the app
cd examples/react-tailwind-v4
npm run dev
```

## Notes

- `src/index.css` uses Tailwind v4 `@config` to point at the generated preset.
- `src/index.css` also imports the generated `tokens.css` so CSS variables exist.
