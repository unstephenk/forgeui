import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config.js";
import { generateTailwindPreset, generateTokensCss } from "../generate.js";

function baseDoc(values: Record<string, unknown>) {
  return {
    $themes: [{ name: "Light", selectedTokenSets: { core: "enabled" } }],
    $sets: { core: "core" },
    core: {
      opacity: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { $type: "opacity", $value: v }]))
    }
  } as any;
}

describe("opacity token mapping", () => {
  it("normalizes common opacity shapes and maps to Tailwind theme.opacity", () => {
    const cfg = defaultConfig();
    const doc = baseDoc({
      half: 0.5,
      percent: "50%",
      tailwindy: 50
    });

    const css = generateTokensCss(doc, cfg);
    expect(css).toContain("--core-opacity-half: 0.5;");
    expect(css).toContain("--core-opacity-percent: 0.5;");
    expect(css).toContain("--core-opacity-tailwindy: 0.5;");

    const preset = generateTailwindPreset(doc, cfg).preset;
    expect(preset).toContain("opacity");
    expect(preset).toContain("half");
    expect(preset).toContain("half: '0.5'");
  });
});
