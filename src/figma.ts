import fs from "node:fs";
import path from "node:path";

import { ensureDir } from "./utils.js";

type FigmaPullParams = {
  outFile: string;
  // Mode 1: direct URL to exported tokens JSON
  url?: string;
  // Mode 2: fetch a specific node and extract tokens from plugin data
  fileKey?: string;
  nodeId?: string;
  token?: string;
};

function tryParseJson(input: unknown): any | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function extractTokensStudioFromNodePayload(node: any): any | null {
  const doc = node?.document;
  if (!doc) return null;

  // Tokens Studio has historically used shared plugin data.
  const spd = doc.sharedPluginData ?? doc.sharedPluginMetadata ?? doc.pluginData ?? {};
  if (typeof spd !== "object" || spd == null) return null;

  const candidates = ["tokens-studio", "tokens", "tokensStudio", "token-studio"];
  for (const key of candidates) {
    const bucket = (spd as any)[key];
    if (!bucket) continue;

    // Try common field names.
    const direct = (bucket as any).tokens ?? (bucket as any).data ?? bucket;
    const parsed = tryParseJson(direct);
    if (parsed) return parsed;
    if (typeof direct === "object") return direct;
  }

  // Last resort: scan all buckets for something that looks like a TS export.
  for (const [k, bucket] of Object.entries(spd as any)) {
    const direct = (bucket as any)?.tokens ?? (bucket as any)?.data ?? bucket;
    const parsed = tryParseJson(direct);
    if (parsed && (parsed.$themes || parsed.$sets)) return parsed;
    if (direct && typeof direct === "object" && ((direct as any).$themes || (direct as any).$sets)) return direct;
  }

  return null;
}

type FigmaPullResult = {
  written: boolean;
  etag?: string | null;
  cacheKey?: string;
};

function cacheFilePath(cwd: string): string {
  return path.join(cwd, ".forgeui", "figma.pull.cache.json");
}

function readCache(cwd: string): Record<string, { etag?: string }> {
  const p = cacheFilePath(cwd);
  try {
    if (!fs.existsSync(p)) return {};
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
}

function writeCache(cwd: string, cache: Record<string, { etag?: string }>) {
  const p = cacheFilePath(cwd);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(cache, null, 2) + "\n", "utf8");
}

export async function figmaPull(params: FigmaPullParams): Promise<FigmaPullResult> {
  const url = params.url ?? process.env.FIGMA_TOKENS_URL;
  const token = params.token ?? process.env.FIGMA_TOKEN;
  const fileKey = params.fileKey ?? process.env.FIGMA_FILE_KEY;
  const nodeId = params.nodeId ?? process.env.FIGMA_NODE_ID;

  let json: any;

  const cwd = process.cwd();
  const cache = readCache(cwd);

  if (url) {
    const cacheKey = `url:${url}`;
    const etag = cache[cacheKey]?.etag;

    const res = await fetch(url, {
      headers: {
        ...(token ? { "X-Figma-Token": token } : {}),
        ...(etag ? { "If-None-Match": etag } : {})
      }
    });

    if (res.status === 304) {
      return { written: false, etag, cacheKey };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Failed to fetch tokens (HTTP ${res.status}). ${body ? `Body: ${body.slice(0, 200)}` : ""}`);
    }

    const nextEtag = res.headers.get("etag");
    if (nextEtag) {
      cache[cacheKey] = { etag: nextEtag };
      writeCache(cwd, cache);
    }

    json = await res.json();
  } else if (fileKey && nodeId) {
    if (!token) {
      throw new Error(
        [
          "Missing FIGMA_TOKEN.",
          "\n\nWhen using FIGMA_FILE_KEY + FIGMA_NODE_ID mode, a Figma personal access token is required.",
          "Set:",
          "  export FIGMA_TOKEN=\"...\"",
          "\nThen run:",
          "  forgeui figma pull --fileKey ... --nodeId ..."
        ].join("\n")
      );
    }

    const apiUrl = `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}`;
    const cacheKey = `node:${fileKey}:${nodeId}`;
    const etag = cache[cacheKey]?.etag;

    const res = await fetch(apiUrl, {
      headers: {
        "X-Figma-Token": token,
        ...(etag ? { "If-None-Match": etag } : {})
      }
    });

    if (res.status === 304) {
      return { written: false, etag, cacheKey };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Failed to fetch Figma node (HTTP ${res.status}). ${body ? `Body: ${body.slice(0, 200)}` : ""}`);
    }

    const nextEtag = res.headers.get("etag");
    if (nextEtag) {
      cache[cacheKey] = { etag: nextEtag };
      writeCache(cwd, cache);
    }

    const payload = await res.json();
    const node = payload?.nodes?.[nodeId];
    const extracted = extractTokensStudioFromNodePayload(node);

    if (!extracted) {
      const keys = Object.keys(node?.document?.sharedPluginData ?? {}).join(", ");
      throw new Error(
        [
          "Fetched the node, but could not find Tokens Studio data in plugin metadata.",
          "Try exporting via FIGMA_TOKENS_URL instead, or confirm the node contains Tokens Studio plugin data.",
          keys ? `Found sharedPluginData keys: ${keys}` : "No sharedPluginData keys found."
        ].join("\n")
      );
    }

    json = extracted;
  } else {
    throw new Error(
      [
        "Missing figma pull inputs.",
        "\nChoose ONE mode:",
        "\nMode A (recommended):",
        "  export FIGMA_TOKENS_URL=\"https://example.com/tokens.json\"",
        "\nMode B (Figma REST):",
        "  export FIGMA_FILE_KEY=\"...\"",
        "  export FIGMA_NODE_ID=\"...\"",
        "  export FIGMA_TOKEN=\"...\"",
        "\nThen run:",
        `  forgeui figma pull --out ${params.outFile}`
      ].join("\n")
    );
  }

  const outAbs = path.resolve(process.cwd(), params.outFile);
  ensureDir(path.dirname(outAbs));
  fs.writeFileSync(outAbs, JSON.stringify(json, null, 2) + "\n", "utf8");
  return { written: true };
}
