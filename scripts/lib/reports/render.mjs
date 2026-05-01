/**
 * Markdown renderer for p31.report/0.1.0 envelopes.
 */
const STATUS_BADGE = {
  ok: "🟢 ok",
  notice: "🟡 notice",
  caution: "🟠 caution",
  urgent: "🔴 urgent",
  critical: "🔴 CRITICAL",
  skip: "· skip",
};

/** @param {any} envelope */
export function renderMarkdown(envelope) {
  const lines = [];
  lines.push(`# P31 ${envelope.kind.toUpperCase()} report — ${envelope.summary?.headline || envelope.id}`);
  lines.push("");
  lines.push(`- **id:** \`${envelope.id}\``);
  lines.push(`- **ts:** ${envelope.ts}`);
  lines.push(`- **kind:** \`${envelope.kind}\``);
  if (envelope.severity) lines.push(`- **severity:** ${envelope.severity}`);
  if (envelope.category) lines.push(`- **category:** ${envelope.category}`);
  if (envelope.summary?.severity) lines.push(`- **roll-up:** ${envelope.summary.severity}`);
  if (envelope.git?.head) lines.push(`- **git:** \`${envelope.git.branch || ""}@${envelope.git.head}\``);
  lines.push("");
  if (envelope.summary?.nextOne) {
    lines.push(`> **Next:** \`${envelope.summary.nextOne}\``);
    lines.push("");
  }
  if (envelope.body) {
    lines.push(envelope.body);
    lines.push("");
  }
  for (const s of envelope.sections || []) {
    lines.push(`## ${s.title}  ·  ${STATUS_BADGE[s.status] || s.status}`);
    if (s.lines?.length) {
      for (const l of s.lines) lines.push(l);
    } else {
      lines.push("_(no content)_");
    }
    lines.push("");
  }
  if (envelope.refs?.length) {
    lines.push("## References");
    for (const r of envelope.refs) lines.push("- " + r);
    lines.push("");
  }
  lines.push("---");
  lines.push(`*p31.report/0.1.0 · file under \`~/.p31/reports/...\` · index \`docs/reports/index.json\`*`);
  return lines.join("\n");
}
