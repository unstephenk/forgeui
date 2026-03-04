import { describe, expect, it } from "vitest";
import fs from "node:fs";

import { defaultConfig } from "../config.js";
import { generateTokensCss, generateTailwindPreset } from "../generate.js";

// Minimal fixture to assert gradient mapping.

describe("gradient mapping", () => {
  it("emits CSS var and Tailwind backgroundImage mapping", () => {
    const doc = JSON.parse(fs.readFileSync("fixtures/gradient.tokens.json", "utf8"));
    const cfg = defaultConfig();

    const css = generateTokensCss(doc as any, cfg);
    expect(css).toContain("--core-gradient-hero");
    expect(css).toContain("linear-gradient");

    const preset = generateTailwindPreset(doc as any, cfg).preset;
    expect(preset).toContain("backgroundImage");
    expect(preset).toContain("hero");
    expect(preset).toContain("var(--core-gradient-hero)");
  });
});
