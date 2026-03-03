#!/usr/bin/env node

import fs from 'node:fs';
import { execSync } from 'node:child_process';

function sh(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function die(msg) {
  console.error(`[forgeui release] ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noPush = args.includes('--no-push');
// Default: push, because that's the whole point of a release helper.
const push = args.includes('--push') || !noPush;

const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  die(`Refusing to release from branch '${branch}' (expected 'main')`);
}

const status = sh('git status --porcelain');
if (status) {
  die('Working tree is dirty. Commit or stash your changes first.');
}

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const version = pkg?.version;
if (!version) die('Could not read package.json version');

const tag = `v${version}`;

// ensure tag does not already exist (including remote tags)
run('git fetch --tags --quiet');
const existing = sh(`git tag -l ${tag}`);
if (existing) {
  die(`Tag already exists: ${tag} (did you already release this version?)`);
}

console.log(`[forgeui release] Preflight…`);

console.log(`[forgeui release] Running tests…`);
run('npm test');

console.log(`[forgeui release] Build…`);
run('npm run build');

console.log(`[forgeui release] NPM pack smoke…`);
const tgz = sh('npm pack --silent');
try {
  fs.unlinkSync(tgz);
} catch {
  // ignore
}

if (dryRun) {
  console.log(`[forgeui release] DRY RUN: would create annotated tag ${tag}`);
  console.log(`[forgeui release] DRY RUN: would push main + ${tag}`);
  process.exit(0);
}

console.log(`[forgeui release] Creating annotated tag ${tag}…`);
run(`git tag -a ${tag} -m ${JSON.stringify(tag)}`);

console.log(`[forgeui release] Done. Pushing the tag triggers the GitHub Actions release workflow.`);

if (push) {
  console.log(`[forgeui release] Pushing main + tag…`);
  run('git push origin main');
  run(`git push origin ${tag}`);
} else {
  console.log('[forgeui release] Tag created but not pushed (per --no-push).');
  console.log('  git push origin main');
  console.log(`  git push origin ${tag}`);
}
