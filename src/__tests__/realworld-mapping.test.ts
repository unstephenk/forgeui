import { describe, expect, it } from "vitest";
import fs from "node:fs";

import { defaultConfig } from "../config.js";
import { generateTokensCss, generateTailwindPreset } from "../generate.js";

describe("real-world mapping fixture", () => {
  it("generates css vars + tailwind mappings for multiple token types", () => {
    const doc = JSON.parse(fs.readFileSync("fixtures/realworld.tokens.json", "utf8"));
    const cfg = defaultConfig();

    const css = generateTokensCss(doc as any, cfg);
    expect(css).toContain("--core-color-brand-500");
    expect(css).toContain("--core-gradient-hero");
    expect(css).toContain("--core-border-subtle-color");
    expect(css).toContain("--core-typography-heading-h1-font-size");

    const preset = generateTailwindPreset(doc as any, cfg).preset;
    expect(preset).toContain("backgroundImage");
    expect(preset).toContain("hero");
    expect(preset).toContain("borderColor");
    expect(preset).toContain("fontSize");
  });
});
