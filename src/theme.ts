import type { ForgeUIConfig } from "./types.js";

export function themeFallbackChain(cfg: ForgeUIConfig, themeName: string): string[] {
  const chain: string[] = [themeName];
  const extra = cfg.themes.fallbacks?.[themeName] ?? [];
  for (const t of extra) if (!chain.includes(t)) chain.push(t);
  if (cfg.themes.rootTheme && !chain.includes(cfg.themes.rootTheme)) chain.push(cfg.themes.rootTheme);
  return chain;
}
