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
const push = args.includes('--push');

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

// ensure tag does not already exist
const existing = sh(`git tag -l ${tag}`);
if (existing) {
  die(`Tag already exists: ${tag} (did you already release this version?)`);
}

console.log(`[forgeui release] Running tests…`);
run('npm test');

console.log(`[forgeui release] Creating tag ${tag}…`);
run(`git tag ${tag}`);

console.log(`[forgeui release] Done. Pushing the tag triggers the GitHub Actions release workflow.`);

if (push) {
  console.log(`[forgeui release] Pushing main + tag…`);
  run('git push origin main');
  run(`git push origin ${tag}`);
} else {
  console.log('  git push origin main');
  console.log(`  git push origin ${tag}`);
  console.log('Tip: re-run with --push to do this automatically.');
}
