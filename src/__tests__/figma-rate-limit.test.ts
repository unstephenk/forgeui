import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { figmaPull } from "../figma.js";

describe("figmaPull rate limiting", () => {
  it("retries on 429 (Retry-After) and succeeds", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forgeui-figma-rl-"));
    const prev = process.cwd();

    try {
      process.chdir(tmp);

      const calls: any[] = [];
      vi.spyOn(globalThis, "fetch")
        // @ts-expect-error - minimal mock
        .mockImplementationOnce(async (url, init) => {
          calls.push({ url, init });
          return {
            status: 429,
            ok: false,
            headers: new Headers({ "Retry-After": "0" }),
            text: async () => "rate limit",
          };
        })
        // @ts-expect-error - minimal mock
        .mockImplementationOnce(async (url, init) => {
          calls.push({ url, init });
          return {
            status: 200,
            ok: true,
            headers: new Headers(),
            json: async () => ({ $themes: [{ name: "Light", selectedTokenSets: { core: "enabled" } }], core: {} }),
          };
        });

      const res = await figmaPull({ outFile: "tokens.json", url: "https://example.com/tokens.json" });
      expect(res.written).toBe(true);
      expect(calls.length).toBe(2);
      expect(fs.existsSync(path.join(tmp, "tokens.json"))).toBe(true);
    } finally {
      process.chdir(prev);
      vi.restoreAllMocks();
    }
  });
});
