import type { ForgeUIConfig } from "./types.js";

// Hand-rolled JSON Schema for editor IntelliSense.
// Keep it intentionally simple (v0).
export const CONFIG_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://github.com/unstephenk/forgeui/blob/main/forgeui.config.schema.json",
  title: "ForgeUI Config",
  type: "object",
  additionalProperties: false,
  properties: {
    tokensPath: { type: "string" },
    outDir: { type: "string" },
    plugins: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          module: { type: "string" },
          options: { type: "object", additionalProperties: true },
          enabled: { type: "boolean" }
        },
        required: ["module"]
      }
    },
    themes: {
      type: "object",
      additionalProperties: false,
      properties: {
        rootTheme: { type: "string" },
        selectorByTheme: {
          type: "object",
          additionalProperties: {
            anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
          }
        },
        fallbacks: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      required: ["rootTheme"]
    },
    filter: {
      type: "object",
      additionalProperties: false,
      properties: {
        include: { type: "array", items: { type: "string" } },
        exclude: { type: "array", items: { type: "string" } },
        sets: { type: "array", items: { type: "string" } },
        types: {
          type: "array",
          items: {
            enum: ["color", "dimension", "shadow", "gradient", "fontFamily", "fontSize", "lineHeight", "fontWeight", "typography", "border"]
          }
        }
      }
    },
    css: {
      type: "object",
      additionalProperties: false,
      properties: {
        alsoEmitClassDark: { type: "boolean" },
        dimensions: {
          type: "object",
          additionalProperties: false,
          properties: {
            unit: { enum: ["preserve", "px", "rem"] },
            remBasePx: { type: "number" },
            precision: { type: "number" }
          }
        }
      }
    },
    tailwind: {
      type: "object",
      additionalProperties: false,
      properties: {
        cssFile: { type: "string" },
        themeFile: { type: "string" },
        presetFile: { type: "string" },
        presetFormat: { enum: ["esm", "cjs"] },
        presetUsage: { enum: ["v4", "v3"] },
        darkThemeName: { type: "string" },
        map: {
          type: "object",
          additionalProperties: false,
          properties: {
            colors: {
              type: "object",
              additionalProperties: { type: "string" }
            }
          }
        }
      },
      required: ["cssFile", "presetFile", "darkThemeName"]
    },
    format: {
      type: "object",
      additionalProperties: false,
      properties: {
        prettier: { type: "boolean" }
      }
    }
  },
  required: ["tokensPath", "outDir", "themes", "css", "tailwind"]
} as const;

export type ForgeUIConfigSchema = typeof CONFIG_SCHEMA;

export function asConfigSchema() {
  return CONFIG_SCHEMA;
}

// For TS users who want to validate manually.
export type _ForgeUIConfig = ForgeUIConfig;
