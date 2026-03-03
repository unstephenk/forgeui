# Plugins

ForgeUI supports a simple plugin system for tweaking generated outputs.

Plugins can run hooks:
- `beforeGenerate`
- `afterGenerate`

## Configure

```ts
// forgeui.config.ts
export default {
  plugins: [
    {
      name: "prettier",
      module: "./examples/plugins/forgeui-plugin-prettier.ts",
      options: { enabled: true },
    },
  ],
} as const;
```

## Context
A plugin receives a context object with:
- `cfg`: the ForgeUI config
- `doc`: the parsed Tokens Studio document
- `outputs`: generated outputs (css/preset/themeFragment)

## Example plugins
- `examples/plugins/forgeui-plugin-banner.ts` — prepends a banner comment
- `examples/plugins/forgeui-plugin-prettier.ts` — formats generated TS with Prettier

## Notes
- Plugins are loaded using `jiti` so `.ts` plugins work in Node.
- Keep plugins deterministic: avoid timestamps/randomness.
