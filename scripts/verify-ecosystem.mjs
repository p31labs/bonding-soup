#!/usr/bin/env node
/**
 * Validates p31-ecosystem.json: JSON parse, required keys for template URLs, deployable paths,
 * monetary invariants (donate probe ↔ payment.donateApiHealthUrl, canonical creator-economy URL).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const manifestPath = path.join(root, "p31-ecosystem.json");
const constantsPath = path.join(root, "p31-constants.json");
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
  if (id === "creator-economy-contract" && String(p.url) !== CREATOR_ECONOMY_URL) {
    fail(
      `probe creator-economy-contract must use canonical URL ${CREATOR_ECONOMY_URL} (got ${String(p.url)})`
    );
  }
}

for (const d of manifest.deployables || []) {
  if (!d.id || !d.cwd || !d.command) {
    fail(`deployable missing id/cwd/command: ${JSON.stringify(d)}`);
  }
  const full = path.join(root, d.cwd);
  if (!fs.existsSync(full)) {
    console.warn("verify-ecosystem: optional tree missing, skip path check:", d.cwd);
  }
}

console.log("verify-ecosystem: OK");
process.exit(0);
