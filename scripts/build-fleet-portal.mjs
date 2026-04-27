#!/usr/bin/env node
/**
 * Generate fleet-portal.html — one static page of every live app/page URL we can derive from
 * p31-constants.json, p31-live-fleet.json, p31-ecosystem.json. Regenerate when those change.
 *   npm run build:fleet-portal
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "fleet-portal.html");

function getNested(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function expandUrl(template, constants) {
  if (template == null) return "";
  return String(template).replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const v = getNested(constants, key.trim());
    return v !== undefined && v !== null ? String(v) : "";
  });
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readJson(name) {
  const p = path.join(root, name);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const C = readJson("p31-constants.json");
const fleet = readJson("p31-live-fleet.json");
const eco = readJson("p31-ecosystem.json");

/** Bonding deploy base + GitHub /main (same-origin on hub has no home-relative files — verify-internal-hub-links) */
const bondingBase = C.bonding && C.bonding.publicUrl
  ? String(C.bonding.publicUrl).replace(/\/$/, "")
  : "https://bonding.p31ca.org";
let ghMain = "https://github.com/p31labs/bonding-soup/blob/main";
try {
  const ghp = path.join(root, "p31-github.json");
  if (fs.existsSync(ghp)) {
    const g = JSON.parse(fs.readFileSync(ghp, "utf8"));
    if (g.homeRepository) ghMain = `https://github.com/${g.homeRepository}/blob/main`;
  }
} catch {
  /* keep default */
}

const sections = [];

/** @param {string} title @param {string} id */
function h2(title, id) {
  sections.push(`<h2 id="${esc(id)}">${esc(title)}</h2>`);
}

/**
 * @param {Array<{ href: string, label: string, note?: string }>} rows
 */
function table(rows) {
  let h = '<table class="fp-table" role="table"><thead><tr><th>What</th><th>Open</th><th>Note</th></tr></thead><tbody>';
  for (const r of rows) {
    h += "<tr>";
    h += `<td class="fp-label">${esc(r.label)}</td>`;
    h += `<td><a class="fp-link" href="${esc(r.href)}" target="_blank" rel="noopener">${esc(r.href)}</a></td>`;
    h += `<td class="fp-note">${r.note != null ? esc(r.note) : "—"}</td>`;
    h += "</tr>";
  }
  h += "</tbody></table>";
  sections.push(h);
}

// —— Sites (hub, ops, org, bonding)
h2("Hub & org sites", "hub-org");
{
  const sites = fleet.sites;
  const rows = [];
  if (sites?.technicalHub?.url) {
    rows.push({ href: sites.technicalHub.url, label: "p31ca technical hub", note: sites.technicalHub.note || "" });
  }
  if (sites?.operatorShell?.url) {
    rows.push({ href: sites.operatorShell.url, label: "Operator shell / glass", note: sites.operatorShell.note || "" });
  }
  if (sites?.integrationsBridge?.url) {
    rows.push({ href: sites.integrationsBridge.url, label: "Integrations bridge", note: sites.integrationsBridge.note || "" });
  }
  if (sites?.orgMarketing?.url) {
    rows.push({ href: sites.orgMarketing.url, label: "phosphorus31.org (marketing)", note: sites.orgMarketing.note || "" });
  }
  if (sites?.bondingVertical?.url) {
    rows.push({ href: sites.bondingVertical.url, label: "BONDING vertical", note: sites.bondingVertical.note || "" });
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— Public JSON / machine indexes
h2("Public contracts & machine indexes", "contracts");
{
  const pm = fleet.sites?.publicMachineIndexes;
  const rows = [];
  if (pm && typeof pm === "object") {
    for (const [k, v] of Object.entries(pm)) {
      if (k === "note" || v == null) continue;
      if (typeof v === "string" && v.startsWith("http")) {
        rows.push({ href: v, label: k, note: "JSON / index" });
      }
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— Featured p31ca paths
h2("p31ca — featured paths (static & redirects)", "p31ca-paths");
{
  const base = "https://p31ca.org";
  const featured = fleet.sites?.featuredPublicPaths;
  const rows = [];
  if (Array.isArray(featured)) {
    for (const f of featured) {
      if (f?.path) {
        const p = f.path.startsWith("/") ? f.path : `/${f.path}`;
        rows.push({ href: base + p, label: p, note: f.note || "" });
      }
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— Live mesh: URLs from constants + health rows
h2("Mesh & Workers (K₄ edge)", "mesh-workers");
{
  const m = fleet.meshAndPayments?.mesh;
  const rows = [];
  if (m && typeof m === "object") {
    for (const [k, v] of Object.entries(m)) {
      if (k === "note" || typeof v !== "string" || !v.startsWith("http")) continue;
      rows.push({ href: v, label: k, note: "from p31-constants.json mesh" });
    }
  }
  const wv = fleet.workersVerified;
  if (Array.isArray(wv)) {
    for (const w of wv) {
      if (w.workersDev) {
        rows.push({
          href: w.workersDev,
          label: `Worker: ${w.id || "—"}`,
          note: w.note || w.constantsKey || "",
        });
        const hp = w.healthPaths || w.statusPath;
        if (w.statusPath) {
          rows.push({ href: w.workersDev + w.statusPath, label: `${w.id} status`, note: "orchestrator path" });
        } else if (Array.isArray(hp)) {
          for (const p of hp) {
            const path = p.startsWith("/") ? p : `/${p}`;
            rows.push({ href: w.workersDev + path, label: `${w.id} ${path}`, note: "health" });
          }
        }
      }
      if (w.sameOriginOnHub) {
        rows.push({ href: w.sameOriginOnHub, label: `passkey (zone)`, note: w.id || "p31-passkey" });
      }
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— Donate / payment
h2("Monetary (donate-api)", "monetary");
{
  const pay = fleet.meshAndPayments?.payment;
  const rows = [];
  if (pay && typeof pay === "object") {
    for (const [k, v] of Object.entries(pay)) {
      if (typeof v === "string" && v.startsWith("http")) {
        rows.push({ href: v, label: k, note: "payment" });
      }
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— Allowlisted workers (default workers.dev)
h2("Fleet — other Workers (workers.dev)", "workers-more");
{
  const wa = fleet.workersAllowlisted;
  const rows = [];
  if (Array.isArray(wa)) {
    for (const w of wa) {
      if (w.defaultWorkersDev) {
        rows.push({
          href: w.defaultWorkersDev,
          label: w.id || "—",
          note: w.note || w.codePath || "",
        });
      }
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— Glass probes (ecosystem) — expand templates
h2("Glass probes (p31-ecosystem.json)", "glass");
{
  const raw = eco.glassProbes || [];
  const rows = [];
  for (const p of raw) {
    if (p.skipIfEmpty) continue;
    const url = expandUrl(p.url, C);
    if (!url || !/^https?:/i.test(url)) continue;
    const method = (p.method || "GET").toUpperCase();
    const label = `${p.group || "other"} · ${p.id}${method !== "GET" ? ` [${method}]` : ""}`;
    rows.push({ href: url, label, note: p.note || "" });
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}

// —— P31 home + hub (https only — p31ca dist link checker has no BONDING repo paths)
h2("P31 home, hub, and source links", "local");
{
  const rows = [
    { href: `${bondingBase}/soup`, label: "BONDING Soup (live)", note: "Bonding deploy; local: npm run demo → :8080" },
    { href: `${bondingBase}/poets-room.html`, label: "Poets room (live)", note: "Bonding" },
    { href: `${ghMain}/p31-personal-howto.html`, label: "Personal how-to (source)", note: "Open file locally for full command list" },
    { href: "https://p31ca.org/passport", label: "Cognitive Passport (hub)", note: "Generator mirror" },
    { href: "https://p31ca.org/doc-library/", label: "Doc library (hub)", note: "Search home docs" },
    { href: `${ghMain}/docs/physics-learn/index.html`, label: "Physics learn (source)", note: "Labs shell in repo" },
    { href: "http://127.0.0.1:3131/", label: "Command center (local only)", note: "npm run command-center" },
  ];
  table(rows);
}

const updated = fleet.updated || "—";
const html = `<!DOCTYPE html>
<html lang="en" class="fp-root">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>P31 — live fleet & pages</title>
  <meta name="description" content="Every production URL we track from p31-live-fleet, p31-ecosystem, and p31-constants. Generated by npm run build:fleet-portal." />
  <meta name="theme-color" content="#0f1115" />
  <link rel="stylesheet" href="cognitive-passport/p31-style.css" />
  <style>
    .fp-page { max-width: 64rem; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
    .fp-hero h1 { font-size: 1.75rem; margin: 0 0 0.35rem; letter-spacing: -0.02em; }
    .fp-hero p { margin: 0.35rem 0; opacity: 0.88; }
    .fp-meta { font-size: 0.85rem; opacity: 0.75; margin-top: 0.75rem; }
    .fp-toc { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 1.25rem 0 1.5rem; padding: 0.75rem 0; border-top: 1px solid var(--p31-hairline, #2a2f3a); border-bottom: 1px solid var(--p31-hairline, #2a2f3a); }
    .fp-toc a { text-decoration: none; color: var(--p31-semantic-calm, #2dd4bf); }
    .fp-toc a:hover { text-decoration: underline; }
    .fp-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin: 0.5rem 0 1.75rem; }
    .fp-table th, .fp-table td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--p31-hairline, #2a2f3a); vertical-align: top; }
    .fp-table th { font-weight: 600; opacity: 0.9; }
    .fp-label { font-weight: 500; }
    .fp-link { color: var(--p31-semantic-calm, #2dd4bf); word-break: break-all; }
    .fp-note { opacity: 0.8; font-size: 0.86rem; }
  </style>
</head>
<body class="p31-surface" data-soup-psych="1">
  <div class="fp-page">
    <header class="fp-hero">
      <h1>Live apps &amp; pages</h1>
      <p>Single index of production URLs tracked from <code>p31-live-fleet.json</code>, <code>p31-ecosystem.json</code> (glass probes), and <code>p31-constants.json</code>. <strong>Regenerate</strong> after changing those files: <code>npm run build:fleet-portal</code>.</p>
      <p class="fp-meta">Fleet data <code>p31-live-fleet.json</code> <time datetime="${esc(updated)}">updated: ${esc(updated)}</time> — run <code>npm run ecosystem:glass</code> for live row timings; <code>verify:ecosystem</code> for template alignment.</p>
    </header>
    <nav class="fp-toc" aria-label="Sections">
      <a href="#hub-org">Hub &amp; org</a>
      <a href="#contracts">Contracts</a>
      <a href="#p31ca-paths">p31ca paths</a>
      <a href="#mesh-workers">Mesh</a>
      <a href="#monetary">Monetary</a>
      <a href="#workers-more">More Workers</a>
      <a href="#glass">Glass</a>
      <a href="#local">Home &amp; source</a>
    </nav>
    <main>
${sections.join("\n")}
    </main>
    <footer class="fp-meta">
      <p><a href="${bondingBase}/soup">← BONDING Soup</a> · <a href="${ghMain}/p31-personal-howto.html">How-to</a> · <a href="${ghMain}/docs/PLAN-BONDING-SOUP-WHEN-SCALE.md">When-scale plan</a> · <a href="https://p31ca.org/">p31ca.org</a></p>
    </footer>
  </div>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log("build-fleet-portal: wrote", path.relative(root, outPath), `(${html.length} bytes)`);
