import type { ForgeUIConfig, Theme, TokenLeaf, TokensStudioDoc } from "./types.js";
import { flattenSetTokens, getThemes, getTokenLeafAtPath, listEnabledSetsForTheme } from "./tokens.js";
import { isObject, unwrapRef } from "./utils.js";

export type ForgeUIWarning = {
  code: string;
  message: string;
  token?: string;
  theme?: string;
};

export function validateTokensDoc(doc: TokensStudioDoc, cfg?: ForgeUIConfig): { themes: Theme[]; warnings: ForgeUIWarning[] } {
  const warnings: ForgeUIWarning[] = [];

  if (!Array.isArray(doc.$themes) || doc.$themes.length === 0) {
    throw new Error("Invalid tokens: missing $themes[]");
  }

  const themes = getThemes(doc);

  // Validate enabled sets exist
  for (const theme of themes) {
    const enabled = listEnabledSetsForTheme(theme);
    for (const setName of enabled) {
      if (!(setName in (doc as any))) {
        warnings.push({
          code: "MISSING_SET",
          message: `Theme '${theme.name}' enables set '${setName}' but it is missing from the document.`,
          theme: theme.name
        });
      }
    }
  }

  // Validate refs + theme maps
  for (const theme of themes) {
    const enabled = listEnabledSetsForTheme(theme);
    for (const setName of enabled) {
      const setObj = (doc as any)[setName];
      const flat = flattenSetTokens(setObj, [setName]);
      for (const t of flat) {
        const leaf: TokenLeaf = t.leaf;
        const v = leaf.$value;

        // Theme maps: ensure theme key exists when object-like
        if (isObject(v)) {
          // If it looks like a theme map (contains any theme name), warn if missing this theme
          const looksLikeThemeMap = themes.some((th) => th.name in v);
          if (looksLikeThemeMap && !(theme.name in v)) {
            const fb = cfg?.themes.fallbacks?.[theme.name] ?? [];
            const hasFallback = fb.some((tname) => tname in v) || (cfg?.themes.rootTheme && cfg.themes.rootTheme in v);
            warnings.push({
              code: "MISSING_THEME_VALUE",
              message: hasFallback
                ? `Token '${t.fqName}' is a theme map missing '${theme.name}' (will fall back).`
                : `Token '${t.fqName}' is a theme map but has no value for theme '${theme.name}'.`,
              token: t.fqName,
              theme: theme.name
            });
          }
        }

        // Refs: check they point to something
        const ref = unwrapRef(v);
        if (ref) {
          try {
            getTokenLeafAtPath(doc, ref);
          } catch (e: any) {
            warnings.push({
              code: "DANGLING_REF",
              message: `Token '${t.fqName}' references '{${ref}}' but it cannot be resolved: ${e?.message ?? String(e)}`,
              token: t.fqName,
              theme: theme.name
            });
          }
        }
      }
    }
  }

  return { themes, warnings };
}
