import type { TokenIndexEntry } from "./docsgen.js";

function mdEscape(s: string) {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function namespaceOf(token: string) {
  const first = String(token ?? "").split(".")[0];
  return first || "other";
}

function mdTable(themes: string[], rows: string[][]): string[] {
  const header = ["Token", "Type", "CSS Var", ...themes].join(" | ");
  const sep = ["---", "---", "---", ...themes.map(() => "---")].join(" | ");

  return [
    header,
    sep,
    ...rows.map((r) => r.map((x) => mdEscape(String(x))).join(" | ")),
    ""
  ];
}

export function generateTokensMarkdown(index: { generatedAt: string; tokens: TokenIndexEntry[] }): string {
  const themeNames = new Set<string>();
  for (const t of index.tokens) for (const k of Object.keys(t.themes)) themeNames.add(k);
  const themes = Array.from(themeNames).sort();

  const groups = new Map<string, TokenIndexEntry[]>();
  for (const t of index.tokens) {
    const ns = namespaceOf(t.token);
    if (!groups.has(ns)) groups.set(ns, []);
    groups.get(ns)!.push(t);
  }

  const nsList = Array.from(groups.keys()).sort();

  const out: string[] = [];
  out.push("# Tokens");
  out.push("");
  out.push(`Generated: ${index.generatedAt}`);
  out.push("");

  // Quick index
  out.push("## Index");
  out.push("");
  for (const ns of nsList) {
    out.push(`- [${mdEscape(ns)}](#${mdEscape(ns.toLowerCase())}) (${groups.get(ns)!.length})`);
  }
  out.push("");

  for (const ns of nsList) {
    const items = groups.get(ns)!;
    out.push(`## ${mdEscape(ns)}`);
    out.push("");

    const rows = items
      .slice()
      .sort((a, b) => String(a.token).localeCompare(String(b.token)))
      .map((t) => {
        const vals = themes.map((th) => String(t.themes[th] ?? ""));
        return [t.token, t.type, t.cssVar, ...vals];
      });

    out.push(...mdTable(themes, rows));
  }

  return out.join("\n");
}
