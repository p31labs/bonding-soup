/**
 * P31 Psychological E2E — Glass Box Emitter  (Layer 7)
 * Writes live status JSON (polled during run) and final promoted reports
 * into the standard P31 reports system so the Glass Box picks them up.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

// Live status file — runtime-only, gitignored
const LIVE_FILE = path.join(ROOT, "docs", "psych-e2e-live.json");
const LIVE_SCHEMA = "p31.psychE2ELive/1.0.0";

// ─── Live status ───────────────────────────────────────────────────────────────

/**
 * Write the live status file (polled by psych-e2e-live.html during a run).
 * Called after every step — fast path, synchronous.
 * @param {object} status  LiveStatus shape
 */
export function writeLiveStatus(status) {
  try {
    fs.mkdirSync(path.dirname(LIVE_FILE), { recursive: true });
    fs.writeFileSync(
      LIVE_FILE,
      JSON.stringify({ schema: LIVE_SCHEMA, ...status, updatedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  } catch (_) {}
}

/** Clear the live file (written on run completion). */
export function clearLiveStatus(runId, runReport) {
  writeLiveStatus({
    runId,
    status: "complete",
    headline: runReport?.headline || "Run complete",
    sessionCount: runReport?.sessionCount || 0,
    stepCount: runReport?.stepCount || 0,
    mean: runReport?.scoreStats?.mean ?? null,
    severity: runReport?.severity || "low",
  });
}

// ─── Glass Box promoted report ─────────────────────────────────────────────────

/**
 * Write a promoted report for this run into the standard P31 reports system.
 * Uses the existing filing library so the Glass Box LIVE REPORTS FEED shows it.
 *
 * @param {object} runReport  RunReport from aggregator.mjs
 * @returns {Promise<{ id, headline }>}
 */
export async function writeRunReport(runReport) {
  let saveReport, writeIndex, loadAllEnvelopes, newReportId;
  try {
    const filing = await import("../lib/reports/filing.mjs");
    saveReport       = filing.saveReport;
    writeIndex       = filing.writeIndex;
    loadAllEnvelopes = filing.loadAllEnvelopes;
    newReportId      = filing.newReportId;
  } catch (e) {
    console.warn("glass-box-emitter: reports filing unavailable —", e.message);
    return null;
  }

  const ts      = new Date().toISOString();
  const id      = newReportId("psych-e2e", new Date());
  const { scoreStats, criticalFindings, byNDProfile, worstPage, bestPage, headline, severity } = runReport;

  // Markdown body for promoted report
  const md = renderReport({ id, ts, runReport });

  const envelope = {
    schema:   "p31.report/0.1.0",
    id,
    kind:     "psych-e2e",
    ts,
    severity: severity || "low",
    summary: {
      headline,
      severity: severity || "low",
    },
    sections: [
      { title: "Score Statistics", body: formatStats(scoreStats) },
      { title: "Critical Findings", body: formatCritical(criticalFindings) },
      { title: "By ND Profile",    body: formatByND(byNDProfile) },
    ],
  };

  try {
    saveReport(envelope, md);
    const all = loadAllEnvelopes();
    writeIndex(ROOT, all);

    // Write promoted entry
    writePromoted(ROOT, id, ts, headline, severity, md);
    console.log(`glass-box-emitter: promoted report ${id}`);
  } catch (e) {
    console.warn("glass-box-emitter: failed to write report —", e.message);
    return null;
  }

  return { id, headline };
}

// ─── Promoted index ────────────────────────────────────────────────────────────

function writePromoted(root, id, ts, headline, severity, md) {
  const dir  = path.join(root, "docs", "reports", "promoted");
  const file = path.join(dir, `${id}.md`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, md, "utf8");

  const indexFile = path.join(dir, "index.json");
  let entries = [];
  try {
    const existing = JSON.parse(fs.readFileSync(indexFile, "utf8"));
    entries = existing.entries || [];
  } catch (_) {}

  entries.push({
    id, file: `/docs/reports/promoted/${id}.md`,
    ts, kind: "psych-e2e", severity,
    headline,
    bytes: Buffer.byteLength(md, "utf8"),
  });
  entries.sort((a, b) => a.ts.localeCompare(b.ts));

  fs.writeFileSync(indexFile, JSON.stringify({
    schema:      "p31.reportsPromoted/0.1.0",
    version:     "1.0.0",
    generatedAt: new Date().toISOString(),
    count:       entries.length,
    entries,
  }, null, 2) + "\n", "utf8");
}

// ─── Design health ────────────────────────────────────────────────────────────

const DESIGN_HEALTH_FILE = path.join(ROOT, "docs", "design-health.json");
const DESIGN_HEALTH_SCHEMA = "p31.designHealth/1.0.0";

/**
 * Compute design health metrics from static file analysis of the 4 Bin A surfaces.
 * Grades are derived only from verifiable, public file content — no operator-private data.
 */
export function computeDesignHealth() {
  const BIN_A = [
    path.join(ROOT, "public", "passport.html"),
    path.join(ROOT, "public", "geodesic.html"),
    path.join(ROOT, "public", "delta-language.html"),
    path.join(ROOT, "public", "observatory.html"),
  ];

  let safeModeCompliant = 0;
  let phosRouterActive = 0;
  let hardcodedHex = 0;
  let touchTargetSurfaces = 0;
  let validSurfaces = 0;

  for (const file of BIN_A) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    validSurfaces++;

    if (html.includes("p31-safe-mode.js")) safeModeCompliant++;

    // PHOS router active = script tag present and NOT commented out
    const hasRouter = html.includes('src="/public/lib/p31-phos-router.js"') ||
                      html.includes("src='/public/lib/p31-phos-router.js'");
    const commented = /<!--[^>]*p31-phos-router\.js[^>]*-->/.test(html);
    if (hasRouter && !commented) phosRouterActive++;

    // Hardcoded hex: #[0-9a-fA-F]{3,8} outside CSS var() and :root blocks
    const lines = html.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      if (line.includes("--p31-") || line.includes("stroke=\"var") || line.includes("fill=\"var")) continue;
      const hexMatches = line.match(/#[0-9a-fA-F]{6}\b/g) || [];
      // Exclude canonical teal + common values in SVG stroke attributes
      const forbidden = hexMatches.filter(h => !["#5DCAA5","#0f1115","#000000","#000","#fff","#ffffff"].includes(h.toLowerCase()));
      hardcodedHex += forbidden.length;
    }

    if (html.includes("min-height: 44px") || html.includes("min-height:44px")) touchTargetSurfaces++;
  }

  function grade(ratio) {
    if (ratio >= 1.0) return "A";
    if (ratio >= 0.9) return "A-";
    if (ratio >= 0.8) return "B";
    if (ratio >= 0.7) return "B-";
    return "C";
  }

  const n = validSurfaces || 1;
  return {
    schema: DESIGN_HEALTH_SCHEMA,
    generatedAt: new Date().toISOString(),
    surfaces: validSurfaces,
    metrics: {
      safeModeCompliance: {
        surfaces: validSurfaces, compliant: safeModeCompliant,
        grade: grade(safeModeCompliant / n),
      },
      phosRouterCoverage: {
        surfaces: validSurfaces, active: phosRouterActive,
        grade: grade(phosRouterActive / n),
      },
      tokenCompliance: {
        hardcodedHex, grade: hardcodedHex === 0 ? "A" : hardcodedHex < 5 ? "B" : "C",
      },
      touchTargets: {
        surfaces: validSurfaces, compliant: touchTargetSurfaces,
        note: "compliant = surface declares min-height: 44px",
        grade: grade(touchTargetSurfaces / n),
      },
    },
  };
}

/**
 * Write design health metrics to docs/design-health.json.
 * Called from emit-design-health.mjs and optionally after verify runs.
 */
export function writeDesignHealth() {
  const data = computeDesignHealth();
  try {
    fs.mkdirSync(path.dirname(DESIGN_HEALTH_FILE), { recursive: true });
    fs.writeFileSync(DESIGN_HEALTH_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
    return data;
  } catch (e) {
    console.warn("glass-box-emitter: failed to write design-health.json —", e.message);
    return null;
  }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderReport({ id, ts, runReport }) {
  const {
    sessionCount, stepCount, abandonedCount, durationMs,
    scoreStats, byGrade, byNDProfile, criticalFindings,
    worstPage, bestPage, headline, severity,
  } = runReport;

  const secs = Math.round((durationMs || 0) / 1000);
  const gradeBar = buildGradeBar(scoreStats, stepCount);

  return `# P31 Psych E2E — Run ${id.slice(-8)}

- **id:** \`${id}\`
- **ts:** ${ts}
- **kind:** \`psych-e2e\`
- **severity:** ${severity}
- **sessions:** ${sessionCount} · **steps:** ${stepCount} · **duration:** ${secs}s

> ${headline}

## Score Statistics

${formatStats(scoreStats)}

### Distribution (${stepCount} steps)

\`\`\`
${gradeBar}
\`\`\`

## By ND Profile

${formatByND(byNDProfile)}

## Page Rankings

- **Worst:** ${worstPage ? `\`${worstPage.url}\` — mean ${worstPage.mean}/100 (n=${worstPage.n})` : "n/a"}
- **Best:**  ${bestPage  ? `\`${bestPage.url}\` — mean ${bestPage.mean}/100 (n=${bestPage.n})`  : "n/a"}

## Critical Findings (score < 50)

${formatCritical(criticalFindings)}

## Science Lens

Each deduction is derived from a published formula:
- **Fitts (1954):** MT = a + b × log₂(D/W + 1) — motor difficulty
- **Hick (1952):** RT = b × log₂(n + 1) — decision time
- **Sweller (1988):** CLI = IL + EL + GL — cognitive load
- **Miller (1956):** WM = 7 ± 2 chunks (ADHD: 5 ± 1)
- **WCAG 2.2:** contrast 4.5:1, targets 24×24px, motion SC 2.3.3
- **Bayes:** P(frustrated | obs) — frustration trajectory

---
*p31.report/0.1.0 · psych-e2e · ${ts}*
`;
}

function formatStats(s) {
  if (!s) return "_no data_";
  return `| Metric | Value |
|--------|-------|
| Mean   | ${s.mean} [${s.ci95?.[0]}–${s.ci95?.[1]}] |
| Median | ${s.median} |
| SD     | ${s.sd} |
| P5/P95 | ${s.p5} / ${s.p95} |`;
}

function formatCritical(findings) {
  if (!findings || findings.length === 0) return "_No critical findings — all steps ≥ 50._";
  return findings.map((f) =>
    `- \`${f.url}\` **${f.score}/100** — ${f.detail || f.topDeduction || "multiple deductions"}${f.citation ? ` *(${f.citation})*` : ""}`
  ).join("\n");
}

function formatByND(byND) {
  if (!byND || Object.keys(byND).length === 0) return "_no ND breakdown_";
  return Object.entries(byND).map(([label, v]) =>
    `- **${label}** (n=${v.count}): mean=${v.mean}, worst=${v.worst}`
  ).join("\n");
}

function buildGradeBar(stats, total) {
  if (!stats || !total) return "";
  // ASCII histogram using score deciles
  const decile = (p) => `${Math.round(p * 100)}`.padStart(3);
  return [
    `p5=${decile(stats.p5 / 100)} p25=${decile(stats.p25 / 100)} median=${decile(stats.median / 100)} p75=${decile(stats.p75 / 100)} p95=${decile(stats.p95 / 100)}`,
    `mean=${stats.mean} ± ${stats.sd} · CI95 [${stats.ci95?.[0]}–${stats.ci95?.[1]}]`,
  ].join("\n");
}
