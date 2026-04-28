#!/usr/bin/env node
/**
 * Regression guard: `simplex-bootstrap.mjs --dry-run --apply` exits 0 and prints expected DRY RUN lines.
 * No Cloudflare API calls. Does not require simplex-v7/node_modules beyond wrangler.toml present.
 */
import { spawnSync } from "node:child_process";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const r = spawnSync(process.execPath, [path.join(root, "scripts/simplex-bootstrap.mjs"), "--dry-run", "--apply"], {
  cwd: root,
  encoding: "utf8",
});

const combined = `${r.stderr ?? ""}${r.stdout ?? ""}`;
if (r.status !== 0) {
  console.error("verify-simplex-bootstrap: script exited", r.status, "\n", combined);
  process.exit(1);
}

const mustAlways = ["DRY RUN:", "queues create", "d1 execute simplex"];
for (const m of mustAlways) {
  if (!combined.includes(m)) {
    console.error(`verify-simplex-bootstrap: missing marker: ${JSON.stringify(m)}`);
    console.error(combined.slice(0, 1200));
    process.exit(1);
  }
}

const configuring = combined.includes("creating D1 + KV");
const skipped = combined.includes("skipping D1/KV") || combined.includes("no REPLACE");
if (configuring) {
  for (const m of ["d1 create", "kv namespace create"]) {
    if (!combined.includes(m)) {
      console.error(`verify-simplex-bootstrap: bootstrap path missing marker: ${JSON.stringify(m)}`);
      process.exit(1);
    }
  }
} else if (!skipped) {
  console.error("verify-simplex-bootstrap: unexpected output — neither bootstrap nor skip message");
  process.exit(1);
}

console.log("verify-simplex-bootstrap: OK");
