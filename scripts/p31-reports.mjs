#!/usr/bin/env node
/**
 * P31 reports — morning · midday · evening · urgent · auto · weekly · latest · search · promote · index.
 *
 *   npm run reports:morning
 *   npm run reports:midday
 *   npm run reports:evening
 *   npm run reports:urgent -- "<headline>" --severity high --category incident --details "…"
 *   npm run reports:auto                       # picks slot by local time, warns if today's slot already filed
 *   npm run reports:weekly                     # 7-day digest
 *   npm run reports:latest [-- --kind morning]
 *   npm run reports:search -- "<query>"
 *   npm run reports:promote <id>               # copies markdown into docs/reports/promoted/
 *   npm run reports:index                      # rebuild docs/reports/index.json
 *
 * Files:
 *   - Local archive: ~/.p31/reports/YYYY/MM/DD/<id>.{json,md}
 *   - Committed:     docs/reports/index.json (metadata only)
 *   - Promoted:      docs/reports/promoted/<id>.md (opt-in)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getOperatorJoyLine } from "./lib/operator-joy.mjs";
import {
  readinessSection,
  glassSection,
  commitsSection,
  shiftSection,
  urgentPileSection,
  driftSection,
  rollupStatus,
} from "./lib/reports/sections.mjs";
import {
  REPORTS_HOME,
  INDEX_REL,
  newReportId,
  saveReport,
  loadAllEnvelopes,
  writeIndex,
  latestEnvelope,
  searchEnvelopes,
} from "./lib/reports/filing.mjs";
import { renderMarkdown } from "./lib/reports/render.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const KIND_HOURS_BACK = { morning: 12, midday: 4, evening: 12, weekly: 24 * 7 };

function gitInfo() {
  try {
    const head = execFileSync("git", ["-C", root, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
    const branch = execFileSync("git", ["-C", root, "rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" }).trim();
    return { head, branch };
  } catch { return { head: null, branch: null }; }
}

function pickAutoKind(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return "morning";
  if (h < 17) return "midday";
  return "evening";
}

function todayHasKind(envelopes, kind, d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const today = `${yyyy}-${mm}-${dd}`;
  return envelopes.some((e) => e.kind === kind && e.ts.startsWith(today));
}

function buildAggregate(kind, opts = {}) {
  const ts = new Date().toISOString();
  const all = loadAllEnvelopes();
  const sinceHours = KIND_HOURS_BACK[kind] || 24;

  const sections = [];
  const readiness = readinessSection(root, { refresh: opts.refresh });
  sections.push(readiness);
  sections.push(glassSection(root));
  sections.push(driftSection(all, kind, readiness.data));
  sections.push(urgentPileSection(all, kind, ts));
  sections.push(commitsSection(root, sinceHours));
  sections.push(shiftSection());
  if (kind === "morning" || kind === "evening") {
    const line = getOperatorJoyLine(root, { short: kind === "morning" });
    sections.push({ id: "joy", title: "Trim tab", status: "ok", lines: [line], data: { line } });
  }

  const overall = rollupStatus(sections);
  const headline = makeAggregateHeadline(kind, readiness, sections);
  const nextOne = readiness?.data?.nextOne || "Run npm run launch:audit";

  const envelope = {
    schema: "p31.report/0.1.0",
    id: newReportId(kind),
    kind,
    ts,
    git: gitInfo(),
    summary: {
      headline,
      severity: overall,
      ready: !!readiness?.data?.ready,
      score: readiness?.data?.score ?? null,
      blockers: readiness?.data?.blockers || [],
      humanGatesPending: readiness?.data?.humanGatesPending ?? null,
      nextOne,
    },
    sections,
    refs: [
      "/tmp/p31_launch_readiness.json",
      "~/.p31/launch-log.jsonl",
      "~/.p31/operator-shift.jsonl",
      "docs/reports/index.json",
    ],
  };
  return envelope;
}

function makeAggregateHeadline(kind, readiness, sections) {
  const score = readiness?.data?.score;
  const blockers = readiness?.data?.blockers?.length || 0;
  const gates = readiness?.data?.humanGatesPending || 0;
  const urgent = sections.find((s) => s.id === "urgent-pile");
  const urgentN = urgent?.data?.pile?.length || 0;
  const parts = [`${score ?? "?"}/100`];
  if (blockers > 0) parts.push(`${blockers} blocker${blockers === 1 ? "" : "s"}`);
  if (gates > 0) parts.push(`${gates} critical gate${gates === 1 ? "" : "s"}`);
  if (urgentN > 0) parts.push(`${urgentN} urgent`);
  return `${kind} · ${parts.join(" · ")}`;
}

function buildUrgent(args) {
  const ts = new Date().toISOString();
  const headline = args.headline;
  if (!headline) {
    console.error("reports:urgent: provide a headline as first arg");
    process.exit(2);
  }
  const severity = args.severity || "high";
  const category = args.category || "incident";
  const readiness = readinessSection(root, { refresh: false });
  const sections = [];
  sections.push({
    id: "details",
    title: "Details",
    status: severity === "critical" ? "critical" : "urgent",
    lines: (args.details || "(no details supplied — edit the markdown to add)").split("\n"),
    data: { details: args.details || null },
  });
  sections.push(readiness);
  sections.push(commitsSection(root, 6));
  sections.push(shiftSection());

  const envelope = {
    schema: "p31.report/0.1.0",
    id: newReportId("urgent"),
    kind: "urgent",
    severity,
    category,
    ts,
    git: gitInfo(),
    summary: {
      headline,
      severity,
      ready: !!readiness?.data?.ready,
      score: readiness?.data?.score ?? null,
      blockers: readiness?.data?.blockers || [],
      nextOne: args.nextOne || `Investigate ${category}: ${headline}`,
    },
    sections,
    refs: ["/tmp/p31_launch_readiness.json", "~/.p31/launch-log.jsonl"],
  };
  return envelope;
}

function buildWeekly() {
  const ts = new Date().toISOString();
  const all = loadAllEnvelopes();
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const week = all.filter((e) => e.ts > cutoff);

  const counts = {};
  for (const e of week) counts[e.kind] = (counts[e.kind] || 0) + 1;
  const urgent = week.filter((e) => e.kind === "urgent");
  const severityCounts = {};
  for (const u of urgent) {
    const s = u.severity || u.summary?.severity || "info";
    severityCounts[s] = (severityCounts[s] || 0) + 1;
  }
  const scores = week
    .filter((e) => e.kind !== "urgent" && e.summary?.score != null)
    .map((e) => e.summary.score);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const min = scores.length ? Math.min(...scores) : null;
  const max = scores.length ? Math.max(...scores) : null;

  const sections = [];
  sections.push({
    id: "week-stats",
    title: "Last 7 days",
    status: urgent.length > 2 ? "caution" : "ok",
    lines: [
      `Reports: ${week.length} (` + Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(", ") + ")",
      scores.length ? `Score: avg ${avg.toFixed(1)} · min ${min} · max ${max}` : "Score: (no aggregates this week)",
      urgent.length ? `Urgent: ${urgent.length} (${Object.entries(severityCounts).map(([k, v]) => `${k}=${v}`).join(", ")})` : "Urgent: 0",
    ],
    data: { counts, severityCounts, avg, min, max, urgentCount: urgent.length, total: week.length },
  });
  sections.push({
    id: "urgent-week",
    title: "Urgent items this week",
    status: urgent.length ? (urgent.some((u) => u.severity === "critical") ? "critical" : "urgent") : "ok",
    lines: urgent.length ? urgent.map((u) => `· ${(u.severity || "?").toUpperCase().padEnd(8)} ${u.ts}  ${u.summary?.headline || u.id}`) : ["(none)"],
    data: { urgent: urgent.map((u) => ({ id: u.id, ts: u.ts, severity: u.severity, headline: u.summary?.headline })) },
  });
  sections.push(readinessSection(root, { refresh: false }));
  sections.push(commitsSection(root, 24 * 7));

  const envelope = {
    schema: "p31.report/0.1.0",
    id: newReportId("weekly"),
    kind: "weekly",
    ts,
    git: gitInfo(),
    summary: {
      headline: `weekly · ${week.length} reports · ${urgent.length} urgent · avg ${avg ? avg.toFixed(1) : "?"}/100`,
      severity: rollupStatus(sections),
      score: avg,
      blockers: [],
      nextOne: "Tag the week — promote standout reports via npm run reports:promote",
    },
    sections,
    refs: ["docs/reports/index.json"],
  };
  return envelope;
}

function fileAndIndex(envelope) {
  const md = renderMarkdown(envelope);
  const paths = saveReport(envelope, md);
  const all = loadAllEnvelopes();
  const { out } = writeIndex(root, all);
  return { md, paths, indexPath: out };
}

function printConsole(envelope, paths, indexPath, opts = {}) {
  const sevColor = { ok: "\x1b[32m", notice: "\x1b[36m", caution: "\x1b[33m", urgent: "\x1b[31m", critical: "\x1b[31;1m", skip: "\x1b[90m" };
  const sev = envelope.summary?.severity || "ok";
  console.log(`\n${sevColor[sev] || ""}━━ P31 ${envelope.kind.toUpperCase()} ━━\x1b[0m  ${envelope.summary.headline}`);
  console.log(`id  ${envelope.id}`);
  console.log(`ts  ${envelope.ts}`);
  if (envelope.summary?.nextOne) console.log(`▶   ${envelope.summary.nextOne}`);
  if (!opts.brief) {
    for (const s of envelope.sections) {
      const c = sevColor[s.status] || "";
      console.log(`\n${c}● ${s.title}\x1b[0m  (${s.status})`);
      for (const l of (s.lines || []).slice(0, 8)) console.log(`  ${l}`);
      if ((s.lines || []).length > 8) console.log(`  … +${s.lines.length - 8} more`);
    }
  }
  console.log(`\nfiled  ${paths.json}`);
  console.log(`md     ${paths.md}`);
  console.log(`index  ${indexPath}`);
}

function cmdLatest(args) {
  const all = loadAllEnvelopes();
  const kind = args.kind;
  const e = latestEnvelope(all, kind);
  if (!e) {
    console.log(`reports:latest: no reports${kind ? " of kind " + kind : ""}`);
    process.exit(1);
  }
  if (args.json) {
    process.stdout.write(JSON.stringify(e, null, 2) + "\n");
    return;
  }
  console.log(renderMarkdown(e));
}

function cmdSearch(args) {
  if (!args.query) { console.error("reports:search: provide a query"); process.exit(2); }
  const all = loadAllEnvelopes();
  const hits = searchEnvelopes(all, args.query);
  if (!hits.length) {
    console.log(`reports:search: no hits for '${args.query}'`);
    return;
  }
  for (const e of hits.slice(-25)) {
    console.log(`${e.kind.padEnd(8)} ${e.ts}  ${e.id}`);
    console.log(`           ${e.summary?.headline || ""}`);
  }
}

function cmdPromote(args) {
  if (!args.id) { console.error("reports:promote: provide a report id"); process.exit(2); }
  const all = loadAllEnvelopes();
  const e = all.find((x) => x.id === args.id);
  if (!e) { console.error(`reports:promote: not found: ${args.id}`); process.exit(2); }
  const md = renderMarkdown(e);
  const dest = path.join(root, "docs", "reports", "promoted", `${e.id}.md`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, md, "utf8");
  console.log(`reports:promote: wrote ${path.relative(root, dest)}`);
}

function cmdIndex() {
  const all = loadAllEnvelopes();
  const { out, index } = writeIndex(root, all);
  console.log(`reports:index: ${index.count} reports → ${path.relative(root, out)}`);
}

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

async function main() {
  const argv = process.argv.slice(2);
  const subcmd = argv[0] || "auto";
  const args = parseArgs(argv.slice(1));

  if (["morning", "midday", "evening"].includes(subcmd)) {
    const env = buildAggregate(subcmd, { refresh: !!args.refresh });
    const { paths, indexPath } = fileAndIndex(env);
    printConsole(env, paths, indexPath, { brief: !!args.brief });
    return;
  }
  if (subcmd === "auto") {
    const all = loadAllEnvelopes();
    const kind = pickAutoKind();
    if (todayHasKind(all, kind) && !args.force) {
      console.log(`reports:auto: today's ${kind} report already exists. Pass --force to file another.`);
      const e = [...all].reverse().find((x) => x.kind === kind);
      if (e) console.log(`latest ${kind}: ${e.id} · ${e.summary?.headline || ""}`);
      process.exit(0);
    }
    const env = buildAggregate(kind, { refresh: !!args.refresh });
    const { paths, indexPath } = fileAndIndex(env);
    printConsole(env, paths, indexPath, { brief: !!args.brief });
    return;
  }
  if (subcmd === "urgent") {
    const headline = args._[0] || args.headline;
    const env = buildUrgent({ headline, severity: args.severity, category: args.category, details: args.details, nextOne: args.next });
    const { paths, indexPath } = fileAndIndex(env);
    printConsole(env, paths, indexPath, { brief: false });
    return;
  }
  if (subcmd === "weekly") {
    const env = buildWeekly();
    const { paths, indexPath } = fileAndIndex(env);
    printConsole(env, paths, indexPath, { brief: !!args.brief });
    return;
  }
  if (subcmd === "latest") return cmdLatest({ kind: args.kind, json: !!args.json });
  if (subcmd === "search") return cmdSearch({ query: args._[0] || args.q });
  if (subcmd === "promote") return cmdPromote({ id: args._[0] || args.id });
  if (subcmd === "index") return cmdIndex();

  console.error(`reports: unknown subcommand '${subcmd}'`);
  console.error("Use one of: morning · midday · evening · urgent · auto · weekly · latest · search · promote · index");
  process.exit(2);
}

main();
