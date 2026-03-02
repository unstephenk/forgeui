#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import { cac } from "cac";

import { DEFAULT_CONFIG_FILES, configTemplate, loadConfig, resolveConfigPath } from "./config.js";
import { generateTailwindPreset, generateTokensCss, outPath } from "./generate.js";
import { makeLock, makeManifest } from "./lock.js";
import type { TokensStudioDoc } from "./types.js";
import { ensureDir, readJsonFile, writeFile } from "./utils.js";
import { diffText } from "./textdiff.js";

function getForgeuiVersion(): string {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const raw = fs.readFileSync(pkgUrl, "utf8");
    return JSON.parse(raw).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const cli = cac("forgeui");

cli
  .command("init", `Create ${DEFAULT_CONFIG_FILES[0]} and output folder`)
  .option("--force", "Overwrite existing config")
  .option("--js", `Write ${DEFAULT_CONFIG_FILES[1]} instead of ${DEFAULT_CONFIG_FILES[0]}`)
  .action((opts: { force?: boolean; js?: boolean }) => {
    const file = opts.js ? DEFAULT_CONFIG_FILES[1] : DEFAULT_CONFIG_FILES[0];
    const configPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(configPath) && !opts.force) {
      throw new Error(`${file} already exists (use --force to overwrite)`);
    }
    fs.writeFileSync(configPath, configTemplate({ js: !!opts.js }), "utf8");
    console.log(`Wrote ${file}`);

    // also create outDir from defaults
    ensureDir(path.resolve(process.cwd(), "forgeui"));
    console.log("Created ./forgeui/");
  });

async function runSync(params?: { config?: string; write?: boolean }): Promise<{
  cfgPath: string;
  tokensAbs: string;
  cssPath: string;
  presetPath: string;
  lockPath: string;
  manifestPath: string;
  css: string;
  preset: string;
}> {
  const cfgPath = resolveConfigPath(params?.config);
  const cfg = await loadConfig(cfgPath);
  const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
  const doc = readJsonFile<TokensStudioDoc>(tokensAbs);

  const css = generateTokensCss(doc, cfg);
  const preset = generateTailwindPreset(doc, cfg);

  const cssPath = outPath(cfg, cfg.tailwind.cssFile);
  const presetPath = outPath(cfg, cfg.tailwind.presetFile);
  const lockPath = outPath(cfg, "forgeui.lock.json");
  const manifestPath = outPath(cfg, "forgeui.manifest.json");

  if (params?.write !== false) {
    writeFile(cssPath, css);
    writeFile(presetPath, preset);

    const v = getForgeuiVersion();
    const manifest = makeManifest({
      forgeuiVersion: v,
      cfg,
      configFile: cfgPath,
      tokensFile: cfg.tokensPath,
      doc,
      outputs: [cfg.tailwind.cssFile, cfg.tailwind.presetFile, "forgeui.lock.json", "forgeui.manifest.json"]
    });

    // write manifest first (so lock can include its hash if desired later)
    writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    const lock = makeLock({
      forgeuiVersion: v,
      configAbs: path.resolve(process.cwd(), cfgPath),
      tokensAbs,
      outputsAbs: {
        [cfg.tailwind.cssFile]: cssPath,
        [cfg.tailwind.presetFile]: presetPath,
        "forgeui.manifest.json": manifestPath
      }
    });

    writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n");

    console.log(`Wrote ${path.relative(process.cwd(), cssPath)}`);
    console.log(`Wrote ${path.relative(process.cwd(), presetPath)}`);
    console.log(`Wrote ${path.relative(process.cwd(), lockPath)}`);
    console.log(`Wrote ${path.relative(process.cwd(), manifestPath)}`);
  }

  return { cfgPath, tokensAbs, cssPath, presetPath, lockPath, manifestPath, css, preset };
}

cli
  .command("sync", "Generate tokens.css + Tailwind preset from Tokens Studio export")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    await runSync({ config: opts.config });
  });

cli
  .command("watch", "Watch tokens file and re-run sync")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const watchPath = path.resolve(process.cwd(), cfg.tokensPath);
    console.log(`Watching ${path.relative(process.cwd(), watchPath)}...`);
    await runSync({ config: cfgPath });

    const w = chokidar.watch(watchPath, { ignoreInitial: true });
    w.on("all", async () => {
      try {
        await runSync({ config: cfgPath });
      } catch (e) {
        console.error(e);
      }
    });
  });

cli
  .command("diff", "Show what would change (tokens.css + preset + lock/manifest)")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    const res = await runSync({ config: opts.config, write: false });

    const existingCss = fs.existsSync(res.cssPath) ? fs.readFileSync(res.cssPath, "utf8") : "";
    const existingPreset = fs.existsSync(res.presetPath) ? fs.readFileSync(res.presetPath, "utf8") : "";

    const cssD = diffText({ before: existingCss, after: res.css, label: path.relative(process.cwd(), res.cssPath) });
    const presetD = diffText({
      before: existingPreset,
      after: res.preset,
      label: path.relative(process.cwd(), res.presetPath)
    });

    const out = [cssD, presetD].filter(Boolean).join("\n");
    if (!out) {
      console.log("No changes.");
      process.exitCode = 0;
      return;
    }

    process.stdout.write(out);
    process.exitCode = 1;
  });

cli.help();

cli.parse();
