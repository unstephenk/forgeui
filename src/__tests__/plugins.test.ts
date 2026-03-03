import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import type { ForgeUIConfig } from "../types.js";
import { loadPlugins, runHook } from "../plugins.js";

describe("plugins", () => {
  it("loads plugin modules and attaches options", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "forgeui-plugin-"));
    const prev = process.cwd();

    try {
      process.chdir(tmp);

      const pluginPath = path.join(tmp, "my-plugin.js");
      fs.writeFileSync(
        pluginPath,
        `export default { name: 'p', hooks: { afterGenerate(ctx){ ctx.outputs.css = 'X' + ctx.outputs.css } } }\n`,
        "utf8"
      );

      const cfg: ForgeUIConfig = {
        tokensPath: "./tokens.json",
        outDir: "./forgeui",
        plugins: [{ module: "./my-plugin.js", options: { foo: "bar" } }],
        themes: { rootTheme: "Light" },
        css: {},
        tailwind: { cssFile: "tokens.css", presetFile: "forgeui.preset.ts", darkThemeName: "Dark" },
      };

      const plugins = await loadPlugins(cfg);
      expect(plugins).toHaveLength(1);
      expect((plugins[0] as any).options).toEqual({ foo: "bar" });

      const ctx: any = { cfg, doc: { $themes: [] }, outputs: { css: "hello" } };
      await runHook(plugins, "afterGenerate", ctx);
      expect(ctx.outputs.css).toBe("Xhello");
    } finally {
      process.chdir(prev);
    }
  });

  it("runs hooks in order", async () => {
    const calls: string[] = [];

    const p1: any = { hooks: { beforeGenerate: vi.fn(() => calls.push("p1")) } };
    const p2: any = { hooks: { beforeGenerate: vi.fn(() => calls.push("p2")) } };

    await runHook([p1, p2], "beforeGenerate", { cfg: {} as any, doc: { $themes: [] } as any });
    expect(calls).toEqual(["p1", "p2"]);
  });
});
