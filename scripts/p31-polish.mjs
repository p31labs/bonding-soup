#!/usr/bin/env node
/**
 * One-shot “make it green + synced” for P31 home + nested Andromeda p31ca.
 * - Regenerates constants-derived artifacts (mesh JSON, ground-truth header, TS export).
 * - Normalizes BONDING static HTML (viewport-fit + p31-mesh-m-first): apply:mesh-m-first:home.
 * - Mirrors p31-live-fleet.json into the hub public tree when both paths exist.
 * - Regenerates fleet-portal.html (npm run build:fleet-portal) and mirrors it to p31ca public when present.
 * - Runs sync:doc-library:p31ca when p31ca exists (build:doc-index + mirror to public/doc-library/).
 * - Runs release:local (verify + p31ca build + security:check, loose mesh strict).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(title, cmd, cwd = root) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function main() {
  run("apply:constants", "npm run apply:constants", root);
  run("apply:mesh-m-first:home", "npm run apply:mesh-m-first:home", root);
  run("apply:pwa:home (BONDING manifest link)", "npm run apply:pwa:home", root);

  run("build:fleet-portal (live apps index HTML)", "npm run build:fleet-portal", root);

  const fleetSrc = path.join(root, "p31-live-fleet.json");
  const fleetDst = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/p31-live-fleet.json");
  if (fs.existsSync(fleetSrc) && fs.existsSync(path.dirname(fleetDst))) {
    fs.copyFileSync(fleetSrc, fleetDst);
    console.log("\n\x1b[32m✓\x1b[0m synced p31-live-fleet.json → andromeda/04_SOFTWARE/p31ca/public/");
  }
  const portalSrc = path.join(root, "fleet-portal.html");
  const portalDst = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/fleet-portal.html");
  if (fs.existsSync(portalSrc) && fs.existsSync(path.dirname(portalDst))) {
    let html = fs.readFileSync(portalSrc, "utf8");
    html = html.replace('href="cognitive-passport/p31-style.css"', 'href="p31-style.css"');
    html = html.replace(
      'href="cognitive-passport/p31-responsive-surface.css"',
      'href="p31-responsive-surface.css"',
    );
    html = html.replace(
      'src="cognitive-passport/lib/p31-subject-prefs.js"',
      'src="lib/p31-subject-prefs.js"',
    );
    fs.writeFileSync(portalDst, html, "utf8");
    console.log("\n\x1b[32m✓\x1b[0m wrote fleet-portal.html → p31ca public/ (p31-style.css) — live: https://p31ca.org/fleet-portal.html\n");
  }

  const p31caRoot = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
  if (fs.existsSync(p31caRoot) && process.env.P31_POLISH_SKIP_DOC_LIB !== "1") {
    run(
      "sync:doc-library:p31ca (build:doc-index + hub /doc-library mirror)",
      "npm run sync:doc-library:p31ca",
      root
    );
  } else if (!fs.existsSync(p31caRoot)) {
    console.log("\n\x1b[33m▶\x1b[0m polish: skip sync:doc-library:p31ca — no andromeda/04_SOFTWARE/p31ca\n");
  }

  run("release:local (verify + hub build + security)", "npm run release:local", root);
  console.log("\n\x1b[32m✓\x1b[0m p31-polish: complete\n");
}

main();
