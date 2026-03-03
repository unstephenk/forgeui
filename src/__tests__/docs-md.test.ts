import { describe, expect, test } from "vitest";

import { generateTokensMarkdown } from "../docsmd.js";

describe("docs --md", () => {
  test("groups tokens by namespace and emits section tables", () => {
    const md = generateTokensMarkdown({
      generatedAt: "2026-03-03T00:00:00.000Z",
      tokens: [
        {
          token: "core.color.brand.500",
          type: "color" as any,
          cssVar: "--core-color-brand-500",
          themes: { Light: "#fff", Dark: "#000" },
        },
        {
          token: "components.button.bg",
          type: "color" as any,
          cssVar: "--components-button-bg",
          themes: { Light: "#eee", Dark: "#111" },
        },
      ],
    });

    expect(md).toContain("# Tokens");
    expect(md).toContain("## Index");
    expect(md).toContain("## core");
    expect(md).toContain("## components");

    // Table header includes both themes.
    expect(md).toContain("Token | Type | CSS Var | Dark | Light");

    // Rows show up under the right namespace.
    expect(md).toMatch(/## core[\s\S]*core\.color\.brand\.500/);
    expect(md).toMatch(/## components[\s\S]*components\.button\.bg/);
  });
});
