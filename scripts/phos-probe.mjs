#!/usr/bin/env node
/**
 * Sign the Phos JSON body and POST to the Worker (one-shot smoke test).
 *
 *   PHOS_HMAC_SECRET='…' PHOS_URL='https://api.phosphorus31.org' node scripts/phos-probe.mjs
 *   node scripts/phos-probe.mjs path/to/body.json
 *
 * @see simplex-v7/scripts/phos-sign.mjs (sign-only)
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const secret = process.env.PHOS_HMAC_SECRET?.trim();
const base = (process.env.PHOS_URL ?? "https://api.phosphorus31.org").replace(/\/$/, "");

if (!secret) {
  console.error("Missing PHOS_HMAC_SECRET.");
  process.exit(1);
}

const defaultBody = path.join(root, "simplex-v7", "scripts", "phos-example-body.json");
const bodyPath = path.resolve(process.argv[2] ?? defaultBody);
const body = readFileSync(bodyPath, "utf8");
const sig = createHmac("sha256", secret).update(body, "utf8").digest("hex");

const url = `${base}/api/phos/respond`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Phos-Signature": sig,
  },
  body,
});

const text = await res.text();
process.stdout.write(`${res.status} ${res.statusText}\n`);
process.stdout.write(`${text}\n`);
process.exit(res.ok ? 0 : 1);
