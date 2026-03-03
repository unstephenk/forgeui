import type { TokenLeaf, TokenType } from "./types.js";
import { isObject } from "./utils.js";

const TOKEN_TYPES: TokenType[] = [
  "color",
  "dimension",
  "shadow",
  "fontFamily",
  "fontSize",
  "lineHeight",
  "fontWeight"
];

export function isTokenType(v: unknown): v is TokenType {
  return typeof v === "string" && (TOKEN_TYPES as string[]).includes(v);
}

export function isTokenLeaf(v: unknown): v is TokenLeaf {
  return isObject(v) && isTokenType((v as any).$type) && ("$value" in (v as any));
}
