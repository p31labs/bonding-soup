#!/usr/bin/env node
/**
 * sync-ecosystem — keeps both sites speaking the same canonical facts.
 *
 * Reads p31-constants.json → writes:
 *   phosphorus31.org/website/p31-status.json  (served publicly by org site)
 *
 * Also validates that the ecosystem bridge worker's SYNC_PAYLOAD is consistent
 * with p31-constants.json (warns on drift, does NOT auto-patch the worker source).
 *
 * Run: npm run sync:ecosystem
 * Also wired into: npm run apply:constants
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PHOS_ROOT = resolve(ROOT, "phosphorus31.org");
const CONSTANTS_PATH = resolve(ROOT, "p31-constants.json");
const PHOS_STATUS_PATH = resolve(PHOS_ROOT, "website/p31-status.json");
const BRIDGE_SRC_PATH = resolve(ROOT, "workers/p31-ecosystem-bridge/src/index.ts");

function loadConstants() {
  const raw = readFileSync(CONSTANTS_PATH, "utf8");
  return JSON.parse(raw);
}

function buildPhosStatus(c) {
  const org = c.organization ?? {};
  const research = c.research ?? {};
  const payment = c.payment ?? {};
  return {
    schema: "p31.orgStatus/1.0.0",
    generated: new Date().toISOString().slice(0, 10),
    org: {
      legalName: org.legalName ?? "P31 Labs, Inc.",
      ein: org.ein ?? "42-1888158",
      stateOfIncorporation: org.stateOfIncorporation ?? "GA",
      sosControlNumber: org.sosControlNumber ?? "",
      status501c3: org.status501c3 ?? "determined_active",
      determinationDate: org.determinationDate ?? "",
      publicCharityStatus: org.publicCharityStatus ?? "170(b)(1)(A)(vi)",
      deductibilityStatus: org.deductibilityStatus ?? "tax_deductible_donations_enabled",
      samUei: c.sam?.uei ?? "",
    },
    research: {
      zenodoPublicationCount: research.zenodoPublicationCount ?? 22,
      researchSeriesCount: research.researchSeriesCount ?? 22,
    },
    payment: {
      donateApiUrl: payment.donateApiHealthUrl ?? "https://donate-api.phosphorus31.org/health",
      stripeWorkerHost: payment.stripeWorkerHost ?? "donate-api.phosphorus31.org",
    },
    site: {
      url: "https://phosphorus31.org",
      publicSurfaces: 18,
    },
    mesh: {
      ecosystemBridgeUrl: "https://ecosystem-bridge.trimtab-signal.workers.dev",
      techHubUrl: "https://p31ca.org",
    },
  };
}

function checkBridgeDrift(c, status) {
  if (!existsSync(BRIDGE_SRC_PATH)) return;
  const src = readFileSync(BRIDGE_SRC_PATH, "utf8");
  const warnings = [];
  const ein = c.organization?.ein ?? "42-1888158";
  if (!src.includes(ein)) warnings.push(`Bridge worker missing EIN ${ein}`);
  const pubs = String(c.research?.zenodoPublicationCount ?? 22);
  if (!src.includes(pubs)) warnings.push(`Bridge worker may have stale publication count (expected ${pubs})`);
  const det = c.organization?.determinationDate ?? "";
  if (det && !src.includes(det)) warnings.push(`Bridge worker may have stale determinationDate (expected ${det})`);
  if (warnings.length > 0) {
    console.warn("⚠  Ecosystem bridge drift detected:");
    warnings.forEach((w) => console.warn("   •", w));
    console.warn("   Update SYNC_PAYLOAD in workers/p31-ecosystem-bridge/src/index.ts");
  }
}

function main() {
  const c = loadConstants();
  const status = buildPhosStatus(c);

  if (!existsSync(resolve(PHOS_ROOT, "website"))) {
    console.log("⚠  phosphorus31.org/website not found — skipping p31-status.json write");
    return;
  }

  writeFileSync(PHOS_STATUS_PATH, JSON.stringify(status, null, 2) + "\n", "utf8");
  console.log(`✓  sync:ecosystem → wrote ${PHOS_STATUS_PATH.replace(ROOT + "/", "")}`);

  checkBridgeDrift(c, status);
}

main();
