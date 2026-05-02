#!/usr/bin/env node
/**
 * Reads discord/p31-bot generated manifest and writes root p31-discord-bot-swarm.json
 * for fleet-portal / live-fleet alignment. Run after verify:bot (manifest fresh).
 * No-op (exit 0) if bot tree is missing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStamp } from "./lib/build-stamp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const botDir = path.join(root, "andromeda/04_SOFTWARE/discord/p31-bot");
const manifestPath = path.join(botDir, "generated/p31-bot.manifest.json");
const outPath = path.join(root, "p31-discord-bot-swarm.json");

const botPkg = path.join(botDir, "package.json");
if (!fs.existsSync(botPkg)) {
  console.log(
    "sync-discord-bot-swarm: skip (no " +
      path.relative(root, botDir) +
      ")",
  );
  process.exit(0);
}

if (!fs.existsSync(manifestPath)) {
  console.error(
    "sync-discord-bot-swarm: missing manifest — run npm run verify:bot in",
    path.relative(root, botDir),
  );
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.error("sync-discord-bot-swarm: invalid JSON in manifest:", e.message);
  process.exit(1);
}

const commands = Array.isArray(manifest.commands) ? manifest.commands : [];
const commandNames = commands.map((c) => c?.name).filter(Boolean);

const swarm = {
  schema: "p31.discordBotSwarm/1.0.0",
  generatedAt: buildStamp(),
  sourceManifest: path.relative(root, manifestPath).replace(/\\/g, "/"),
  ecosystemDeployableId: "p31-discord-bot-swarm",
  registryFingerprint: manifest.registryFingerprint ?? null,
  packageVersion: manifest.packageVersion ?? null,
  commandCount: commands.length,
  commandNames,
  integrations: {
    glassGroups: ["mesh", "orchestrator", "command-center", "pages"],
    relatedWorkerIds: ["p31-cortex", "command-center-worker", "donate-api"],
    note: "Bot uses env for CORTEX_API_URL, webhooks, Railway/process host — not workers.dev",
  },
  quantumClockSuite: {
    qclockCommand: true,
    parityWithPackage: "@p31/quantum-deck",
    note: "Deterministic tick + Web Crypto shuffle in bot",
  },
};

fs.writeFileSync(outPath, JSON.stringify(swarm, null, 2) + "\n", "utf8");
console.log(
  "sync-discord-bot-swarm: wrote",
  path.relative(root, outPath),
  `(${swarm.commandCount} commands, fp ${swarm.registryFingerprint})`,
);
