#!/usr/bin/env node
/**
 * Validates p31-ecosystem.json: JSON parse, required keys for template URLs, deployable paths (`steps` argv arrays),
 * monetary invariants (donate-api health URLs; stripeApiHealthUrl must match donateApiHealthUrl until a separate API host exists; creator-economy URL).
 * Also checks p31-live-fleet.json mesh/payment block matches p31-constants.json (no drift).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const manifestPath = path.join(root, "p31-ecosystem.json");
const constantsPath = path.join(root, "p31-constants.json");
const liveFleetPath = path.join(root, "p31-live-fleet.json");
const githubConfigPath = path.join(root, "p31-github.json");

function fail(msg) {
  console.error("verify-ecosystem:", msg);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const constants = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
if (fs.existsSync(githubConfigPath)) {
  try {
    JSON.parse(fs.readFileSync(githubConfigPath, "utf8"));
  } catch (e) {
    fail("p31-github.json invalid JSON: " + (e && e.message ? e.message : e));
  }
}

const keysNeeded = new Set();
for (const p of manifest.glassProbes || []) {
  const m = String(p.url).matchAll(/\{\{([^}]+)\}\}/g);
  for (const x of m) {
    keysNeeded.add(x[1].trim());
  }
}

function getNested(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

for (const k of keysNeeded) {
  if (getNested(constants, k) === undefined) {
    fail(`missing constants value for template {{${k}}} in glass probe URL`);
  }
}

for (const p of manifest.glassProbes || []) {
  const m = p.method;
  if (m != null && m !== "GET" && m !== "POST") {
    fail(`glass probe ${p.id}: method must be GET or POST (got ${JSON.stringify(m)})`);
  }
  if (p.expectJsonKey != null && typeof p.expectJsonKey !== "string") {
    fail(`glass probe ${p.id}: expectJsonKey must be a string`);
  }
}

const CREATOR_ECONOMY_URL = "https://p31ca.org/creator-economy.json";

function expandProbeUrl(url) {
  return String(url).replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const v = getNested(constants, key.trim());
    if (v === undefined) {
      fail(`expandProbeUrl: missing {{${key.trim()}}}`);
    }
    return v;
  });
}

const pay = constants.payment;
if (pay && typeof pay.donateApiHealthUrl === "string" && pay.donateApiHealthUrl) {
  const u = pay.donateApiHealthUrl;
  if (!u.startsWith("https://") || !/\/health\/?$/.test(u.replace(/\/$/, ""))) {
    fail("payment.donateApiHealthUrl must be https and end with /health (canonical donate-api liveness)");
  }
}
if (pay && typeof pay.donateApiWorkersDevUrl === "string" && pay.donateApiWorkersDevUrl) {
  try {
    const u = new URL(pay.donateApiWorkersDevUrl);
    if (u.protocol !== "https:") {
      fail("payment.donateApiWorkersDevUrl must use https");
    }
    if (u.hostname !== "donate-api.trimtab-signal.workers.dev") {
      fail("payment.donateApiWorkersDevUrl hostname must be donate-api.trimtab-signal.workers.dev");
    }
    if (u.pathname.replace(/\/$/, "") !== "" || u.search || u.hash) {
      fail("payment.donateApiWorkersDevUrl must be origin only (no path, query, or hash) for glass {{…}}/health");
    }
  } catch (e) {
    fail("payment.donateApiWorkersDevUrl is not a valid URL: " + (e && e.message ? e.message : e));
  }
}
if (pay && typeof pay.stripeApiHealthUrl === "string" && pay.stripeApiHealthUrl) {
  const u = pay.stripeApiHealthUrl;
  if (!u.startsWith("https://") || !/\/health\/?$/.test(u.replace(/\/$/, ""))) {
    fail("payment.stripeApiHealthUrl must be https and end with /health (Stripe/API Worker liveness)");
  }
}
if (
  pay &&
  typeof pay.stripeApiHealthUrl === "string" &&
  pay.stripeApiHealthUrl &&
  typeof pay.donateApiHealthUrl === "string" &&
  pay.donateApiHealthUrl &&
  pay.stripeApiHealthUrl !== pay.donateApiHealthUrl
) {
  fail(
    "payment.stripeApiHealthUrl must equal payment.donateApiHealthUrl — single deployed Stripe Worker is donate-api (no separate api.phosphorus31.org until DNS + Worker exist)"
  );
}

for (const p of manifest.glassProbes || []) {
  const id = p.id;
  const expanded = expandProbeUrl(p.url);
  if (id === "donate-api-health" && pay?.donateApiHealthUrl) {
    if (expanded !== pay.donateApiHealthUrl) {
      fail(
        `probe donate-api-health expands to ${JSON.stringify(expanded)} but p31-constants payment.donateApiHealthUrl is ${JSON.stringify(pay.donateApiHealthUrl)} — keep them equal`
      );
    }
  }
  if (id === "donate-api-health-workers-dev" && pay?.donateApiWorkersDevUrl) {
    const want = `${String(pay.donateApiWorkersDevUrl).replace(/\/$/, "")}/health`;
    if (expanded !== want) {
      fail(
        `probe donate-api-health-workers-dev expands to ${JSON.stringify(expanded)} but expected ${JSON.stringify(want)} from payment.donateApiWorkersDevUrl`
      );
    }
  }
  if (id === "creator-economy-contract" && String(p.url) !== CREATOR_ECONOMY_URL) {
    fail(
      `probe creator-economy-contract must use canonical URL ${CREATOR_ECONOMY_URL} (got ${String(p.url)})`
    );
  }
}

for (const d of manifest.deployables || []) {
  if (!d.id || !d.cwd) {
    fail(`deployable missing id/cwd: ${JSON.stringify(d)}`);
  }
  const steps = d.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    fail(`deployable ${d.id}: steps must be a non-empty array of argv arrays`);
  }
  for (let si = 0; si < steps.length; si++) {
    const argv = steps[si];
    if (!Array.isArray(argv) || argv.length === 0) {
      fail(`deployable ${d.id}: steps[${si}] must be a non-empty argv array`);
    }
    for (let ai = 0; ai < argv.length; ai++) {
      if (typeof argv[ai] !== "string" || argv[ai].length === 0) {
        fail(`deployable ${d.id}: steps[${si}][${ai}] must be a non-empty string`);
      }
    }
  }
  const full = path.join(root, d.cwd);
  if (!fs.existsSync(full)) {
    console.warn("verify-ecosystem: optional tree missing, skip path check:", d.cwd);
  }
}

if (fs.existsSync(liveFleetPath)) {
  const fleet = JSON.parse(fs.readFileSync(liveFleetPath, "utf8"));
  const fm = fleet.meshAndPayments?.mesh;
  const cm = constants.mesh;
  if (fm && cm) {
    for (const k of Object.keys(cm)) {
      if (k.startsWith("_")) continue;
      if (fm[k] !== cm[k]) {
        fail(
          `p31-live-fleet.json mesh.${k} (${JSON.stringify(fm[k])}) !== p31-constants.json (${JSON.stringify(cm[k])})`
        );
      }
    }
  }
  const fp = fleet.meshAndPayments?.payment;
  const cp = constants.payment;
  if (fp && cp) {
    for (const k of ["donateApiHealthUrl", "donateApiWorkersDevUrl", "stripeWorkerHost"]) {
      if (fp[k] !== undefined && fp[k] !== cp[k]) {
        fail(
          `p31-live-fleet.json payment.${k} (${JSON.stringify(fp[k])}) !== p31-constants (${JSON.stringify(cp[k])})`
        );
      }
    }
  }
  for (const w of fleet.workersVerified || []) {
    const ck = w.constantsKey;
    if (!ck) continue;
    const want = getNested(constants, ck);
    if (want === undefined) {
      fail(`p31-live-fleet workersVerified ${w.id}: unknown constantsKey ${ck}`);
    }
    if (w.workersDev !== undefined && w.workersDev !== want) {
      fail(
        `p31-live-fleet workersVerified ${w.id}: workersDev ${JSON.stringify(w.workersDev)} !== constants ${ck} ${JSON.stringify(want)}`
      );
    }
  }
}

console.log("verify-ecosystem: OK");
process.exit(0);
