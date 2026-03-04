import type { TokenLeaf, TokenType } from "./types.js";
import { isObject } from "./utils.js";

const TOKEN_TYPES: TokenType[] = [
  "color",
  "dimension",
  "shadow",
  "gradient",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "fontWeight",
  "typography",
  "border",
  "opacity",
  "zIndex",
  "duration"
];

export function isTokenType(v: unknown): v is TokenType {
  return typeof v === "string" && (TOKEN_TYPES as string[]).includes(v);
}

export function isTokenLeaf(v: unknown): v is TokenLeaf {
  return isObject(v) && isTokenType((v as any).$type) && ("$value" in (v as any));
}

export function isThemeValueMap(v: unknown, themeNames: string[]): v is Record<string, unknown> {
  if (!isObject(v)) return false;
  return themeNames.some((t) => t in v);
}
