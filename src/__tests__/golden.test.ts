import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { defaultConfig } from "../config.js";
import { generateTailwindPreset, generateTokensCss } from "../generate.js";
import type { TokensStudioDoc } from "../types.js";

const FIXTURES = path.resolve(process.cwd(), "fixtures");
const GOLDEN = path.resolve(process.cwd(), "fixtures", "golden");

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function normalizeNewlines(s: string) {
  return s.replace(/\r\n/g, "\n");
}

describe("golden fixtures", () => {
  it("generates tokens.css and forgeui.preset.ts deterministically", () => {
    const doc = readJson(path.join(FIXTURES, "tokens.themesets.json")) as TokensStudioDoc;
    const cfg = defaultConfig();

    const css = generateTokensCss(doc, cfg);
    const preset = generateTailwindPreset(doc, cfg).preset;

    const cssExpected = fs.readFileSync(path.join(GOLDEN, "tokens.css"), "utf8");
    const presetExpected = fs.readFileSync(path.join(GOLDEN, "forgeui.preset.ts"), "utf8");

    expect(normalizeNewlines(css)).toBe(normalizeNewlines(cssExpected));
    expect(normalizeNewlines(preset)).toBe(normalizeNewlines(presetExpected));
  });

  it("generates split preset + theme fragment deterministically", () => {
    const doc = readJson(path.join(FIXTURES, "tokens.themesets.json")) as TokensStudioDoc;
    const cfg = defaultConfig();
    cfg.tailwind.themeFile = "forgeui.theme.ts";

    const gen = generateTailwindPreset(doc, cfg);
    const preset = gen.preset;
    const theme = gen.themeFragment;

    const presetExpected = fs.readFileSync(path.join(GOLDEN, "forgeui.preset.split.ts"), "utf8");
    const themeExpected = fs.readFileSync(path.join(GOLDEN, "forgeui.theme.ts"), "utf8");

    expect(theme).toBeTruthy();
    expect(normalizeNewlines(preset)).toBe(normalizeNewlines(presetExpected));
    expect(normalizeNewlines(theme!)).toBe(normalizeNewlines(themeExpected));
  });

  it("generates Tailwind v3 (CJS) preset deterministically", () => {
    const doc = readJson(path.join(FIXTURES, "tokens.themesets.json")) as TokensStudioDoc;
    const cfg = defaultConfig();
    cfg.tailwind.presetUsage = "v3";
    cfg.tailwind.presetFile = "forgeui.preset.cjs";

    const preset = generateTailwindPreset(doc, cfg).preset;

    const expected = fs.readFileSync(path.join(GOLDEN, "forgeui.preset.v3.cjs"), "utf8");
    expect(normalizeNewlines(preset)).toBe(normalizeNewlines(expected));
  });
});
