const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function quoteString(s: string): string {
  // JSON.stringify gives us correct escaping; swap to single quotes for readability.
  const j = JSON.stringify(s);
  // j is double-quoted
  const body = j.slice(1, -1).replace(/'/g, "\\'");
  return `'${body}'`;
}

function formatKey(k: string): string {
  return IDENT.test(k) ? k : quoteString(k);
}

export function formatTs(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);

  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "string") return quoteString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => `${padIn}${formatTs(v, indent + 1)},`).join("\n");
    return `[` + `\n${items}\n${pad}]`;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";

    const lines = entries
      .map(([k, v]) => {
        return `${padIn}${formatKey(k)}: ${formatTs(v, indent + 1)},`;
      })
      .join("\n");

    return `{\n${lines}\n${pad}}`;
  }

  // Fallback for things like Date/BigInt/etc.
  return quoteString(String(value));
}
