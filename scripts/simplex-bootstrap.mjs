#!/usr/bin/env node
/**
 * Automated Simplex Cloudflare bring-up (WCD-SIMPLEX-01): D1 + KV via wrangler `--update-config`,
 * queue creation (idempotent tolerate "exists"), remote schema apply.
 * Requires `wrangler login`. Does not deploy the Worker unless `--deploy` + confirmation path.
 *
 * Usage:
 *   node scripts/simplex-bootstrap.mjs
 *   node scripts/simplex-bootstrap.mjs --dry-run --apply
 *   node scripts/simplex-bootstrap.mjs --apply
 *   node scripts/simplex-bootstrap.mjs --schema-only
 *   node scripts/simplex-bootstrap.mjs --apply --deploy   # after secrets
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const simplex = path.join(root, "simplex-v7");
const wranglerToml = path.join(simplex, "wrangler.toml");
const schemaSql = path.join(simplex, "src", "db", "schema.sql");

const argv = new Set(process.argv.slice(2));
const dryRun = argv.has("--dry-run");
const apply = argv.has("--apply");
const schemaOnly = argv.has("--schema-only");
const deploy = argv.has("--deploy");

function readToml() {
  if (!fs.existsSync(wranglerToml)) {
    console.error(`simplex-bootstrap: missing ${wranglerToml}`);
    process.exit(1);
  }
  return fs.readFileSync(wranglerToml, "utf8");
}

function needsD1KvBootstrap(tomlText) {
  return /REPLACE_WITH_D1_ID|REPLACE_WITH_KV_ID/i.test(tomlText);
}

function wranglerCmd(args, { cwd = simplex, capture } = {}) {
  const bins = ["npx", "wrangler", ...args];
  const label = bins.join(" ");
  if (dryRun) {
    console.log(`DRY RUN: ${label}`);
    return { ok: true, skipped: true };
  }
  const r = spawnSync(bins[0], bins.slice(1), {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
    env: process.env,
  });
  const out = `${r.stderr ?? ""}${r.stdout ?? ""}`;
  return { ok: r.status === 0, exit: r.status ?? 1, out, skipped: false };
}

function execWranglerFatal(args, label) {
  const r = wranglerCmd(args, { capture: false });
  if (r.skipped) return;
  if (!r.ok) {
    console.error(`${label}: failed (exit ${r.exit})`);
    process.exit(1);
  }
}

/** Queue create tolerates duplicate name in account. */
function wranglerQueuesCreate() {
  const r = wranglerCmd(["queues", "create", "simplex-agent-queue"], { capture: true });
  if (r.skipped) return;
  if (r.ok) return;
  const combined = r.out.toLowerCase();
  if (combined.includes("already") || combined.includes("exist") || combined.includes("duplicate")) {
    console.log("simplex-bootstrap: queue simplex-agent-queue already present — OK.");
    return;
  }
  console.error("simplex-bootstrap: queues create failed:\n", r.out);
  process.exit(1);
}

function main() {
  if (schemaOnly) {
    if (dryRun) {
      console.log("DRY RUN: npx wrangler d1 execute simplex --remote --file=src/db/schema.sql");
      return;
    }
    execWranglerFatal(
      ["d1", "execute", "simplex", "--remote", "--file=src/db/schema.sql"],
      "d1 execute schema"
    );
    console.log("simplex-bootstrap: schema applied (remote).");
    return;
  }

  if (!apply && !dryRun) {
    console.log(`simplex-bootstrap — Cloudflare resources for simplex-v7

  --dry-run       Print wrangler commands (no API calls)
  --apply         Run D1/KV create (if REPLACE_* in wrangler.toml), queue create, remote schema apply
  --schema-only   Only wrangler d1 execute --remote --file=schema (no creates; pair with login)
  --deploy        After --apply, run wrangler deploy from simplex-v7

Requires: Node 20+, cd from repo root, wrangler login, simplex-v7/npm install done at least once.

Examples:
  npm run simplex:bootstrap:dry
  npm run simplex:bootstrap:apply
  npm run simplex:bootstrap:schema   # remote schema only
`);
    process.exit(0);
  }

  if (!fs.existsSync(path.join(simplex, "package.json"))) {
    console.error("simplex-bootstrap: simplex-v7/package.json not found");
    process.exit(1);
  }
  if (!fs.existsSync(schemaSql)) {
    console.error("simplex-bootstrap: missing", schemaSql);
    process.exit(1);
  }

  const toml = readToml();

  if (needsD1KvBootstrap(toml)) {
    console.log("simplex-bootstrap: creating D1 + KV (wrangler will patch wrangler.toml)…");
    execWranglerFatal(
      ["d1", "create", "simplex", "--binding", "DB", "--update-config"],
      "d1 create"
    );
    execWranglerFatal(
      ["kv", "namespace", "create", "SIMPLEX_STATE", "--binding", "SIMPLEX_STATE", "--update-config"],
      "kv namespace create"
    );
  } else {
    console.log("simplex-bootstrap: wrangler.toml has no REPLACE_WITH_* — skipping D1/KV create.");
  }

  wranglerQueuesCreate();

  execWranglerFatal(
    ["d1", "execute", "simplex", "--remote", "--file=src/db/schema.sql"],
    "d1 execute schema"
  );

  console.log(
    "simplex-bootstrap: remote D1 schema OK. Next: wrangler secret put … (simplex-v7/DEPLOY.md §3); then npm run simplex:bootstrap:apply -- --deploy"
  );

  if (deploy) {
    if (dryRun) {
      console.log("DRY RUN: npx wrangler deploy (cwd simplex-v7)");
      return;
    }
    execSync("npx wrangler deploy", { cwd: simplex, stdio: "inherit" });
    console.log("simplex-bootstrap: Worker deployed.");
  }
}

main();
