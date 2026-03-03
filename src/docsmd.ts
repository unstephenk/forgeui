import type { TokenIndexEntry } from "./docsgen.js";

function mdEscape(s: string) {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function generateTokensMarkdown(index: { generatedAt: string; tokens: TokenIndexEntry[] }): string {
  const themeNames = new Set<string>();
  for (const t of index.tokens) for (const k of Object.keys(t.themes)) themeNames.add(k);
  const themes = Array.from(themeNames);

  const header = ["Token", "Type", "CSS Var", ...themes].join(" | ");
  const sep = ["---", "---", "---", ...themes.map(() => "---")].join(" | ");

  const rows = index.tokens.map((t) => {
    const vals = themes.map((th) => mdEscape(String(t.themes[th] ?? "")));
    return [mdEscape(t.token), mdEscape(t.type), mdEscape(t.cssVar), ...vals].join(" | ");
  });

  return [
    "# Tokens",
    "",
    `Generated: ${index.generatedAt}`,
    "",
    header,
    sep,
    ...rows,
    ""
  ].join("\n");
}
