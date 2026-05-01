#!/usr/bin/env node
/**
 * P31 reports — simulation. Files synthetic reports into a SANDBOX archive
 * (P31_REPORTS_HOME override) so the operator can preview the cadence + UI
 * without touching the live archive.
 *
 *   npm run reports:simulate -- --scenario steady-week
 *   npm run reports:simulate -- --scenario incident-day
 *   npm run reports:simulate -- --scenario drift-down
 *   npm run reports:simulate -- --scenario urgent-storm
 *   npm run reports:simulate -- --scenario steady-week --out /tmp/p31-sim
 *
 * Defaults sandbox: ~/.p31/reports-sim/<scenario>-<utc-stamp>/
 * Set --keep to keep the sandbox; otherwise the path is printed and left in place.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { out[key] = next; i++; }
      else out[key] = true;
    } else out._.push(a);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const scenario = args.scenario || args._[0] || "steady-week";
const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const sandbox = args.out
  ? path.resolve(args.out)
  : path.join(os.homedir(), ".p31", "reports-sim", `${scenario}-${stamp}`);

fs.mkdirSync(sandbox, { recursive: true });
process.env.P31_REPORTS_HOME = sandbox;

// Lazy import AFTER setting env so filing picks up the sandbox.
const { saveReport, writeIndex, loadAllEnvelopes } = await import("./lib/reports/filing.mjs");
const { renderMarkdown } = await import("./lib/reports/render.mjs");

/* ----------------------------- helpers ----------------------------- */

function pad(n) { return n.toString().padStart(2, "0"); }
function isoAt(d, h, m = 0) {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
}
function dayOffset(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function rid(kind, ts) {
  const d = new Date(ts);
  const r = Math.random().toString(36).slice(2, 6);
  return `${kind}-${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}-${r}`;
}

/** Synthesize a "readiness" section without running real checks. */
function synthReadiness(score, blockers = [], warnings = []) {
  const lanes = [
    { id: "alignment", title: "Alignment + contract registry", weight: 10, status: blockers.length ? "fail" : "pass", score: blockers.length ? 0 : 10 },
    { id: "integrity", title: "Operator-locked truth", weight: 10, status: "pass", score: 10 },
    { id: "governance", title: "PRS launch governance", weight: 10, status: "pass", score: 10 },
    { id: "build", title: "Build + deploy", weight: 12, status: score >= 90 ? "pass" : "warn", score: score >= 90 ? 12 : 9 },
    { id: "passkeys", title: "Passkey + identity", weight: 10, status: "pass", score: 10 },
    { id: "payments", title: "Payments + creator economy", weight: 10, status: warnings.find((w) => /payments/i.test(w)) ? "warn" : "pass", score: warnings.find((w) => /payments/i.test(w)) ? 7 : 10 },
    { id: "mesh", title: "Mesh + DO isolation", weight: 8, status: "pass", score: 8 },
    { id: "security", title: "Security suite", weight: 10, status: "pass", score: 10 },
    { id: "observability", title: "Glass + runbooks", weight: 10, status: "pass", score: 10 },
    { id: "human-gate", title: "Human sign-offs", weight: 10, status: warnings.length ? "warn" : "pass", score: warnings.length ? 5 : 10 },
  ];
  return {
    id: "readiness",
    title: "Launch readiness",
    status: blockers.length ? "caution" : score >= 92 ? "ok" : "notice",
    lines: [
      `Score **${score}/100** · ${lanes.filter((L)=>L.status==="pass").length}/${lanes.length} lanes green · mode \`audit\`  *(simulated)*`,
      score >= 92 ? "Status: **READY**" : "Status: **HOLD**",
      blockers.length ? `Blockers: ${blockers.length}` : "",
      warnings.length ? `Warnings: ${warnings.length}` : "",
    ].filter(Boolean),
    data: { score, ready: score >= 92, blockers, warnings, humanGatesPending: warnings.length, mode: "audit", nextOne: blockers[0] || warnings[0] || "Operator-rest window — no blockers" },
  };
}

function makeAggregate({ kind, ts, score, blockers = [], warnings = [], urgentPile = [], drift = null }) {
  const readiness = synthReadiness(score, blockers, warnings);
  const sections = [readiness];
  if (drift) {
    sections.push({
      id: "drift",
      title: `Drift since previous ${kind}`,
      status: drift.dScore < 0 ? "caution" : "ok",
      lines: [`Δscore ${drift.dScore >= 0 ? "+" : ""}${drift.dScore} · Δblockers ${drift.dBlock >= 0 ? "+" : ""}${drift.dBlock}`],
      data: drift,
    });
  }
  if (urgentPile.length) {
    sections.push({
      id: "urgent-pile",
      title: `Urgent items since last ${kind} (${urgentPile.length})`,
      status: urgentPile.some((u)=>u.severity==="critical") ? "critical" : "urgent",
      lines: urgentPile.map((u)=>`· ${u.severity.toUpperCase().padEnd(8)} ${u.ts}  ${u.headline}`),
      data: { pile: urgentPile },
    });
  }
  sections.push({ id: "commits", title: "Recent commits (sim)", status: "ok", lines: [`· abc${kind[0]} ${ts.slice(0,10)} sim: ${kind} cadence`], data: {} });
  sections.push({ id: "shift", title: "Operator shift", status: "ok", lines: ["Last: in (sim) — coffee secured"], data: {} });

  const overallSeverity = (() => {
    let max = 0;
    const rank = { ok: 0, notice: 1, caution: 2, urgent: 3, critical: 4 };
    let key = "ok";
    for (const s of sections) {
      if ((rank[s.status] ?? -1) > max) { max = rank[s.status]; key = s.status; }
    }
    return key;
  })();

  const headlineParts = [`${kind} · ${score}/100`];
  if (blockers.length) headlineParts.push(`${blockers.length} blocker${blockers.length===1?"":"s"}`);
  if (warnings.length) headlineParts.push(`${warnings.length} warning${warnings.length===1?"":"s"}`);
  if (urgentPile.length) headlineParts.push(`${urgentPile.length} urgent`);

  return {
    schema: "p31.report/0.1.0",
    id: rid(kind, ts),
    kind,
    ts,
    git: { head: "sim_____", branch: "main" },
    summary: {
      headline: headlineParts.join(" · "),
      severity: overallSeverity,
      ready: score >= 92 && !blockers.length,
      score,
      blockers,
      humanGatesPending: warnings.length,
      nextOne: readiness.data.nextOne,
    },
    sections,
    refs: ["(simulated — sandbox archive)"],
  };
}

function makeUrgent({ ts, headline, severity = "high", category = "incident", details }) {
  return {
    schema: "p31.report/0.1.0",
    id: rid("urgent", ts),
    kind: "urgent",
    severity,
    category,
    ts,
    git: { head: "sim_____", branch: "main" },
    summary: {
      headline,
      severity,
      ready: false,
      score: null,
      blockers: [],
      nextOne: `Investigate ${category}: ${headline}`,
    },
    sections: [
      { id: "details", title: "Details", status: severity === "critical" ? "critical" : "urgent", lines: (details || "(sim — synthetic incident)").split("\n"), data: { details } },
    ],
    refs: ["(simulated)"],
  };
}

/* ----------------------------- scenarios ----------------------------- */

function scenarioSteadyWeek() {
  const out = [];
  const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  let prev = null;
  for (let day = 0; day < 7; day++) {
    const d = dayOffset(start, day);
    const dayScore = 88 + Math.round(Math.random() * 6);
    for (const slot of [["morning", 9], ["midday", 13], ["evening", 19]]) {
      const ts = isoAt(d, slot[1]);
      const score = dayScore + (slot[0] === "evening" ? -1 : 0);
      const drift = prev && prev.kind === slot[0] ? { dScore: score - prev.score, dBlock: 0, prev: { score: prev.score, blockers: 0, ts: prev.ts } } : null;
      const env = makeAggregate({ kind: slot[0], ts, score, drift });
      out.push(env);
      prev = { kind: slot[0], score, ts };
    }
  }
  return out;
}

function scenarioIncidentDay() {
  const out = [];
  const today = new Date();
  out.push(makeAggregate({ kind: "morning", ts: isoAt(today, 9), score: 92 }));
  out.push(makeAggregate({ kind: "midday", ts: isoAt(today, 13), score: 88, warnings: ["payments: donate-api flapping"] }));
  const urgent = makeUrgent({ ts: isoAt(today, 13, 30), headline: "donate-api 502 storm", severity: "high", details: "Cloudflare 502 every ~30s; circuit-breaker not yet tripped." });
  out.push(urgent);
  out.push(makeAggregate({
    kind: "evening", ts: isoAt(today, 19), score: 78,
    blockers: ["payments donate-api still degraded"],
    urgentPile: [{ ts: urgent.ts, severity: urgent.severity, headline: urgent.summary.headline }],
    drift: { dScore: -10, dBlock: 1, prev: { score: 88, blockers: 0, ts: isoAt(today, 13) } },
  }));
  return out;
}

function scenarioDriftDown() {
  const out = [];
  const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  let prev = null;
  for (let day = 0; day < 7; day++) {
    const d = dayOffset(start, day);
    const score = 95 - day * 3;
    const ts = isoAt(d, 9);
    const drift = prev ? { dScore: score - prev.score, dBlock: 0, prev: { score: prev.score, blockers: 0, ts: prev.ts } } : null;
    out.push(makeAggregate({ kind: "morning", ts, score, drift, warnings: day >= 4 ? [`drift: ${day} days of slow decline`] : [] }));
    prev = { score, ts };
  }
  return out;
}

function scenarioUrgentStorm() {
  const out = [];
  const today = new Date();
  out.push(makeAggregate({ kind: "morning", ts: isoAt(today, 9), score: 92 }));
  const pile = [];
  const urgents = [
    { h: 10, headline: "passkey worker rate-limited", severity: "high", category: "incident" },
    { h: 11, headline: "Stripe webhook delayed 3min", severity: "medium", category: "incident" },
    { h: 12, headline: "grant deadline confirmed Friday", severity: "high", category: "announcement" },
    { h: 14, headline: "donor matching offer landed", severity: "medium", category: "opportunity" },
    { h: 15, headline: "DO migration step failed mid-run", severity: "critical", category: "incident" },
  ];
  for (const u of urgents) {
    const env = makeUrgent({ ts: isoAt(today, u.h), headline: u.headline, severity: u.severity, category: u.category, details: `Auto-generated urgent (${u.category}): ${u.headline}` });
    out.push(env);
    pile.push({ ts: env.ts, severity: env.severity, headline: env.summary.headline });
  }
  out.push(makeAggregate({
    kind: "evening", ts: isoAt(today, 19), score: 81,
    blockers: ["DO migration must roll back or finish before tomorrow"],
    urgentPile: pile,
    drift: { dScore: -11, dBlock: 1, prev: { score: 92, blockers: 0, ts: isoAt(today, 9) } },
  }));
  return out;
}

const SCENARIOS = {
  "steady-week": scenarioSteadyWeek,
  "incident-day": scenarioIncidentDay,
  "drift-down": scenarioDriftDown,
  "urgent-storm": scenarioUrgentStorm,
};

/* ----------------------------- run ----------------------------- */

if (!SCENARIOS[scenario]) {
  console.error(`reports:simulate: unknown scenario '${scenario}'`);
  console.error(`available: ${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(2);
}

const envelopes = SCENARIOS[scenario]();
for (const env of envelopes) {
  saveReport(env, renderMarkdown(env));
}
const all = loadAllEnvelopes();
const { out: indexPath } = writeIndex(sandbox + "/_index", all);
const manifest = {
  schema: "p31.reportsSimulation/0.1.0",
  scenario,
  generatedAt: new Date().toISOString(),
  sandbox,
  count: envelopes.length,
  ids: envelopes.map((e) => ({ id: e.id, kind: e.kind, ts: e.ts, headline: e.summary.headline, severity: e.summary.severity })),
};
fs.writeFileSync(path.join(sandbox, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`\nreports:simulate: scenario=${scenario} reports=${envelopes.length}`);
console.log(`sandbox  ${sandbox}`);
console.log(`manifest ${path.join(sandbox, "manifest.json")}`);
console.log(`index    ${indexPath}`);
console.log(`\nbrowse: P31_REPORTS_HOME='${sandbox}' npm run reports:latest`);
console.log(`search: P31_REPORTS_HOME='${sandbox}' npm run reports:search -- "<query>"`);
console.log(`\nLatest report (${envelopes[envelopes.length-1].kind}):`);
console.log(`  ${envelopes[envelopes.length-1].summary.headline}`);
