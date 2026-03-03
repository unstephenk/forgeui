import type { ForgeUIPlugin } from "../../src/plugins.js";

// Example plugin: formats generated TS outputs with Prettier.
// NOTE: requires `prettier` to be installed in the consuming project.

const plugin: ForgeUIPlugin<{ enabled?: boolean }> = {
  name: "prettier",

  async afterGenerate(ctx) {
    if (ctx.pluginOptions?.enabled === false) return;

    let prettier: any;
    try {
      prettier = await import("prettier");
    } catch {
      ctx.warn?.("prettier not installed; skipping formatting");
      return;
    }

    for (const [file, content] of Object.entries(ctx.outputs)) {
      if (!file.endsWith(".ts") && !file.endsWith(".js") && !file.endsWith(".cjs") && !file.endsWith(".mjs")) continue;
      try {
        ctx.outputs[file] = await prettier.format(String(content), { parser: "typescript" });
      } catch (e: any) {
        ctx.warn?.(`prettier failed for ${file}: ${e?.message ?? String(e)}`);
      }
    }
  }
};

export default plugin;
