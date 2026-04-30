#!/usr/bin/env node
/**
 * Ephemeralization: docs/p31-atmosphere-*.json → design-assets/atmosphere/ + hub public/lib/atmosphere/
 * Extracts canon starfield.presets for browser clients (no fetch to andromeda from static pages).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const docsRamp = path.join(root, "docs/p31-atmosphere-ramp.json");
const docsRoutes = path.join(root, "docs/p31-atmosphere-routes.json");
const canonPath = path.join(root, "andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json");
const designDir = path.join(root, "design-assets", "atmosphere");
const clientSrc = path.join(designDir, "p31-atmosphere-client.js");
const p31caPublic = path.join(root, "andromeda/04_SOFTWARE/p31ca/public");
const p31caLib = path.join(p31caPublic, "lib/atmosphere");
const bondingPublic = path.join(root, "andromeda/04_SOFTWARE/bonding/public");
const bondingAtmo = path.join(bondingPublic, "p31-atmosphere");

function cp(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

export function syncP31Atmosphere() {
  if (!fs.existsSync(docsRamp) || !fs.existsSync(docsRoutes)) {
    console.error("sync-p31-atmosphere: missing docs/p31-atmosphere-ramp.json or routes");
    process.exit(1);
  }
  if (!fs.existsSync(clientSrc)) {
    console.error("sync-p31-atmosphere: missing", clientSrc);
    process.exit(1);
  }

  fs.mkdirSync(designDir, { recursive: true });
  cp(docsRamp, path.join(designDir, "p31-atmosphere-ramp.json"));
  cp(docsRoutes, path.join(designDir, "p31-atmosphere-routes.json"));

  let presets = {};
  if (fs.existsSync(canonPath)) {
    try {
      const canon = JSON.parse(fs.readFileSync(canonPath, "utf8"));
      presets = canon?.starfield?.presets && typeof canon.starfield.presets === "object"
        ? canon.starfield.presets
        : {};
    } catch {
      presets = {};
    }
  }
  const presetPath = path.join(designDir, "p31-canon-starfield-presets.json");
  fs.writeFileSync(
    presetPath,
    JSON.stringify(
      {
        schema: "p31.canonStarfieldPresetsSlice/1.0.0",
        source: "andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json#starfield.presets",
        presets,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  if (fs.existsSync(p31caPublic)) {
    fs.mkdirSync(p31caLib, { recursive: true });
    for (const f of [
      "p31-atmosphere-ramp.json",
      "p31-atmosphere-routes.json",
      "p31-canon-starfield-presets.json",
      "p31-atmosphere-client.js",
      "p31-atmosphere-hints-boot.js",
    ]) {
      cp(path.join(designDir, f), path.join(p31caLib, f));
    }
    console.log("sync-p31-atmosphere:", path.relative(root, p31caLib), "(hub mirror)");
  } else {
    console.log("sync-p31-atmosphere: skip p31ca (tree missing)");
  }

  if (fs.existsSync(bondingPublic)) {
    fs.mkdirSync(bondingAtmo, { recursive: true });
    for (const f of [
      "p31-atmosphere-ramp.json",
      "p31-atmosphere-routes.json",
      "p31-canon-starfield-presets.json",
    ]) {
      cp(path.join(designDir, f), path.join(bondingAtmo, f));
    }
    console.log("sync-p31-atmosphere:", path.relative(root, bondingAtmo), "(bonding /p31-atmosphere/)");
  } else {
    console.log("sync-p31-atmosphere: skip bonding (tree missing)");
  }

  console.log("sync-p31-atmosphere: OK →", path.relative(root, designDir));
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    syncP31Atmosphere();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
