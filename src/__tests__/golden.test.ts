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
});
