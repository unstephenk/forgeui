# ForgeUI Roadmap

This file is the source of truth for what’s next.
Rule: **every commit must keep at least 10 upcoming items** in the “Next” list.

## Recently completed (high level)
- Tokens Studio ($themes/$sets) → `tokens.css`
- Tailwind v4 preset generation
- `init`, `sync`, `watch`, `diff`
- lockfile + manifest
- golden tests
- example React + Tailwind v4 app

## Next (keep >= 10)
1. **NPM smoke test**: add `npm pack` + install test in CI to catch broken publishes.
2. **Windows support**: path handling + newline stability + CI job on windows-latest.
3. **Figma pull (v1)**: optional command to fetch tokens via Figma API and sync.
4. **Component scaffolding (v1)**: `forgeui scaffold <component>` for React + Tailwind.
5. **Storybook integration (v1)**: auto-generate token docs page + theme switcher.
6. **Plugin system (v1)**: allow custom generators via config + hooks.
7. **Validation strict mode**: upgrade warnings to errors with `--strict`.
8. **Token docs generator**: output `tokens.md` or a JSON index for docs sites.
9. **Better shadow support**: translate Tokens Studio shadow arrays into CSS box-shadow strings.
10. **Color transforms**: support `rgba()`/`hsl()` inputs and output stable rgb triplets.
