import fs from "node:fs";
import path from "node:path";

import { ensureDir } from "./utils.js";

export async function figmaPull(params: { outFile: string; url?: string; token?: string }): Promise<void> {
  const url = params.url ?? process.env.FIGMA_TOKENS_URL;
  const token = params.token ?? process.env.FIGMA_TOKEN;

  if (!url) {
    throw new Error(
      [
        "Missing FIGMA_TOKENS_URL.",
        "\n\nSet it to a URL that returns your Tokens Studio JSON export.",
        "Example:",
        "  export FIGMA_TOKENS_URL=\"https://example.com/tokens.json\"",
        "\nOptional:",
        "  export FIGMA_TOKEN=\"...\"  # sent as X-Figma-Token",
        "\nThen run:",
        `  forgeui figma pull --out ${params.outFile}`
      ].join("\n")
    );
  }

  const res = await fetch(url, {
    headers: {
      ...(token ? { "X-Figma-Token": token } : {})
    }
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch tokens (HTTP ${res.status}). ${body ? `Body: ${body.slice(0, 200)}` : ""}`);
  }

  const json = await res.json();
  const outAbs = path.resolve(process.cwd(), params.outFile);
  ensureDir(path.dirname(outAbs));
  fs.writeFileSync(outAbs, JSON.stringify(json, null, 2) + "\n", "utf8");
}
