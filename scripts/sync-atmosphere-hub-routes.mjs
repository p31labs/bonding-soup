#!/usr/bin/env node
/**
 * Merges hub registry ids (hub-app-ids.mjs) into docs/p31-atmosphere-routes.json
 * so every cockpit card has a surfaceId → ramp mapping. Idempotent.
 * Invoke: npm run sync:atmosphere-hub-routes
 * Wired into verify:atmosphere-ramp when hub-app-ids exists.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const routesPath = path.join(root, "docs/p31-atmosphere-routes.json");
const hubIdsPath = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "scripts", "hub", "hub-app-ids.mjs");

const GARDEN_WARM = new Set([
  "quantum-family",
  "mission-control",
  "kids-growth",
  "book",
  "planetary-onboard",
]);

const LAB_SOVEREIGN = new Set([
  "k4market",
  "tomography",
  "quantum-deck",
  "axiom",
  "collider",
  "quantum-core",
  "qg-ide",
  "quantum-life-os",
  "somatic-anchor",
  "node-zero",
  "sovereign",
  "spaceship-earth",
  "attractor",
  "kenosis",
  "genesis-gate",
  "cortex",
  "alchemy",
  "liminal",
  "prism",
  "resonance",
  "signal",
  "vault",
]);

const LEGAL_DOC = new Set(["legal-evidence"]);

function classify(id) {
  if (LEGAL_DOC.has(id)) {
    return { rampId: "legal-document", starfieldAOD: "off" };
  }
  if (GARDEN_WARM.has(id)) {
    return { rampId: "garden-warm", starfieldAOD: "on" };
  }
  if (LAB_SOVEREIGN.has(id)) {
    return { rampId: "lab-sovereign", starfieldAOD: "on" };
  }
  return { rampId: "hub-lobby", starfieldAOD: "on" };
}

async function loadHubOrder() {
  if (!fs.existsSync(hubIdsPath)) return null;
  const mod = await import(pathToFileURL(hubIdsPath).href);
  const order = mod.HUB_ALL_CARD_ORDER || mod.HUB_COCKPIT_ORDER;
  if (!Array.isArray(order)) return null;
  return order;
}

async function main() {
  if (!fs.existsSync(routesPath)) {
    console.error("sync-atmosphere-hub-routes: missing", routesPath);
    process.exit(1);
  }

  const doc = JSON.parse(fs.readFileSync(routesPath, "utf8"));
  if (!Array.isArray(doc.routes)) {
    console.error("sync-atmosphere-hub-routes: invalid routes array");
    process.exit(1);
  }

  const hubOrder = await loadHubOrder();
  if (!hubOrder) {
    console.log("sync-atmosphere-hub-routes: skip — no hub-app-ids (partial clone)");
    return;
  }

  const seen = new Set(doc.routes.map((r) => r.surfaceId));
  const added = [];
  for (const id of hubOrder) {
    if (typeof id !== "string" || !id.trim()) continue;
    if (seen.has(id)) continue;
    const { rampId, starfieldAOD } = classify(id);
    added.push({
      surfaceId: id,
      rampId,
      starfieldAOD,
      notes: `Hub registry card (${rampId}) — synced by scripts/sync-atmosphere-hub-routes.mjs`,
    });
    seen.add(id);
  }

  if (!added.length) {
    console.log("sync-atmosphere-hub-routes: routes already complete for hub ids");
    return;
  }

  added.sort((a, b) => a.surfaceId.localeCompare(b.surfaceId));
  doc.routes = doc.routes.concat(added);
  fs.writeFileSync(routesPath, JSON.stringify(doc, null, 2) + "\n");
  console.log(`sync-atmosphere-hub-routes: added ${added.length} hub route(s) → ${path.relative(root, routesPath)}`);
}

main().catch((e) => {
  console.error("sync-atmosphere-hub-routes:", e);
  process.exit(1);
});
