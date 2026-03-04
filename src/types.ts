export type TokenType =
  | "color"
  | "dimension"
  | "shadow"
  | "gradient"
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "fontWeight"
  | "typography"
  | "border";

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
  plugins?: {
    // Optional label used in logs/errors (defaults to plugin export name/module).
    name?: string;
    module: string;
    options?: Record<string, unknown>;
    // If false, the plugin is skipped.
    enabled?: boolean;
  }[];
  themes: {
    rootTheme: string; // e.g. "Light"
    selectorByTheme?: Record<string, string | string[]>; // explicit overrides
    // Optional per-theme fallback chain when a theme-mapped token is missing a value.
    // Example: { "Dark": ["Light"] }
    fallbacks?: Record<string, string[]>;
  };
  filter?: {
    // Matched against fully-qualified token path like: core.color.brand.500
    include?: string[];
    exclude?: string[];
    // Limit to specific token sets (e.g. ["core"])
    sets?: string[];
    // Limit to specific $types
    types?: TokenType[];
  };
  css: {
    // if true, also write a `.dark` selector block mirroring the dark theme selector
    alsoEmitClassDark?: boolean;

    // Dimension normalization controls how numeric/dimension tokens are emitted.
    // - preserve: keep author units when present; assume `px` for bare numbers.
    // - px: convert `rem` to `px` (using remBasePx)
    // - rem: convert `px` (and bare numbers) to `rem` (using remBasePx)
    dimensions?: {
      unit?: "preserve" | "px" | "rem";
      remBasePx?: number; // default: 16
      precision?: number; // default: 4
    };
  };
  tailwind: {
    cssFile: string;
    themeFile?: string; // optional separate theme fragment (e.g. "forgeui.theme.ts")
    presetFile: string;
    // Optional: output module format for the Tailwind preset.
    // - esm: `export default preset` (best for Tailwind v4 CSS-first and ESM configs)
    // - cjs: `module.exports = preset` (helps Tailwind v3 + CommonJS configs)
    presetFormat?: "esm" | "cjs";
    // Optional: controls the usage snippet embedded in the generated preset.
    // - v4: CSS-first `@config` wiring
    // - v3: `tailwind.config.*` `presets: [...]` wiring
    presetUsage?: "v4" | "v3";
    darkThemeName: string; // e.g. "Dark"
    map?: {
      // Prefix remaps, e.g. { "bg": "surface" } or { "fg.default": "text.DEFAULT" }
      // Applied to color keys only (for now).
      colors?: Record<string, string>;
    };
  };
  format?: {
    prettier?: boolean;
  };
};
