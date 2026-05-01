#!/usr/bin/env node
/**
 * Ensures p31-discord-bot-swarm.json matches generated/p31-bot.manifest.json.
 * No-op (exit 0) if bot tree is missing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const botDir = path.join(root, "andromeda/04_SOFTWARE/discord/p31-bot");
const manifestPath = path.join(botDir, "generated/p31-bot.manifest.json");
const swarmPath = path.join(root, "p31-discord-bot-swarm.json");

const botPkg = path.join(botDir, "package.json");
if (!fs.existsSync(botPkg)) {
  console.log(
    "verify-discord-bot-swarm: skip (no " +
      path.relative(root, botDir) +
      ")",
  );
  process.exit(0);
}

function fail(msg) {
  console.error("verify-discord-bot-swarm:", msg);
  process.exit(1);
}

if (!fs.existsSync(swarmPath)) {
  fail(
    "missing p31-discord-bot-swarm.json — run: npm run verify:discord-bot",
  );
}
if (!fs.existsSync(manifestPath)) {
  fail(
    "missing bot manifest — run npm run verify:bot in " +
      path.relative(root, botDir),
  );
}

let manifest;
let swarm;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  swarm = JSON.parse(fs.readFileSync(swarmPath, "utf8"));
} catch (e) {
  fail(e.message || String(e));
}

const mf = manifest.registryFingerprint;
const sf = swarm.registryFingerprint;
if (mf !== sf) {
  fail(
    `registryFingerprint mismatch manifest ${JSON.stringify(mf)} vs swarm ${JSON.stringify(sf)} — run npm run verify:discord-bot`,
  );
}

const mc = Array.isArray(manifest.commands) ? manifest.commands.length : 0;
const sc = Number(swarm.commandCount);
if (sc !== mc) {
  fail(
    `commandCount mismatch manifest ${mc} vs swarm ${sc} — run npm run verify:discord-bot`,
  );
}

if (swarm.schema !== "p31.discordBotSwarm/1.0.0") {
  fail(`unexpected swarm schema ${JSON.stringify(swarm.schema)}`);
}

console.log("verify-discord-bot-swarm: OK");
process.exit(0);
