#!/usr/bin/env node
/**
 * Copies canonical starfield assets → p31ca public/lib (hub + demos).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "design-assets", "starfield");
const p31caPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

function cp(rel, destRel) {
  const from = path.join(srcDir, rel);
  const to = path.join(p31caPublic, destRel);
  if (!fs.existsSync(from)) {
    console.error(`sync-p31-starfield: missing ${from}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`sync-p31-starfield: ${rel} → ${path.relative(root, to)}`);
}

if (!fs.existsSync(path.join(p31caPublic, "lib"))) {
  fs.mkdirSync(path.join(p31caPublic, "lib"), { recursive: true });
}

cp("p31-starfield.js", path.join("lib", "p31-starfield.js"));
cp("p31-mesh-touches.js", path.join("lib", "p31-mesh-touches.js"));
cp("p31-starfield.css", path.join("lib", "p31-starfield.css"));
cp("p31-larmor-fields.css", path.join("lib", "p31-larmor-fields.css"));
cp("p31-starfield-static-plate.js", path.join("lib", "p31-starfield-static-plate.js"));
/** Demo sits next to module/css so `./p31-starfield.js` resolves on the hub. */
cp("demo.html", path.join("lib", "starfield-demo.html"));

console.log("sync-p31-starfield: OK");
