#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import { cac } from "cac";

import { DEFAULT_CONFIG_FILES, configTemplate, loadConfig, resolveConfigPath } from "./config.js";
import { generateTailwindPreset, generateTokensCss, outPath } from "./generate.js";
import { loadPlugins, runHook } from "./plugins.js";
import { maybePrettifyTs } from "./prettier.js";
import { makeLock, makeManifest } from "./lock.js";
import type { TokensStudioDoc } from "./types.js";
import { ensureDir, readJsonFile, writeFile } from "./utils.js";
import { diffText } from "./textdiff.js";
import { validateTokensDoc } from "./validate.js";
import { generateTokenIndex } from "./docsgen.js";
import { generateTokensMarkdown } from "./docsmd.js";
import { asConfigSchema } from "./schema.js";
import { writeTokensTemplate } from "./template.js";
import { figmaPull } from "./figma.js";

function getForgeuiVersion(): string {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const raw = fs.readFileSync(pkgUrl, "utf8");
    return JSON.parse(raw).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const argv = process.argv.slice(2);
const GLOBAL = {
  quiet: argv.includes("--quiet"),
  json: argv.includes("--json"),
  strict: argv.includes("--strict"),
  warningsAsErrors: argv.includes("--warnings-as-errors"),
  debug: argv.includes("--debug")
};

function log(s: string) {
  if (!GLOBAL.quiet && !GLOBAL.json) console.log(s);
}

let _fatalHandled = false;
function fatal(e: unknown) {
  if (_fatalHandled) return;
  _fatalHandled = true;

  const err = e instanceof Error ? e : new Error(String(e));

  if (GLOBAL.json) {
    process.stdout.write(
      JSON.stringify({ ok: false, error: { message: err.message, ...(GLOBAL.debug ? { stack: err.stack } : {}) } }, null, 2) + "\n"
    );
  } else {
    // Keep it readable; stacks are for debugging.
    console.error(`[forgeui] ${err.message}`);
    if (GLOBAL.debug && err.stack) console.error(err.stack);
  }

  process.exitCode = 1;
}

process.on("unhandledRejection", fatal);
process.on("uncaughtException", fatal);

const cli = cac("forgeui");
cli.option("--quiet", "Suppress non-essential output");
cli.option("--json", "Output machine-readable JSON (where supported)");
cli.option("--strict", "Treat warnings as errors (non-zero exit)");
cli.option("--warnings-as-errors", "Exit non-zero if validation warnings exist (CI-friendly)");
cli.option("--debug", "Print stack traces for errors");
cli.option("--outDir <dir>", "Override output directory (instead of config outDir)");

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
    log(`Wrote ${file}`);

    // also create outDir from defaults
    ensureDir(path.resolve(process.cwd(), "forgeui"));
    log("Created ./forgeui/");
  });

async function runSync(params?: { config?: string; write?: boolean; outDir?: string }): Promise<{
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
  if (params?.outDir) cfg.outDir = params.outDir;

  const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
  if (!fs.existsSync(tokensAbs)) {
    throw new Error(`Tokens file not found: ${cfg.tokensPath}`);
  }
  const doc = readJsonFile<TokensStudioDoc>(tokensAbs);
  const validation = validateTokensDoc(doc, cfg);
  if ((GLOBAL.strict || GLOBAL.warningsAsErrors) && validation.warnings.length) {
    const first = validation.warnings[0];
    throw new Error(`Strict mode: ${validation.warnings.length} warning(s). First: ${first.code}: ${first.message}`);
  }

  const plugins = await loadPlugins(cfg);

  // Generate base outputs
  const cssRaw = generateTokensCss(doc, cfg);
  const genRaw = generateTailwindPreset(doc, cfg);

  // Expose outputs by *filename* (what actually gets written)
  const outputs: Record<string, string> = {
    [cfg.tailwind.cssFile]: cssRaw,
    [cfg.tailwind.presetFile]: genRaw.preset
  };
  if (cfg.tailwind.themeFile && genRaw.themeFragment) outputs[cfg.tailwind.themeFile] = genRaw.themeFragment;

  const warn = (msg: string) => {
    if (!GLOBAL.json) console.warn(`[forgeui plugin warning] ${msg}`);
  };

  // Run hooks
  await runHook(plugins, "beforeGenerate", {
    cfg,
    doc,
    outputs,
    warn,
    pluginOptions: undefined
  });

  for (const p of plugins) {
    (p as any).pluginOptions = (p as any).options;
  }

  await runHook(plugins, "afterGenerate", {
    cfg,
    doc,
    outputs,
    warn,
    pluginOptions: undefined
  });

  const css = outputs[cfg.tailwind.cssFile] ?? cssRaw;
  const preset = await maybePrettifyTs(outputs[cfg.tailwind.presetFile] ?? genRaw.preset, cfg.format?.prettier);
  const themeFragment = cfg.tailwind.themeFile
    ? outputs[cfg.tailwind.themeFile]
      ? await maybePrettifyTs(outputs[cfg.tailwind.themeFile], cfg.format?.prettier)
      : undefined
    : undefined;

  const cssPath = outPath(cfg, cfg.tailwind.cssFile);
  const presetPath = outPath(cfg, cfg.tailwind.presetFile);
  const themePath = cfg.tailwind.themeFile ? outPath(cfg, cfg.tailwind.themeFile) : null;
  const lockPath = outPath(cfg, "forgeui.lock.json");
  const manifestPath = outPath(cfg, "forgeui.manifest.json");

  if (params?.write !== false) {
    // print warnings (non-fatal)
    if (validation.warnings.length && !GLOBAL.json) {
      for (const w of validation.warnings) {
        const where = [w.theme ? `theme=${w.theme}` : null, w.token ? `token=${w.token}` : null]
          .filter(Boolean)
          .join(" ");
        console.warn(`[forgeui warning] ${w.code}${where ? ` (${where})` : ""}: ${w.message}`);
      }
    }

    // incremental: only write changed files
    const writeIfChanged = (p: string, next: string) => {
      const prev = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
      if (prev === next) return false;
      writeFile(p, next);
      return true;
    };

    writeIfChanged(cssPath, css);
    writeIfChanged(presetPath, preset);
    if (themePath && themeFragment) writeIfChanged(themePath, themeFragment);

    const v = getForgeuiVersion();
    const outputs = [cfg.tailwind.cssFile, cfg.tailwind.presetFile];
    if (cfg.tailwind.themeFile) outputs.push(cfg.tailwind.themeFile);
    outputs.push("forgeui.lock.json", "forgeui.manifest.json");

    const manifest = makeManifest({
      forgeuiVersion: v,
      cfg,
      configFile: cfgPath,
      tokensFile: cfg.tokensPath,
      doc,
      outputs
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
        ...(cfg.tailwind.themeFile && themePath ? { [cfg.tailwind.themeFile]: themePath } : {}),
        "forgeui.manifest.json": manifestPath
      }
    });

    writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n");

    const writtenAbs = [cssPath, presetPath, lockPath, manifestPath];
    if (themePath) writtenAbs.splice(2, 0, themePath);
    const written = writtenAbs.map((p) => path.relative(process.cwd(), p));
    if (GLOBAL.json) {
      process.stdout.write(
        JSON.stringify({ ok: true, written, warnings: validation.warnings, warningCount: validation.warnings.length }, null, 2) +
          "\n"
      );
    } else {
      for (const p of written) log(`Wrote ${p}`);
    }
  }

  return {
    cfgPath,
    tokensAbs,
    cssPath,
    presetPath,
    lockPath,
    manifestPath,
    css,
    preset,
    ...(themePath && themeFragment ? { themePath, themeFragment } : {})
  } as any;
}

cli
  .command("sync", "Generate tokens.css + Tailwind preset from Tokens Studio export")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--dry-run", "Do not write files; compute outputs only")
  .action(async (opts: { config?: string; dryRun?: boolean }) => {
    await runSync({ config: opts.config, write: !opts.dryRun, outDir: ((cli as any).opts?.() ?? {}).outDir });
  });

cli
  .command("watch", "Watch tokens file and re-run sync")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const watchPath = path.resolve(process.cwd(), cfg.tokensPath);
    log(`Watching ${path.relative(process.cwd(), watchPath)}...`);
    await runSync({ config: cfgPath, outDir: ((cli as any).opts?.() ?? {}).outDir });

    const w = chokidar.watch(watchPath, { ignoreInitial: true });
    w.on("all", async () => {
      try {
        await runSync({ config: cfgPath, outDir: ((cli as any).opts?.() ?? {}).outDir });
      } catch (e) {
        console.error(e);
      }
    });
  });

cli
  .command("diff", "Show what would change (tokens.css + preset + lock/manifest)")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    const res = await runSync({ config: opts.config, write: false, outDir: ((cli as any).opts?.() ?? {}).outDir });

    const existingCss = fs.existsSync(res.cssPath) ? fs.readFileSync(res.cssPath, "utf8") : "";
    const existingPreset = fs.existsSync(res.presetPath) ? fs.readFileSync(res.presetPath, "utf8") : "";

    const cssD = diffText({ before: existingCss, after: res.css, label: path.relative(process.cwd(), res.cssPath) });
    const presetD = diffText({
      before: existingPreset,
      after: res.preset,
      label: path.relative(process.cwd(), res.presetPath)
    });

    const out = [cssD, presetD].filter(Boolean).join("\n");
    const changedFiles = [
      { file: path.relative(process.cwd(), res.cssPath), changed: !!cssD },
      { file: path.relative(process.cwd(), res.presetPath), changed: !!presetD }
    ].filter((x) => x.changed);

    if (!out) {
      if (GLOBAL.json) process.stdout.write(JSON.stringify({ changed: false, files: [] }, null, 2) + "\n");
      else log("No changes.");
      process.exitCode = 0;
      return;
    }

    if (GLOBAL.json) {
      process.stdout.write(JSON.stringify({ changed: true, files: changedFiles.map((x) => x.file) }, null, 2) + "\n");
    } else {
      process.stdout.write(out);
    }

    process.exitCode = 1;
  });

cli
  .command("figma pull", "Fetch tokens JSON and write to your tokensPath")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--out <file>", "Override output file (defaults to config tokensPath)")
  .option("--url <url>", "Override FIGMA_TOKENS_URL")
  .option("--fileKey <key>", "Figma file key (alternate mode; uses Figma REST API)")
  .option("--nodeId <id>", "Figma node id (alternate mode; uses Figma REST API)")
  .option("--token <token>", "Override FIGMA_TOKEN")
  .option("--no-fetch", "Do not call network; use cached snapshot only", { default: false })
  .action(async (opts: {
    config?: string;
    out?: string;
    url?: string;
    fileKey?: string;
    nodeId?: string;
    token?: string;
    fetch?: boolean;
  }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    const outFile = opts.out ?? cfg.tokensPath;
    const res = await figmaPull({
      outFile,
      url: opts.url,
      fileKey: opts.fileKey,
      nodeId: opts.nodeId,
      token: opts.token,
      noFetch: opts.fetch === false,
    });

    if (GLOBAL.json) {
      process.stdout.write(
        JSON.stringify({ ok: true, written: res.written ? [outFile] : [], unchanged: !res.written }, null, 2) + "\n",
      );
    } else {
      if (res.written) log(`Wrote ${outFile}`);
      else log("No changes (cached). ");
    }
  });

cli
  .command("docs", "Generate token docs outputs")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--md", "Also write a markdown table (tokens.md)")
  .option("--group-order <list>", "Comma-separated namespace order for tokens.md (e.g. core,components)")
  .action(async (opts: { config?: string; md?: boolean; groupOrder?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
    const doc = readJsonFile<TokensStudioDoc>(tokensAbs);
    const validation = validateTokensDoc(doc, cfg);
    if ((GLOBAL.strict || GLOBAL.warningsAsErrors) && validation.warnings.length) {
      const first = validation.warnings[0];
      throw new Error(`Strict mode: ${validation.warnings.length} warning(s). First: ${first.code}: ${first.message}`);
    }

    const index = generateTokenIndex(doc, cfg);
    const outJson = outPath(cfg, "tokens.index.json");
    writeFile(outJson, JSON.stringify(index, null, 2) + "\n");

    const written: string[] = [path.relative(process.cwd(), outJson)];

    if (opts.md) {
      const outMd = outPath(cfg, "tokens.md");
      const order = opts.groupOrder
        ? String(opts.groupOrder)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      writeFile(outMd, generateTokensMarkdown(index, { groupOrder: order }));
      written.push(path.relative(process.cwd(), outMd));
    }

    if (GLOBAL.json) process.stdout.write(JSON.stringify({ ok: true, written }, null, 2) + "\n");
    else for (const w of written) log(`Wrote ${w}`);
  });

cli
  .command("schema", "Write forgeui config JSON schema (for editor IntelliSense)")
  .action(async () => {
    const schema = asConfigSchema();
    const out = path.resolve(process.cwd(), "forgeui.config.schema.json");
    writeFile(out, JSON.stringify(schema, null, 2) + "\n");
    if (GLOBAL.json) process.stdout.write(JSON.stringify({ ok: true, written: [path.relative(process.cwd(), out)] }, null, 2) + "\n");
    else log(`Wrote ${path.relative(process.cwd(), out)}`);
  });

cli
  .command("validate", "Validate tokens.json and print warnings")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
    const doc = readJsonFile<TokensStudioDoc>(tokensAbs);
    const validation = validateTokensDoc(doc, cfg);

    const warningCount = validation.warnings.length;

    if (GLOBAL.json) {
      process.stdout.write(JSON.stringify({ ok: warningCount === 0, warningCount, warnings: validation.warnings }, null, 2) + "\n");
    } else {
      if (!warningCount) {
        log("No warnings.");
      } else {
        for (const w of validation.warnings) {
          const where = [w.theme ? `theme=${w.theme}` : null, w.token ? `token=${w.token}` : null]
            .filter(Boolean)
            .join(" ");
          console.warn(`[forgeui warning] ${w.code}${where ? ` (${where})` : ""}: ${w.message}`);
        }
      }

      log(`Warnings: ${warningCount}`);
    }

    // validate is explicitly a checking command: exit non-zero when warnings exist.
    process.exitCode = warningCount ? 1 : 0;
  });

cli
  .command("template", "Write a starter Tokens Studio export (tokens.json)")
  .option("--out <path>", "Output path", { default: "tokens.json" })
  .option("--force", "Overwrite existing file")
  .action(async (opts: { out: string; force?: boolean }) => {
    const abs = writeTokensTemplate(opts.out, opts.force);
    if (GLOBAL.json) process.stdout.write(JSON.stringify({ ok: true, written: [path.relative(process.cwd(), abs)] }, null, 2) + "\n");
    else log(`Wrote ${path.relative(process.cwd(), abs)}`);
  });

cli.help();

cli.parse();
