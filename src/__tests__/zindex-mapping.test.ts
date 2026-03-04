import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config.js";
import { generateTailwindPreset, generateTokensCss } from "../generate.js";

function baseDoc(values: Record<string, unknown>) {
  return {
    $themes: [{ name: "Light", selectedTokenSets: { core: "enabled" } }],
    $sets: { core: "core" },
    core: {
      zIndex: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { $type: "zIndex", $value: v }]))
    }
  } as any;
}

describe("zIndex token mapping", () => {
  it("emits CSS vars and maps to Tailwind theme.zIndex", () => {
    const cfg = defaultConfig();
    const doc = baseDoc({
      modal: 1000,
      popover: "2000"
    });

    const css = generateTokensCss(doc, cfg);
    expect(css).toContain("--core-z-index-modal: 1000;");
    expect(css).toContain("--core-z-index-popover: 2000;");

    const preset = generateTailwindPreset(doc, cfg).preset;
    expect(preset).toContain("zIndex");
    expect(preset).toContain("modal: '1000'");
    expect(preset).toContain("popover: '2000'");
  });
});
