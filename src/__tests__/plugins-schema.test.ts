import { describe, expect, it } from "vitest";

import { validatePluginOptions } from "../plugins_schema.js";

describe("plugin options schema", () => {
  it("validates options with JSON schema", () => {
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        mode: { enum: ["fast", "pretty"] }
      },
      required: ["mode"]
    };

    expect(validatePluginOptions(schema, { mode: "pretty" }).ok).toBe(true);
    const bad = validatePluginOptions(schema, { enabled: true });
    expect(bad.ok).toBe(false);
  });
});
