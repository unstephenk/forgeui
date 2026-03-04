#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import { cac } from "cac";

import { DEFAULT_CONFIG_FILES, configTemplate, loadConfig, resolveConfigPath } from "./config.js";
import { generateTailwindPreset, generateTokensCss, outPath } from "./generate.js";
import { loadPlugins, runHook } from "./plugins.js";
import { listBuiltinPlugins } from "./builtin_plugins/index.js";
import { maybePrettifyTs } from "./prettier.js";

async function prettierFormat(code: string, parser: "typescript" | "css" | "json" | "markdown"): Promise<string> {
  const prettier = await import("prettier");
  return await prettier.format(code, { parser });
}
import { makeLockFromContents, makeManifest } from "./lock.js";
import type { TokensStudioDoc } from "./types.js";
import { ensureDir, readJsonFile, writeFile } from "./utils.js";
import { diffText } from "./textdiff.js";
import { validateTokensDoc } from "./validate.js";
import { generateTokenIndex } from "./docsgen.js";
import { generateTokensMarkdown } from "./docsmd.js";
import { asConfigSchema } from "./schema.js";
import { writeTokensTemplate } from "./template.js";
import { figmaPull } from "./figma.js";
import { isTokenType } from "./typeguards.js";

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

function parseCsvList(v?: string): string[] | undefined {
  if (v == null) return undefined;
  const out = String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return out.length ? out : undefined;
}

function applyTypesOverride(cfg: any, typesCsv?: string) {
  const types = parseCsvList(typesCsv);
  if (!types) return;

  const invalid = types.filter((t) => !isTokenType(t));
  if (invalid.length) {
    throw new Error(`Invalid --types value(s): ${invalid.join(", ")}`);
  }

  cfg.filter ??= {};
  cfg.filter.types = types;
}

function applySetsOverride(cfg: any, setsCsv?: string) {
  const sets = parseCsvList(setsCsv);
  if (!sets) return;

  cfg.filter ??= {};
  cfg.filter.sets = sets;
}

function applyIncludeExcludeOverride(cfg: any, params?: { include?: string; exclude?: string }) {
  const include = parseCsvList(params?.include);
  const exclude = parseCsvList(params?.exclude);

  if (!include && !exclude) return;

  cfg.filter ??= {};
  if (include) cfg.filter.include = include;
  if (exclude) cfg.filter.exclude = exclude;
}

function applyFormatOverride(cfg: any, format?: boolean) {
  if (!format) return;
  cfg.format ??= {};
  cfg.format.prettier = true;
}

async function runSync(params?: {
  config?: string;
  write?: boolean;
  outDir?: string;
  types?: string;
  sets?: string;
  include?: string;
  exclude?: string;
  format?: boolean;
  theme?: string;
}): Promise<{
  cfgPath: string;
  tokensAbs: string;
  cssPath: string;
  presetPath: string;
  lockPath: string;
  manifestPath: string;
  css: string;
  preset: string;
  manifestJson: string;
  lockJson: string;
  themePath?: string;
  themeFragment?: string;
}> {
  const cfgPath = resolveConfigPath(params?.config);
  const cfg = await loadConfig(cfgPath);
  if (params?.outDir) cfg.outDir = params.outDir;

  applyTypesOverride(cfg, params?.types);
  applySetsOverride(cfg, params?.sets);
  applyIncludeExcludeOverride(cfg, { include: params?.include, exclude: params?.exclude });
  applyFormatOverride(cfg, params?.format);

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
  const cssRaw = generateTokensCss(doc, cfg, params?.theme ? { theme: params.theme } : undefined);
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
    pluginOptions: undefined,
    debug: GLOBAL.debug,
    debugLog: log
  });

  for (const p of plugins) {
    (p as any).pluginOptions = (p as any).options;
  }

  await runHook(plugins, "afterGenerate", {
    cfg,
    doc,
    outputs,
    warn,
    pluginOptions: undefined,
    debug: GLOBAL.debug,
    debugLog: log
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

  const v = getForgeuiVersion();
  const outputFiles = [cfg.tailwind.cssFile, cfg.tailwind.presetFile];
  if (cfg.tailwind.themeFile) outputFiles.push(cfg.tailwind.themeFile);
  outputFiles.push("forgeui.lock.json", "forgeui.manifest.json");

  const manifest = makeManifest({
    forgeuiVersion: v,
    cfg,
    configFile: cfgPath,
    tokensFile: cfg.tokensPath,
    doc,
    outputs: outputFiles
  });
  const manifestJson = JSON.stringify(manifest, null, 2) + "\n";

  const lock = makeLockFromContents({
    forgeuiVersion: v,
    configAbs: path.resolve(process.cwd(), cfgPath),
    tokensAbs,
    outputs: {
      [cfg.tailwind.cssFile]: css,
      [cfg.tailwind.presetFile]: preset,
      ...(cfg.tailwind.themeFile && themeFragment ? { [cfg.tailwind.themeFile]: themeFragment } : {}),
      "forgeui.manifest.json": manifestJson
    }
  });
  const lockJson = JSON.stringify(lock, null, 2) + "\n";

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
    writeIfChanged(manifestPath, manifestJson);
    writeIfChanged(lockPath, lockJson);

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
    manifestJson,
    lockJson,
    ...(themePath && themeFragment ? { themePath, themeFragment } : {})
  } as any;
}

cli
  .command("sync", "Generate tokens.css + Tailwind preset from Tokens Studio export")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--dry-run", "Do not write files; compute outputs only")
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .option("--theme <name>", "Generate CSS vars for a single theme only (debug/speed)")
  .option("--format", "Enable prettier formatting for generated TS outputs (shorthand for config.format.prettier=true)")
  .action(
    async (opts: {
      config?: string;
      dryRun?: boolean;
      types?: string;
      sets?: string;
      include?: string;
      exclude?: string;
      theme?: string;
      format?: boolean;
    }) => {
      await runSync({
        config: opts.config,
        write: !opts.dryRun,
        outDir: ((cli as any).opts?.() ?? {}).outDir,
        types: opts.types,
        sets: opts.sets,
        include: opts.include,
        exclude: opts.exclude,
        theme: opts.theme,
        format: opts.format
      });
    }
  );

cli
  .command("watch", "Watch tokens file and re-run sync")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .option("--theme <name>", "Generate CSS vars for a single theme only (debug/speed)")
  .option("--format", "Enable prettier formatting for generated TS outputs (shorthand for config.format.prettier=true)")
  .action(async (opts: { config?: string; types?: string; sets?: string; include?: string; exclude?: string; theme?: string; format?: boolean }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    applyTypesOverride(cfg, opts.types);
    applySetsOverride(cfg, opts.sets);
    applyIncludeExcludeOverride(cfg, { include: opts.include, exclude: opts.exclude });
    applyFormatOverride(cfg, opts.format);

    const watchPath = path.resolve(process.cwd(), cfg.tokensPath);
    log(`Watching ${path.relative(process.cwd(), watchPath)}...`);
    await runSync({
      config: cfgPath,
      outDir: ((cli as any).opts?.() ?? {}).outDir,
      types: opts.types,
      sets: opts.sets,
      include: opts.include,
      exclude: opts.exclude,
      theme: opts.theme,
      format: opts.format
    });

    const w = chokidar.watch(watchPath, { ignoreInitial: true });
    w.on("all", async () => {
      try {
        await runSync({
          config: cfgPath,
          outDir: ((cli as any).opts?.() ?? {}).outDir,
          types: opts.types,
          sets: opts.sets,
          include: opts.include,
          exclude: opts.exclude,
          theme: opts.theme,
          format: opts.format
        });
      } catch (e) {
        console.error(e);
      }
    });
  });

cli
  .command("diff", "Show what would change (tokens.css + preset + lock/manifest)")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .option("--theme <name>", "Generate CSS vars for a single theme only (debug/speed)")
  .option("--format", "Enable prettier formatting for generated TS outputs (shorthand for config.format.prettier=true)")
  .action(async (opts: { config?: string; types?: string; sets?: string; include?: string; exclude?: string; theme?: string; format?: boolean }) => {
    const res = await runSync({
      config: opts.config,
      write: false,
      outDir: ((cli as any).opts?.() ?? {}).outDir,
      types: opts.types,
      sets: opts.sets,
      include: opts.include,
      exclude: opts.exclude,
      theme: opts.theme,
      format: opts.format
    });

    const diffs: { file: string; diff: string }[] = [];

    {
      const existingCss = fs.existsSync(res.cssPath) ? fs.readFileSync(res.cssPath, "utf8") : "";
      const d =
        diffText({ before: existingCss, after: res.css, label: path.relative(process.cwd(), res.cssPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.cssPath), diff: d });
    }

    {
      const existingPreset = fs.existsSync(res.presetPath) ? fs.readFileSync(res.presetPath, "utf8") : "";
      const d =
        diffText({ before: existingPreset, after: res.preset, label: path.relative(process.cwd(), res.presetPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.presetPath), diff: d });
    }

    if (res.themePath && res.themeFragment != null) {
      const existingTheme = fs.existsSync(res.themePath) ? fs.readFileSync(res.themePath, "utf8") : "";
      const d =
        diffText({ before: existingTheme, after: res.themeFragment, label: path.relative(process.cwd(), res.themePath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.themePath), diff: d });
    }

    {
      const existingManifest = fs.existsSync(res.manifestPath) ? fs.readFileSync(res.manifestPath, "utf8") : "";
      const d =
        diffText({
          before: existingManifest,
          after: res.manifestJson,
          label: path.relative(process.cwd(), res.manifestPath)
        }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.manifestPath), diff: d });
    }

    {
      const existingLock = fs.existsSync(res.lockPath) ? fs.readFileSync(res.lockPath, "utf8") : "";
      const d = diffText({ before: existingLock, after: res.lockJson, label: path.relative(process.cwd(), res.lockPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.lockPath), diff: d });
    }

    const out = diffs
      .map((x) => x.diff)
      .filter(Boolean)
      .join("\n");

    const changedFiles = diffs.filter((x) => !!x.diff).map((x) => x.file);

    if (!out) {
      if (GLOBAL.json) process.stdout.write(JSON.stringify({ changed: false, files: [] }, null, 2) + "\n");
      else log("No changes.");
      process.exitCode = 0;
      return;
    }

    if (GLOBAL.json) {
      process.stdout.write(JSON.stringify({ changed: true, files: changedFiles }, null, 2) + "\n");
    } else {
      process.stdout.write(out);
    }

    process.exitCode = 1;
  });

cli
  .command("figma pull", "Fetch tokens JSON and write to your tokensPath")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--out <file>", "Override extracted output file (defaults to config tokensPath)")
  .option("--raw <file>", "Also write the raw response/payload JSON")
  .option("--url <url>", "Override FIGMA_TOKENS_URL")
  .option("--fileKey <key>", "Figma file key (alternate mode; uses Figma REST API)")
  .option("--nodeId <id>", "Figma node id (alternate mode; uses Figma REST API)")
  .option("--token <token>", "Override FIGMA_TOKEN")
  .option("--cache-dir <dir>", "Override cache directory (defaults to ./.forgeui; useful for CI)")
  .option("--no-fetch", "Do not call network; use cached snapshot only", { default: false })
  .action(async (opts: {
    config?: string;
    out?: string;
    raw?: string;
    url?: string;
    fileKey?: string;
    nodeId?: string;
    token?: string;
    cacheDir?: string;
    fetch?: boolean;
  }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    const outFile = opts.out ?? cfg.tokensPath;
    const res = await figmaPull({
      outFile,
      rawOutFile: opts.raw,
      url: opts.url,
      fileKey: opts.fileKey,
      nodeId: opts.nodeId,
      token: opts.token,
      cacheDir: opts.cacheDir,
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
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .action(async (opts: { config?: string; md?: boolean; groupOrder?: string; types?: string; sets?: string; include?: string; exclude?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const outDir = ((cli as any).opts?.() ?? {}).outDir ?? cfg.outDir;

    applyTypesOverride(cfg, opts.types);
    applySetsOverride(cfg, opts.sets);
    applyIncludeExcludeOverride(cfg, { include: opts.include, exclude: opts.exclude });

    const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
    const doc = readJsonFile<TokensStudioDoc>(tokensAbs);
    const validation = validateTokensDoc(doc, cfg);
    if ((GLOBAL.strict || GLOBAL.warningsAsErrors) && validation.warnings.length) {
      const first = validation.warnings[0];
      throw new Error(`Strict mode: ${validation.warnings.length} warning(s). First: ${first.code}: ${first.message}`);
    }

    const index = generateTokenIndex(doc, cfg);
    const outJson = outPath({ ...cfg, outDir }, "tokens.index.json");
    writeFile(outJson, JSON.stringify(index, null, 2) + "\n");

    const written: string[] = [path.relative(process.cwd(), outJson)];

    if (opts.md) {
      const outMd = outPath({ ...cfg, outDir }, "tokens.md");
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
  .command("fmt", "Format generated outputs in outDir (prettier)")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--check", "Exit non-zero if formatting would change any file")
  .action(async (opts: { config?: string; check?: boolean }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const outDir = ((cli as any).opts?.() ?? {}).outDir ?? cfg.outDir;

    const candidates = [
      outPath({ ...cfg, outDir }, cfg.tailwind.cssFile),
      outPath({ ...cfg, outDir }, cfg.tailwind.presetFile),
      ...(cfg.tailwind.themeFile ? [outPath({ ...cfg, outDir }, cfg.tailwind.themeFile)] : []),
      outPath({ ...cfg, outDir }, "forgeui.lock.json"),
      outPath({ ...cfg, outDir }, "forgeui.manifest.json"),
      outPath({ ...cfg, outDir }, "tokens.index.json"),
      outPath({ ...cfg, outDir }, "tokens.md"),
    ];

    const files = candidates.filter((p) => fs.existsSync(p));
    if (!files.length) {
      if (!GLOBAL.json) log(`No generated files found in ${path.relative(process.cwd(), outDir) || "."}`);
      process.exitCode = 0;
      return;
    }

    const changed: string[] = [];

    for (const abs of files) {
      const ext = path.extname(abs).toLowerCase();
      const prev = fs.readFileSync(abs, "utf8");

      let next = prev;
      if (ext === ".ts" || ext === ".js" || ext === ".mjs" || ext === ".cjs") {
        next = await prettierFormat(prev, "typescript");
      } else if (ext === ".css") {
        next = await prettierFormat(prev, "css");
      } else if (ext === ".json") {
        next = await prettierFormat(prev, "json");
      } else if (ext === ".md") {
        next = await prettierFormat(prev, "markdown");
      }

      if (next !== prev) {
        changed.push(path.relative(process.cwd(), abs));
        if (!opts.check) writeFile(abs, next);
      }
    }

    if (GLOBAL.json) {
      process.stdout.write(JSON.stringify({ ok: changed.length === 0, changed }, null, 2) + "\n");
    } else {
      if (!changed.length) log("Already formatted.");
      else {
        for (const f of changed) log(`${opts.check ? "Would format" : "Formatted"} ${f}`);
      }
    }

    process.exitCode = opts.check ? (changed.length ? 1 : 0) : 0;
  });

cli
  .command("clean", "Remove generated files (outDir) and local caches")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--dry-run", "Show what would be removed, but do not delete")
  .option("--no-cache", "Do not remove the ./.forgeui cache directory")
  .option("--keep-cache", "Alias for --no-cache", { default: false })
  .action(async (opts: { config?: string; dryRun?: boolean; cache?: boolean; keepCache?: boolean }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);
    const outDir = ((cli as any).opts?.() ?? {}).outDir ?? cfg.outDir;

    const candidates = [
      outPath({ ...cfg, outDir }, cfg.tailwind.cssFile),
      outPath({ ...cfg, outDir }, cfg.tailwind.presetFile),
      ...(cfg.tailwind.themeFile ? [outPath({ ...cfg, outDir }, cfg.tailwind.themeFile)] : []),
      outPath({ ...cfg, outDir }, "forgeui.lock.json"),
      outPath({ ...cfg, outDir }, "forgeui.manifest.json"),
      outPath({ ...cfg, outDir }, "tokens.index.json"),
      outPath({ ...cfg, outDir }, "tokens.md"),
    ];

    const removed: string[] = [];

    for (const abs of candidates) {
      if (!fs.existsSync(abs)) continue;
      removed.push(path.relative(process.cwd(), abs));
      if (!opts.dryRun) fs.rmSync(abs);
    }

    const cacheDirAbs = path.resolve(process.cwd(), ".forgeui");
    const shouldRemoveCache = opts.keepCache ? false : opts.cache !== false;
    if (shouldRemoveCache && fs.existsSync(cacheDirAbs)) {
      removed.push(path.relative(process.cwd(), cacheDirAbs) || ".forgeui");
      if (!opts.dryRun) fs.rmSync(cacheDirAbs, { recursive: true, force: true });
    }

    // Try to remove outDir if it is now empty.
    const outAbs = path.resolve(process.cwd(), outDir);
    if (fs.existsSync(outAbs) && fs.statSync(outAbs).isDirectory()) {
      const entries = fs.readdirSync(outAbs);
      if (entries.length === 0) {
        removed.push(path.relative(process.cwd(), outAbs));
        if (!opts.dryRun) fs.rmdirSync(outAbs);
      }
    }

    if (GLOBAL.json) process.stdout.write(JSON.stringify({ ok: true, removed }, null, 2) + "\n");
    else {
      if (!removed.length) log("Nothing to clean.");
      else for (const p of removed) log(`${opts.dryRun ? "Would remove" : "Removed"} ${p}`);
    }
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
  .command("check", "Run schema+validate+diff (CI-friendly)")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .option("--theme <name>", "Generate CSS vars for a single theme only (debug/speed)")
  .option("--format", "Enable prettier formatting for generated TS outputs (shorthand for config.format.prettier=true)")
  .action(async (opts: { config?: string; types?: string; sets?: string; include?: string; exclude?: string; theme?: string; format?: boolean }) => {
    // 1) schema: ensure checked-in schema matches current runtime schema
    const schemaOut = path.resolve(process.cwd(), "forgeui.config.schema.json");
    const nextSchema = JSON.stringify(asConfigSchema(), null, 2) + "\n";
    const prevSchema = fs.existsSync(schemaOut) ? fs.readFileSync(schemaOut, "utf8") : null;
    const schemaOk = prevSchema === nextSchema;

    // 2) validate: tokens warnings
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    applyTypesOverride(cfg, opts.types);
    applySetsOverride(cfg, opts.sets);
    applyIncludeExcludeOverride(cfg, { include: opts.include, exclude: opts.exclude });
    applyFormatOverride(cfg, opts.format);

    const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
    const doc = readJsonFile<TokensStudioDoc>(tokensAbs);
    const validation = validateTokensDoc(doc, cfg);
    const warningsOk = validation.warnings.length === 0;

    // 3) diff: generated outputs match what is on disk
    const res = await runSync({
      config: cfgPath,
      write: false,
      outDir: ((cli as any).opts?.() ?? {}).outDir,
      types: opts.types,
      sets: opts.sets,
      include: opts.include,
      exclude: opts.exclude,
      theme: opts.theme,
      format: opts.format
    });
    const diffs: { file: string; diff: string }[] = [];

    {
      const existingCss = fs.existsSync(res.cssPath) ? fs.readFileSync(res.cssPath, "utf8") : "";
      const d = diffText({ before: existingCss, after: res.css, label: path.relative(process.cwd(), res.cssPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.cssPath), diff: d });
    }

    {
      const existingPreset = fs.existsSync(res.presetPath) ? fs.readFileSync(res.presetPath, "utf8") : "";
      const d = diffText({ before: existingPreset, after: res.preset, label: path.relative(process.cwd(), res.presetPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.presetPath), diff: d });
    }

    if (res.themePath && res.themeFragment != null) {
      const existingTheme = fs.existsSync(res.themePath) ? fs.readFileSync(res.themePath, "utf8") : "";
      const d =
        diffText({ before: existingTheme, after: res.themeFragment, label: path.relative(process.cwd(), res.themePath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.themePath), diff: d });
    }

    {
      const existingManifest = fs.existsSync(res.manifestPath) ? fs.readFileSync(res.manifestPath, "utf8") : "";
      const d =
        diffText({ before: existingManifest, after: res.manifestJson, label: path.relative(process.cwd(), res.manifestPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.manifestPath), diff: d });
    }

    {
      const existingLock = fs.existsSync(res.lockPath) ? fs.readFileSync(res.lockPath, "utf8") : "";
      const d = diffText({ before: existingLock, after: res.lockJson, label: path.relative(process.cwd(), res.lockPath) }) ?? "";
      diffs.push({ file: path.relative(process.cwd(), res.lockPath), diff: d });
    }

    const changed = diffs.filter((x) => !!x.diff);
    const diffOk = changed.length === 0;

    const ok = schemaOk && warningsOk && diffOk;

    if (GLOBAL.json) {
      process.stdout.write(
        JSON.stringify(
          {
            ok,
            schema: { ok: schemaOk, file: path.relative(process.cwd(), schemaOut) },
            validate: { ok: warningsOk, warningCount: validation.warnings.length, warnings: validation.warnings },
            diff: {
              ok: diffOk,
              files: changed.map((x) => x.file)
            }
          },
          null,
          2
        ) + "\n"
      );
    } else {
      if (!schemaOk) console.error(`[forgeui] Schema out of date: ${path.relative(process.cwd(), schemaOut)} (run: forgeui schema)`);
      if (!warningsOk) console.error(`[forgeui] Warnings: ${validation.warnings.length} (run: forgeui validate)`);
      if (!diffOk) {
        for (const d of changed) process.stdout.write(d.diff);
      }
      if (ok) log("OK");
    }

    process.exitCode = ok ? 0 : 1;
  });

cli
  .command("doctor", "Print environment + config summary")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .action(async (opts: { config?: string; types?: string; sets?: string; include?: string; exclude?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    applyTypesOverride(cfg, opts.types);
    applySetsOverride(cfg, opts.sets);
    applyIncludeExcludeOverride(cfg, { include: opts.include, exclude: opts.exclude });

    const outDir = ((cli as any).opts?.() ?? {}).outDir ?? cfg.outDir;
    const tokensAbs = path.resolve(process.cwd(), cfg.tokensPath);
    const schemaAbs = path.resolve(process.cwd(), "forgeui.config.schema.json");

    const info = {
      ok: true,
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      config: {
        path: cfgPath,
        valid: true
      },
      tokens: {
        path: cfg.tokensPath,
        exists: fs.existsSync(tokensAbs),
        abs: tokensAbs
      },
      outDir: {
        path: outDir,
        abs: path.resolve(process.cwd(), outDir)
      },
      filter: {
        types: cfg.filter?.types ?? null,
        sets: cfg.filter?.sets ?? null,
        include: cfg.filter?.include ?? null,
        exclude: cfg.filter?.exclude ?? null
      },
      plugins: (cfg.plugins ?? []).map((p) => ({ name: p.name ?? null, module: p.module, enabled: p.enabled !== false })),
      figmaEnv: {
        FIGMA_TOKENS_URL: Boolean(process.env.FIGMA_TOKENS_URL),
        FIGMA_FILE_KEY: Boolean(process.env.FIGMA_FILE_KEY),
        FIGMA_NODE_ID: Boolean(process.env.FIGMA_NODE_ID),
        FIGMA_TOKEN: Boolean(process.env.FIGMA_TOKEN)
      },
      schemaFile: {
        path: path.relative(process.cwd(), schemaAbs),
        exists: fs.existsSync(schemaAbs)
      }
    };

    if (GLOBAL.json) process.stdout.write(JSON.stringify(info, null, 2) + "\n");
    else {
      log(`Node: ${info.node}`);
      log(`Platform: ${info.platform}`);
      log(`CWD: ${info.cwd}`);
      log(`Config: ${info.config.path}`);
      log(`Tokens: ${info.tokens.path} (${info.tokens.exists ? "found" : "missing"})`);
      log(`OutDir: ${outDir}`);
      const f = info.filter;
      if (f.types || f.sets || f.include || f.exclude) {
        log("Filter:");
        if (f.types) log(`- types: ${f.types.join(", ")}`);
        if (f.sets) log(`- sets: ${f.sets.join(", ")}`);
        if (f.include) log(`- include: ${f.include.join(", ")}`);
        if (f.exclude) log(`- exclude: ${f.exclude.join(", ")}`);
      }
      if (info.plugins.length) {
        log(`Plugins:`);
        for (const p of info.plugins) log(`- ${p.enabled ? "on" : "off"} ${p.module}${p.name ? ` (${p.name})` : ""}`);
      }
      log(`Schema file: ${info.schemaFile.exists ? "present" : "missing"} (${info.schemaFile.path})`);
    }
  });

cli
  .command("plugins", "List builtin plugins and configured plugins")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .action(async (opts: { config?: string }) => {
    const builtins = listBuiltinPlugins();

    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    if (GLOBAL.json) {
      process.stdout.write(
        JSON.stringify(
          {
            ok: true,
            builtin: builtins,
            configured: (cfg.plugins ?? []).map((p) => ({ name: p.name ?? null, module: p.module, enabled: p.enabled !== false })),
          },
          null,
          2
        ) + "\n"
      );
      return;
    }

    log("Builtin plugins:");
    for (const n of builtins) log(`- ${n}`);

    const defs = cfg.plugins ?? [];
    if (!defs.length) {
      log("\nConfigured plugins: (none)");
      return;
    }

    log("\nConfigured plugins:");
    for (const p of defs) log(`- ${p.enabled === false ? "off" : "on"} ${p.module}${p.name ? ` (${p.name})` : ""}`);
  });

cli
  .command("validate", "Validate tokens.json and print warnings")
  .option("--config <path>", "Path to forgeui config (defaults to auto-detect)")
  .option("--types <list>", "Override config.filter.types (comma-separated; e.g. color,dimension)")
  .option("--sets <list>", "Override config.filter.sets (comma-separated; e.g. core,components)")
  .option("--include <globs>", "Override config.filter.include (comma-separated; e.g. core.*,components.*)")
  .option("--exclude <globs>", "Override config.filter.exclude (comma-separated)")
  .action(async (opts: { config?: string; types?: string; sets?: string; include?: string; exclude?: string }) => {
    const cfgPath = resolveConfigPath(opts.config);
    const cfg = await loadConfig(cfgPath);

    applyTypesOverride(cfg, opts.types);
    applySetsOverride(cfg, opts.sets);
    applyIncludeExcludeOverride(cfg, { include: opts.include, exclude: opts.exclude });

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
