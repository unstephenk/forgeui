export async function maybePrettifyTs(code: string, enabled?: boolean): Promise<string> {
  if (!enabled) return code;
  try {
    const prettier = await import("prettier");
    return await prettier.format(code, { parser: "typescript" });
  } catch {
    // optional dependency; fall back to raw output
    return code;
  }
}
