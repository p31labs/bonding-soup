#!/usr/bin/env node
/**
 * Structural checks on generated fleet-portal.html (ATC radar + Gray Rock + glass strip).
 * Hub mirror should match after polish — verified when andromeda/p31ca is present.
 * When hub file exists, root vs hub must match byte-for-byte (LF-normalized) unless
 * P31_FLEET_PORTAL_SKIP_MIRROR_BYTES=1 (e.g. intentional build:fleet-portal:live-only hub).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MUST = [
  'id="fp-atc"',
  'id="fp-body"',
  // Default surface state is now `fp-alive` (tables visible inline) — the
  // Gray-Rock + reveal-button gate was removed in the unification pass
  // (2026-04-30) so the route tables don't hide behind a click.
  "fp-alive",
  'id="fp-detail"',
  "fp-glass-strip",
  "fp-status-legend",
  "fp-local-hint",
];

function die(msg) {
  console.error("verify-fleet-portal:", msg);
  process.exit(1);
}

function normNl(s) {
  return s.replace(/\r\n/g, "\n");
}

function verifyFile(rel) {
  const p = path.join(root, ...rel.split("/"));
  if (!fs.existsSync(p)) {
    die(`missing ${rel}`);
  }
  const body = fs.readFileSync(p, "utf8");
  for (const frag of MUST) {
    if (!body.includes(frag)) {
      die(`${rel}: missing required anchor ${JSON.stringify(frag)}`);
    }
  }
}

function main() {
  const rootFp = path.join(root, "fleet-portal.html");
  verifyFile("fleet-portal.html");
  const hub = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "fleet-portal.html");
  if (fs.existsSync(hub)) {
    const body = fs.readFileSync(hub, "utf8");
    for (const frag of MUST) {
      if (!body.includes(frag)) {
        die(`andromeda/04_SOFTWARE/p31ca/public/fleet-portal.html: missing ${JSON.stringify(frag)} — run npm run build:fleet-portal and copy to hub public`);
      }
    }
    if (process.env.P31_FLEET_PORTAL_SKIP_MIRROR_BYTES !== "1") {
      const a = normNl(fs.readFileSync(rootFp, "utf8"));
      const b = normNl(body);
      if (a !== b) {
        die(
          "fleet-portal.html root vs p31ca/public byte mismatch — run build:fleet-portal from repo root and mirror to hub (or P31_FLEET_PORTAL_SKIP_MIRROR_BYTES=1 if intentional glass/live-only drift)"
        );
      }
    }
  }

  console.log("verify-fleet-portal: OK");
}

main();
