import path from "node:path";
import jitiFactory from "jiti";

import type { ForgeUIConfig, TokensStudioDoc } from "./types.js";

export type ForgeUIPluginContext = {
  cfg: ForgeUIConfig;
  doc: TokensStudioDoc;
  outputs?: {
    css?: string;
    preset?: string;
    themeFragment?: string;
  };
};

export type ForgeUIPlugin = {
  name?: string;
  hooks?: {
    beforeGenerate?: (ctx: ForgeUIPluginContext) => void | Promise<void>;
    afterGenerate?: (ctx: ForgeUIPluginContext) => void | Promise<void>;
  };
};

export async function loadPlugins(cfg: ForgeUIConfig): Promise<ForgeUIPlugin[]> {
  const defs = cfg.plugins ?? [];
  if (!defs.length) return [];

  const jiti = jitiFactory(process.cwd(), { interopDefault: true });

  const plugins: ForgeUIPlugin[] = [];
  for (const def of defs) {
    const modPath = def.module;
    const abs = modPath.startsWith(".") ? path.resolve(process.cwd(), modPath) : modPath;

    const loaded = jiti(abs);
    const plugin: ForgeUIPlugin = (loaded?.default ?? loaded) as any;
    if (!plugin || typeof plugin !== "object") {
      throw new Error(`Invalid plugin module: ${modPath} (expected an object export)`);
    }

    // Attach options (non-standard but convenient for v1)
    (plugin as any).options = def.options;
    plugins.push(plugin);
  }

  return plugins;
}

export async function runHook(
  plugins: ForgeUIPlugin[],
  hook: "beforeGenerate" | "afterGenerate",
  ctx: ForgeUIPluginContext
): Promise<void> {
  for (const p of plugins) {
    const fn = p.hooks?.[hook];
    if (!fn) continue;
    await fn(ctx);
  }
}
