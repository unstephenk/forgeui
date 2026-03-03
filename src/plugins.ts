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
  // Internal metadata for better error messages.
  __forgeui?: {
    module: string;
    name: string;
  };
};

function pluginLabel(p: ForgeUIPlugin): string {
  const name = p.__forgeui?.name || p.name;
  const mod = p.__forgeui?.module;
  if (name && mod) return `${name} (${mod})`;
  if (name) return name;
  if (mod) return mod;
  return "<plugin>";
}

export async function loadPlugins(cfg: ForgeUIConfig): Promise<ForgeUIPlugin[]> {
  const defs = cfg.plugins ?? [];
  if (!defs.length) return [];

  const jiti = jitiFactory(process.cwd(), { interopDefault: true });

  const plugins: ForgeUIPlugin[] = [];
  for (const def of defs) {
    if (def.enabled === false) continue;

    const modPath = def.module;
    const abs = modPath.startsWith(".") ? path.resolve(process.cwd(), modPath) : modPath;

    let loaded: any;
    try {
      loaded = jiti(abs);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to load plugin ${def.name ? `${def.name} ` : ""}from ${modPath}. ${msg}`);
    }

    const plugin: ForgeUIPlugin = (loaded?.default ?? loaded) as any;
    if (!plugin || typeof plugin !== "object") {
      throw new Error(`Invalid plugin module: ${modPath} (expected an object export)`);
    }

    const name = def.name ?? plugin.name ?? modPath;
    plugin.__forgeui = { module: modPath, name };

    // Validate hook shapes early.
    for (const [k, v] of Object.entries(plugin.hooks ?? {})) {
      if (typeof v !== "function") {
        throw new Error(`Invalid hook ${k} in plugin ${pluginLabel(plugin)} (expected a function)`);
      }
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

    try {
      await fn(ctx);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Plugin ${pluginLabel(p)} failed in ${hook}: ${msg}`);
    }
  }
}
