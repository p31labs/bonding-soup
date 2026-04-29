#!/usr/bin/env node
/**
 * Mirror Sovereign Lab + browser slicer (+ STL assets) from P31 home into p31ca Pages `public/`.
 * Hub copies rebadge soup/doc links for p31ca.org. Alignment: p31-alignment.json derivation `sovereign-pages-to-p31ca`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31caPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

if (!fs.existsSync(p31caPublic)) {
  console.error("sync-sovereign-pages-to-p31ca: missing", p31caPublic);
  process.exit(1);
}

function hubPatch(html) {
  let out = html;
  const pairs = [
    [/href="soup\.html"/g, 'href="https://bonding.p31ca.org/soup"'],
    [/href="docs\/doc-library\/index\.html"/g, 'href="/doc-library/index.html"'],
  ];
  for (const [re, to] of pairs) {
    out = out.replace(re, to);
  }
  return out;
}

const sovereignSrc = path.join(root, "p31-sovereign-lab.html");
const slicerSrc = path.join(root, "p31-slicer.html");
const stlSrc = path.join(root, "design-assets", "stl");

for (const p of [sovereignSrc, slicerSrc]) {
  if (!fs.existsSync(p)) {
    console.error("sync-sovereign-pages-to-p31ca: missing", p);
    process.exit(1);
  }
}

fs.writeFileSync(
  path.join(p31caPublic, "p31-sovereign-lab.html"),
  hubPatch(fs.readFileSync(sovereignSrc, "utf8")),
);
fs.writeFileSync(path.join(p31caPublic, "p31-slicer.html"), hubPatch(fs.readFileSync(slicerSrc, "utf8")));

if (!fs.existsSync(stlSrc)) {
  console.warn("sync-sovereign-pages-to-p31ca: skip STL tree — missing", stlSrc);
} else {
  const stlDest = path.join(p31caPublic, "design-assets", "stl");
  fs.mkdirSync(stlDest, { recursive: true });
  fs.cpSync(stlSrc, stlDest, { recursive: true });
}

console.log("sync-sovereign-pages-to-p31ca: OK →", path.relative(root, p31caPublic));
