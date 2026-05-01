/**
 * Section builders for p31.report/0.1.0.
 * Each section returns { id, title, status, lines:[], data:{} }.
 *   status: "ok"|"notice"|"caution"|"urgent"|"critical"|"skip"
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   status: "ok"|"notice"|"caution"|"urgent"|"critical"|"skip",
 *   lines: string[],
 *   data: any,
 * }} Section
 */

/** @returns {Section} */
function skipSection(id, title, why) {
  return { id, title, status: "skip", lines: [`(skip — ${why})`], data: { skip: why } };
}

/** Read a JSON file or return null. */
function readJson(p) {
  if (!p || !fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

/** @param {string} root */
export function readinessSection(root, opts = {}) {
  const reportPath = process.env.P31_LAUNCH_REPORT || "/tmp/p31_launch_readiness.json";
  let report = readJson(reportPath);

  if ((!report || opts.refresh) && opts.refresh !== false) {
    const r = spawnSync("npm", ["run", "launch:audit", "--", "--no-log"], { cwd: root, stdio: "pipe", encoding: "utf8" });
    if (r.status !== null) report = readJson(reportPath);
  }

  if (!report) {
    return skipSection("readiness", "Launch readiness", "no /tmp/p31_launch_readiness.json (run npm run launch:audit)");
  }

  const s = report.summary;
  const greenLanes = report.lanes.filter((L) => L.status === "pass").length;
  const status = report.summary.blockers.length > 0
    ? "caution"
    : (s.score >= 92 ? "ok" : "notice");

  const lines = [
    `Score **${s.score}/100** · ${greenLanes}/${report.lanes.length} lanes green · mode \`${report.mode}\``,
    s.ready ? "Status: **READY**" : "Status: **HOLD**",
  ];
  if (s.blockers.length) lines.push(`Blockers: ${s.blockers.length}`);
  if (s.warnings.length) lines.push(`Warnings: ${s.warnings.length}`);
  if (s.humanGatesPending) lines.push(`Human gates pending: ${s.humanGatesPending}`);
  lines.push(`Next: \`${report.nextOne}\``);

  for (const L of report.lanes) {
    const dot = L.status === "pass" ? "✓" : L.status === "warn" ? "·" : "✗";
    lines.push(`  ${dot} ${L.id.padEnd(13)} ${L.score}/${L.weight}  ${L.title}`);
  }

  return {
    id: "readiness",
    title: "Launch readiness",
    status,
    lines,
    data: { score: s.score, ready: s.ready, blockers: s.blockers, warnings: s.warnings, humanGatesPending: s.humanGatesPending, mode: report.mode, nextOne: report.nextOne, gitHead: report.git?.head },
  };
}

/** @param {string} _root */
export function glassSection(_root) {
  const p = process.env.P31_GLASS_REPORT || "/tmp/p31_glass_report.json";
  const report = readJson(p);
  if (!report) return skipSection("glass", "Live glass probes", "no /tmp/p31_glass_report.json (run npm run ecosystem:glass)");

  const probes = Array.isArray(report.probes) ? report.probes : [];
  const counts = { up: 0, down: 0, auth: 0, warn: 0, slow: 0, other: 0 };
  const downRows = [];
  for (const r of probes) {
    const state = (r.state || r.status || "other").toLowerCase();
    if (counts[state] !== undefined) counts[state]++; else counts.other++;
    if (state === "down") downRows.push(`${r.id || r.name || "?"}: ${r.url || ""}`);
    if (r.slow) counts.slow++;
  }
  const status = counts.down > 0 ? "caution" : counts.slow > 0 ? "notice" : "ok";
  const lines = [
    `up=${counts.up} · down=${counts.down} · auth=${counts.auth} · warn=${counts.warn} · slow=${counts.slow}`,
  ];
  if (downRows.length) lines.push("Down rows:", ...downRows.map((r) => "  · " + r));

  return {
    id: "glass",
    title: "Live glass probes",
    status,
    lines,
    data: { counts, downRows, generatedAt: report.generatedAt },
  };
}

/** @param {string} _root @param {number} sinceHours */
export function commitsSection(_root, sinceHours) {
  try {
    const out = execFileSync("git", ["-C", _root, "log", `--since=${sinceHours} hours ago`, "--pretty=format:%h %ad %s", "--date=short"], { encoding: "utf8" });
    const lines = out.split("\n").filter(Boolean);
    return {
      id: "commits",
      title: `Recent commits (${sinceHours}h)`,
      status: lines.length ? "ok" : "notice",
      lines: lines.length ? lines.slice(0, 25).map((l) => "· " + l) : ["(none)"],
      data: { count: lines.length, sinceHours },
    };
  } catch (e) {
    return skipSection("commits", "Recent commits", "git log unavailable");
  }
}

export function shiftSection() {
  const file = path.join(HOME, ".p31", "operator-shift.jsonl");
  if (!fs.existsSync(file)) return skipSection("shift", "Operator shift", "no ~/.p31/operator-shift.jsonl");
  const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
  const last = lines.length ? safeParse(lines[lines.length - 1]) : null;
  if (!last) return skipSection("shift", "Operator shift", "log empty");
  const state = last.state || last.action || "unknown";
  const ageMs = Date.now() - new Date(last.ts || last.timestamp || 0).getTime();
  const ageH = Number.isFinite(ageMs) ? Math.round(ageMs / 36e5) : null;
  const status = state === "in" ? "ok" : "notice";
  return {
    id: "shift",
    title: "Operator shift",
    status,
    lines: [`Last: ${state}${ageH != null ? ` (${ageH}h ago)` : ""}${last.note ? " — " + last.note : ""}`],
    data: { last },
  };
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

/** Pull all urgent reports filed since the previous aggregate of `kind`. */
export function urgentPileSection(allReports, currentKind, currentTs) {
  const lastSameKind = [...allReports].reverse().find((r) => r.kind === currentKind && r.ts < currentTs);
  const cutoff = lastSameKind ? lastSameKind.ts : new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const pile = allReports.filter((r) => r.kind === "urgent" && r.ts > cutoff && r.ts <= currentTs);
  if (!pile.length) return skipSection("urgent-pile", "Urgent items since last aggregate", "none");
  const status = pile.some((r) => r.severity === "critical") ? "critical" : pile.some((r) => r.severity === "high") ? "urgent" : "caution";
  return {
    id: "urgent-pile",
    title: `Urgent items since last ${currentKind} (${pile.length})`,
    status,
    lines: pile.map((r) => `· ${r.severity?.toUpperCase().padEnd(8) || "INFO   "} ${r.ts}  ${r.headline || r.id}`),
    data: { pile: pile.map((p) => ({ id: p.id, ts: p.ts, severity: p.severity, headline: p.headline })) },
  };
}

/** Diff readiness vs previous report of same kind. */
export function driftSection(allReports, currentKind, currentReadiness) {
  const last = [...allReports].reverse().find((r) => r.kind === currentKind && r.summary?.score != null);
  if (!last) return skipSection("drift", "Drift since last", "no prior aggregate of same kind");
  if (!currentReadiness) return skipSection("drift", "Drift since last", "no readiness data");
  const dScore = (currentReadiness.score - (last.summary.score ?? 0)).toFixed(2);
  const lastBlock = (last.summary.blockers || []).length;
  const nowBlock = (currentReadiness.blockers || []).length;
  const dBlock = nowBlock - lastBlock;
  const status = dScore < 0 || dBlock > 0 ? "caution" : "ok";
  return {
    id: "drift",
    title: `Drift since previous ${currentKind}`,
    status,
    lines: [
      `Δscore ${dScore >= 0 ? "+" : ""}${dScore} · Δblockers ${dBlock >= 0 ? "+" : ""}${dBlock}`,
      `prev: score=${last.summary.score} · blockers=${lastBlock} · ts=${last.ts}`,
    ],
    data: { dScore: Number(dScore), dBlock, prev: { score: last.summary.score, blockers: lastBlock, ts: last.ts } },
  };
}

/** @param {string} root */
export function complianceSection(root) {
  const registryPath = path.join(root, "p31-protocol-registry.json");
  const registry = readJson(registryPath);
  
  if (!registry || !registry.officeCalendar) {
    return skipSection("compliance", "Office compliance", "no officeCalendar in p31-protocol-registry.json");
  }
  
  const calendar = registry.officeCalendar;
  const deadlines = calendar.deadlines || [];
  const now = new Date();
  
  const upcoming = [];
  const urgent = [];
  const overdue = [];
  
  for (const d of deadlines) {
    const deadlineDate = new Date(d.date);
    const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      overdue.push({ ...d, daysUntil });
    } else if (d.urgent || d.critical || daysUntil <= 7) {
      urgent.push({ ...d, daysUntil });
    } else if (daysUntil <= 30) {
      upcoming.push({ ...d, daysUntil });
    }
  }
  
  // Sort by days until deadline
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  urgent.sort((a, b) => a.daysUntil - b.daysUntil);
  overdue.sort((a, b) => a.daysUntil - b.daysUntil);
  
  const lines = [];
  let status = "ok";
  
  if (overdue.length) {
    status = "critical";
    lines.push(`**OVERDUE (${overdue.length}):**`);
    for (const d of overdue.slice(0, 3)) {
      lines.push(`  ✗ ${d.id} — ${Math.abs(d.daysUntil)} days overdue — ${d.action}`);
    }
  }
  
  if (urgent.length) {
    if (status === "ok") status = "urgent";
    if (lines.length) lines.push("");
    lines.push(`**URGENT (${urgent.length}):**`);
    for (const d of urgent.slice(0, 5)) {
      const amount = d.amount ? ` [${d.amount}]` : "";
      lines.push(`  ! ${d.id} — ${d.daysUntil} days${amount} — ${d.action}`);
    }
  }
  
  if (upcoming.length) {
    if (lines.length) lines.push("");
    lines.push(`**Upcoming (${upcoming.length}):**`);
    for (const d of upcoming.slice(0, 5)) {
      const amount = d.amount ? ` [${d.amount}]` : "";
      lines.push(`  · ${d.id} — ${d.daysUntil} days${amount} — ${d.action}`);
    }
  }
  
  if (!lines.length) {
    lines.push("No urgent or upcoming deadlines (next 30 days)");
  }
  
  // Add quick commands
  lines.push("");
  lines.push("**Quick commands:**");
  if (urgent.length || overdue.length) {
    lines.push("  npm run office:check — Check all deadlines");
  }
  lines.push("  npm run office:notice — Generate board notice");
  lines.push("  npm run office:coi — Generate COI form");
  
  return {
    id: "compliance",
    title: "Office compliance",
    status,
    lines,
    data: { 
      overdue: overdue.length, 
      urgent: urgent.length, 
      upcoming: upcoming.length,
      entity: calendar.entity?.legalName 
    },
  };
}

export const STATUS_RANK = { ok: 0, notice: 1, caution: 2, urgent: 3, critical: 4, skip: -1 };
export function rollupStatus(sections) {
  let max = -1;
  let key = "ok";
  for (const s of sections) {
    const r = STATUS_RANK[s.status] ?? -1;
    if (r > max) { max = r; key = s.status; }
  }
  return key === "skip" ? "ok" : key;
}
