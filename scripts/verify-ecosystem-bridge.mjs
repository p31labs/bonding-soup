#!/usr/bin/env node
/**
 * verify:ecosystem-bridge — structural checks for the cross-site bridge.
 *
 * Does NOT require network access. Validates:
 *   1. Worker config exists and has correct name
 *   2. p31-status.json exists in phosphorus31.org/website/
 *   3. p31-status.json fields match p31-constants.json
 *   4. _headers CSP includes required bridge origins
 *   5. p31-live-fleet.json includes ecosystem bridge + buffer-api
 *   6. p31-constants.json has ecosystemBridgeWorkerUrl
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PHOS_ROOT = resolve(ROOT, "phosphorus31.org");

let errors = 0;
let warnings = 0;

function fail(msg) { console.error("✗", msg); errors++; }
function warn(msg)  { console.warn ("⚠", msg); warnings++; }
function ok(msg)    { console.log  ("✓", msg); }

function read(path) {
  if (!existsSync(path)) return null;
  try { return readFileSync(path, "utf8"); } catch { return null; }
}
function readJson(path) {
  const raw = read(path);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// 1. Worker config
const wranglerPath = resolve(ROOT, "workers/p31-ecosystem-bridge/wrangler.toml");
const workerSrcPath = resolve(ROOT, "workers/p31-ecosystem-bridge/src/index.ts");
if (!existsSync(wranglerPath)) {
  fail("workers/p31-ecosystem-bridge/wrangler.toml missing");
} else {
  const wrangler = read(wranglerPath);
  if (!wrangler.includes('name = "p31-ecosystem-bridge"')) {
    fail("wrangler.toml worker name must be p31-ecosystem-bridge");
  } else {
    ok("ecosystem bridge wrangler.toml present + named correctly");
  }
}
if (!existsSync(workerSrcPath)) {
  fail("workers/p31-ecosystem-bridge/src/index.ts missing");
} else {
  ok("ecosystem bridge src/index.ts present");
}

// 2. p31-status.json exists
const statusPath = resolve(PHOS_ROOT, "website/p31-status.json");
if (!existsString(PHOS_ROOT)) {
  warn("phosphorus31.org not found — skipping p31-status.json checks");
} else {
  if (!existsSync(statusPath)) {
    fail("phosphorus31.org/website/p31-status.json missing — run: npm run sync:ecosystem");
  } else {
    ok("phosphorus31.org/website/p31-status.json present");
  }

  // 3. Fields match p31-constants.json
  const constants = readJson(resolve(ROOT, "p31-constants.json"));
  const status = readJson(statusPath);
  if (constants && status) {
    const constEin = constants.organization?.ein;
    const statusEin = status.org?.ein;
    if (constEin !== statusEin) {
      fail(`EIN mismatch: constants=${constEin} status=${statusEin} — run: npm run sync:ecosystem`);
    } else {
      ok(`EIN consistent: ${constEin}`);
    }

    const constPubs = constants.research?.zenodoPublicationCount;
    const statusPubs = status.research?.zenodoPublicationCount;
    if (constPubs !== statusPubs) {
      fail(`publication count mismatch: constants=${constPubs} status=${statusPubs} — run: npm run sync:ecosystem`);
    } else {
      ok(`publication count consistent: ${constPubs}`);
    }

    const constDet = constants.organization?.determinationDate;
    const statusDet = status.org?.determinationDate;
    if (constDet !== statusDet) {
      fail(`determinationDate mismatch: constants=${constDet} status=${statusDet} — run: npm run sync:ecosystem`);
    } else {
      ok(`determinationDate consistent: ${constDet}`);
    }

    const bridgeUrl = constants.mesh?.ecosystemBridgeWorkerUrl;
    if (!bridgeUrl) {
      fail("p31-constants.json missing mesh.ecosystemBridgeWorkerUrl");
    } else if (bridgeUrl !== "https://ecosystem-bridge.trimtab-signal.workers.dev") {
      fail(`ecosystemBridgeWorkerUrl unexpected value: ${bridgeUrl}`);
    } else {
      ok(`ecosystemBridgeWorkerUrl present: ${bridgeUrl}`);
    }
  }

  // 4. _headers CSP
  const headersPath = resolve(PHOS_ROOT, "website/_headers");
  const headers = read(headersPath);
  if (!headers) {
    fail("phosphorus31.org/website/_headers missing");
  } else {
    const requiredOrigins = [
      "https://donate-api.phosphorus31.org",
      "https://ecosystem-bridge.trimtab-signal.workers.dev",
      "https://p31ca.org",
    ];
    for (const origin of requiredOrigins) {
      if (!headers.includes(origin)) {
        fail(`_headers CSP missing connect-src origin: ${origin}`);
      } else {
        ok(`_headers CSP includes: ${origin}`);
      }
    }
    // Must NOT still have the old incorrect stripe-only CSP
    if (headers.includes("connect-src 'self' https://stripe-donate") && !headers.includes("donate-api.phosphorus31.org")) {
      fail("_headers still has old stripe-only CSP — apply the CSP update");
    }
  }
}

// 5. p31-live-fleet.json has new workers
const fleet = readJson(resolve(ROOT, "p31-live-fleet.json"));
if (!fleet) {
  fail("p31-live-fleet.json missing or invalid JSON");
} else {
  const verified = fleet.workersVerified ?? [];
  const hasbridge = verified.some((w) => w.id === "p31-ecosystem-bridge");
  const hasbuffer = verified.some((w) => w.id === "p31-buffer-api");
  if (!hasbridge) fail("p31-live-fleet.json workersVerified missing p31-ecosystem-bridge entry");
  else ok("p31-live-fleet.json has ecosystem bridge entry");
  if (!hasbuffer) fail("p31-live-fleet.json workersVerified missing p31-buffer-api entry");
  else ok("p31-live-fleet.json has p31-buffer-api entry");
}

// 6. Bridge worker SYNC_PAYLOAD drift check
if (existsSync(workerSrcPath)) {
  const src = read(workerSrcPath);
  const constants = readJson(resolve(ROOT, "p31-constants.json"));
  if (constants && src) {
    const ein = constants.organization?.ein ?? "42-1888158";
    if (!src.includes(ein)) warn(`bridge SYNC_PAYLOAD may have stale EIN (expected ${ein})`);
    const pubs = String(constants.research?.zenodoPublicationCount ?? 22);
    if (!src.includes(pubs)) warn(`bridge SYNC_PAYLOAD may have stale publication count (expected ${pubs})`);
  }
}

function existsString(p) {
  return existsSync(p);
}

const total = errors + warnings;
if (errors > 0) {
  console.error(`\nverify:ecosystem-bridge FAIL — ${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\nverify:ecosystem-bridge OK (${warnings} warning(s))`);
} else {
  console.log(`\nverify:ecosystem-bridge OK`);
}
