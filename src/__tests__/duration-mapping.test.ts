import { describe, expect, it } from "vitest";
import { defaultConfig } from "../config.js";
import { generateTailwindPreset, generateTokensCss } from "../generate.js";

function baseDoc(values: Record<string, unknown>) {
  return {
    $themes: [{ name: "Light", selectedTokenSets: { core: "enabled" } }],
    $sets: { core: "core" },
    core: {
      duration: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { $type: "duration", $value: v }]))
    }
  } as any;
}

describe("duration token mapping", () => {
  it("normalizes duration values and maps to Tailwind transitionDuration + animationDuration", () => {
    const cfg = defaultConfig();
    const doc = baseDoc({
      fast: 150,
      slow: "300ms",
      secs: "0.2s"
    });

    const css = generateTokensCss(doc, cfg);
    expect(css).toContain("--core-duration-fast: 150ms;");
    expect(css).toContain("--core-duration-slow: 300ms;");
    expect(css).toContain("--core-duration-secs: 0.2s;");

    const preset = generateTailwindPreset(doc, cfg).preset;
    expect(preset).toContain("transitionDuration");
    expect(preset).toContain("animationDuration");
    expect(preset).toContain("fast: '150ms'");
    expect(preset).toContain("slow: '300ms'");
    expect(preset).toContain("secs: '0.2s'");
  });
});
