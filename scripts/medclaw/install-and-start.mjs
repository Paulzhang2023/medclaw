#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const configPath = path.join(repoRoot, "medclaw.config.json");
const nodeModulesPath = path.join(repoRoot, "node_modules");
const distEntryPath = path.join(repoRoot, "dist", "entry.js");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(nodeModulesPath)) {
  run("pnpm", ["install"]);
}

if (!fs.existsSync(distEntryPath)) {
  run("pnpm", ["build"]);
}

if (!fs.existsSync(configPath)) {
  run("node", ["openclaw.mjs", "medclaw", "init-minimal-config", "--path", configPath]);
}

run("node", ["openclaw.mjs", "medclaw", "apply-minimal-config", "--path", configPath]);
run("node", ["openclaw.mjs", "medclaw", "start"]);
