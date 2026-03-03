import { describe, expect, it } from "vitest";

import { defaultConfig } from "../config.js";
import { validateTokensDoc } from "../validate.js";
import type { TokensStudioDoc } from "../types.js";

describe("validateTokensDoc", () => {
  it("warns when a token leaf has $type but is missing $value", () => {
    const doc: TokensStudioDoc = {
      $themes: [
        {
          id: "t1",
          name: "Light",
          selectedTokenSets: {
            core: "enabled"
          }
        }
      ],
      // @ts-expect-error - fixture intentionally malformed
      core: {
        color: {
          // missing $value
          brand: {
            $type: "color"
          }
        }
      }
    };

    const res = validateTokensDoc(doc, defaultConfig());
    expect(res.warnings.some((w) => w.code === "MISSING_TOKEN_VALUE" && w.token === "core.color.brand")).toBe(true);
  });
});
