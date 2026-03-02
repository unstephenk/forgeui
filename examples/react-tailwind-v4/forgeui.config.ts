import type { ForgeUIConfig } from "@forgeui/cli";

const config: ForgeUIConfig = {
  tokensPath: "./examples/react-tailwind-v4/tokens.json",
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

export default config;
