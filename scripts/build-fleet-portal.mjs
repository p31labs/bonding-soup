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
  let h =
    '<div class="fp-table-wrap"><table class="fp-table" role="table"><thead><tr><th>What</th><th>Open</th><th>Note</th></tr></thead><tbody>';
  for (const r of rows) {
    h += "<tr>";
    h += `<td class="fp-label">${esc(r.label)}</td>`;
    h += `<td><a class="fp-link" href="${esc(r.href)}" target="_blank" rel="noopener">${esc(r.href)}</a></td>`;
    h += `<td class="fp-note">${r.note != null ? esc(r.note) : "—"}</td>`;
    h += "</tr>";
  }
  h += "</tbody></table></div>";
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
    {
      href: `${bondingBase}/soup`,
      label: "C.A.R.S. (live)",
      note: "Bonding deploy; local: npm run soup:prep then npm run demo → :8080",
    },
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
<html lang="en" class="fp-root" data-p31-appearance="hub" style="color-scheme: dark;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
  <title>P31 — live fleet & pages</title>
  <meta name="description" content="Every production URL we track from p31-live-fleet, p31-ecosystem, and p31-constants. Generated by npm run build:fleet-portal." />
  <meta name="theme-color" content="#0f1115" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="cognitive-passport/p31-style.css" />
  <link rel="stylesheet" href="cognitive-passport/p31-responsive-surface.css" />
  <script src="cognitive-passport/lib/p31-subject-prefs.js"></script>
  <style>
    body.fp-shell {
      background-color: var(--p31-void);
      background-image:
        linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 40px 40px;
      background-position: center top;
      color: var(--p31-cloud);
      font-family: var(--p31-font-sans);
      margin: 0;
      min-height: 100vh;
    }
    .fp-shell::before {
      content: '';
      pointer-events: none;
      position: fixed;
      top: 0;
      left: 0;
      width: min(820px, 100vw);
      height: min(820px, 100vh);
      background: radial-gradient(circle at top left, rgba(77, 184, 168, 0.1), transparent 42%);
      z-index: 0;
    }
    .fp-page {
      position: relative;
      z-index: 1;
      max-width: 64rem;
      margin: 0 auto;
      padding: max(1.25rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) 3rem
        max(1rem, env(safe-area-inset-left, 0px));
      box-sizing: border-box;
      width: 100%;
    }
    .fp-topnav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.85rem;
      padding: 0.35rem 0 1rem;
      margin-bottom: 0.75rem;
      border-bottom: 1px solid var(--p31-border-subtle);
      font-family: var(--p31-font-mono);
      font-size: 0.7rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--p31-muted) 95%, transparent);
    }
    .fp-topnav a {
      color: var(--p31-muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .fp-topnav a:hover { color: var(--p31-cyan); }
    .fp-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem 1.1rem;
      padding: 0.5rem 0.85rem;
      margin-bottom: 0.95rem;
      border-radius: 0.65rem;
      border: 1px solid var(--p31-border-subtle);
      font-family: var(--p31-font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--p31-muted) 96%, transparent);
      background: color-mix(in srgb, var(--p31-surface2, #161920) 72%, transparent);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
    }
    .fp-strip .fp-dot {
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 999px;
      background: var(--p31-phosphorus, #3ba372);
      box-shadow: 0 0 10px rgba(59, 163, 114, 0.42);
      flex-shrink: 0;
    }
    .fp-strip .fp-plain {
      letter-spacing: 0;
      text-transform: none;
      font-size: 0.72rem;
      line-height: 1.45;
      color: color-mix(in srgb, var(--p31-muted) 94%, transparent);
    }
    .fp-hero-bar {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.85rem;
    }
    .fp-hero-rule { flex: 1; height: 1px; background: rgba(255, 255, 255, 0.06); }
    .fp-hero-cap {
      font-family: var(--p31-font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--p31-muted) 92%, transparent);
      margin: 0;
      white-space: nowrap;
    }
    .fp-hero h1 {
      font-family: var(--p31-font-sans);
      font-size: clamp(1.2rem, 2.5vw + 0.75rem, 1.55rem);
      margin: 0 0 0.45rem;
      letter-spacing: -0.02em;
      font-weight: 700;
      color: var(--p31-cloud);
    }
    .fp-hero p { margin: 0.4rem 0; color: color-mix(in srgb, var(--p31-cloud) 78%, transparent); line-height: 1.55; font-size: 0.9rem; }
    .fp-hero p code {
      font-family: var(--p31-font-mono);
      font-size: 0.85em;
      color: color-mix(in srgb, var(--p31-teal) 85%, transparent);
    }
    .fp-meta {
      font-size: 0.78rem;
      color: color-mix(in srgb, var(--p31-muted) 95%, transparent);
      margin-top: 0.65rem;
      font-family: var(--p31-font-mono);
      line-height: 1.5;
    }
    .fp-toc {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem 0.95rem;
      margin: 1.25rem 0 1.5rem;
      padding: 0.85rem 0;
      border-top: 1px solid var(--p31-border-subtle);
      border-bottom: 1px solid var(--p31-border-subtle);
      font-family: var(--p31-font-mono);
      font-size: 0.7rem;
    }
    .fp-toc a { text-decoration: none; color: var(--p31-teal); transition: color 0.15s ease; }
    .fp-toc a:hover { color: var(--p31-cyan); text-decoration: underline; }
    .fp-table-wrap {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 0.5rem 0 1.75rem;
      border: 1px solid var(--p31-border-subtle);
      border-radius: 0.65rem;
      background: rgba(22, 25, 32, 0.45);
      backdrop-filter: blur(10px);
    }
    .fp-table {
      width: 100%;
      min-width: min(100%, 36rem);
      border-collapse: collapse;
      font-size: 0.78rem;
      font-family: var(--p31-font-mono);
    }
    .fp-table th, .fp-table td { text-align: left; padding: 0.45rem 0.55rem; border-bottom: 1px solid var(--p31-border-subtle); vertical-align: top; }
    .fp-table tr:last-child th, .fp-table tr:last-child td { border-bottom: none; }
    .fp-table th {
      font-weight: 600;
      color: color-mix(in srgb, var(--p31-cloud) 55%, transparent);
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .fp-label { font-weight: 500; color: var(--p31-cloud); font-size: 0.8rem; }
    .fp-link { color: var(--p31-cyan); word-break: break-all; text-decoration: none; transition: opacity 0.15s ease; }
    .fp-link:hover { opacity: 0.9; text-decoration: underline; }
    .fp-note { color: color-mix(in srgb, var(--p31-muted) 96%, transparent); font-size: 0.8rem; line-height: 1.45; }
    h2 {
      font-family: var(--p31-font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--p31-muted) 95%, transparent);
      margin: 1.75rem 0 0.5rem;
    }
  </style>
</head>
<body class="p31-surface p31-responsive-surface fp-shell" data-soup-psych="1">
  <div class="fp-page">
    <nav class="fp-topnav" aria-label="Site">
      <span style="color: var(--p31-teal); letter-spacing: 0.18em;">Fleet index</span>
      <span style="display: flex; flex-wrap: wrap; gap: 0.75rem 1rem;">
        <a href="https://p31ca.org/">Hub</a>
        <a href="https://github.com/p31labs/andromeda" target="_blank" rel="noopener">GitHub</a>
        <a href="https://p31ca.org/fleet-portal">This page</a>
      </span>
    </nav>
    <div class="fp-strip" role="status" aria-live="polite">
      <span style="display:inline-flex;align-items:center;gap:0.4rem;color:color-mix(in srgb,var(--p31-teal) 88%,var(--p31-muted));">
        <span class="fp-dot" aria-hidden="true"></span>
        Fleet · EDE
      </span>
      <span class="fp-plain">Roll-up from <code style="font-size:inherit">p31-live-fleet.json</code> · fleet stamp <time datetime="${esc(updated)}">${esc(updated)}</time> · regenerate: <code style="font-size:inherit">npm run build:fleet-portal</code></span>
    </div>
    <header class="fp-hero">
      <div class="fp-hero-bar" role="presentation">
        <span class="fp-hero-rule" aria-hidden="true"></span>
        <p class="fp-hero-cap">Instrumentation</p>
        <span class="fp-hero-rule" aria-hidden="true"></span>
      </div>
      <h1>Live apps &amp; pages</h1>
      <p>Single index of production URLs tracked from <code>p31-live-fleet.json</code>, <code>p31-ecosystem.json</code> (glass probes), and <code>p31-constants.json</code>. <strong>Regenerate</strong> after changing those files: <code>npm run build:fleet-portal</code>.</p>
      <p class="fp-meta">Fleet data <code>p31-live-fleet.json</code> <time datetime="${esc(updated)}">updated: ${esc(updated)}</time> — run <code>npm run ecosystem:glass</code> for live row timings; <code>verify:ecosystem</code> for template alignment. <strong>CONNECTION:</strong> <code>npm run connection</code> · <a href="${esc(ghMain + "/docs/P31-DEPLOY-CANON.md")}">deploy canon</a> (CI · manual · local CLI).</p>
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
      <p><a href="${bondingBase}/soup">← C.A.R.S.</a> · <a href="${ghMain}/p31-personal-howto.html">How-to</a> · <a href="${ghMain}/docs/P31-DEPLOY-CANON.md">CONNECTION</a> · <a href="${ghMain}/docs/PLAN-BONDING-SOUP-WHEN-SCALE.md">When-scale plan</a> · <a href="https://p31ca.org/">p31ca.org</a></p>
    </footer>
  </div>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log("build-fleet-portal: wrote", path.relative(root, outPath), `(${html.length} bytes)`);
