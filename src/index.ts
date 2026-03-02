#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import { cac } from "cac";

import { DEFAULT_CONFIG_FILE, configTemplate, loadConfig } from "./config.js";
import { generateTailwindPreset, generateTokensCss, outPath } from "./generate.js";
import type { TokensStudioDoc } from "./types.js";
import { ensureDir, readJsonFile, writeFile } from "./utils.js";

const cli = cac("forgeui");

cli
  .command("init", "Create forgeui.config.ts and output folder")
  .option("--force", "Overwrite existing config")
  .action((opts: { force?: boolean }) => {
    const configPath = path.resolve(process.cwd(), DEFAULT_CONFIG_FILE);
    if (fs.existsSync(configPath) && !opts.force) {
      throw new Error(`${DEFAULT_CONFIG_FILE} already exists (use --force to overwrite)`);
    }
    fs.writeFileSync(configPath, configTemplate(), "utf8");
    console.log(`Wrote ${DEFAULT_CONFIG_FILE}`);

    // also create outDir from defaults
    ensureDir(path.resolve(process.cwd(), "forgeui"));
    console.log("Created ./forgeui/");
  });

async function runSync() {
  const cfg = await loadConfig();
  const doc = readJsonFile<TokensStudioDoc>(path.resolve(process.cwd(), cfg.tokensPath));

  const css = generateTokensCss(doc, cfg);
  const preset = generateTailwindPreset(doc, cfg);

  const cssPath = outPath(cfg, cfg.tailwind.cssFile);
  const presetPath = outPath(cfg, cfg.tailwind.presetFile);

  writeFile(cssPath, css);
  writeFile(presetPath, preset);

  console.log(`Wrote ${path.relative(process.cwd(), cssPath)}`);
  console.log(`Wrote ${path.relative(process.cwd(), presetPath)}`);
}

cli
  .command("sync", "Generate tokens.css + Tailwind preset from Tokens Studio export")
  .action(async () => {
    await runSync();
  });

cli
  .command("watch", "Watch tokens file and re-run sync")
  .action(async () => {
    const cfg = await loadConfig();
    const watchPath = path.resolve(process.cwd(), cfg.tokensPath);
    console.log(`Watching ${path.relative(process.cwd(), watchPath)}...`);
    await runSync();

    const w = chokidar.watch(watchPath, { ignoreInitial: true });
    w.on("all", async () => {
      try {
        await runSync();
      } catch (e) {
        console.error(e);
      }
    });
  });

cli.help();

cli.parse();
