#!/usr/bin/env node
/**
 * Runs `npm run verify:bot` in andromeda/04_SOFTWARE/discord/p31-bot when present.
 * No-op (exit 0) if the tree is missing — partial clones, home-only checkouts.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const botDir = path.join(root, "andromeda/04_SOFTWARE/discord/p31-bot");
const botPkg = path.join(botDir, "package.json");

if (!fs.existsSync(botPkg)) {
  console.log(
    "verify:discord-bot — skip (no " + path.relative(root, botDir) + ")",
  );
  process.exit(0);
}

execSync("npm run verify:bot", { cwd: botDir, stdio: "inherit" });
execSync(`node ${path.join(__dirname, "sync-discord-bot-swarm.mjs")}`, {
  cwd: root,
  stdio: "inherit",
});
execSync(`node ${path.join(__dirname, "verify-discord-bot-swarm.mjs")}`, {
  cwd: root,
  stdio: "inherit",
});
