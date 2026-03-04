import path from "node:path";
import picomatch from "picomatch";
import type { ForgeUIConfig, Theme, TokensStudioDoc } from "./types.js";
import { flattenSetTokens, getThemes, listEnabledSetsForTheme, resolveTokenValue } from "./tokens.js";
import { formatTs } from "./format.js";
import { isObject, slugify, toKebab } from "./utils.js";

function themeSelectors(cfg: ForgeUIConfig, theme: Theme): string[] {
  const name = theme.name;
  const explicit = cfg.themes.selectorByTheme?.[name];
  if (Array.isArray(explicit)) return explicit;
  if (typeof explicit === "string") return [explicit];
  if (name === cfg.themes.rootTheme) return [":root"];
  return [`[data-theme=\"${slugify(name)}\"]`];
}

function varNameFromTokenPath(tokenPath: string[]): string {
  // collision-proof, fully qualified
  return `--${toKebab(tokenPath)}`;
}

function hexToRgbTriplet(hex: string): string | null {
  const h = hex.trim();
  const m = h.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let x = m[1];
  if (x.length === 3) x = x.split("").map((c) => c + c).join("");
  const r = parseInt(x.slice(0, 2), 16);
  const g = parseInt(x.slice(2, 4), 16);
  const b = parseInt(x.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function rgbFuncToTriplet(v: string): string | null {
  // supports rgb(1 2 3) / rgb(1,2,3) / rgba(1,2,3,0.5)
  const s = v.trim();
  const m = s.match(/^rgba?\((.*)\)$/i);
  if (!m) return null;
  const inner = m[1].trim();

  // split on commas or whitespace
  const parts = inner.includes(",")
    ? inner.split(",").map((p) => p.trim())
    : inner
        .replace(/\s*\/\s*.*$/, "") // drop / alpha if present
        .trim()
        .split(/\s+/)
        .map((p) => p.trim());

  if (parts.length < 3) return null;
  const [r, g, b] = parts;
  const rn = Number(r);
  const gn = Number(g);
  const bn = Number(b);
  if (![rn, gn, bn].every((n) => Number.isFinite(n))) return null;
  return `${rn} ${gn} ${bn}`;
}

function hslToRgbTriplet(input: string): string | null {
  // supports hsl(210 50% 40%) and hsl(210, 50%, 40%) and hsla(...)
  const s = input.trim();
  const m = s.match(/^hsla?\((.*)\)$/i);
  if (!m) return null;
  const inner = m[1].trim();

  const parts = inner.includes(",")
    ? inner.split(",").map((p) => p.trim())
    : inner
        .replace(/\s*\/\s*.*$/, "") // drop / alpha if present
        .trim()
        .split(/\s+/)
        .map((p) => p.trim());

  if (parts.length < 3) return null;

  const hRaw = parts[0].replace(/deg$/i, "");
  const sRaw = parts[1];
  const lRaw = parts[2];

  const h = Number(hRaw);
  const sp = Number(sRaw.replace(/%$/, ""));
  const lp = Number(lRaw.replace(/%$/, ""));
  if (![h, sp, lp].every((n) => Number.isFinite(n))) return null;

  const hh = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(1, sp / 100));
  const lig = Math.max(0, Math.min(1, lp / 100));

  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m2 = lig - c / 2;

  let r1 = 0,
    g1 = 0,
    b1 = 0;

  if (hh < 60) {
    r1 = c;
    g1 = x;
  } else if (hh < 120) {
    r1 = x;
    g1 = c;
  } else if (hh < 180) {
    g1 = c;
    b1 = x;
  } else if (hh < 240) {
    g1 = x;
    b1 = c;
  } else if (hh < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const r = Math.round((r1 + m2) * 255);
  const g = Math.round((g1 + m2) * 255);
  const b = Math.round((b1 + m2) * 255);

  return `${r} ${g} ${b}`;
}

type DimensionUnit = "preserve" | "px" | "rem";

type NormalizeDimensionOptions = {
  unit: DimensionUnit;
  remBasePx: number;
  precision: number;
};

function formatNumber(n: number, precision: number): string {
  // clamp precision and strip trailing zeros
  const p = Math.max(0, Math.min(10, Math.floor(precision)));
  const s = n.toFixed(p);
  return s.replace(/(?:\.0+|(?<=\d)0+)$/, "").replace(/\.$/, "");
}

function normalizeDimension(resolved: unknown, opts: NormalizeDimensionOptions): string {
  const { unit, remBasePx, precision } = opts;

  // Pass through common CSS expressions without touching them.
  if (typeof resolved === "string") {
    const raw = resolved.trim();
    if (/^(calc|clamp|min|max)\(/i.test(raw)) return raw;
    if (/^var\(/i.test(raw)) return raw;
  }

  // Number => px by default, then convert as requested.
  if (typeof resolved === "number") {
    if (!Number.isFinite(resolved)) return String(resolved);
    if (unit === "rem") return `${formatNumber(resolved / remBasePx, precision)}rem`;
    return `${formatNumber(resolved, precision)}px`;
  }

  if (typeof resolved === "string") {
    const s = resolved.trim();

    // numeric string => px (then convert)
    if (/^-?\d+(?:\.\d+)?$/.test(s)) {
      const n = Number(s);
      if (!Number.isFinite(n)) return s;
      if (unit === "rem") return `${formatNumber(n / remBasePx, precision)}rem`;
      return `${formatNumber(n, precision)}px`;
    }

    // "16px" / "1 rem" / "16PX" / "0" etc
    const m = s.match(/^(-?\d+(?:\.\d+)?)(?:\s*)(px|rem|em|%|vh|vw)?$/i);
    if (!m) return s;

    const n = Number(m[1]);
    if (!Number.isFinite(n)) return s;

    const u = (m[2] ?? "px").toLowerCase();

    if (unit === "preserve") {
      return `${formatNumber(n, precision)}${u}`;
    }

    if (unit === "px") {
      if (u === "rem") return `${formatNumber(n * remBasePx, precision)}px`;
      // For unknown/other units, preserve.
      if (u !== "px") return `${formatNumber(n, precision)}${u}`;
      return `${formatNumber(n, precision)}px`;
    }

    // unit === "rem"
    if (u === "px") return `${formatNumber(n / remBasePx, precision)}rem`;
    if (u === "rem") return `${formatNumber(n, precision)}rem`;
    // Other units: preserve.
    return `${formatNumber(n, precision)}${u}`;
  }

  return String(resolved);
}

function shadowToCssValue(resolved: unknown): string {
  // Tokens Studio shadow can be an array of shadow objects.
  // We accept either:
  // - string (already a css box-shadow)
  // - array of { offsetX, offsetY, blur, spread, color, inset? }
  if (typeof resolved === "string") return resolved;
  if (!Array.isArray(resolved)) return String(resolved);

  const parts: string[] = [];
  for (const s of resolved) {
    if (!isObject(s)) {
      parts.push(String(s));
      continue;
    }
    const inset = (s as any).inset ? "inset " : "";
    const ox = (s as any).offsetX ?? "0px";
    const oy = (s as any).offsetY ?? "0px";
    const blur = (s as any).blur ?? "0px";
    const spread = (s as any).spread ?? "0px";
    const color = (s as any).color ?? "rgba(0,0,0,0)";
    parts.push(`${inset}${ox} ${oy} ${blur} ${spread} ${color}`.trim());
  }
  return parts.join(", ");
}

export function generateTokensCss(doc: TokensStudioDoc, cfg: ForgeUIConfig): string {
  const themes = getThemes(doc);

  const dimOpts: NormalizeDimensionOptions = {
    unit: cfg.css?.dimensions?.unit ?? "preserve",
    remBasePx: cfg.css?.dimensions?.remBasePx ?? 16,
    precision: cfg.css?.dimensions?.precision ?? 4
  };

  const include = cfg.filter?.include?.length ? picomatch(cfg.filter.include) : null;
  const exclude = cfg.filter?.exclude?.length ? picomatch(cfg.filter.exclude) : null;

  const blocks: string[] = [];
  for (const theme of themes) {
    let enabledSets = listEnabledSetsForTheme(theme);
    if (cfg.filter?.sets?.length) enabledSets = enabledSets.filter((s) => cfg.filter!.sets!.includes(s));

    const selectors = themeSelectors(cfg, theme);

    const lines: string[] = [];
    for (const setName of enabledSets) {
      const setObj = (doc as any)[setName];
      const flat = flattenSetTokens(setObj, [setName]);
      for (const t of flat) {
        if (cfg.filter?.types?.length && !cfg.filter.types.includes(t.leaf.$type)) continue;

        const fq = t.fqName;
        if (include && !include(fq)) continue;
        if (exclude && exclude(fq)) continue;

        const resolved = resolveTokenValue(doc, t.leaf, theme.name, [], fq, [theme.name, ...(cfg.themes.fallbacks?.[theme.name] ?? []), cfg.themes.rootTheme].filter(Boolean));
        const varName = varNameFromTokenPath(t.path);

        if (t.leaf.$type === "color" && typeof resolved === "string") {
          const rgb = hexToRgbTriplet(resolved) ?? rgbFuncToTriplet(resolved) ?? hslToRgbTriplet(resolved);
          lines.push(`  ${varName}: ${rgb ?? resolved};`);
        } else if (t.leaf.$type === "shadow") {
          lines.push(`  ${varName}: ${shadowToCssValue(resolved)};`);
        } else if (t.leaf.$type === "dimension") {
          lines.push(`  ${varName}: ${normalizeDimension(resolved, dimOpts)};`);
        } else if (t.leaf.$type === "typography" && isObject(resolved)) {
          // Expand composite typography tokens into per-field CSS vars.
          const base = varName;
          const ff = (resolved as any).fontFamily;
          const fs = (resolved as any).fontSize;
          const fw = (resolved as any).fontWeight;
          const ls = (resolved as any).letterSpacing;
          const lh = (resolved as any).lineHeight;

          if (ff != null) {
            const v = Array.isArray(ff) ? ff.join(", ") : String(ff);
            lines.push(`  ${base}-font-family: ${v};`);
          }
          if (fs != null) lines.push(`  ${base}-font-size: ${String(fs)};`);
          if (fw != null) lines.push(`  ${base}-font-weight: ${String(fw)};`);
          if (ls != null) lines.push(`  ${base}-letter-spacing: ${String(ls)};`);
          if (lh != null) lines.push(`  ${base}-line-height: ${String(lh)};`);
        } else if (t.leaf.$type === "border" && isObject(resolved)) {
          // Expand composite border tokens into per-field CSS vars.
          // Tokens Studio border shape is typically: { color, width, style }.
          const base = varName;
          const c = (resolved as any).color;
          const w = (resolved as any).width;
          const s = (resolved as any).style;

          let colorForVar: string | null = null;
          if (typeof c === "string") {
            colorForVar = hexToRgbTriplet(c) ?? rgbFuncToTriplet(c) ?? hslToRgbTriplet(c) ?? c;
          } else if (c != null) {
            colorForVar = String(c);
          }

          const widthForVar = w != null ? normalizeDimension(w, dimOpts) : null;
          const styleForVar = s != null ? String(s) : null;

          if (colorForVar != null) lines.push(`  ${base}-color: ${colorForVar};`);
          if (widthForVar != null) lines.push(`  ${base}-width: ${widthForVar};`);
          if (styleForVar != null) lines.push(`  ${base}-style: ${styleForVar};`);

          // Also emit the shorthand for convenience.
          const colorForShorthand =
            typeof colorForVar === "string" && /^\d+\s+\d+\s+\d+$/.test(colorForVar.trim())
              ? `rgb(${colorForVar} / 1)`
              : colorForVar ?? "transparent";
          const widthForShorthand = widthForVar ?? "0px";
          const styleForShorthand = styleForVar ?? "solid";
          lines.push(`  ${base}: ${widthForShorthand} ${styleForShorthand} ${colorForShorthand};`);
        } else {
          lines.push(`  ${varName}: ${String(resolved)};`);
        }
      }
    }

    const body = lines.sort().join("\n");
    for (const selector of selectors) {
      blocks.push(`${selector} {\n${body}\n}`);
    }
  }

  return `/* Generated by ForgeUI. Do not edit by hand. */\n\n${blocks.join("\n\n")}\n`;
}

function tokenPathToTailwindColorKey(tokenPath: string[]): string[] {
  // Expect [setName, 'color', ...]
  const idx = tokenPath.indexOf("color");
  if (idx === -1) return [];
  return tokenPath.slice(idx + 1);
}

function remapKeyPath(keyPath: string[], remaps?: Record<string, string>): string[] {
  if (!remaps) return keyPath;
  const asDot = keyPath.join(".");

  // Longest-prefix match on dotted key paths
  let bestFrom: string | null = null;
  for (const from of Object.keys(remaps)) {
    if (asDot === from || asDot.startsWith(from + ".")) {
      if (!bestFrom || from.length > bestFrom.length) bestFrom = from;
    }
  }
  if (!bestFrom) return keyPath;

  const to = remaps[bestFrom];
  const rest = asDot === bestFrom ? "" : asDot.slice(bestFrom.length + 1);
  const nextDot = rest ? `${to}.${rest}` : to;
  return nextDot.split(".");
}

function tailwindColorValue(varName: string): string {
  // We store colors as `r g b` triplets in vars when possible.
  return `rgb(var(${varName}) / <alpha-value>)`;
}

function tokenPathToTailwindKey(tokenPath: string[], marker: string): string[] {
  const idx = tokenPath.indexOf(marker);
  if (idx === -1) return [];
  return tokenPath.slice(idx + 1);
}

function setNested(obj: any, keyPath: string[], value: unknown) {
  let cur = obj;
  for (let i = 0; i < keyPath.length; i++) {
    const k = keyPath[i];
    const last = i === keyPath.length - 1;
    if (last) {
      cur[k] = value;
    } else {
      cur[k] ??= {};
      cur = cur[k];
    }
  }
}

export function generateTailwindPreset(doc: TokensStudioDoc, cfg: ForgeUIConfig): { preset: string; themeFragment?: string } {
  const rootTheme = cfg.themes.rootTheme;
  const root = getThemes(doc).find((t) => t.name === rootTheme);
  if (!root) throw new Error(`Root theme not found: ${rootTheme}`);

  let enabledSets = listEnabledSetsForTheme(root);
  if (cfg.filter?.sets?.length) enabledSets = enabledSets.filter((s) => cfg.filter!.sets!.includes(s));

  const include = cfg.filter?.include?.length ? picomatch(cfg.filter.include) : null;
  const exclude = cfg.filter?.exclude?.length ? picomatch(cfg.filter.exclude) : null;

  const dimOpts: NormalizeDimensionOptions = {
    unit: cfg.css?.dimensions?.unit ?? "preserve",
    remBasePx: cfg.css?.dimensions?.remBasePx ?? 16,
    precision: cfg.css?.dimensions?.precision ?? 4
  };

  const colors: any = {};
  const spacing: any = {};
  const borderRadius: any = {};
  const boxShadow: any = {};
  const borderColor: any = {};
  const borderWidth: any = {};
  const borderStyle: any = {};
  const backgroundImage: any = {};

  // Typography can be expressed either as dedicated tokens ($type=typography)
  // or as separate tokens like `font.family.*`, `font.size.*`, etc.
  const fontFamily: any = {};
  const fontSize: any = {};
  const fontWeight: any = {};
  const letterSpacing: any = {};
  const lineHeight: any = {};

  for (const setName of enabledSets) {
    const flat = flattenSetTokens((doc as any)[setName], [setName]);
    for (const t of flat) {
      const fq = t.fqName;
      if (cfg.filter?.types?.length && !cfg.filter.types.includes(t.leaf.$type)) continue;
      if (include && !include(fq)) continue;
      if (exclude && exclude(fq)) continue;

      if (t.leaf.$type === "color") {
        let keyPath = tokenPathToTailwindColorKey(t.path);
        if (keyPath.length === 0) continue;
        keyPath = remapKeyPath(keyPath, cfg.tailwind.map?.colors);
        const vname = `--${toKebab(t.path)}`;
        setNested(colors, keyPath, tailwindColorValue(vname));
        continue;
      }

      if (t.leaf.$type === "dimension") {
        // spacing: {set}.space.*
        const sKey = tokenPathToTailwindKey(t.path, "space");
        if (sKey.length) {
          const resolved = resolveTokenValue(doc, t.leaf, rootTheme, [], fq, [rootTheme]);
          setNested(spacing, sKey, normalizeDimension(resolved, dimOpts));
          continue;
        }

        // radius: {set}.radius.*
        const rKey = tokenPathToTailwindKey(t.path, "radius");
        if (rKey.length) {
          const resolved = resolveTokenValue(doc, t.leaf, rootTheme, [], fq, [rootTheme]);
          setNested(borderRadius, rKey, normalizeDimension(resolved, dimOpts));
          continue;
        }
      }

      if (t.leaf.$type === "shadow") {
        const shKey = tokenPathToTailwindKey(t.path, "shadow");
        if (shKey.length) {
          const vname = `--${toKebab(t.path)}`;
          setNested(boxShadow, shKey, `var(${vname})`);
        }
        continue;
      }

      if (t.leaf.$type === "border") {
        const bKey = tokenPathToTailwindKey(t.path, "border");
        if (!bKey.length) continue;

        const baseVar = `--${toKebab(t.path)}`;
        // generateTokensCss emits: --...-color as an `r g b` triplet when possible.
        setNested(borderColor, bKey, tailwindColorValue(`${baseVar}-color`));
        setNested(borderWidth, bKey, `var(${baseVar}-width)`);
        setNested(borderStyle, bKey, `var(${baseVar}-style)`);
        continue;
      }

      if (t.leaf.$type === "gradient") {
        const gKey = tokenPathToTailwindKey(t.path, "gradient");
        if (!gKey.length) continue;
        const vname = `--${toKebab(t.path)}`;
        setNested(backgroundImage, gKey, `var(${vname})`);
        continue;
      }

      if (t.leaf.$type === "typography") {
        const key = tokenPathToTailwindKey(t.path, "typography");
        if (!key.length) continue;
        const resolved = resolveTokenValue(doc, t.leaf, rootTheme, [], fq, [rootTheme]);
        if (!isObject(resolved)) continue;

        const k = key.join("-");

        // Use the per-field CSS vars emitted by generateTokensCss.
        // This keeps Tailwind values themeable via `[data-theme=...]`.
        const baseVar = `--${toKebab(t.path)}`;
        const ffVar = `var(${baseVar}-font-family)`;
        const fsVar = `var(${baseVar}-font-size)`;
        const fwVar = `var(${baseVar}-font-weight)`;
        const lsVar = `var(${baseVar}-letter-spacing)`;
        const lhVar = `var(${baseVar}-line-height)`;

        const ff = (resolved as any).fontFamily;
        const fs = (resolved as any).fontSize;
        const fw = (resolved as any).fontWeight;
        const ls = (resolved as any).letterSpacing;
        const lh = (resolved as any).lineHeight;

        if (ff != null) fontFamily[k] = [ffVar];
        if (fw != null) fontWeight[k] = fwVar;
        if (ls != null) letterSpacing[k] = lsVar;
        if (lh != null) lineHeight[k] = lhVar;

        if (fs != null) {
          // Tailwind accepts either a string or [size, options].
          const opts: any = {};
          if (lh != null) opts.lineHeight = lhVar;
          if (ls != null) opts.letterSpacing = lsVar;
          if (fw != null) opts.fontWeight = fwVar;
          fontSize[k] = Object.keys(opts).length ? [fsVar, opts] : fsVar;
        }

        continue;
      }
    }
  }

  const theme = {
    colors,
    spacing,
    borderRadius,
    boxShadow,
    borderColor,
    borderWidth,
    borderStyle,
    backgroundImage,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight
  };

  const preset = {
    darkMode: ["class", "[data-theme='dark']"],
    theme: {
      extend: theme
    }
  };

  const relOut = cfg.outDir.replace(/^\.\//, "");
  const presetUsage = cfg.tailwind.presetUsage ?? "v4";
  const presetFormat =
    cfg.tailwind.presetFormat ?? (cfg.tailwind.presetFile.endsWith(".cjs") ? "cjs" : "esm");

  const usageV4 = `/*\nTailwind v4 usage (CSS-first):\n\n  // in your app CSS\n  @import \"tailwindcss\";\n  @config \"./${relOut}/${cfg.tailwind.presetFile}\";\n\n  // ensure this is loaded too\n  @import \"./${relOut}/${cfg.tailwind.cssFile}\";\n*/`;

  const usageV3 = `/*\nTailwind v3 usage:\n\n  // tailwind.config.js (or .cjs)\n  module.exports = {\n    presets: [require(\"./${relOut}/${cfg.tailwind.presetFile}\")],\n  };\n\n  // ensure this is loaded too (your app CSS)\n  @import \"./${relOut}/${cfg.tailwind.cssFile}\";\n*/`;

  const usage = presetUsage === "v3" ? usageV3 : usageV4;

  const presetDecl = `const preset = ${formatTs(preset)} as const;`;
  const presetExport = presetFormat === "cjs" ? `module.exports = preset;` : `export default preset;`;

  const presetCode = `/* Generated by ForgeUI. Do not edit by hand. */\n\n${usage}\n\n${presetDecl}\n\n${presetExport}\n`;

  const themeFile = cfg.tailwind.themeFile;
  if (themeFile) {
    const importPath = `./${themeFile.replace(/\.(ts|js|cjs|mjs)$/, "")}`;

    const themeDecl = `const theme = ${formatTs(theme)} as const;`;
    const themeExport = presetFormat === "cjs" ? `module.exports = theme;` : `export default theme;`;

    const themeCode = `/* Generated by ForgeUI. Do not edit by hand. */\n\n${themeDecl}\n\n${themeExport}\n`;

    const presetWithImport =
      presetFormat === "cjs"
        ? `/* Generated by ForgeUI. Do not edit by hand. */\n\n${usage}\n\nconst theme = require(${JSON.stringify(
            importPath
          )});\n\nconst preset = {\n  darkMode: ${formatTs(preset.darkMode)},\n  theme: {\n    extend: theme,\n  },\n} as const;\n\nmodule.exports = preset;\n`
        : `/* Generated by ForgeUI. Do not edit by hand. */\n\n${usage}\n\nimport theme from ${JSON.stringify(
            importPath
          )};\n\nconst preset = {\n  darkMode: ${formatTs(preset.darkMode)},\n  theme: {\n    extend: theme,\n  },\n} as const;\n\nexport default preset;\n`;

    return { preset: presetWithImport, themeFragment: themeCode };
  }

  return { preset: presetCode };
}

export function outPath(cfg: ForgeUIConfig, file: string): string {
  return path.resolve(process.cwd(), cfg.outDir, file);
}
