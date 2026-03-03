import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { figmaPull } from "../figma.js";

describe("figmaPull caching", () => {
  it("uses If-None-Match + returns unchanged on 304", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forgeui-figma-"));
    const prev = process.cwd();

    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, ".forgeui"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, ".forgeui", "figma.pull.cache.json"),
        JSON.stringify({ "url:https://example.com/tokens.json": { etag: "W/\"abc\"" } }, null, 2) + "\n",
        "utf8"
      );

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        // @ts-expect-error - minimal mock
        .mockResolvedValue({
          status: 304,
          ok: false,
          headers: new Headers(),
          json: async () => ({}),
          text: async () => "",
        });

      const res = await figmaPull({ outFile: "tokens.json", url: "https://example.com/tokens.json" });
      expect(res.written).toBe(false);

      // Should not have written output file.
      expect(fs.existsSync(path.join(tmp, "tokens.json"))).toBe(false);

      const call = fetchSpy.mock.calls[0];
      expect(call[1]?.headers).toMatchObject({ "If-None-Match": 'W/"abc"' });
    } finally {
      process.chdir(prev);
      vi.restoreAllMocks();
    }
  });
});
