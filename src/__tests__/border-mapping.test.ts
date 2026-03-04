import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config.js";
import { generateTailwindPreset, generateTokensCss } from "../generate.js";

function baseDoc(value: unknown) {
  return {
    $themes: [{ name: "Light", selectedTokenSets: { core: "enabled" } }],
    $sets: { core: "core" },
    core: {
      border: {
        card: { $type: "border", $value: value }
      }
    }
  } as any;
}

describe("border token mapping", () => {
  it("expands border tokens into per-field CSS vars and maps to Tailwind border*", () => {
    const cfg = defaultConfig();
    const doc = baseDoc({ width: "1px", style: "solid", color: "#ff0000" });

    const css = generateTokensCss(doc, cfg);
    expect(css).toContain("--core-border-card-color: 255 0 0;");
    expect(css).toContain("--core-border-card-width: 1px;");
    expect(css).toContain("--core-border-card-style: solid;");
    expect(css).toContain("--core-border-card: 1px solid rgb(255 0 0 / 1);");

    const preset = generateTailwindPreset(doc, cfg).preset;
    expect(preset).toContain("borderColor");
    expect(preset).toContain("borderWidth");
    expect(preset).toContain("borderStyle");
    expect(preset).toContain("card");
    expect(preset).toContain("--core-border-card-color");
    expect(preset).toContain("--core-border-card-width");
    expect(preset).toContain("--core-border-card-style");
  });
});
