import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { loadConfig } from "../config.js";

describe("config schema validation", () => {
  it("throws a helpful error when config fails JSON schema", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forgeui-cfg-"));
    const prev = process.cwd();
    try {
      process.chdir(tmp);

      // Intentionally invalid: tokensPath should be string.
      fs.writeFileSync(
        path.join(tmp, "forgeui.config.js"),
        `export default { tokensPath: 123, outDir: './forgeui', themes: { rootTheme: 'Light' }, css: {}, tailwind: { cssFile: 'tokens.css', presetFile: 'forgeui.preset.ts', darkThemeName: 'Dark' } };\n`,
        "utf8"
      );

      await expect(loadConfig("forgeui.config.js")).rejects.toThrow(/Invalid forgeui config/);
    } finally {
      process.chdir(prev);
    }
  });
});
