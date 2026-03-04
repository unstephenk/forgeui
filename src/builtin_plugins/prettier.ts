import type { ForgeUIPlugin } from "../plugins.js";

/**
 * Builtin plugin: prettier
 *
 * Formats generated TS/JS-ish outputs using Prettier (if installed).
 */
export function builtinPrettierPlugin(): ForgeUIPlugin {
  const plugin: ForgeUIPlugin = {
    name: "builtin:prettier",
    hooks: {
      async afterGenerate(ctx) {
        let prettier: any;
        try {
          prettier = await import("prettier");
        } catch {
          ctx.warn?.("prettier not installed; skipping formatting");
          return;
        }

        for (const [file, content] of Object.entries(ctx.outputs)) {
          if (!/\.(ts|js|cjs|mjs)$/.test(file)) continue;
          try {
            ctx.outputs[file] = await prettier.format(String(content), { parser: "typescript" });
          } catch (e: any) {
            ctx.warn?.(`prettier failed for ${file}: ${e?.message ?? String(e)}`);
          }
        }
      }
    },
    optionsSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    }
  };

  return plugin;
}
