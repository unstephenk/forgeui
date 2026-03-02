import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ForgeUIConfig, TokensStudioDoc } from "./types.js";
import { getThemes, listEnabledSetsForTheme } from "./tokens.js";

export type ForgeUILock = {
  forgeuiVersion: string;
  createdAt: string;
  inputs: {
    configFile: string;
    tokensFile: string;
    configSha256: string;
    tokensSha256: string;
  };
  outputs: Record<string, { sha256: string; bytes: number }>;
};

export type ForgeUIManifest = {
  forgeuiVersion: string;
  createdAt: string;
  configFile: string;
  tokensFile: string;
  outDir: string;
  themes: string[];
  enabledSetsByTheme: Record<string, string[]>;
  outputs: string[];
};

export function sha256OfString(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

export function sha256OfFile(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function makeManifest(params: {
  forgeuiVersion: string;
  cfg: ForgeUIConfig;
  configFile: string;
  tokensFile: string;
  doc: TokensStudioDoc;
  outputs: string[];
}): ForgeUIManifest {
  const themes = getThemes(params.doc);
  const enabledSetsByTheme: Record<string, string[]> = {};
  for (const t of themes) enabledSetsByTheme[t.name] = listEnabledSetsForTheme(t);

  return {
    forgeuiVersion: params.forgeuiVersion,
    createdAt: new Date().toISOString(),
    configFile: params.configFile,
    tokensFile: params.tokensFile,
    outDir: params.cfg.outDir,
    themes: themes.map((t) => t.name),
    enabledSetsByTheme,
    outputs: params.outputs
  };
}

export function makeLock(params: {
  forgeuiVersion: string;
  configAbs: string;
  tokensAbs: string;
  outputsAbs: Record<string, string>;
}): ForgeUILock {
  const outputs: ForgeUILock["outputs"] = {};
  for (const [rel, abs] of Object.entries(params.outputsAbs)) {
    const buf = fs.readFileSync(abs);
    outputs[rel] = {
      sha256: crypto.createHash("sha256").update(buf).digest("hex"),
      bytes: buf.byteLength
    };
  }

  return {
    forgeuiVersion: params.forgeuiVersion,
    createdAt: new Date().toISOString(),
    inputs: {
      configFile: path.basename(params.configAbs),
      tokensFile: path.basename(params.tokensAbs),
      configSha256: sha256OfFile(params.configAbs),
      tokensSha256: sha256OfFile(params.tokensAbs)
    },
    outputs
  };
}
