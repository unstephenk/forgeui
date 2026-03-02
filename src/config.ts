import fs from "node:fs";
import path from "node:path";
import jitiFactory from "jiti";
import type { ForgeUIConfig } from "./types.js";

export const DEFAULT_CONFIG_FILE = "forgeui.config.ts";

export function defaultConfig(): ForgeUIConfig {
  return {
    tokensPath: "./tokens.json",
    outDir: "./forgeui",
    themes: {
      rootTheme: "Light",
      selectorByTheme: {
        Light: ":root",
        Dark: "[data-theme=\"dark\"]"
      }
    },
    css: {
      alsoEmitClassDark: true
    },
    tailwind: {
      cssFile: "tokens.css",
      presetFile: "forgeui.preset.ts",
      darkThemeName: "Dark"
    }
  };
}

export function configTemplate(): string {
  const cfg = defaultConfig();
  return `import type { ForgeUIConfig } from "@forgeui/cli";\n\nconst config: ForgeUIConfig = ${JSON.stringify(
    cfg,
    null,
    2
  )};\n\nexport default config;\n`;
}

export async function loadConfig(configPath = DEFAULT_CONFIG_FILE): Promise<ForgeUIConfig> {
  const abs = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Config not found: ${configPath} (run: forgeui init)`);
  }
  const jiti = jitiFactory(process.cwd(), { interopDefault: true });
  const mod = jiti(abs);
  const cfg: ForgeUIConfig = (mod?.default ?? mod) as ForgeUIConfig;
  return cfg;
}
