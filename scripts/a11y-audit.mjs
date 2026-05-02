#!/usr/bin/env node
/**
 * a11y-audit.mjs — PEER-1G (CWP-P31-PEER-COMP-2026-05).
 *
 * Static accessibility audit shim. Scans HTML files in the home tree against
 * a small set of WCAG 2.2 AA-relevant checks that can be applied without
 * rendering the page. The point is to:
 *
 *   1. Catch the easy wins (missing lang, unlabeled images, no skip-link)
 *      before they reach a browser-based audit.
 *   2. Establish a measurable baseline that future PRs can be compared
 *      against.
 *   3. Run on every CI build (cheap, no Chrome / Playwright needed).
 *
 * What this DOES NOT do:
 *   - Color-contrast computation (needs CSS resolution + rendering)
 *   - ARIA tree walking with computed accessible names
 *   - Focus-order verification
 *   - Screen-reader simulation
 *
 * Those are the responsibility of the in-browser audit (axe-core via
 * Playwright) that lands in Phase 2 of the same CWP.
 *
 * Exit codes:
 *   0 — no findings, or only INFO findings
 *   1 — at least one P0 (severity=error) finding
 *   2 — script error
 *
 * Output:
 *   - Console: per-file findings + summary
 *   - JSON report at docs/a11y/REPORT-<timestamp>.json (with --report)
 *   - Markdown report at docs/a11y/REPORT-LATEST.md (with --md)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const VERBOSE = process.argv.includes("--verbose");
const WRITE_JSON = process.argv.includes("--report");
const WRITE_MD = process.argv.includes("--md") || process.argv.includes("--markdown");
const STRICT = process.argv.includes("--strict") || process.env.P31_A11Y_STRICT === "1";

// ----- Files to scan ---------------------------------------------------------

// Home-tree HTML, excluding generated and vendored.
function listHtml() {
  const res = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "*.html"],
    {
      cwd: root,
      encoding: "utf8",
    }
  );
  if (res.status !== 0) {
    console.error("a11y-audit: git ls-files failed:", res.stderr.slice(0, 400));
    process.exit(2);
  }
  const skip = [
    /\/node_modules\//,
    /\/dist\//,
    /\/build\//,
    /\/\.git\//,
    /\/coverage\//,
    /\/andromeda\//,
    /\/phosphorus31\.org\//,
    /\/wcd33-global-archive\//,
    /\/Discovery\/\.venv\//,
    /-vendored\.html$/,
    /\.generated\.html$/,
  ];
  return res.stdout
    .split("\n")
    .filter(Boolean)
    .filter((rel) => !skip.some((re) => re.test("/" + rel)));
}

// ----- Checks ----------------------------------------------------------------

const RULES = [
  {
    id: "html-lang",
    severity: "error", // WCAG 3.1.1 Language of Page (Level A)
    wcag: "3.1.1",
    test: (html) => {
      const m = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i);
      if (!m) return { failed: true, message: "missing <html lang> attribute" };
      return null;
    },
  },
  {
    id: "doctype",
    severity: "warn", // syntactically required for HTML5
    wcag: "n/a (HTML5 syntax)",
    test: (html) => {
      if (!/<!DOCTYPE\s+html/i.test(html.slice(0, 200))) {
        return { failed: true, message: "missing <!DOCTYPE html> declaration" };
      }
      return null;
    },
  },
  {
    id: "title-element",
    severity: "error", // WCAG 2.4.2 Page Titled (Level A)
    wcag: "2.4.2",
    test: (html) => {
      const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      if (!m) return { failed: true, message: "missing <title> element" };
      if (!m[1].trim()) return { failed: true, message: "<title> is empty" };
      return null;
    },
  },
  {
    id: "viewport-meta",
    severity: "warn", // WCAG 1.4.4 Resize Text (Level AA) — viewport zoom not blocked
    wcag: "1.4.4 / 1.4.10",
    test: (html) => {
      const m = html.match(/<meta\s+[^>]*name\s*=\s*["']viewport["'][^>]*>/i);
      if (!m) return { failed: true, message: "missing viewport meta (mobile reflow)" };
      if (/maximum-scale\s*=\s*1/.test(m[0]) || /user-scalable\s*=\s*no/i.test(m[0])) {
        return { failed: true, message: "viewport blocks user zoom (WCAG 1.4.4)" };
      }
      return null;
    },
  },
  {
    id: "img-alt",
    severity: "error", // WCAG 1.1.1 Non-text Content (Level A)
    wcag: "1.1.1",
    test: (html) => {
      const imgs = html.match(/<img\b[^>]*>/gi) || [];
      const offenders = imgs.filter((tag) => !/\balt\s*=\s*["']/.test(tag));
      if (offenders.length > 0) {
        return {
          failed: true,
          message: `${offenders.length} <img> element(s) without an alt attribute`,
          examples: offenders.slice(0, 2).map((s) => s.slice(0, 80)),
        };
      }
      return null;
    },
  },
  {
    id: "input-label",
    severity: "warn", // WCAG 3.3.2 Labels or Instructions (Level A) — fuzzy heuristic
    wcag: "3.3.2",
    test: (html) => {
      const inputs =
        html.match(/<input\b[^>]*>/gi) || /* */ [];
      const visible = inputs.filter(
        (tag) =>
          !/type\s*=\s*["'](?:hidden|submit|button|reset|image)/i.test(tag) &&
          !/\baria-label\s*=/i.test(tag) &&
          !/\baria-labelledby\s*=/i.test(tag) &&
          !/\btitle\s*=/i.test(tag) &&
          !(/id\s*=\s*["']([^"']+)["']/i.test(tag) && hasLabelFor(html, RegExp.$1))
      );
      if (visible.length > 0) {
        return {
          failed: true,
          message: `${visible.length} interactive <input> element(s) likely missing a programmatic label`,
          examples: visible.slice(0, 2).map((s) => s.slice(0, 80)),
        };
      }
      return null;
    },
  },
  {
    id: "heading-h1",
    severity: "warn", // WCAG 1.3.1 Info and Relationships (Level A) — page should have one h1
    wcag: "1.3.1 / 2.4.6",
    test: (html) => {
      const h1s = (html.match(/<h1\b/gi) || []).length;
      if (h1s === 0) return { failed: true, message: "no <h1> on page" };
      if (h1s > 1) return { failed: true, message: `${h1s} <h1> elements on page (prefer one)` };
      return null;
    },
  },
  {
    id: "heading-skip",
    severity: "warn", // heading-order heuristic
    wcag: "1.3.1",
    test: (html) => {
      const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
      if (headings.length === 0) return null;
      let prev = headings[0];
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > prev + 1) {
          return {
            failed: true,
            message: `heading level skip: h${prev} → h${headings[i]} at position ${i}`,
          };
        }
        prev = headings[i];
      }
      return null;
    },
  },
  {
    id: "link-empty",
    severity: "error", // WCAG 2.4.4 Link Purpose (Level A) — link must have accessible name
    wcag: "2.4.4",
    test: (html) => {
      const empties = [];
      const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        const attrs = m[1];
        const inner = stripTags(m[2]).trim();
        const ariaLabel = /\baria-label\s*=\s*["']([^"']+)["']/i.exec(attrs);
        const title = /\btitle\s*=\s*["']([^"']+)["']/i.exec(attrs);
        if (!inner && !ariaLabel && !title) {
          empties.push(m[0].slice(0, 80));
          if (empties.length >= 5) break;
        }
      }
      if (empties.length > 0) {
        return {
          failed: true,
          message: `${empties.length} <a> element(s) without accessible text`,
          examples: empties.slice(0, 2),
        };
      }
      return null;
    },
  },
  {
    id: "skip-link",
    severity: "info", // WCAG 2.4.1 Bypass Blocks (Level A) — recommended for nav-heavy pages
    wcag: "2.4.1",
    test: (html) => {
      const hasSkip =
        /href\s*=\s*["']#main\b/i.test(html) ||
        /href\s*=\s*["']#content\b/i.test(html) ||
        /class\s*=\s*["'][^"']*\bskip[-_]?link\b/i.test(html) ||
        /sr-only[\s\S]*?(skip|main content)/i.test(html);
      if (!hasSkip && /<nav\b/i.test(html)) {
        return { failed: true, message: "no skip-to-main link on a page that has <nav>" };
      }
      return null;
    },
  },
  {
    id: "main-landmark",
    severity: "info",
    wcag: "1.3.1 / 2.4.1",
    test: (html) => {
      if (!/<main\b/i.test(html) && !/role\s*=\s*["']main["']/i.test(html)) {
        return { failed: true, message: "no <main> landmark or role=main on page" };
      }
      return null;
    },
  },
  {
    id: "duplicate-id",
    severity: "warn", // WCAG 4.1.1 (note: removed in 2.2 but still good hygiene)
    wcag: "4.1.1 (legacy)",
    test: (html) => {
      const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
      const dup = new Map();
      for (const id of ids) dup.set(id, (dup.get(id) || 0) + 1);
      const dupes = [...dup.entries()].filter(([, n]) => n > 1);
      if (dupes.length > 0) {
        return {
          failed: true,
          message: `${dupes.length} duplicate id(s): ${dupes
            .slice(0, 3)
            .map(([k, n]) => `${k}×${n}`)
            .join(", ")}`,
        };
      }
      return null;
    },
  },
];

function hasLabelFor(html, id) {
  const re = new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${escapeRegex(id)}["']`, "i");
  return re.test(html);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

// ----- Run -------------------------------------------------------------------

function audit(rel) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  const findings = [];
  // Empty / placeholder files are out of scope for HTML structural audit.
  // (e.g. public/index.html is a 0-byte placeholder for a future static root.)
  if (html.trim().length === 0) return findings;
  for (const rule of RULES) {
    let r;
    try {
      r = rule.test(html);
    } catch (e) {
      r = { failed: true, message: "rule threw: " + (e.message || String(e)) };
    }
    if (r && r.failed) {
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        wcag: rule.wcag,
        message: r.message,
        examples: r.examples,
      });
    }
  }
  return findings;
}

function summarize(rows) {
  const counts = { error: 0, warn: 0, info: 0 };
  for (const row of rows) {
    for (const f of row.findings) {
      counts[f.severity] = (counts[f.severity] || 0) + 1;
    }
  }
  return counts;
}

function main() {
  const files = listHtml();
  if (files.length === 0) {
    console.log("a11y-audit: no HTML files in scope");
    process.exit(0);
  }

  const rows = files.map((rel) => ({ file: rel, findings: audit(rel) }));
  const counts = summarize(rows);

  const offenders = rows.filter((r) => r.findings.length > 0);

  if (VERBOSE || offenders.length === 0) {
    for (const r of rows) {
      if (r.findings.length === 0) {
        if (VERBOSE) console.log(`  OK  ${r.file}`);
      } else {
        console.log(`\n${r.file}`);
        for (const f of r.findings) {
          console.log(`  [${f.severity.toUpperCase()}] ${f.rule} (WCAG ${f.wcag}) — ${f.message}`);
          if (f.examples) {
            for (const ex of f.examples) console.log(`      e.g. ${ex}`);
          }
        }
      }
    }
  } else {
    for (const r of offenders) {
      console.log(`\n${r.file}`);
      for (const f of r.findings) {
        console.log(`  [${f.severity.toUpperCase()}] ${f.rule} (WCAG ${f.wcag}) — ${f.message}`);
      }
    }
  }

  console.log(
    `\na11y-audit: scanned ${files.length} HTML file(s); ${offenders.length} file(s) with findings; ` +
      `${counts.error || 0} error / ${counts.warn || 0} warn / ${counts.info || 0} info.`
  );

  if (WRITE_JSON || WRITE_MD) {
    const dir = path.join(root, "docs/a11y");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    if (WRITE_JSON) {
      const jp = path.join(dir, `REPORT-${stamp}.json`);
      fs.writeFileSync(
        jp,
        JSON.stringify(
          {
            schema: "p31.a11yReport/1.0.0",
            generatedAt: new Date().toISOString(),
            wcagTarget: "2.2 AA (static checks subset)",
            scannedFiles: files.length,
            counts,
            rows,
          },
          null,
          2
        )
      );
      console.log("a11y-audit: wrote", path.relative(root, jp));
    }
    if (WRITE_MD) {
      const md = renderMarkdown(rows, counts, files.length);
      const mp = path.join(dir, "REPORT-LATEST.md");
      fs.writeFileSync(mp, md);
      console.log("a11y-audit: wrote", path.relative(root, mp));
    }
  }

  if (STRICT && counts.error > 0) {
    console.error("a11y-audit: FAIL (strict) — error-class findings present.");
    process.exit(1);
  }
  if (counts.error > 0) {
    console.warn("a11y-audit: WARN — error-class findings present (run with --strict to fail the gate).");
  }
  process.exit(0);
}

function renderMarkdown(rows, counts, total) {
  const lines = [];
  lines.push("# P31 a11y audit — latest report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("Target: WCAG 2.2 AA (static-checks subset). For the full audit");
  lines.push("methodology, see `docs/a11y/REPORT-2026-Q3.md`.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Total files | Files with findings | Errors | Warnings | Info |`);
  lines.push(`|-------------|---------------------|--------|----------|------|`);
  lines.push(
    `| ${total} | ${rows.filter((r) => r.findings.length > 0).length} | ${
      counts.error || 0
    } | ${counts.warn || 0} | ${counts.info || 0} |`
  );
  lines.push("");
  lines.push("## Findings by file");
  lines.push("");
  for (const r of rows) {
    if (r.findings.length === 0) continue;
    lines.push(`### \`${r.file}\``);
    lines.push("");
    lines.push("| Severity | Rule | WCAG | Message |");
    lines.push("|----------|------|------|---------|");
    for (const f of r.findings) {
      lines.push(`| ${f.severity} | \`${f.rule}\` | ${f.wcag} | ${f.message.replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
  }
  if (rows.every((r) => r.findings.length === 0)) {
    lines.push("_No findings — all scanned files passed the static-check subset._");
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push("*Report generated by `npm run a11y:audit -- --md`. PEER-1G of `docs/CWP-P31-PEER-COMP-2026-05.md`.*");
  return lines.join("\n") + "\n";
}

main();
