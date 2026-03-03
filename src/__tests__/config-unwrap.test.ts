import { describe, expect, it } from "vitest";
import { unwrapConfigModule } from "../config.js";

describe("config module unwrapping", () => {
  it("supports CJS-like modules", () => {
    const cfg = unwrapConfigModule({ tokensPath: "./t.json" } as any);
    expect(cfg.tokensPath).toBe("./t.json");
  });

  it("supports default export", () => {
    const cfg = unwrapConfigModule({ default: { outDir: "./out" } } as any);
    expect(cfg.outDir).toBe("./out");
  });

  it("supports nested default interop", () => {
    const cfg = unwrapConfigModule({ default: { default: { outDir: "./out2" } } } as any);
    expect(cfg.outDir).toBe("./out2");
  });

  it("supports config factory functions", () => {
    const cfg = unwrapConfigModule(() => ({ outDir: "./out3" })) as any;
    expect(cfg.outDir).toBe("./out3");
  });
});
