import fs from "node:fs";
import path from "node:path";

export function defaultTokensTemplate(): any {
  // Minimal Tokens Studio export (Themes + Sets)
  return {
    $metadata: {
      name: "ForgeUI Starter Tokens",
      version: "1.0.0"
    },
    $sets: {
      core: "enabled",
      components: "enabled"
    },
    $themes: [
      {
        id: "t_light",
        name: "Light",
        selectedTokenSets: { core: "enabled", components: "enabled" }
      },
      {
        id: "t_dark",
        name: "Dark",
        selectedTokenSets: { core: "enabled", components: "enabled" }
      }
    ],
    core: {
      color: {
        bg: {
          default: { $type: "color", $value: { Light: "#FFFFFF", Dark: "#0B0F19" } }
        },
        fg: {
          default: { $type: "color", $value: { Light: "#0B0F19", Dark: "#F8FAFC" } }
        },
        brand: {
          500: { $type: "color", $value: { Light: "#6366F1", Dark: "#818CF8" } }
        }
      },
      space: {
        4: { $type: "dimension", $value: "16px" },
        8: { $type: "dimension", $value: "32px" }
      },
      radius: {
        md: { $type: "dimension", $value: "10px" }
      },
      shadow: {
        sm: {
          $type: "shadow",
          $value: [
            { color: "rgba(0,0,0,0.10)", offsetX: "0px", offsetY: "1px", blur: "2px", spread: "0px" }
          ]
        }
      }
    },
    components: {
      button: {
        bg: {
          default: { $type: "color", $value: "{core.color.brand.500}" }
        },
        radius: { $type: "dimension", $value: "{core.radius.md}" }
      }
    }
  };
}

export function writeTokensTemplate(outPath: string, force?: boolean) {
  const abs = path.resolve(process.cwd(), outPath);
  if (fs.existsSync(abs) && !force) {
    throw new Error(`${outPath} already exists (use --force to overwrite)`);
  }
  fs.writeFileSync(abs, JSON.stringify(defaultTokensTemplate(), null, 2) + "\n", "utf8");
  return abs;
}
