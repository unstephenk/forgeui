# Releasing ForgeUI

ForgeUI uses **Changesets** + a tag-triggered GitHub Actions workflow.

## 0) Prereqs
- `NPM_TOKEN` secret is set in GitHub repo settings.
- You have permission to push tags.

## 1) Create a changeset

```bash
npm run changeset
```

Pick the bump type (patch/minor/major) and write a short summary.

## 2) Version packages

```bash
npm run version-packages
```

This updates `package.json` versions and `CHANGELOG.md`.
Commit and push.

## 3) Tag a release

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

## 4) What CI does
The `Release` workflow will:
- install deps
- run tests
- run `npm publish --dry-run`
- publish to npm
- create a GitHub Release with generated notes
