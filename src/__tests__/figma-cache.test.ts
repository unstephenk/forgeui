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

  it("materializes output from disk snapshot on 304 when output is missing", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forgeui-figma-"));
    const prev = process.cwd();

    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, ".forgeui", "cache", "figma"), { recursive: true });

      const cacheKey = "url:https://example.com/tokens.json";
      const crypto = await import("node:crypto");
      const h = crypto.createHash("sha1").update(cacheKey).digest("hex").slice(0, 12);
      const snapRel = path.join(".forgeui", "cache", "figma", `${h}.json`);

      fs.writeFileSync(path.join(tmp, snapRel), JSON.stringify({ hello: "world" }, null, 2) + "\n", "utf8");
      fs.writeFileSync(
        path.join(tmp, ".forgeui", "figma.pull.cache.json"),
        JSON.stringify({ [cacheKey]: { etag: "W/\"abc\"", snapshot: snapRel } }, null, 2) + "\n",
        "utf8"
      );

      vi.spyOn(globalThis, "fetch")
        // @ts-expect-error - minimal mock
        .mockResolvedValue({
          status: 304,
          ok: false,
          headers: new Headers(),
          json: async () => ({}),
          text: async () => "",
        });

      const res = await figmaPull({ outFile: "tokens.json", url: "https://example.com/tokens.json" });
      expect(res.written).toBe(true);
      expect(res.fromCache).toBe(true);

      const written = JSON.parse(fs.readFileSync(path.join(tmp, "tokens.json"), "utf8"));
      expect(written).toEqual({ hello: "world" });
    } finally {
      process.chdir(prev);
      vi.restoreAllMocks();
    }
  });

  it("supports overriding the cache directory", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forgeui-figma-"));
    const prev = process.cwd();

    try {
      process.chdir(tmp);
      fs.mkdirSync(path.join(tmp, "my-cache"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, "my-cache", "figma.pull.cache.json"),
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

      const res = await figmaPull({
        outFile: "tokens.json",
        url: "https://example.com/tokens.json",
        cacheDir: "my-cache",
      });
      expect(res.written).toBe(false);

      const call = fetchSpy.mock.calls[0];
      expect(call[1]?.headers).toMatchObject({ "If-None-Match": 'W/"abc"' });
    } finally {
      process.chdir(prev);
      vi.restoreAllMocks();
    }
  });
});
