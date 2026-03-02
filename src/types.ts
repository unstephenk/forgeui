export type TokenType =
  | "color"
  | "dimension"
  | "shadow"
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "fontWeight";

export type Theme = {
  id?: string;
  name: string;
  selectedTokenSets?: Record<string, string>;
};

export type TokensStudioDoc = {
  $metadata?: Record<string, unknown>;
  $themes: Theme[];
  $sets?: Record<string, string>;
  [key: string]: unknown;
};

export type TokenLeaf = {
  $type: TokenType;
  $value: unknown;
};

export type ForgeUIConfig = {
  tokensPath: string;
  outDir: string;
  themes: {
    rootTheme: string; // e.g. "Light"
    selectorByTheme?: Record<string, string>; // explicit overrides
  };
  css: {
    // if true, also write a `.dark` selector block mirroring the dark theme selector
    alsoEmitClassDark?: boolean;
  };
  tailwind: {
    presetFile: string;
    cssFile: string;
    darkThemeName: string; // e.g. "Dark"
  };
};
