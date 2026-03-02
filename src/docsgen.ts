import type { ForgeUIConfig, TokensStudioDoc } from "./types.js";
import { flattenSetTokens, getThemes, listEnabledSetsForTheme, resolveTokenValue } from "./tokens.js";
import { themeFallbackChain } from "./theme.js";
import { toKebab } from "./utils.js";

export type TokenIndexEntry = {
  token: string;
  type: string;
  cssVar: string;
  themes: Record<string, unknown>;
};

export function generateTokenIndex(doc: TokensStudioDoc, cfg: ForgeUIConfig): { generatedAt: string; tokens: TokenIndexEntry[] } {
  const themes = getThemes(doc);
  const out: TokenIndexEntry[] = [];

  // Union of enabled sets across themes (so index is complete)
  const enabledSets = Array.from(
    new Set(
      themes.flatMap((t) => listEnabledSetsForTheme(t)).filter((s) => (cfg.filter?.sets?.length ? cfg.filter.sets.includes(s) : true))
    )
  );

  for (const setName of enabledSets) {
    const flat = flattenSetTokens((doc as any)[setName], [setName]);
    for (const t of flat) {
      const cssVar = `--${toKebab(t.path)}`;
      const themesMap: Record<string, unknown> = {};
      for (const th of themes) {
        themesMap[th.name] = resolveTokenValue(doc, t.leaf, th.name, [], t.fqName, themeFallbackChain(cfg, th.name));
      }
      out.push({ token: t.fqName, type: t.leaf.$type, cssVar, themes: themesMap });
    }
  }

  // stable ordering
  out.sort((a, b) => a.token.localeCompare(b.token));

  return { generatedAt: new Date().toISOString(), tokens: out };
}
