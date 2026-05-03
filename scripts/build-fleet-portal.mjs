#!/usr/bin/env node
/**
 * Generate fleet-portal.html — one static page of every live app/page URL we can derive from
 * p31-constants.json, p31-live-fleet.json, p31-ecosystem.json. Regenerate when those change.
 *   npm run build:fleet-portal
 * Optional ATC colors: merge last glass report (P31_GLASS_REPORT or /tmp/p31_glass_report.json):
 *   npm run ecosystem:glass && npm run build:fleet-portal
 *   npm run build:fleet-portal:live
 *
 * After write: when `andromeda/.../p31ca/public` exists, copies `fleet-portal.html` to the hub
 * (keeps verify:fleet-portal byte parity). Opt out: P31_FLEET_PORTAL_NO_AUTO_MIRROR=1.
 *
 * Surface canon: .p31-doc-* (shared with device-setup, personal-howto). Same hero,
 * cards, tables, footer everywhere; the only fleet-specific chrome is the radar SVG
 * (kept as `.fp-radar-*` because no other surface needs it).
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

/** Visual weight for ATC radar (snapshot — live green/amber comes from ecosystem:glass). */
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
      return { fill: "rgba(52, 211, 153, 0.58)", stroke: "rgba(34, 197, 94, 0.72)" };
    case "amber":
      return { fill: "rgba(251, 191, 36, 0.52)", stroke: "rgba(217, 119, 6, 0.78)" };
    case "coral":
      return { fill: "rgba(248, 113, 113, 0.55)", stroke: "rgba(239, 68, 68, 0.82)" };
    default:
      return { fill: "rgba(148, 163, 184, 0.42)", stroke: "rgba(100, 116, 139, 0.45)" };
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
    '<defs><radialGradient id="fp-radar-glow" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="rgba(77,184,168,0.16)"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>'
  );
  parts.push('<rect width="100" height="100" fill="url(#fp-radar-glow)"/>');
  // Concentric rings — three orbital tiers; outermost matches blip orbit.
  parts.push(
    '<circle class="fp-radar-ring fp-radar-ring--outer" cx="50" cy="50" r="36" fill="none" stroke="rgba(77,184,168,0.22)" stroke-width="0.28"/>'
  );
  parts.push(
    '<circle class="fp-radar-ring fp-radar-ring--mid" cx="50" cy="50" r="22" fill="none" stroke="rgba(77,184,168,0.14)" stroke-width="0.2"/>'
  );
  parts.push(
    '<circle class="fp-radar-ring fp-radar-ring--inner" cx="50" cy="50" r="10" fill="none" stroke="rgba(77,184,168,0.10)" stroke-width="0.16"/>'
  );
  // Cross-hairs (axis-aligned, very subtle) — gives the field a "scope" feel.
  parts.push(
    '<line class="fp-radar-axis" x1="50" y1="14" x2="50" y2="86" stroke="rgba(77,184,168,0.08)" stroke-width="0.15"/>'
  );
  parts.push(
    '<line class="fp-radar-axis" x1="14" y1="50" x2="86" y2="50" stroke="rgba(77,184,168,0.08)" stroke-width="0.15"/>'
  );
  // Sweep — a soft conic arc (gradient fan) that rotates around center.
  parts.push(
    '<defs><radialGradient id="fp-sweep-grad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(94,234,212,0.0)"/><stop offset="78%" stop-color="rgba(94,234,212,0.0)"/><stop offset="92%" stop-color="rgba(94,234,212,0.18)"/><stop offset="100%" stop-color="rgba(94,234,212,0.30)"/></radialGradient></defs>'
  );
  parts.push(
    '<g class="fp-radar-sweep"><path d="M 50 50 L 86 50 A 36 36 0 0 0 75.46 24.54 Z" fill="url(#fp-sweep-grad)"/></g>'
  );
  // Center hub — small cyan dot with halo.
  parts.push(
    '<circle class="fp-radar-hub" cx="50" cy="50" r="1.4" fill="rgba(94,234,212,0.95)"/>'
  );
  parts.push(
    '<circle class="fp-radar-hub-pulse" cx="50" cy="50" r="3" fill="none" stroke="rgba(94,234,212,0.5)" stroke-width="0.5"/>'
  );
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
    const title = esc(b.id + (b.note ? " — " + b.note.slice(0, 120) : "") + glassNote);
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

/** Bonding deploy base + GitHub /main. */
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
} catch { /* keep default */ }

const sections = [];

/** @param {string} title @param {string} id @param {string} headingId */
function openSection(title, id, headingId) {
  sections.push(`<section class="p31-doc-section" id="${esc(id)}" aria-labelledby="${esc(headingId)}">`);
  sections.push(`  <h2 id="${esc(headingId)}">${esc(title)}</h2>`);
  sections.push(`  <div class="p31-doc-card">`);
}
function closeSection() {
  sections.push(`  </div>`);
  sections.push(`</section>`);
}

/**
 * @param {Array<{ href: string, label: string, note?: string }>} rows
 */
function table(rows) {
  let h = '<div class="p31-doc-table-wrap"><table><thead><tr><th>What</th><th>Open</th><th>Note</th></tr></thead><tbody>';
  for (const r of rows) {
    h += "<tr>";
    h += `<td><strong>${esc(r.label)}</strong></td>`;
    h += `<td><a href="${esc(r.href)}" target="_blank" rel="noopener">${esc(r.href)}</a></td>`;
    h += `<td>${r.note != null ? esc(r.note) : "—"}</td>`;
    h += "</tr>";
  }
  h += "</tbody></table></div>";
  sections.push(h);
}

// —— Sites (hub, ops, org, bonding)
openSection("Hub & org sites", "hub-org", "h-hub-org");
{
  const sites = fleet.sites;
  const rows = [];
  if (sites?.technicalHub?.url) rows.push({ href: sites.technicalHub.url, label: "p31ca technical hub", note: sites.technicalHub.note || "" });
  if (sites?.operatorShell?.url) rows.push({ href: sites.operatorShell.url, label: "Operator shell / glass", note: sites.operatorShell.note || "" });
  if (sites?.integrationsBridge?.url) rows.push({ href: sites.integrationsBridge.url, label: "Integrations bridge", note: sites.integrationsBridge.note || "" });
  if (sites?.orgMarketing?.url) rows.push({ href: sites.orgMarketing.url, label: "phosphorus31.org (marketing)", note: sites.orgMarketing.note || "" });
  if (sites?.bondingVertical?.url) rows.push({ href: sites.bondingVertical.url, label: "BONDING vertical", note: sites.bondingVertical.note || "" });
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}
closeSection();

// —— Public JSON / machine indexes
openSection("Public contracts & machine indexes", "contracts", "h-contracts");
{
  const pm = fleet.sites?.publicMachineIndexes;
  const rows = [];
  if (pm && typeof pm === "object") {
    for (const [k, v] of Object.entries(pm)) {
      if (k === "note" || v == null) continue;
      if (typeof v === "string" && v.startsWith("http")) rows.push({ href: v, label: k, note: "JSON / index" });
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}
closeSection();

// —— Featured p31ca paths
openSection("p31ca — featured paths (static & redirects)", "p31ca-paths", "h-p31ca-paths");
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
closeSection();

// —— Live mesh: URLs from constants + health rows
openSection("Mesh & Workers (K₄ edge)", "mesh-workers", "h-mesh-workers");
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
        rows.push({ href: w.workersDev, label: `Worker: ${w.id || "—"}`, note: w.note || w.constantsKey || "" });
        const hp = w.healthPaths || w.statusPath;
        if (w.statusPath) rows.push({ href: w.workersDev + w.statusPath, label: `${w.id} status`, note: "orchestrator path" });
        else if (Array.isArray(hp)) {
          for (const p of hp) {
            const pp = p.startsWith("/") ? p : `/${p}`;
            rows.push({ href: w.workersDev + pp, label: `${w.id} ${pp}`, note: "health" });
          }
        }
      }
      if (w.sameOriginOnHub) rows.push({ href: w.sameOriginOnHub, label: `passkey (zone)`, note: w.id || "p31-passkey" });
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}
closeSection();

// —— Donate / payment
openSection("Monetary (donate-api)", "monetary", "h-monetary");
{
  const pay = fleet.meshAndPayments?.payment;
  const rows = [];
  if (pay && typeof pay === "object") {
    for (const [k, v] of Object.entries(pay)) {
      if (typeof v === "string" && v.startsWith("http")) rows.push({ href: v, label: k, note: "payment" });
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}
closeSection();

// —— Allowlisted workers (default workers.dev)
openSection("Fleet — other Workers (workers.dev)", "workers-more", "h-workers-more");
{
  const wa = fleet.workersAllowlisted;
  const rows = [];
  if (Array.isArray(wa)) {
    for (const w of wa) {
      if (w.defaultWorkersDev) rows.push({ href: w.defaultWorkersDev, label: w.id || "—", note: w.note || w.codePath || "" });
    }
  }
  if (rows.length) table(rows);
  else sections.push("<p>—</p>");
}
closeSection();

// —— Glass probes (ecosystem)
openSection("Glass probes (p31-ecosystem.json)", "glass", "h-glass");
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
closeSection();

// —— P31 home + hub + source links
openSection("P31 home, hub, and source links", "local", "h-local");
{
  const rows = [
    { href: `${bondingBase}/soup`, label: "C.A.R.S. (live)", note: "Bonding deploy; local: npm run soup:prep then npm run demo → :8080" },
    { href: `${bondingBase}/p31-sovereign-lab.html`, label: "Sovereign Lab (live)", note: "Dome · coherence · serial · voice — sync via npm run sync:soup-bonding" },
    { href: `${bondingBase}/p31-slicer.html`, label: "Browser slicer (live)", note: "Kiri:Moto embed — same sync" },
    { href: `${bondingBase}/poets-room.html`, label: "Poets room (live)", note: "Bonding" },
    { href: `${ghMain}/p31-personal-howto.html`, label: "Personal how-to (source)", note: "Open file locally for full command list" },
    { href: "https://p31ca.org/passport", label: "Cognitive Passport (hub)", note: "Generator mirror" },
    { href: "https://p31ca.org/lab", label: "Sovereign Lab (hub /lab)", note: "npm run sync:sovereign-p31ca — dome · labTelemetry bridge" },
    { href: "https://p31ca.org/slicer", label: "Browser slicer (hub /slicer)", note: "Kiri embed + K₄ STL — same sync" },
    { href: "https://p31ca.org/doc-library/", label: "Doc library (hub)", note: "Search home docs" },
    { href: "https://p31ca.org/visuals", label: "Visual demos (hub /visuals)", note: "K₄ mesh · alignment graph · Larmor pulse · glass box gallery" },
    { href: "https://p31ca.org/glass-box", label: "Glass box (hub /glass-box)", note: "Public transparency terminal — synthetic playbacks + verify pulse + promoted reports" },
    { href: `${ghMain}/docs/P31-DEEP-DIVE.md`, label: "P31 deep dive (source)", note: "Curator's walk through the codebase's mind-bending primitives" },
    { href: `${ghMain}/docs/physics-learn/index.html`, label: "Physics learn (source)", note: "Labs shell in repo" },
    { href: "http://127.0.0.1:3131/", label: "Command center (local only)", note: "npm run command-center" },
    { href: "http://127.0.0.1:5174/", label: "Geodesic state preview (local)", note: "npm run demo:geodesic-preview — GET /state via Vite proxy" },
    { href: `${ghMain}/spikes/sovereign-geodesic-preview/README.md`, label: "Geodesic preview spike (source)", note: "README — Worker wire alignment" },
  ];
  table(rows);
}
closeSection();

const glassReportBasename = path.basename(glassReportPath);
let glassStrip = "";
if (glassReport && glassReport.summary) {
  const ts = glassReport.timestamp || "—";
  glassStrip = `<p class="fp-glass-strip" role="status">Merged glass <code>${esc(glassReportBasename)}</code> · <time datetime="${esc(ts)}">${esc(ts)}</time> · up ${glassReport.summary.up} · auth ${glassReport.summary.auth} · warn ${glassReport.summary.warn} · down ${glassReport.summary.down}</p>
<ul class="fp-status-legend" aria-label="Blip colors"><li><span class="fp-leg-dot fp-leg-green"></span> healthy</li><li><span class="fp-leg-dot fp-leg-amber"></span> degraded</li><li><span class="fp-leg-dot fp-leg-coral"></span> down</li><li><span class="fp-leg-dot fp-leg-gray"></span> no probe</li></ul>`;
} else {
  glassStrip = `<p class="fp-glass-strip fp-glass-missing">No glass report merged at build time — run <code>npm run ecosystem:glass</code>, then <code>npm run build:fleet-portal:live</code> or <code>P31_GLASS_REPORT=/path/to/report.json npm run build:fleet-portal</code> to paint blip colors from live probes.</p>
<ul class="fp-status-legend" aria-label="Blip colors"><li><span class="fp-leg-dot fp-leg-green"></span> healthy</li><li><span class="fp-leg-dot fp-leg-amber"></span> degraded</li><li><span class="fp-leg-dot fp-leg-coral"></span> down</li><li><span class="fp-leg-dot fp-leg-gray"></span> no probe</li></ul>`;
}

const updated = fleet.updated || "—";
const html = `<!DOCTYPE html>
<html lang="en" data-p31-appearance="hub" style="color-scheme: dark;">
<head>
  <meta charset="UTF-8" />
  <script>(function(){var r=document.documentElement;if(/[?&]alive=1(?:&|$)/.test(location.search))return;r.classList.add("p31-gray-rock");function wake(){r.classList.remove("p31-gray-rock")}document.addEventListener("pointerdown",wake,{once:true,capture:true});document.addEventListener("keydown",wake,{once:true,capture:true})})();</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
  <meta name="color-scheme" content="dark" />
  <title>P31 — live fleet & pages</title>
  <meta name="description" content="Operator index of live URLs — rolled up from JSON in the repo (p31-live-fleet, ecosystem glass, constants). Not marketing copy; regenerate after deploy lists change." />
  <meta name="theme-color" content="#0f1115" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700&family=JetBrains+Mono:ital,wght@0,400;0,600&display=swap" rel="stylesheet" />
  <link rel="manifest" href="/p31-bonding.webmanifest" crossorigin="anonymous" />
  <link rel="stylesheet" href="/p31-style.css" />
  <link rel="stylesheet" href="/p31-shared-surface.css" />
  <link rel="stylesheet" href="/p31-responsive-surface.css" />
  <script src="/lib/p31-subject-prefs.js"></script>
  <style>
    /* Radar — fleet-portal-only chrome (no other surface uses it). */
    .fp-radar-frame {
      max-width: 22rem;
      margin: 0 auto;
      padding: var(--p31-space-2) var(--p31-space-2);
    }
    .fp-radar-svg {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(0 0 10px rgba(45, 212, 191, 0.12));
    }
    .fp-radar-svg a { text-decoration: none; outline: none; cursor: pointer; }
    .fp-radar-svg a circle {
      transition: r 0.25s ease, stroke-width 0.25s ease, filter 0.25s ease;
    }
    .fp-radar-svg a:hover circle {
      stroke-width: 0.7;
      filter: brightness(1.18) drop-shadow(0 0 4px currentColor);
    }
    .fp-radar-svg a:focus-visible circle {
      stroke: var(--p31-cyan);
      stroke-width: 0.9;
    }
    /* Sweep: rotates around the center hub. ~9s/rev — calm scan. */
    .fp-radar-sweep {
      transform-origin: 50% 50%;
      transform-box: fill-box;
      animation: fp-radar-sweep 9s linear infinite;
    }
    @keyframes fp-radar-sweep {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    /* Center hub pulse — slow halo expanding. */
    .fp-radar-hub-pulse {
      transform-origin: 50% 50%;
      transform-box: fill-box;
      animation: fp-radar-hub 3.6s ease-out infinite;
      opacity: 0;
    }
    @keyframes fp-radar-hub {
      0%   { transform: scale(0.6); opacity: 0.65; }
      80%  { transform: scale(2.4); opacity: 0; }
      100% { transform: scale(2.4); opacity: 0; }
    }
    /* Outer ring breathes — barely. */
    .fp-radar-ring--outer {
      transform-origin: 50% 50%;
      transform-box: fill-box;
      animation: fp-radar-ring 6.4s ease-in-out infinite;
    }
    @keyframes fp-radar-ring {
      0%, 100% { opacity: 0.55; }
      50%      { opacity: 0.95; }
    }
    @media (prefers-reduced-motion: reduce) {
      .fp-radar-sweep,
      .fp-radar-hub-pulse,
      .fp-radar-ring--outer { animation: none; }
      .fp-radar-hub-pulse { opacity: 0; }
    }
    .fp-radar-empty {
      font-size: var(--p31-text-sm);
      color: var(--p31-muted);
      text-align: center;
      margin: var(--p31-space-3) 0;
    }
    .fp-glass-strip {
      font-size: var(--p31-text-xs);
      line-height: 1.5;
      color: color-mix(in srgb, var(--p31-muted) 95%, transparent);
      margin: var(--p31-space-3) auto 0;
      max-width: 38rem;
      text-align: center;
    }
    .fp-glass-strip code { font-size: 0.85em; }
    .fp-glass-missing { color: color-mix(in srgb, var(--p31-muted) 90%, var(--p31-cyan) 14%); }
    .fp-status-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--p31-space-2) var(--p31-space-4);
      list-style: none;
      padding: var(--p31-space-2) 0 0;
      margin: var(--p31-space-2) 0 0;
      font-family: var(--p31-font-mono);
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--p31-muted);
    }
    .fp-status-legend li { display: inline-flex; align-items: center; gap: var(--p31-space-1); }
    .fp-leg-dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
    .fp-leg-green { background: rgb(52, 211, 153); box-shadow: 0 0 6px rgba(52, 211, 153, 0.45); }
    .fp-leg-amber { background: rgb(251, 191, 36); box-shadow: 0 0 6px rgba(251, 191, 36, 0.4); }
    .fp-leg-coral { background: rgb(248, 113, 113); box-shadow: 0 0 6px rgba(248, 113, 113, 0.45); }
    .fp-leg-gray { background: rgb(148, 163, 184); opacity: 0.75; }
    .fp-local-hint {
      display: flex;
      align-items: flex-start;
      gap: var(--p31-space-2);
      font-family: var(--p31-font-mono);
      font-size: var(--p31-text-xs);
      line-height: 1.5;
      color: color-mix(in srgb, var(--p31-muted) 96%, transparent);
      margin: var(--p31-space-3) 0 0;
      padding: var(--p31-space-2) var(--p31-space-3);
      background: color-mix(in srgb, var(--p31-surface2) 70%, transparent);
      border-left: 2px solid color-mix(in srgb, var(--p31-coral) 60%, transparent);
      border-radius: 0 var(--p31-radius-sm) var(--p31-radius-sm) 0;
    }
    .fp-local-icon { flex-shrink: 0; font-size: 1.1em; line-height: 1.2; opacity: 0.85; }
  </style>
</head>
<body id="fp-body" class="p31-doc fp-alive p31-responsive-surface">
  <canvas id="fp-star-plate" width="4" height="4" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block"></canvas>
  <script type="module">
    /* SMART starfield: persistent fixed-viewport static plate — same sky
       as device-setup / howto / desk. Path resolves on hub (/lib/) where the
       starfield bundle is synced via npm run sync:p31-starfield. Fail quiet
       so Gray Rock / partial-clone surfaces stay readable.                */
    const cv = document.getElementById("fp-star-plate");
    if (cv instanceof HTMLCanvasElement) {
      try {
        const mod = await import("/lib/p31-starfield-static-plate.js");
        mod.initStaticStarPlate(cv, { preset: "operatorDesk" });
      } catch (_e) { /* offline / not synced — sky optional */ }
    }
  </script>
  <a class="p31-doc-skip" href="#main">Skip to content</a>
  <div class="p31-doc-wrap p31-doc-wrap--wide" id="main">

    <header class="p31-doc-hero">
      <span class="p31-doc-kicker p31-doc-kicker--coral">Instrumentation</span>
      <h1>Live apps &amp; pages — fleet portal</h1>
      <p class="p31-host-mind">Host mind: <strong>Operator</strong> — fleet altitude readout; same sky as <a href="https://p31ca.org/">hub</a> and <a href="${bondingBase}/soup">C.A.R.S.</a></p>
      <p>One table built from machine lists (<code>p31-live-fleet.json</code>, <code>p31-ecosystem.json</code> glass probes, <code>p31-constants.json</code>) — handy, not a warranty every URL is green. Regenerate after those files change: <code>npm run build:fleet-portal</code>.</p>
      <div class="p31-doc-meta">
        <span>Fleet stamp: <time datetime="${esc(updated)}">${esc(updated)}</time></span>
        <span>Live timings: <code>npm run ecosystem:glass</code></span>
        <span>Templates: <code>verify:ecosystem</code></span>
        <span>CONNECTION: <a href="${esc(ghMain + "/docs/P31-DEPLOY-CANON.md")}">deploy canon</a></span>
      </div>

      <section id="fp-atc" aria-label="Fleet air traffic" style="margin-top: var(--p31-space-5)">
        <div class="p31-doc-card">
          <div class="fp-radar-frame">${radarSvg}</div>
          ${glassStrip}
          <p class="fp-local-hint" role="note">
            <span class="fp-local-icon" aria-hidden="true">⌂</span>
            <span><strong>Local only</strong> — Command Center is not on Workers.dev. Run <code>npm run command-center</code> → <a href="http://127.0.0.1:3131/" target="_blank" rel="noopener">127.0.0.1:3131</a> (EPCP glass). Hover any blip for Worker id and glass detail (when a report was merged).</span>
          </p>
        </div>
      </section>

      <ul class="p31-doc-toc" role="list">
        <li><a class="p31-q-chip p31-q-chip--filter" href="#hub-org">Hub &amp; org</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#contracts">Contracts</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#p31ca-paths">p31ca paths</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#mesh-workers">Mesh</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#monetary">Monetary</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#workers-more">More Workers</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#glass">Glass</a></li>
        <li><a class="p31-q-chip p31-q-chip--filter" href="#local">Home &amp; source</a></li>
      </ul>
    </header>

    <div id="fp-detail">
${sections.join("\n")}

      <div class="p31-doc-links" style="margin-bottom: var(--p31-space-10)">
        <a class="p31-q-chip p31-q-chip--assist" href="${bondingBase}/soup">C.A.R.S.</a>
        <a class="p31-q-chip p31-q-chip--assist" href="https://p31ca.org/agents">K₄ agent hubs</a>
        <a class="p31-q-chip p31-q-chip--assist" href="${ghMain}/p31-personal-howto.html">How-to source</a>
        <a class="p31-q-chip p31-q-chip--assist" href="${ghMain}/docs/P31-DEPLOY-CANON.md">CONNECTION</a>
        <a class="p31-q-chip p31-q-chip--assist" href="${ghMain}/docs/PLAN-BONDING-SOUP-WHEN-SCALE.md">When-scale plan</a>
        <a class="p31-q-chip p31-q-chip--assist" href="https://p31ca.org/visuals">Visual demos</a>
        <a class="p31-q-chip p31-q-chip--assist" href="https://p31ca.org/glass-box">Glass box</a>
        <a class="p31-q-chip p31-q-chip--assist" href="https://p31ca.org/">p31ca.org</a>
      </div>

      <footer class="p31-doc-foot">
        <p>P31 home · fleet portal · <span class="p31-doc-bead" aria-hidden="true">Build, Create, Connect</span></p>
        <p>Regenerate from JSON: <code>npm run build:fleet-portal</code> · Live blip colors: <code>npm run build:fleet-portal:live</code></p>
        <p>Mirror: <a href="https://p31ca.org/fleet-portal">p31ca.org/fleet-portal</a></p>
      </footer>
    </div>
  </div>

  <script type="module">
    /* P31 doc-surface — section stagger fade-in + TOC scroll-spy.
       Inlined here so the generated page works identically on the home
       static server and the hub (no extra sync). Mirrors
       design-assets/p31-doc-surface.js. Fail-quiet, reduced-motion aware. */
    (function(){
      const root = document.body;
      if(!root || !root.classList.contains("p31-doc")) return;
      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const sections = Array.from(document.querySelectorAll(".p31-doc-section"));
      if(reduced || typeof IntersectionObserver !== "function"){
        sections.forEach(s => s.classList.add("is-in"));
      } else {
        const fade = new IntersectionObserver(es => {
          es.forEach(e => { if(e.isIntersecting && e.intersectionRatio > 0.06){ e.target.classList.add("is-in"); fade.unobserve(e.target); } });
        }, { rootMargin: "0px 0px -8% 0px", threshold: [0, 0.06, 0.18] });
        sections.forEach(s => fade.observe(s));
      }
      const toc = document.querySelector(".p31-doc-toc");
      if(!toc || typeof IntersectionObserver !== "function") return;
      const pairs = [];
      toc.querySelectorAll('a[href^="#"]').forEach(a => {
        const id = (a.getAttribute("href")||"").slice(1);
        const t = id ? document.getElementById(id) : null;
        if(t) pairs.push({ link: a, target: t });
      });
      if(!pairs.length) return;
      const ratios = new Map(pairs.map(p => [p.target, 0]));
      function apply(){
        let best=null, br=0;
        ratios.forEach((r,el) => { if(r>br){ br=r; best=el; } });
        pairs.forEach(p => {
          if(p.target===best){ p.link.setAttribute("aria-current","location"); p.link.classList.add("is-active"); }
          else { if(p.link.getAttribute("aria-current")==="location") p.link.removeAttribute("aria-current"); p.link.classList.remove("is-active"); }
        });
      }
      const spy = new IntersectionObserver(es => {
        es.forEach(e => ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
        apply();
      }, { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.08, 0.22, 0.5, 0.85, 1] });
      pairs.forEach(p => spy.observe(p.target));
      apply();
    })();
  </script>
  <script src="/lib/p31-return-ribbon.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log("build-fleet-portal: wrote", path.relative(root, outPath), `(${html.length} bytes)`);

const hubPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");
const hubFleet = path.join(hubPublic, "fleet-portal.html");
if (process.env.P31_FLEET_PORTAL_NO_AUTO_MIRROR !== "1" && fs.existsSync(hubPublic)) {
  fs.mkdirSync(hubPublic, { recursive: true });
  fs.copyFileSync(outPath, hubFleet);
  console.log("build-fleet-portal: auto-mirror →", path.relative(root, hubFleet));
}
