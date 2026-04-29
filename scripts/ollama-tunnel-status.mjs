#!/usr/bin/env node
/**
 * Ollama tunnel status helper.
 *
 * Two modes:
 *  - default (no flag): print the current snapshot at ~/.p31/ollama-tunnel.json
 *    in human form. Exit 0 if a URL is present, 2 if missing/stale, 1 on error.
 *  - --watch: read cloudflared stdout from stdin, scrape the trycloudflare URL,
 *    write the snapshot. Used by ollama-tunnel.sh.
 *  - --verify-config: static check (no network); ensures the .sh + .mjs pair are
 *    present and parse, used by `npm run verify:ollama-tunnel-config`.
 *  - --json: print snapshot as JSON instead of human form.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(os.homedir(), ".p31");
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, "ollama-tunnel.json");

const args = new Set(process.argv.slice(2));

function fail(msg, code = 1) {
  console.error(`ollama-tunnel-status: ${msg}`);
  process.exit(code);
}

function ensureDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function writeSnapshot(snapshot) {
  ensureDir();
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
}

function readSnapshot() {
  if (!fs.existsSync(SNAPSHOT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
  } catch {
    return null;
  }
}

function verifyConfig() {
  const sh = path.join(__dirname, "ollama-tunnel.sh");
  const mjs = path.join(__dirname, "ollama-tunnel-status.mjs");
  for (const f of [sh, mjs]) {
    if (!fs.existsSync(f)) fail(`missing ${path.basename(f)}`);
    if (fs.statSync(f).size < 100) fail(`${path.basename(f)} too small`);
  }
  const text = fs.readFileSync(sh, "utf8");
  if (!text.includes("cloudflared tunnel")) fail("ollama-tunnel.sh missing cloudflared invocation");
  if (!/ollama-tunnel-status\.mjs"?\s+--watch/.test(text)) fail("ollama-tunnel.sh missing --watch hook");
  if (!text.includes(SNAPSHOT_DIR.replace(os.homedir(), "${HOME}"))) {
    if (!text.includes("ollama-tunnel.json")) fail("ollama-tunnel.sh missing snapshot file reference");
  }
  console.log("verify-ollama-tunnel-config: OK (cloudflared script + status helper present)");
}

async function watchMode() {
  ensureDir();
  // Initial empty snapshot so listeners can distinguish "starting" from "stale".
  writeSnapshot({
    url: null,
    state: "starting",
    started_at: new Date().toISOString(),
    pid: process.ppid,
    target: process.env.P31_OLLAMA_HOST || "http://127.0.0.1:11434",
  });

  const urlRegex = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
  let urlSeen = null;

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    process.stdout.write(chunk); // pass through to terminal
    if (!urlSeen) {
      const m = chunk.match(urlRegex);
      if (m) {
        urlSeen = m[0];
        writeSnapshot({
          url: urlSeen,
          openaiBaseUrl: `${urlSeen}/v1`,
          state: "live",
          started_at: new Date().toISOString(),
          pid: process.ppid,
          target: process.env.P31_OLLAMA_HOST || "http://127.0.0.1:11434",
        });
        process.stderr.write(
          `\n[p31-ollama-tunnel] live: ${urlSeen}\n[p31-ollama-tunnel] Cursor base URL: ${urlSeen}/v1\n`
        );
      }
    }
  });

  process.stdin.on("end", () => {
    try {
      fs.unlinkSync(SNAPSHOT_FILE);
    } catch {
      /* ignore */
    }
  });
}

function printSnapshot() {
  const snap = readSnapshot();
  if (!snap) {
    if (args.has("--json")) {
      console.log(JSON.stringify({ state: "absent" }));
      process.exit(2);
    }
    console.log("ollama-tunnel: no snapshot at " + SNAPSHOT_FILE + " (tunnel not running)");
    process.exit(2);
  }
  if (args.has("--json")) {
    console.log(JSON.stringify(snap, null, 2));
    process.exit(snap.state === "live" ? 0 : 2);
  }
  console.log(`ollama-tunnel snapshot (${SNAPSHOT_FILE}):`);
  console.log(`  state:        ${snap.state ?? "?"}`);
  console.log(`  url:          ${snap.url ?? "(not yet assigned)"}`);
  console.log(`  Cursor base:  ${snap.openaiBaseUrl ?? (snap.url ? snap.url + "/v1" : "(not yet)")}`);
  console.log(`  target:       ${snap.target ?? "?"}`);
  console.log(`  started_at:   ${snap.started_at ?? "?"}`);
  console.log(`  pid:          ${snap.pid ?? "?"}`);
  process.exit(snap.state === "live" ? 0 : 2);
}

if (args.has("--verify-config")) verifyConfig();
else if (args.has("--watch")) watchMode();
else printSnapshot();
