#!/usr/bin/env node

import { cac } from "cac";

const cli = cac("forgeui");

cli
  .command("init", "Create forgeui.config.ts and output folder")
  .action(() => {
    console.log("forgeui init (stub) — config scaffolding coming next");
  });

cli
  .command("sync", "Generate tokens.css + Tailwind preset from Tokens Studio export")
  .action(() => {
    console.log("forgeui sync (stub) — generator coming next");
  });

cli
  .command("watch", "Watch tokens file and re-run sync")
  .action(() => {
    console.log("forgeui watch (stub) — watcher coming next");
  });

cli.help();
cli.parse();
