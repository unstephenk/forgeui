import fs from "node:fs";
import path from "node:path";
import jitiFactory from "jiti";
import type { ForgeUIConfig } from "./types.js";

export const DEFAULT_CONFIG_FILES = [
  "forgeui.config.ts",
  "forgeui.config.js",
  "forgeui.config.mjs",
  "forgeui.config.cjs"
] as const;
export type DefaultConfigFile = (typeof DEFAULT_CONFIG_FILES)[number];

export function defaultConfig(): ForgeUIConfig {
  return {
    tokensPath: "./tokens.json",
    outDir: "./forgeui",
    plugins: [],
    themes: {
      rootTheme: "Light",
      selectorByTheme: {
        Light: ":root",
        Dark: ["[data-theme=\"dark\"]", ".dark"]
      },
      fallbacks: {
        Dark: ["Light"]
      }
    },
    filter: {
      include: ["core.*", "components.*"],
      exclude: [],
      sets: [],
      types: []
    },
    css: {
      alsoEmitClassDark: false,
      dimensions: {
        unit: "preserve",
        remBasePx: 16,
        precision: 4
      }
    },
    tailwind: {
      cssFile: "tokens.css",
      // Optional: emit a separate Tailwind theme fragment and import it from the preset.
      // themeFile: "forgeui.theme.ts",
      presetFile: "forgeui.preset.ts",
      presetFormat: "esm",
      presetUsage: "v4",
      darkThemeName: "Dark",
      map: {
        colors: {
          // Example: map `bg.*` → `surface.*`
          // "bg": "surface"
        }
      }
    },
    format: {
      prettier: false
    }
  };
}

export function configTemplate(params?: { js?: boolean }): string {
  const cfg = defaultConfig();
  const body = JSON.stringify(cfg, null, 2);

  if (params?.js) {
    // JSDoc typing for JS users.
    return `/** @type {import('@forgeui/cli').ForgeUIConfig} */\nconst config = ${body};\n\nexport default config;\n`;
  }

  return `import type { ForgeUIConfig } from "@forgeui/cli";\n\nconst config: ForgeUIConfig = ${body};\n\nexport default config;\n`;
}

export function resolveConfigPath(explicit?: string): string {
  if (explicit) return explicit;

  const found = DEFAULT_CONFIG_FILES.filter((f) => fs.existsSync(path.resolve(process.cwd(), f)));
  if (found.length === 0) return DEFAULT_CONFIG_FILES[0];
  if (found.length === 1) return found[0];
  throw new Error(`Multiple configs found: ${found.join(", ")}. Delete extras or pass --config.`);
}

export function unwrapConfigModule(mod: any): ForgeUIConfig {
  // Supported shapes:
  // - ESM default export: { default: config }
  // - CJS export: module.exports = config
  // - transpiled interop: { default: { default: config } }
  // - config factory: () => config
  let cur: any = mod;

  for (let i = 0; i < 3; i++) {
    if (typeof cur === "function") cur = cur();
    if (cur && typeof cur === "object" && "default" in cur && cur.default != null) {
      cur = (cur as any).default;
      continue;
    }
    break;
  }

  return cur as ForgeUIConfig;
}

export async function loadConfig(configPath?: string): Promise<ForgeUIConfig> {
  const chosen = resolveConfigPath(configPath);
  const abs = path.resolve(process.cwd(), chosen);
  if (!fs.existsSync(abs)) {
    throw new Error(`Config not found: ${chosen} (run: forgeui init)`);
  }
  const jiti = jitiFactory(process.cwd(), { interopDefault: true });
  const mod = jiti(abs);
  return unwrapConfigModule(mod);
}
