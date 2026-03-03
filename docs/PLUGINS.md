# Plugins (v1)

ForgeUI supports a small plugin system so you can customize generation without forking.

## Configure plugins
In `forgeui.config.*`:

```ts
export default {
  plugins: [
    {
      module: "./examples/plugins/forgeui-plugin-banner.ts",
      options: {
        banner: "Design tokens — do not edit"
      }
    }
  ]
}
```

- `module` can be a relative path (`./…`) or a package name.
- `options` are attached to the loaded plugin object as `plugin.options` (v1 convenience).

## Hooks
Plugins can implement the following hooks:

- `beforeGenerate(ctx)`
- `afterGenerate(ctx)`

The context:

```ts
type ForgeUIPluginContext = {
  cfg: ForgeUIConfig
  doc: TokensStudioDoc
  outputs?: {
    css?: string
    preset?: string
    themeFragment?: string
  }
}
```

### afterGenerate
`afterGenerate` is the most common: it lets you mutate generated output strings before they’re written.

Example: prefix a banner comment:

```ts
import type { ForgeUIPlugin } from "@forgeui/cli";

const plugin: ForgeUIPlugin = {
  hooks: {
    afterGenerate(ctx) {
      if (!ctx.outputs?.css) return;
      ctx.outputs.css = "/* hi */\n" + ctx.outputs.css;
    }
  }
};

export default plugin;
```

Example: mutate multiple outputs (CSS + preset) with options:

```ts
// see: examples/plugins/forgeui-plugin-rewrite.ts
export default {
  hooks: {
    afterGenerate(ctx) {
      // ctx.outputs.css / ctx.outputs.preset / ctx.outputs.themeFragment
    }
  }
}
```

## Gotchas
- Keep plugins deterministic (no timestamps/random) if you want stable diffs.
- Treat `ctx.doc` as read-only unless you *really* mean it.
