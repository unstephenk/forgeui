import type { ForgeUIPlugin } from "@forgeui/cli";

/**
 * Example ForgeUI plugin:
 * - Demonstrates mutating multiple outputs (css + preset)
 * - Demonstrates reading and validating plugin options
 */
const plugin: ForgeUIPlugin = {
  name: "example-rewrite",
  hooks: {
    afterGenerate(ctx) {
      const opts = (plugin as any).options ?? {};
      const banner = opts.banner != null ? String(opts.banner) : null;

      if (banner) {
        if (ctx.outputs?.css) ctx.outputs.css = `/* ${banner} */\n` + ctx.outputs.css;
        if (ctx.outputs?.preset) ctx.outputs.preset = `/* ${banner} */\n` + ctx.outputs.preset;
      }

      // Tiny, deterministic rewrite example.
      const replace = opts.replaceCssVarPrefix;
      if (typeof replace === "string" && replace.length) {
        if (ctx.outputs?.css) ctx.outputs.css = ctx.outputs.css.replaceAll("--core-", replace);
      }
    }
  }
};

export default plugin;
