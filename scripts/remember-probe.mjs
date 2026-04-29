#!/usr/bin/env node
/**
 * Operator probe for remembrance mesh (requires OPERATOR_SECRET).
 *
 *   OPERATOR_SECRET='…' SIMPLEX_API_URL='https://api.phosphorus31.org' node scripts/remember-probe.mjs status
 *   node scripts/remember-probe.mjs context
 *   node scripts/remember-probe.mjs vertex <uuid>
 */
import process from "node:process";

const mode = process.argv[2] || "status";
const base = (process.env.SIMPLEX_API_URL ?? "https://api.phosphorus31.org").replace(/\/$/, "");
const tok = process.env.OPERATOR_SECRET?.trim();
if (!tok) {
  console.error("Missing OPERATOR_SECRET.");
  process.exit(1);
}

let path = "/api/remember/status";
if (mode === "context") path = "/api/remember/context";
else if (mode === "vertex") {
  const id = process.argv[3]?.trim();
  if (!id) {
    console.error("Usage: node scripts/remember-probe.mjs vertex <uuid>");
    process.exit(1);
  }
  path = `/api/remember/vertex?id=${encodeURIComponent(id)}`;
} else if (mode === "-h" || mode === "--help") {
  console.log(`Usage: node scripts/remember-probe.mjs [status|context|vertex <id>]

Environment: OPERATOR_SECRET (required), SIMPLEX_API_URL (optional)`);
  process.exit(0);
} else if (mode !== "status") {
  console.error("Unknown mode:", mode, "(use status, context, or vertex <id>)");
  process.exit(1);
}

const url = `${base}${path}`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${tok}` },
  cache: "no-store",
});
const text = await res.text();
process.stdout.write(`${res.status} ${res.statusText}\n`);
try {
  process.stdout.write(`${JSON.stringify(JSON.parse(text), null, 2)}\n`);
} catch {
  process.stdout.write(`${text}\n`);
}
process.exit(res.ok ? 0 : 1);
