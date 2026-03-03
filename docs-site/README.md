# ForgeUI Docs Site (VitePress)

Minimal docs site that can render `tokens.index.json`.

## Run

```bash
cd docs-site
npm i
npm run dev
```

## Update token data

This site reads `docs-site/public/tokens.index.json`.

To generate it from your real tokens:

```bash
# from repo root
npx forgeui docs --json
cp forgeui/tokens.index.json docs-site/public/tokens.index.json
```
