import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config.js";
import { generateTokensCss } from "../generate.js";

function baseDoc(value: unknown) {
  return {
    $themes: [{ name: "Light", selectedTokenSets: { core: "enabled" } }],
    $sets: { core: "core" },
    core: {
      space: {
        md: { $type: "dimension", $value: value }
      }
    }
  } as any;
}

describe("dimension normalization", () => {
  it("preserves units by default and normalizes casing/whitespace", () => {
    const cfg = defaultConfig();
    cfg.css.dimensions = { unit: "preserve", remBasePx: 16, precision: 4 };
    const css = generateTokensCss(baseDoc("1 REM"), cfg);
    expect(css).toContain("--core-space-md: 1rem;");
  });

  it("converts px to rem when configured", () => {
    const cfg = defaultConfig();
    cfg.css.dimensions = { unit: "rem", remBasePx: 16, precision: 4 };
    const css = generateTokensCss(baseDoc("24px"), cfg);
    expect(css).toContain("--core-space-md: 1.5rem;");
  });

  it("converts rem to px when configured", () => {
    const cfg = defaultConfig();
    cfg.css.dimensions = { unit: "px", remBasePx: 20, precision: 2 };
    const css = generateTokensCss(baseDoc("1.25rem"), cfg);
    expect(css).toContain("--core-space-md: 25px;");
  });
});
