# Recipes

## 1) Light/Dark toggle

If you generate dark theme vars under `[data-theme="dark"]`, you can toggle with:

```html
<html data-theme="dark">
```

Or, if your selector list includes `.dark`, you can toggle with Tailwind’s classic class:

```html
<html class="dark">
```

## 2) Multi-brand themes

Add additional themes in Tokens Studio, e.g. `Acme` / `Globex`, then map them to selectors:

```ts
// forgeui.config.ts
export default {
  themes: {
    rootTheme: "Light",
    selectorByTheme: {
      Light: ":root",
      Dark: ["[data-theme=\"dark\"]", ".dark"],
      Acme: "[data-brand=\"acme\"]",
      Globex: "[data-brand=\"globex\"]"
    }
  }
} as const;
```

## 3) Rename token namespaces in Tailwind

If your tokens are named `bg.*` but you want Tailwind keys under `surface.*`:

```ts
// forgeui.config.ts
export default {
  tailwind: {
    map: {
      colors: {
        bg: "surface"
      }
    }
  }
} as const;
```

## 4) Only generate a subset of tokens

```ts
export default {
  filter: {
    include: ["core.color.*"],
    exclude: ["*.deprecated.*"],
    sets: ["core"],
    types: ["color"]
  }
} as const;
```
