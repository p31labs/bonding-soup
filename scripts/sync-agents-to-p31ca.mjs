#!/usr/bin/env node
/**
 * sync-agents-to-p31ca — copy home `agents.html` to the p31ca hub mirror.
 *
 *   node scripts/sync-agents-to-p31ca.mjs            # writes only when content differs
 *   node scripts/sync-agents-to-p31ca.mjs --check    # exit 1 when content differs (CI)
 *   node scripts/sync-agents-to-p31ca.mjs --quiet    # suppress non-error output
 *
 * Skips silently when `andromeda/04_SOFTWARE/p31ca/public/` is not present
 * (partial-clone home checkout). On a real write, runs verify-k4-agent-hub
 * against the new mirror to catch drift before commit.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const argv = process.argv.slice(2);
const CHECK = argv.includes("--check");
const QUIET = argv.includes("--quiet");

const SRC = path.join(root, "agents.html");
const DEST_DIR = path.join(root, "andromeda/04_SOFTWARE/p31ca/public");
const DEST = path.join(DEST_DIR, "agents.html");

function log(msg) { if (!QUIET) console.log(`sync-agents-to-p31ca: ${msg}`); }
function fail(msg, code = 1) { console.error(`sync-agents-to-p31ca: ${msg}`); process.exit(code); }

if (!fs.existsSync(SRC)) fail(`missing source ${path.relative(root, SRC)}`);

if (!fs.existsSync(DEST_DIR)) {
  log(`p31ca/public not present (partial clone) — skipping`);
  process.exit(0);
}

const srcRaw = fs.readFileSync(SRC, "utf8");
const destRaw = fs.existsSync(DEST) ? fs.readFileSync(DEST, "utf8") : null;

if (destRaw === srcRaw) {
  log(`mirror already up to date (${srcRaw.length} bytes)`);
  process.exit(0);
}

if (CHECK) {
  fail(
    `mirror differs — run \`npm run sync:agents\` to update ` +
    `(src ${srcRaw.length} bytes vs mirror ${destRaw?.length ?? 0} bytes)`,
  );
}

fs.writeFileSync(DEST, srcRaw);
log(`wrote ${path.relative(root, DEST)} (${srcRaw.length} bytes)`);

// Re-run the K₄ agent hub verifier so a bad mirror is caught immediately.
try {
  execFileSync("node", [path.join(root, "scripts/verify-k4-agent-hub.mjs")], {
    stdio: QUIET ? "pipe" : "inherit",
  });
  log(`verify:k4-agent-hub passed against the fresh mirror`);
} catch (e) {
  fail(`verify:k4-agent-hub FAILED against the fresh mirror — investigate before committing`, 2);
}
