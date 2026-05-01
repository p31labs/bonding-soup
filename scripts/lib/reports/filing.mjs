/**
 * Smart filing for p31.report/0.1.0:
 *   ~/.p31/reports/YYYY/MM/DD/<kind>-<HHMM>-<rand>.json
 *   ~/.p31/reports/YYYY/MM/DD/<kind>-<HHMM>-<rand>.md  (mirror)
 *
 * Index manifest committed: docs/reports/index.json (metadata only — no body).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Live archive root. `P31_REPORTS_HOME` swaps in a sandbox (used by simulation). */
export const REPORTS_HOME = process.env.P31_REPORTS_HOME && process.env.P31_REPORTS_HOME.trim()
  ? path.resolve(process.env.P31_REPORTS_HOME.trim())
  : path.join(os.homedir(), ".p31", "reports");
export const INDEX_REL = path.join("docs", "reports", "index.json");
export const INDEX_RECENT = 50;
export const INDEX_SCHEMA = "p31.reportsIndex/0.1.0";

/** @param {Date} d */
function pad(n) { return n.toString().padStart(2, "0"); }
function dirFor(d) { return path.join(REPORTS_HOME, String(d.getUTCFullYear()), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())); }

/** @param {string} kind */
export function newReportId(kind, d = new Date()) {
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const r = Math.random().toString(36).slice(2, 6);
  return `${kind}-${y}${m}${day}-${h}${min}-${r}`;
}

/** Persist envelope JSON + markdown to local archive. Returns absolute paths. */
export function saveReport(envelope, markdown) {
  const ts = new Date(envelope.ts);
  const dir = dirFor(ts);
  fs.mkdirSync(dir, { recursive: true });
  const json = path.join(dir, `${envelope.id}.json`);
  const md = path.join(dir, `${envelope.id}.md`);
  fs.writeFileSync(json, JSON.stringify(envelope, null, 2) + "\n", "utf8");
  fs.writeFileSync(md, markdown, "utf8");
  return { json, md };
}

/** Read all envelopes (light scan). */
export function loadAllEnvelopes() {
  const out = [];
  if (!fs.existsSync(REPORTS_HOME)) return out;
  walk(REPORTS_HOME, (p) => {
    if (p.endsWith(".json")) {
      try {
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        if (j.schema === "p31.report/0.1.0" && j.id && j.ts) {
          out.push({ ...j, _path: p });
        }
      } catch {}
    }
  });
  return out.sort((a, b) => a.ts.localeCompare(b.ts));
}

function walk(dir, cb) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, cb);
    else cb(p);
  }
}

/** Build the committable index (metadata only). */
export function buildIndex(envelopes) {
  const recent = envelopes.slice(-INDEX_RECENT).reverse().map(toIndexRow);
  const byKind = {};
  for (const e of envelopes) {
    byKind[e.kind] = (byKind[e.kind] || 0) + 1;
  }
  return {
    schema: INDEX_SCHEMA,
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    count: envelopes.length,
    byKind,
    recent,
  };
}

function toIndexRow(e) {
  return {
    id: e.id,
    kind: e.kind,
    ts: e.ts,
    severity: e.summary?.severity || e.severity || "info",
    headline: e.summary?.headline || e.headline || "",
    refsLocal: true,
  };
}

/** @param {string} root */
export function writeIndex(root, envelopes) {
  const index = buildIndex(envelopes);
  const out = path.join(root, INDEX_REL);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(index, null, 2) + "\n", "utf8");
  return { out, index };
}

/** Find latest envelope of optional kind. */
export function latestEnvelope(envelopes, kind) {
  for (let i = envelopes.length - 1; i >= 0; i--) {
    if (!kind || envelopes[i].kind === kind) return envelopes[i];
  }
  return null;
}

/** Search envelopes (case-insensitive substring across id/headline/sections). */
export function searchEnvelopes(envelopes, query) {
  const q = query.toLowerCase();
  const hits = [];
  for (const e of envelopes) {
    const blob = [
      e.id,
      e.summary?.headline,
      e.summary?.severity,
      e.kind,
      JSON.stringify(e.sections || []),
    ].join(" ").toLowerCase();
    if (blob.includes(q)) hits.push(e);
  }
  return hits;
}
