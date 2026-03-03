import type { ForgeUIConfig, Theme, TokenLeaf, TokensStudioDoc } from "./types.js";
import { flattenSetTokens, getThemes, getTokenLeafAtPath, listEnabledSetsForTheme } from "./tokens.js";
import { isObject, unwrapRef } from "./utils.js";
import { isThemeValueMap, isTokenType } from "./typeguards.js";

export type ForgeUIWarning = {
  code: string;
  message: string;
  token?: string;
  theme?: string;
};

function scanUnknownTokenTypes(setObj: unknown, prefix: string[], warnings: ForgeUIWarning[]) {
  if (!isObject(setObj)) return;
  for (const [k, v] of Object.entries(setObj)) {
    const next = [...prefix, k];
    if (isObject(v) && "$type" in v && "$value" in v) {
      const t = (v as any).$type;
      if (!isTokenType(t)) {
        warnings.push({
          code: "UNSUPPORTED_TOKEN_TYPE",
          message: `Token '${next.join(".")}' has unsupported $type '${String(t)}' (will be ignored).`,
          token: next.join(".")
        });
      }
    }
    if (isObject(v)) scanUnknownTokenTypes(v, next, warnings);
  }
}

function scanMissingTokenValues(setObj: unknown, prefix: string[], warnings: ForgeUIWarning[]) {
  if (!isObject(setObj)) return;
  for (const [k, v] of Object.entries(setObj)) {
    const next = [...prefix, k];

    // Tokens Studio leaves should generally be {$type, $value}. If a leaf has $type but no $value,
    // it's almost always an authoring error (or an incomplete export).
    if (isObject(v) && "$type" in v && !("$value" in v)) {
      warnings.push({
        code: "MISSING_TOKEN_VALUE",
        message: `Token '${next.join(".")}' is missing $value.`,
        token: next.join(".")
      });
    }

    if (isObject(v)) scanMissingTokenValues(v, next, warnings);
  }
}

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
      scanUnknownTokenTypes(setObj, [setName], warnings);
      scanMissingTokenValues(setObj, [setName], warnings);
      const flat = flattenSetTokens(setObj, [setName]);
      for (const t of flat) {
        const leaf: TokenLeaf = t.leaf;
        const v = leaf.$value;

        // Theme maps: ensure theme key exists when object-like
        if (isThemeValueMap(v, themes.map((th) => th.name)) && !(theme.name in (v as any))) {
          const fb = cfg?.themes.fallbacks?.[theme.name] ?? [];
          const hasFallback = fb.some((tname) => tname in (v as any)) || (cfg?.themes.rootTheme && cfg.themes.rootTheme in (v as any));
          warnings.push({
            code: "MISSING_THEME_VALUE",
            message: hasFallback
              ? `Token '${t.fqName}' is a theme map missing '${theme.name}' (will fall back).`
              : `Token '${t.fqName}' is a theme map but has no value for theme '${theme.name}'.`,
            token: t.fqName,
            theme: theme.name
          });
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
