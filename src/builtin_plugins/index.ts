import type { ForgeUIPlugin } from "../plugins.js";

import { builtinBannerPlugin } from "./banner.js";

export type BuiltinPluginFactory = () => ForgeUIPlugin;

export const builtinPluginRegistry: Record<string, BuiltinPluginFactory> = {
  banner: builtinBannerPlugin,
};

export function isBuiltinPluginName(name: string): boolean {
  return Boolean(builtinPluginRegistry[name]);
}

export function createBuiltinPlugin(name: string): ForgeUIPlugin {
  const f = builtinPluginRegistry[name];
  if (!f) throw new Error(`Unknown builtin plugin: ${name}`);
  return f();
}
