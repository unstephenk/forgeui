import type { Theme, TokenLeaf, TokensStudioDoc } from "./types.js";
import { isObject, unwrapRef } from "./utils.js";

export type FlatToken = {
  path: string[];
  fqName: string; // joined with '.'
  leaf: TokenLeaf;
};

export function getThemes(doc: TokensStudioDoc): Theme[] {
  if (!Array.isArray(doc.$themes)) throw new Error("Invalid tokens: missing $themes[]");
  return doc.$themes;
}

export function listEnabledSetsForTheme(theme: Theme): string[] {
  const sel = theme.selectedTokenSets ?? {};
  const enabled = Object.entries(sel)
    .filter(([, v]) => v === "enabled")
    .map(([k]) => k);
  return enabled;
}

function isTokenLeaf(v: unknown): v is TokenLeaf {
  return isObject(v) && typeof v.$type === "string" && ("$value" in v);
}

export function flattenSetTokens(setObj: unknown, prefix: string[] = []): FlatToken[] {
  if (!isObject(setObj)) return [];
  const out: FlatToken[] = [];
  for (const [k, v] of Object.entries(setObj)) {
    const next = [...prefix, k];
    if (isTokenLeaf(v)) {
      out.push({ path: next, fqName: next.join("."), leaf: v });
    } else if (isObject(v)) {
      out.push(...flattenSetTokens(v, next));
    }
  }
  return out;
}

export function getTokenLeafAtPath(doc: TokensStudioDoc, pathStr: string): TokenLeaf {
  const parts = pathStr.split(".");
  let cur: unknown = doc;
  for (const p of parts) {
    if (!isObject(cur) || !(p in cur)) {
      throw new Error(`Bad token ref: {${pathStr}} (missing ${p})`);
    }
    cur = (cur as any)[p];
  }
  if (!isTokenLeaf(cur)) throw new Error(`Bad token ref: {${pathStr}} (not a token leaf)`);
  return cur;
}

export function resolveTokenValue(doc: TokensStudioDoc, leaf: TokenLeaf, themeName: string, stack: string[] = []): unknown {
  const v = leaf.$value;

  // If value is a theme map, select by theme name.
  if (isObject(v) && themeName in v) {
    const chosen = (v as any)[themeName];
    // chosen might itself be a ref string
    const ref = unwrapRef(chosen);
    if (ref) {
      if (stack.includes(ref)) throw new Error(`Cyclic token refs: ${[...stack, ref].join(" -> ")}`);
      const nextLeaf = getTokenLeafAtPath(doc, ref);
      return resolveTokenValue(doc, nextLeaf, themeName, [...stack, ref]);
    }
    return chosen;
  }

  // Direct ref
  const ref = unwrapRef(v);
  if (ref) {
    if (stack.includes(ref)) throw new Error(`Cyclic token refs: ${[...stack, ref].join(" -> ")}`);
    const nextLeaf = getTokenLeafAtPath(doc, ref);
    return resolveTokenValue(doc, nextLeaf, themeName, [...stack, ref]);
  }

  return v;
}
