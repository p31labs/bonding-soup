#!/usr/bin/env node
/**
 * Generate fleet-portal.html — one static page of every live app/page URL we can derive from
 * p31-constants.json, p31-live-fleet.json, p31-ecosystem.json. Regenerate when those change.
 *   npm run build:fleet-portal
 * Optional ATC colors: merge last glass report (P31_GLASS_REPORT or /tmp/p31_glass_report.json):
 *   npm run ecosystem:glass && npm run build:fleet-portal
 *   npm run build:fleet-portal:live
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

/** Optional merge from `npm run ecosystem:glass` (P31_GLASS_REPORT or /tmp/p31_glass_report.json). */
function readGlassReport() {
  const p = process.env.P31_GLASS_REPORT || "/tmp/p31_glass_report.json";
  try {
    if (!fs.existsSync(p)) return { path: p, report: null };
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!j || j.schema !== "p31.glassReport/1.0.0" || !Array.isArray(j.probes)) {
      return { path: p, report: null };
    }
    return { path: p, report: j };
  } catch {
    return { path: p, report: null };
  }
}

/**
 * @param {object} report
 * @returns {Map<string, { status: 'green'|'amber'|'coral'|'gray', msMax: number, ids: string[] }>}
 */
function glassHealthByOrigin(report) {
  const rank = { gray: 0, green: 1, amber: 2, coral: 3 };
  /** @type {Map<string, { status: string, msMax: number, ids: string[] }>} */
  const m = new Map();
  for (const r of report.probes || []) {
    let origin = "";
    try {
      origin = new URL(String(r.url)).origin;
    } catch {
      continue;
    }
    const piece =
      r.level === "down"
        ? "coral"
        : r.level === "warn" || r.slow
          ? "amber"
          : r.level === "auth"
            ? "amber"
            : r.level === "up"
              ? "green"
              : "gray";
    const cur = m.get(origin) || { status: "gray", msMax: 0, ids: [] };
    if (rank[piece] > rank[cur.status]) cur.status = piece;
    cur.msMax = Math.max(cur.msMax, Number(r.ms) || 0);
    cur.ids.push(String(r.id || ""));
    m.set(origin, cur);
  }
  return m;
}

const C = readJson("p31-constants.json");
const fleet = readJson("p31-live-fleet.json");
const eco = readJson("p31-ecosystem.json");

/** Visual weight for ATC radar (snapshot — live green/amber comes from ecosystem:glass separately). */
function blipTier(id) {
  const s = String(id || "").toLowerCase();
  if (s.includes("k4-personal")) return "mesh";
  if (
    s.includes("simplex") ||
    s === "p31-workers" ||
    s === "p31-orchestrator" ||
    s === "p31-cortex"
  ) {
    return "bright";
  }
  return "edge";
}

function collectBlips(fleetJson) {
  const m = new Map();
  function add(id, href, note) {
    if (!href || !/^https?:\/\//i.test(String(href))) return;
    const u = String(href).replace(/\/+$/, "");
    if (m.has(u)) return;
    m.set(u, {
      id: id || u,
      href: u + "/",
      note: note ? String(note) : "",
      tier: blipTier(id),
    });
  }
  for (const w of fleetJson.workersVerified || []) {
    if (w && w.workersDev) add(w.id, w.workersDev, w.note);
    if (w && w.sameOriginOnHub) add(`${w.id} (zone)`, w.sameOriginOnHub, "same-origin on hub");
  }
  for (const w of fleetJson.workersAllowlisted || []) {
    if (w && w.defaultWorkersDev) add(w.id, w.defaultWorkersDev, w.note);
  }
  return Array.from(m.values()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function tierRadius(tier) {
  if (tier === "mesh") return 3;
  if (tier === "bright") return 3.35;
  return 1.85;
}

/** Status colors when a glass report was merged (ATC). */
function paletteForGlassStatus(status) {
  switch (status) {
    case "green":
      return {
        fill: "rgba(52, 211, 153, 0.58)",
        stroke: "rgba(34, 197, 94, 0.72)",
      };
    case "amber":
      return {
        fill: "rgba(251, 191, 36, 0.52)",
        stroke: "rgba(217, 119, 6, 0.78)",
      };
    case "coral":
      return {
        fill: "rgba(248, 113, 113, 0.55)",
        stroke: "rgba(239, 68, 68, 0.82)",
      };
    default:
      return {
        fill: "rgba(148, 163, 184, 0.42)",
        stroke: "rgba(100, 116, 139, 0.45)",
      };
  }
}

/** Tier tint when no glass file (layout-only snapshot). */
function paletteForTier(tier) {
  if (tier === "mesh") {
    return { fill: "rgba(94,234,212,0.5)", stroke: "rgba(45,212,191,0.55)" };
  }
  if (tier === "bright") {
    return { fill: "rgba(110,231,183,0.58)", stroke: "rgba(52,211,153,0.5)" };
  }
  return { fill: "rgba(148,163,184,0.5)", stroke: "rgba(100,116,139,0.45)" };
}

/**
 * @param {Array<{ id: string, href: string, note: string, tier: string }>} blips
 * @param {Map<string, { status: string, msMax: number, ids: string[] }>|null} glassByOrigin
 */
function buildRadarSvg(blips, glassByOrigin) {
  const n = blips.length;
  if (!n) return '<p class="fp-radar-empty">No Worker URLs in p31-live-fleet.json</p>';
  const useGlass = glassByOrigin && glassByOrigin.size > 0;
  const parts = [];
  parts.push(
    '<svg class="fp-radar-svg" viewBox="0 0 100 100" role="img" aria-label="Fleet worker blips" xmlns="http://www.w3.org/2000/svg">'
  );
  parts.push(
    '<defs><radialGradient id="fp-radar-glow" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="rgba(77,184,168,0.12)"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>'
  );
  parts.push('<rect width="100" height="100" fill="url(#fp-radar-glow)"/>');
  for (let i = 0; i < n; i++) {
    const b = blips[i];
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = 36;
    const cx = 50 + r * Math.cos(ang);
    const cy = 50 + r * Math.sin(ang);
    const rad = tierRadius(b.tier);
    let origin = "";
    try {
      origin = new URL(b.href).origin;
    } catch {
      /* keep empty */
    }
    let fill;
    let stroke;
    let glassNote = "";
    if (useGlass && origin) {
      const g = glassByOrigin.get(origin);
      const st = g ? g.status : "gray";
      const pal = paletteForGlassStatus(st);
      fill = pal.fill;
      stroke = pal.stroke;
      if (g && g.ids.length) {
        glassNote = ` · glass: ${st}${g.msMax ? ` · max ${g.msMax}ms` : ""} (${g.ids.slice(0, 4).join(", ")}${g.ids.length > 4 ? "…" : ""})`;
      } else {
        glassNote = " · glass: no probe on this origin";
      }
    } else {
      const pal = paletteForTier(b.tier);
      fill = pal.fill;
      stroke = pal.stroke;
    }
    const title = esc(
      b.id + (b.note ? " — " + b.note.slice(0, 120) : "") + glassNote
    );
    const href = esc(b.href);
    parts.push(`<a href="${href}" target="_blank" rel="noopener">`);
    parts.push(
      `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="0.4"><title>${title}</title></circle>`
    );
    parts.push("</a>");
  }
  parts.push("</svg>");
  return parts.join("");
}

const blips = collectBlips(fleet);
const { path: glassReportPath, report: glassReport } = readGlassReport();
const glassByOrigin = glassReport ? glassHealthByOrigin(glassReport) : null;
const radarSvg = buildRadarSvg(blips, glassByOrigin);

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
    {
      href: `${bondingBase}/p31-sovereign-lab.html`,
      label: "Sovereign Lab (live)",
      note: "Dome · coherence · serial · voice — synced with npm run sync:soup-bonding",
    },
    {
      href: `${bondingBase}/p31-slicer.html`,
      label: "Browser slicer (live)",
      note: "Kiri:Moto embed — same sync",
    },
    { href: `${bondingBase}/poets-room.html`, label: "Poets room (live)", note: "Bonding" },
    { href: `${ghMain}/p31-personal-howto.html`, label: "Personal how-to (source)", note: "Open file locally for full command list" },
    { href: "https://p31ca.org/passport", label: "Cognitive Passport (hub)", note: "Generator mirror" },
    { href: "https://p31ca.org/lab", label: "Sovereign Lab (hub /lab)", note: "npm run sync:sovereign-p31ca — dome · labTelemetry bridge" },
    { href: "https://p31ca.org/slicer", label: "Browser slicer (hub /slicer)", note: "Kiri embed + K₄ STL — same sync" },
    { href: "https://p31ca.org/doc-library/", label: "Doc library (hub)", note: "Search home docs" },
    { href: `${ghMain}/docs/physics-learn/index.html`, label: "Physics learn (source)", note: "Labs shell in repo" },
    { href: "http://127.0.0.1:3131/", label: "Command center (local only)", note: "npm run command-center" },
    {
      href: "http://127.0.0.1:5174/",
      label: "Geodesic state preview (local)",
      note: "npm run demo:geodesic-preview — GET /state via Vite proxy",
    },
    {
      href: `${ghMain}/spikes/sovereign-geodesic-preview/README.md`,
      label: "Geodesic preview spike (source)",
      note: "README — Worker wire alignment",
    },
  ];
  table(rows);
}

const glassReportBasename = path.basename(glassReportPath);
let glassStrip = "";
if (glassReport && glassReport.summary) {
  const ts = glassReport.timestamp || "—";
  glassStrip = `<p class="fp-glass-strip" role="status">Merged glass <code>${esc(glassReportBasename)}</code> · <time datetime="${esc(ts)}">${esc(ts)}</time> · up ${glassReport.summary.up} · auth ${glassReport.summary.auth} · warn ${glassReport.summary.warn} · down ${glassReport.summary.down}</p>
<ul class="fp-status-legend" aria-label="Blip colors"><li><span class="fp-leg-dot fp-leg-green"></span> healthy</li><li><span class="fp-leg-dot fp-leg-amber"></span> degraded</li><li><span class="fp-leg-dot fp-leg-coral"></span> down</li><li><span class="fp-leg-dot fp-leg-gray"></span> no probe</li></ul>`;
} else {
  glassStrip = `<p class="fp-glass-strip fp-glass-missing">No glass report merged at build time — run <code>npm run ecosystem:glass</code>, then <code>npm run build:fleet-portal:live</code> or <code>P31_GLASS_REPORT=/path/to/report.json npm run build:fleet-portal</code> to paint blip colors from live probes.</p>`;
}

const updated = fleet.updated || "—";
const html = `<!DOCTYPE html>
<html lang="en" class="fp-root" data-p31-appearance="hub" style="color-scheme: dark;">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
  <title>P31 — live fleet & pages</title>
  <meta name="description" content="Operator index of live URLs — rolled up from JSON in the repo (p31-live-fleet, ecosystem glass, constants). Not marketing copy; regenerate after deploy lists change." />
  <meta name="theme-color" content="#0f1115" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/p31-style.css" />
  <link rel="stylesheet" href="/p31-responsive-surface.css" />
  <script src="/lib/p31-subject-prefs.js"></script>
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
    body.fp-gray-rock:not(.fp-alive) .fp-shell::before {
      opacity: 0.35;
    }
    .fp-atc-wrap {
      margin: 0 auto 1.35rem;
      padding: 1rem 0.75rem 1.15rem;
      border-radius: 0.75rem;
      border: 1px solid var(--p31-border-subtle);
      background: color-mix(in srgb, var(--p31-surface2, #161920) 55%, transparent);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      text-align: center;
    }
    .fp-atc-radar {
      max-width: 22rem;
      margin: 0 auto;
      padding: 0.35rem 0.25rem 0.15rem;
    }
    .fp-glass-strip {
      font-size: 0.7rem;
      line-height: 1.45;
      color: color-mix(in srgb, var(--p31-muted) 93%, transparent);
      margin: 0.5rem auto 0;
      max-width: 38rem;
    }
    .fp-glass-strip code { font-size: 0.85em; }
    .fp-glass-missing { color: color-mix(in srgb, var(--p31-muted) 88%, var(--p31-teal) 12%); }
    .fp-status-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem 1rem;
      list-style: none;
      padding: 0.35rem 0 0;
      margin: 0.25rem 0 0;
      font-size: 0.65rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--p31-muted) 94%, transparent);
    }
    .fp-status-legend li { display: inline-flex; align-items: center; gap: 0.35rem; }
    .fp-leg-dot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .fp-leg-green { background: rgb(52, 211, 153); box-shadow: 0 0 6px rgba(52, 211, 153, 0.45); }
    .fp-leg-amber { background: rgb(251, 191, 36); box-shadow: 0 0 6px rgba(251, 191, 36, 0.4); }
    .fp-leg-coral { background: rgb(248, 113, 113); box-shadow: 0 0 6px rgba(248, 113, 113, 0.45); }
    .fp-leg-gray { background: rgb(148, 163, 184); opacity: 0.75; }
    .fp-radar-svg {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 0 6px rgba(45, 212, 191, 0.08));
    }
    .fp-radar-svg a { text-decoration: none; outline: none; }
    .fp-radar-svg a:focus-visible circle {
      stroke: var(--p31-cyan, #5eead4);
      stroke-width: 0.9;
    }
    .fp-radar-empty {
      font-size: 0.8rem;
      color: color-mix(in srgb, var(--p31-muted) 90%, transparent);
      margin: 0.5rem 0;
    }
    .fp-atc-caption {
      font-size: 0.72rem;
      line-height: 1.45;
      color: color-mix(in srgb, var(--p31-muted) 92%, transparent);
      margin: 0.65rem auto 0;
      max-width: 34rem;
    }
    .fp-local-hint {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 0.45rem;
      text-align: left;
      font-size: 0.72rem;
      line-height: 1.45;
      color: color-mix(in srgb, var(--p31-muted) 94%, transparent);
      margin: 0.85rem auto 0;
      max-width: 34rem;
    }
    .fp-local-icon {
      flex-shrink: 0;
      font-size: 1rem;
      line-height: 1.2;
      opacity: 0.75;
    }
    .fp-reveal-tables {
      margin-top: 1rem;
      padding: 0.45rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid color-mix(in srgb, var(--p31-teal) 45%, var(--p31-border-subtle));
      background: color-mix(in srgb, var(--p31-teal) 12%, transparent);
      color: color-mix(in srgb, var(--p31-cloud) 92%, var(--p31-teal));
      font-family: var(--p31-font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .fp-reveal-tables:hover {
      background: color-mix(in srgb, var(--p31-teal) 22%, transparent);
      border-color: color-mix(in srgb, var(--p31-teal) 65%, var(--p31-border-subtle));
    }
    body.fp-gray-rock:not(.fp-alive) #fp-detail {
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      pointer-events: none;
      margin: 0;
      padding: 0;
      border: none;
    }
    body.fp-gray-rock.fp-alive #fp-detail {
      opacity: 1;
      max-height: none;
      overflow: visible;
      pointer-events: auto;
      margin-top: 0.5rem;
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
<body id="fp-body" class="p31-surface p31-responsive-surface fp-shell fp-gray-rock" data-soup-psych="1">
  <div class="fp-page">
    <section class="fp-atc-wrap" id="fp-atc" aria-label="Fleet air traffic">
      <div class="fp-atc-radar">${radarSvg}</div>
      ${glassStrip}
      <p class="fp-atc-caption">Gray Rock: blips first — hover for Worker id and glass detail when a report was merged. Add <code>?alive=1</code> or use the button to show route tables.</p>
      <p class="fp-local-hint" role="note"><span class="fp-local-icon" aria-hidden="true">⌂</span><span><strong>Local only</strong> — Command Center is not on Workers.dev. Run <code>npm run command-center</code> → <a href="http://127.0.0.1:3131/" target="_blank" rel="noopener">127.0.0.1:3131</a> (EPCP glass).</span></p>
      <button type="button" class="fp-reveal-tables" id="fp-reveal-tables">Open route tables →</button>
    </section>
    <div id="fp-detail" class="fp-detail">
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
      <p class="p31-host-mind">Host mind: <strong>Operator</strong> — fleet altitude readout; same sky as soup and hub.</p>
      <p>One table built from machine lists (<code>p31-live-fleet.json</code>, <code>p31-ecosystem.json</code> glass probes, <code>p31-constants.json</code>) — handy, not a warranty every URL is green. Regenerate after those files change: <code>npm run build:fleet-portal</code>.</p>
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
  </div>
  <script>
(function(){
  var b=document.getElementById("fp-body");
  function alive(){ if(b) b.classList.add("fp-alive"); }
  if(/[?&]alive=1(?:&|$)/.test(location.search||"")) alive();
  var btn=document.getElementById("fp-reveal-tables");
  if(btn) btn.addEventListener("click",alive);
})();
  </script>
  <script src="/lib/p31-return-ribbon.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log("build-fleet-portal: wrote", path.relative(root, outPath), `(${html.length} bytes)`);
