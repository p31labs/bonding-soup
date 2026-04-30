#!/usr/bin/env node
/**
 * Syncs design + hub mirrors, then validates docs/p31-atmosphere-*.json
 * against andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json.
 * npm run verify:atmosphere-ramp
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { syncP31Atmosphere } from "./sync-p31-atmosphere.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const canonPath = join(
  root,
  "andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json",
);
const rampPath = join(root, "docs/p31-atmosphere-ramp.json");
const routesPath = join(root, "docs/p31-atmosphere-routes.json");
const designDir = join(root, "design-assets", "atmosphere");
const p31caAtmo = join(root, "andromeda/04_SOFTWARE/p31ca/public/lib/atmosphere");
const bondingAtmo = join(root, "andromeda/04_SOFTWARE/bonding/public/p31-atmosphere");

const SOUND_PROFILES = new Set([
  "none",
  "organic",
  "chemistry",
  "relay",
  "forbidden",
  "molecular",
]);
const PALETTE_EMPHASIS = new Set([
  "coral",
  "teal",
  "neutral",
  "phosphorus",
  "lavender",
  "butter",
]);
const STARFIELD_AOD = new Set(["on", "off", "degraded"]);

function fail(msg) {
  console.error(`verify:atmosphere-ramp — ${msg}`);
  process.exit(1);
}

function loadJson(path, label) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${label} invalid JSON: ${path} — ${e?.message || e}`);
  }
}

function assertFileEqual(canonical, mirror, label) {
  if (!existsSync(mirror)) fail(`mirror missing (${label}): ${mirror}`);
  const a = readFileSync(canonical, "utf8");
  const b = readFileSync(mirror, "utf8");
  if (a !== b) fail(`mirror drift (${label}) — refresh: npm run sync:atmosphere`);
}

function main() {
  syncP31Atmosphere();

  const rampDoc = loadJson(rampPath, "ramp registry");
  const routesDoc = loadJson(routesPath, "route map");

  assertFileEqual(rampPath, join(designDir, "p31-atmosphere-ramp.json"), "ramp→design");
  assertFileEqual(routesPath, join(designDir, "p31-atmosphere-routes.json"), "routes→design");

  if (existsSync(p31caAtmo)) {
    for (const f of [
      "p31-atmosphere-ramp.json",
      "p31-atmosphere-routes.json",
      "p31-canon-starfield-presets.json",
      "p31-atmosphere-client.js",
      "p31-atmosphere-hints-boot.js",
    ]) {
      assertFileEqual(join(designDir, f), join(p31caAtmo, f), `design→p31ca/${f}`);
    }
  }

  if (existsSync(bondingAtmo)) {
    for (const f of [
      "p31-atmosphere-ramp.json",
      "p31-atmosphere-routes.json",
      "p31-canon-starfield-presets.json",
    ]) {
      assertFileEqual(join(designDir, f), join(bondingAtmo, f), `design→bonding/${f}`);
    }
  }

  if (rampDoc.schema !== "p31.atmosphereRamp/1.0.0") {
    fail(`ramp schema must be p31.atmosphereRamp/1.0.0, got ${String(rampDoc.schema)}`);
  }
  if (routesDoc.schema !== "p31.atmosphereRoutes/1.0.0") {
    fail(`routes schema must be p31.atmosphereRoutes/1.0.0, got ${String(routesDoc.schema)}`);
  }
  if (!Array.isArray(rampDoc.ramps) || rampDoc.ramps.length === 0) {
    fail("rampDoc.ramps must be a non-empty array");
  }
  if (!Array.isArray(routesDoc.routes) || routesDoc.routes.length === 0) {
    fail("routesDoc.routes must be a non-empty array");
  }

  let canon = null;
  if (existsSync(canonPath)) {
    canon = loadJson(canonPath, "universal canon");
    if (canon.schema !== "p31.universalCanon/1.0.0") {
      fail(`canon schema unexpected: ${String(canon.schema)}`);
    }
    const slice = loadJson(
      join(designDir, "p31-canon-starfield-presets.json"),
      "preset slice",
    );
    const want = canon.starfield?.presets || {};
    if (JSON.stringify(slice.presets || {}) !== JSON.stringify(want)) {
      fail("p31-canon-starfield-presets.json out of date vs canon — run npm run sync:atmosphere");
    }
  } else {
    console.warn(
      "verify:atmosphere-ramp — andromeda canon missing; skipping token cross-check (partial clone).",
    );
  }

  const presetKeys =
    canon?.starfield?.presets && typeof canon.starfield.presets === "object"
      ? new Set(Object.keys(canon.starfield.presets))
      : null;
  const radiusKeys =
    canon?.radius && typeof canon.radius === "object"
      ? new Set(Object.keys(canon.radius))
      : null;
  const scaleKeys =
    canon?.typography?.scaleRem && typeof canon.typography.scaleRem === "object"
      ? new Set(Object.keys(canon.typography.scaleRem))
      : null;

  const rampIds = new Set();
  for (const r of rampDoc.ramps) {
    if (!r || typeof r.id !== "string" || !r.id.trim()) fail("ramp missing id");
    if (rampIds.has(r.id)) fail(`duplicate ramp id: ${r.id}`);
    rampIds.add(r.id);

    if (r.starfieldPreset != null) {
      if (typeof r.starfieldPreset !== "string")
        fail(`ramp ${r.id}: starfieldPreset must be string or null`);
      if (presetKeys && !presetKeys.has(r.starfieldPreset)) {
        fail(
          `ramp ${r.id}: starfieldPreset "${r.starfieldPreset}" not in canon.starfield.presets`,
        );
      }
    }

    if (typeof r.radiusToken !== "string")
      fail(`ramp ${r.id}: radiusToken must be string`);
    if (radiusKeys && !radiusKeys.has(r.radiusToken)) {
      fail(`ramp ${r.id}: radiusToken "${r.radiusToken}" not in canon.radius`);
    }

    if (typeof r.typeScaleRem !== "string")
      fail(`ramp ${r.id}: typeScaleRem must be string`);
    if (scaleKeys && !scaleKeys.has(r.typeScaleRem)) {
      fail(
        `ramp ${r.id}: typeScaleRem "${r.typeScaleRem}" not in canon.typography.scaleRem`,
      );
    }

    if (
      typeof r.motionBudget !== "number" ||
      !Number.isInteger(r.motionBudget) ||
      r.motionBudget < 0 ||
      r.motionBudget > 12
    ) {
      fail(`ramp ${r.id}: motionBudget must be integer 0–12`);
    }

    if (typeof r.soundProfile !== "string" || !SOUND_PROFILES.has(r.soundProfile)) {
      fail(
        `ramp ${r.id}: soundProfile must be one of ${[...SOUND_PROFILES].join(", ")}`,
      );
    }

    if (r.paletteEmphasis != null) {
      if (typeof r.paletteEmphasis !== "string" || !PALETTE_EMPHASIS.has(r.paletteEmphasis)) {
        fail(
          `ramp ${r.id}: paletteEmphasis must be one of ${[...PALETTE_EMPHASIS].join(", ")} or omitted`,
        );
      }
    }
  }

  const surfaceIds = new Set();
  for (const row of routesDoc.routes) {
    if (!row || typeof row.surfaceId !== "string" || !row.surfaceId.trim()) {
      fail("route missing surfaceId");
    }
    if (surfaceIds.has(row.surfaceId)) fail(`duplicate surfaceId: ${row.surfaceId}`);
    surfaceIds.add(row.surfaceId);

    if (typeof row.rampId !== "string" || !rampIds.has(row.rampId)) {
      fail(`route ${row.surfaceId}: unknown rampId "${row.rampId}"`);
    }

    if (typeof row.starfieldAOD !== "string" || !STARFIELD_AOD.has(row.starfieldAOD)) {
      fail(
        `route ${row.surfaceId}: starfieldAOD must be one of ${[...STARFIELD_AOD].join(", ")}`,
      );
    }

    const ramp = rampDoc.ramps.find((x) => x.id === row.rampId);
    if (row.starfieldAOD === "off" && ramp.starfieldPreset != null) {
      fail(
        `route ${row.surfaceId}: starfieldAOD off requires ramp ${row.rampId} to use starfieldPreset null (legal posture)`,
      );
    }
    if (row.starfieldAOD !== "off" && ramp.starfieldPreset == null) {
      fail(
        `route ${row.surfaceId}: starfieldAOD ${row.starfieldAOD} requires a non-null starfieldPreset on ramp ${row.rampId}`,
      );
    }
  }

  console.log(
    `verify:atmosphere-ramp — OK (${rampDoc.ramps.length} ramps, ${routesDoc.routes.length} routes${canon ? ", canon + mirrors" : ""}).`,
  );
}

main();
