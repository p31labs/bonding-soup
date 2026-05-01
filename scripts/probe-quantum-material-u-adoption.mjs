#!/usr/bin/env node
/**
 * probe-quantum-material-u-adoption — read-only diagnostic.
 *
 * Walks repo-root + p31ca/public static HTML files, reports:
 *   - eligible : page already loads cognitive-passport/p31-style.css OR p31ca/public/p31-style.css
 *   - adopted  : page references at least one `.p31-q-*` class
 *   - missing  : eligible but zero `.p31-q-*` references (an opt-in candidate)
 *   - external : page does not load the canon CSS (out of scope)
 *
 * Prints a markdown summary by default; pass `--json` for machine output.
 * Never modifies anything. Suitable for `npm run probe:quantum-material-u`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ROOTS = [
  { dir: root, label: "home", maxDepth: 2 },
  { dir: path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public"), label: "p31ca/public", maxDepth: 4 },
  { dir: path.join(root, "cognitive-passport"), label: "cognitive-passport", maxDepth: 2 },
];

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".astro", ".next",
  ".venv", "agent-transcripts", ".cursor",
]);

function* walkHtml(dir, depth, maxDepth) {
  if (depth > maxDepth) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkHtml(full, depth + 1, maxDepth);
    } else if (e.isFile() && /\.html$/i.test(e.name)) {
      yield full;
    }
  }
}

const CANON_HINTS = [
  "p31-style.css",
  "cognitive-passport/p31-style.css",
];

function classify(html) {
  const eligible = CANON_HINTS.some((h) => html.includes(h));
  const adopted = /\.p31-q-/.test(html) || /\bp31-q-[a-z0-9-]+/i.test(html);
  const tonalUse = /var\(--p31-tone-/.test(html) || /var\(--p31-elev-/.test(html);
  return { eligible, adopted, tonalUse };
}

const results = [];
for (const { dir, label, maxDepth } of ROOTS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walkHtml(dir, 0, maxDepth)) {
    let raw;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const { eligible, adopted, tonalUse } = classify(raw);
    let status;
    if (!eligible) status = "external";
    else if (adopted) status = "adopted";
    else status = "missing";
    results.push({
      label,
      path: path.relative(root, file),
      status,
      eligible,
      adopted,
      tonalUse,
      bytes: raw.length,
    });
  }
}

results.sort((a, b) => {
  if (a.label !== b.label) return a.label.localeCompare(b.label);
  return a.path.localeCompare(b.path);
});

const tally = {
  adopted: results.filter((r) => r.status === "adopted").length,
  missing: results.filter((r) => r.status === "missing").length,
  external: results.filter((r) => r.status === "external").length,
  total: results.length,
};

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        schema: "p31.quantumMaterialUProbe/1.0.0",
        generated: new Date().toISOString(),
        roots: ROOTS.map((r) => r.label),
        tally,
        results,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log("# P31 Quantum Material U \u2014 adoption probe\n");
console.log(`scanned: **${tally.total}** static HTML files`);
console.log(`adopted: **${tally.adopted}** \u00b7 missing: **${tally.missing}** \u00b7 external: **${tally.external}**\n`);

if (tally.adopted) {
  console.log("## Adopted (uses `.p31-q-*`)\n");
  for (const r of results.filter((x) => x.status === "adopted")) {
    const tone = r.tonalUse ? " \u00b7 tonal var() in use" : "";
    console.log(`- \`${r.path}\` (${r.label})${tone}`);
  }
  console.log("");
}

if (tally.missing) {
  console.log("## Eligible but un-adopted (canon CSS loaded, zero `.p31-q-*`)\n");
  console.log("These pages already include the canonical stylesheet. Promoting selected components to `.p31-q-*` requires zero new dependencies.\n");
  for (const r of results.filter((x) => x.status === "missing")) {
    console.log(`- \`${r.path}\` (${r.label})`);
  }
  console.log("");
}

if (tally.external) {
  console.log("## External (canon CSS not loaded)\n");
  console.log("Out of scope for the Material U vocabulary unless they opt in by linking the canon CSS first.\n");
  console.log(`(${tally.external} files \u2014 not enumerated)\n`);
}

console.log("---");
console.log("docs/P31-QUANTUM-MATERIAL-U.md \u00b7 npm run probe:quantum-material-u \u00b7 npm run probe:quantum-material-u -- --json");
