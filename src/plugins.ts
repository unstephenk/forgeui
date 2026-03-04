import path from "node:path";
import jitiFactory from "jiti";

import type { ForgeUIConfig, TokensStudioDoc } from "./types.js";
import { validatePluginOptions } from "./plugins_schema.js";
import { createBuiltinPlugin, isBuiltinPluginName, listBuiltinPlugins } from "./builtin_plugins/index.js";

export type ForgeUIPluginContext = {
  cfg: ForgeUIConfig;
  doc: TokensStudioDoc;
  // Outputs are keyed by the *output filename* in outDir.
  // e.g. { "tokens.css": "...", "forgeui.preset.ts": "..." }
  outputs: Record<string, string>;
  warn?: (msg: string) => void;
  pluginOptions?: Record<string, unknown>;
};

export type ForgeUIPlugin<TOptions extends Record<string, unknown> = Record<string, unknown>> = {
  name?: string;
  hooks?: {
    beforeGenerate?: (ctx: ForgeUIPluginContext) => void | Promise<void>;
    afterGenerate?: (ctx: ForgeUIPluginContext) => void | Promise<void>;
  };
  // Optional: validate plugin options and throw a readable error.
  validateOptions?: (options: TOptions) => void;
  // Optional: JSON Schema for plugin options (validated by ForgeUI if provided)
  optionsSchema?: unknown;
  // Internal metadata for better error messages.
  __forgeui?: {
    module: string;
    name: string;
  };
  // Non-standard convenience: we attach config options here at load time.
  options?: TOptions;
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

    let plugin: ForgeUIPlugin;
    if (isBuiltinPluginName(modPath)) {
      plugin = createBuiltinPlugin(modPath);
    } else {
      const abs = modPath.startsWith(".") ? path.resolve(process.cwd(), modPath) : modPath;

      let loaded: any;
      try {
        loaded = jiti(abs);
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        const builtins = listBuiltinPlugins();
        const hint = builtins.length ? ` If you meant a builtin plugin, use one of: ${builtins.join(", ")}.` : "";
        throw new Error(`Failed to load plugin ${def.name ? `${def.name} ` : ""}from ${modPath}. ${msg}.${hint}`);
      }

      plugin = (loaded?.default ?? loaded) as any;
    }
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
    (plugin as any).options = def.options ?? {};

    // Validate options if plugin provides a schema
    if ((plugin as any).optionsSchema) {
      const res = validatePluginOptions((plugin as any).optionsSchema, (plugin as any).options);
      if (!res.ok) throw new Error(`Invalid options for plugin ${pluginLabel(plugin)}: ${res.error}`);
    }

    // Validate options if plugin provides a validator
    if (typeof (plugin as any).validateOptions === "function") {
      try {
        (plugin as any).validateOptions((plugin as any).options);
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Invalid options for plugin ${pluginLabel(plugin)}: ${msg}`);
      }
    }

    plugins.push(plugin);
  }

  return plugins;
}

export async function runHook(
  plugins: ForgeUIPlugin[],
  hook: "beforeGenerate" | "afterGenerate",
  baseCtx: ForgeUIPluginContext
): Promise<void> {
  for (const p of plugins) {
    const fn = p.hooks?.[hook];
    if (!fn) continue;

    // per-plugin context includes pluginOptions
    const ctx: ForgeUIPluginContext = {
      ...baseCtx,
      pluginOptions: (p as any).options ?? {}
    };

    try {
      await fn(ctx);
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Plugin ${pluginLabel(p)} failed in ${hook}: ${msg}`);
    }
  }
}
