// Minimal, line-based diff for human-readable CLI output.
// Not a full Myers diff; good enough for generated-file review.

function commonPrefixLen(a: string[], b: string[]): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  for (; i < n; i++) if (a[i] !== b[i]) break;
  return i;
}

function commonSuffixLen(a: string[], b: string[], prefix: number): number {
  const aLen = a.length - prefix;
  const bLen = b.length - prefix;
  const n = Math.min(aLen, bLen);
  let i = 0;
  for (; i < n; i++) {
    if (a[a.length - 1 - i] !== b[b.length - 1 - i]) break;
  }
  return i;
}

export function diffText(params: { before: string; after: string; label?: string }): string {
  const { before, after } = params;
  if (before === after) return "";

  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  const pre = commonPrefixLen(a, b);
  const suf = commonSuffixLen(a, b, pre);

  const aMid = a.slice(pre, a.length - suf);
  const bMid = b.slice(pre, b.length - suf);

  const out: string[] = [];
  out.push(`--- ${params.label ?? "before"}`);
  out.push(`+++ ${params.label ?? "after"}`);

  // Include 3 lines of context on each side.
  const ctx = 3;
  const start = Math.max(0, pre - ctx);
  const endA = Math.min(a.length, a.length - suf + ctx);
  const endB = Math.min(b.length, b.length - suf + ctx);

  out.push(`@@ -${start + 1},${endA - start} +${start + 1},${endB - start} @@`);

  for (let i = start; i < pre; i++) out.push(` ${a[i]}`);
  for (const line of aMid) out.push(`-${line}`);
  for (const line of bMid) out.push(`+${line}`);
  for (let i = a.length - suf; i < endA; i++) out.push(` ${a[i]}`);

  return out.join("\n") + "\n";
}
