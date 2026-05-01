/**
 * Build human-friendly narrative + "next one thing" from a launch readiness report.
 * Operator-direct voice; no naval metaphors; works in spoon-deficit mode.
 */

/**
 * @param {any} report
 */
export function buildNarrative(report) {
  const s = report.summary;
  const greenLanes = report.lanes.filter((L) => L.status === "pass").length;
  const total = report.lanes.length;
  const percent = Math.round(s.score);

  const head = s.ready
    ? `Ready: ${percent}% — ${greenLanes}/${total} lanes green.`
    : `Hold: ${percent}% — ${greenLanes}/${total} lanes green.`;

  const blockers = s.blockers || [];
  const warnings = s.warnings || [];
  const lines = [head];
  if (blockers.length) {
    lines.push(`Blockers (${blockers.length}): ${blockers.slice(0, 3).join(" · ")}${blockers.length > 3 ? " · …" : ""}`);
  }
  if (warnings.length && !blockers.length) {
    lines.push(`Warnings (${warnings.length}): ${warnings.slice(0, 3).join(" · ")}${warnings.length > 3 ? " · …" : ""}`);
  }
  if (s.humanGatesPending > 0) {
    lines.push(`Human gates pending: ${s.humanGatesPending}.`);
  }
  return lines.join("\n");
}

/**
 * Pick the single most useful next action. Priority order:
 *   1. In gate mode: pending critical checklist gate
 *   2. Any failed cmd/file/key/no-glob check (actionable)
 *   3. Any failed glass probe (live infra issue)
 *   4. Any non-critical pending checklist gate
 *   5. Any warning
 *
 * @param {any} report
 * @returns {string}
 */
export function nextOne(report) {
  const s = report.summary;
  if (s.ready) return "Ready. Run npm run launch:gate before deploy; npm run launch:rehearsal for strict mesh + glass.";

  const checklistEvidence = report.lanes
    .flatMap((L) => L.checks)
    .find((c) => c.id === "checklist")?.evidence;

  if (report.mode === "gate" && checklistEvidence?.pendingCritical?.length) {
    return `npm run launch:check ${checklistEvidence.pendingCritical[0]} met --note '<why>'`;
  }

  const actionable = ["cmd", "file-exists", "json-key", "no-glob"];
  for (const L of report.lanes) {
    for (const c of L.checks) {
      if (c.status === "fail" && actionable.includes(c.kind)) {
        if (c.kind === "cmd" && c.reason?.startsWith("exit ")) {
          return c.reason.replace(/^exit \d+ from /, "");
        }
        if (c.kind === "file-exists") {
          return `Create ${c.reason.replace(/^missing: /, "")} (see ${L.title}).`;
        }
        if (c.kind === "no-glob") return c.reason;
        if (c.kind === "json-key") {
          return `Set ${c.reason.replace(/^key empty: /, "")} via npm run apply:constants.`;
        }
      }
    }
  }

  for (const L of report.lanes) {
    for (const c of L.checks) {
      if (c.status === "fail" && c.kind === "glass-probe") {
        return `Live probe down — ${c.reason}. Run npm run ecosystem:glass and check that Worker.`;
      }
    }
  }

  if (checklistEvidence?.pendingCritical?.length) {
    return `npm run launch:check ${checklistEvidence.pendingCritical[0]} met --note '<why>'`;
  }
  if (checklistEvidence) {
    const allPending = (checklistEvidence.pendingCritical || []).concat(checklistEvidence.blocked || []);
    if (!allPending.length && checklistEvidence.met < checklistEvidence.total) {
      return `Run npm run launch:check to flip remaining ${checklistEvidence.total - checklistEvidence.met} non-critical gates.`;
    }
  }

  for (const L of report.lanes) {
    for (const c of L.checks) {
      if (c.status === "warn") return `Address warning in ${L.id}: ${c.reason}.`;
    }
  }
  return "Run npm run launch:rehearsal to verify under strict mesh + glass.";
}
