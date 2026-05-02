#!/usr/bin/env node
/**
 * verify-no-telemetry.mjs
 *
 * P31 telemetry posture gate. Companion to `docs/TELEMETRY.md`.
 * Phase: PEER-2D of `docs/CWP-P31-PEER-COMP-2026-05.md`.
 *
 * What this gate does:
 *   - Enumerates git-tracked source files in each P31 git repo root present on disk
 *     (home, andromeda, phosphorus31.org). Cognitive-passport lives inside the home
 *     repo so it is covered by the home enumeration.
 *   - Greps for known telemetry vendor strings (analytics URLs, SDK names, tag IDs).
 *   - Hard-fails the build if any match is found that is not on the EXCEPTIONS list.
 *
 * Why git-tracked-only: the operator's home directory contains IDE extensions, browser
 * profiles, and cached vendor bundles that are not part of P31. Scanning by filesystem
 * walk produced thousands of false positives. `git ls-files` gives us exactly the files
 * P31 ships.
 *
 * To add a legitimate exception:
 *   1. Author or extend a CWP describing why.
 *   2. Add a row to EXCEPTIONS below with file path suffix, reason, and CWP id.
 *   3. Re-run; the gate passes.
 *
 * Adding telemetry without updating EXCEPTIONS is a CI-blocking change by design.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HOME_ROOT = fileURLToPath(new URL("..", import.meta.url));

// Roots to scan. Each must be its own git repository root or it is skipped silently.
const REPO_ROOTS = [
  { path: HOME_ROOT, label: "home" },
  { path: join(HOME_ROOT, "andromeda"), label: "andromeda" },
  { path: join(HOME_ROOT, "phosphorus31.org"), label: "phosphorus31" },
];

// File extensions that can carry client-side or page-served telemetry.
const SCAN_EXTS = new Set([
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".astro",
  ".svelte",
  ".vue",
  ".css",
]);

// Known telemetry vendor patterns. Each entry: {pattern, vendor, type}.
// `pattern` is a literal substring match (case-insensitive).
const DENYLIST = [
  // Google
  { pattern: "googletagmanager.com", vendor: "Google Tag Manager", type: "analytics" },
  { pattern: "google-analytics.com", vendor: "Google Analytics", type: "analytics" },
  { pattern: "gtag.js", vendor: "Google Analytics (gtag)", type: "analytics" },
  { pattern: "gtag('config'", vendor: "Google Analytics (gtag config)", type: "analytics" },
  { pattern: "googletag.cmd", vendor: "Google Ads tag (cmd)", type: "advertising" },
  { pattern: "googletag.pubads", vendor: "Google Ads tag (pubads)", type: "advertising" },
  // Meta
  { pattern: "connect.facebook.net", vendor: "Facebook Pixel", type: "advertising" },
  { pattern: "fbq('init'", vendor: "Facebook Pixel call", type: "advertising" },
  { pattern: "fbq('track'", vendor: "Facebook Pixel track", type: "advertising" },
  // Other ad pixels
  { pattern: "analytics.tiktok.com", vendor: "TikTok Pixel", type: "advertising" },
  { pattern: "ct.pinterest.com", vendor: "Pinterest Tag", type: "advertising" },
  { pattern: "snap.licdn.com", vendor: "LinkedIn Insight", type: "advertising" },
  { pattern: "static.ads-twitter.com", vendor: "Twitter pixel", type: "advertising" },
  // Privacy-friendly analytics (still tracking, still off by P31 default)
  { pattern: "plausible.io/js", vendor: "Plausible Analytics", type: "analytics" },
  { pattern: "cdn.usefathom.com", vendor: "Fathom Analytics", type: "analytics" },
  { pattern: "api.simpleanalytics.io", vendor: "Simple Analytics", type: "analytics" },
  { pattern: "umami.is/script", vendor: "Umami", type: "analytics" },
  { pattern: "goatcounter.com/count", vendor: "GoatCounter", type: "analytics" },
  // Product analytics
  { pattern: "api.mixpanel.com", vendor: "Mixpanel", type: "product-analytics" },
  { pattern: "api.amplitude.com", vendor: "Amplitude", type: "product-analytics" },
  { pattern: "app.posthog.com", vendor: "PostHog", type: "product-analytics" },
  { pattern: "cdn.segment.com/analytics.js", vendor: "Segment", type: "product-analytics" },
  { pattern: "cdn.heapanalytics.com", vendor: "Heap CDN", type: "product-analytics" },
  // Session replay / heatmaps
  { pattern: "static.hotjar.com", vendor: "Hotjar", type: "session-replay" },
  { pattern: "fullstory.com/s/fs.js", vendor: "FullStory", type: "session-replay" },
  { pattern: "cdn.lr-ingest.com", vendor: "LogRocket", type: "session-replay" },
  { pattern: "rec.smartlook.com", vendor: "Smartlook", type: "session-replay" },
  { pattern: "clarity.ms/tag", vendor: "Microsoft Clarity", type: "session-replay" },
  // Error reporting
  { pattern: "browser.sentry-cdn.com", vendor: "Sentry browser SDK", type: "error-reporting" },
  { pattern: "@sentry/browser", vendor: "Sentry browser package", type: "error-reporting" },
  { pattern: "notify.bugsnag.com", vendor: "Bugsnag", type: "error-reporting" },
  { pattern: "cdn.rollbar.com", vendor: "Rollbar", type: "error-reporting" },
  // RUM
  { pattern: "browser-intake-datadoghq.com", vendor: "Datadog RUM", type: "rum" },
  { pattern: "@datadog/browser-rum", vendor: "Datadog RUM SDK", type: "rum" },
  { pattern: "js-agent.newrelic.com", vendor: "New Relic browser agent", type: "rum" },
  // A/B testing
  { pattern: "cdn.optimizely.com", vendor: "Optimizely", type: "ab-testing" },
  { pattern: "dev.visualwebsiteoptimizer.com", vendor: "VWO", type: "ab-testing" },
  // Cloudflare Web Analytics (we do not run the script)
  { pattern: "static.cloudflareinsights.com", vendor: "Cloudflare Web Analytics", type: "analytics" },
];

// Documented exceptions. Each entry: {suffix, reason, cwp}.
// A file is exempted from the gate when its repo-relative path ENDS WITH `suffix`.
// Exceptions exist so we can:
//   - Document the deny list without tripping on the documentation
//   - Hold the policy explicitly in TELEMETRY.md and the transparency report
//   - Reference vendor names in audit RFP and CWPs
const EXCEPTIONS = [
  { suffix: "docs/TELEMETRY.md", reason: "Documents the policy and the deny list", cwp: "CWP-P31-PEER-COMP-2026-05" },
  { suffix: "docs/transparency/REPORT-2026-Q4.md", reason: "Transparency report explicitly enumerates what we do NOT use", cwp: "CWP-P31-PEER-COMP-2026-05" },
  { suffix: "docs/CWP-P31-PEER-COMP-2026-05.md", reason: "Parent CWP discusses peer telemetry posture", cwp: "CWP-P31-PEER-COMP-2026-05" },
  { suffix: "docs/funding/NLnet-AUDIT-ASK-DRAFT.md", reason: "Funding ask discusses peer telemetry stance", cwp: "CWP-P31-PEER-COMP-2026-05" },
  { suffix: "docs/funding/OTF-AUDIT-ASK-DRAFT.md", reason: "Funding ask discusses peer telemetry stance", cwp: "CWP-P31-PEER-COMP-2026-05" },
  { suffix: "scripts/verify-no-telemetry.mjs", reason: "This script defines the deny list", cwp: "CWP-P31-PEER-COMP-2026-05" },
];

const findings = [];

function isExcepted(relPath) {
  return EXCEPTIONS.some((e) => relPath.endsWith(e.suffix));
}

function shouldScan(name) {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return SCAN_EXTS.has(name.slice(dot).toLowerCase());
}

function gitTrackedFiles(repoRoot) {
  if (!existsSync(join(repoRoot, ".git"))) return null;
  try {
    const out = execFileSync("git", ["-C", repoRoot, "ls-files"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return out.split("\n").filter(Boolean);
  } catch {
    return null;
  }
}

console.log("verify:no-telemetry — scanning git-tracked source files for telemetry vendor signals");
let scannedRoots = 0;
let scannedFiles = 0;

for (const { path: repoRoot, label } of REPO_ROOTS) {
  if (!existsSync(repoRoot)) {
    console.log(`  (skip ${label} — path not present)`);
    continue;
  }
  const tracked = gitTrackedFiles(repoRoot);
  if (!tracked) {
    console.log(`  (skip ${label} — not a git repo)`);
    continue;
  }
  scannedRoots++;
  let rootScanned = 0;
  for (const rel of tracked) {
    if (!shouldScan(rel)) continue;
    const full = join(repoRoot, rel);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    const repoRelToHome = relative(HOME_ROOT, full);
    if (isExcepted(repoRelToHome) || isExcepted(rel)) continue;
    let content;
    try {
      content = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    const lower = content.toLowerCase();
    for (const rule of DENYLIST) {
      if (lower.includes(rule.pattern.toLowerCase())) {
        findings.push({ root: label, file: repoRelToHome, vendor: rule.vendor, type: rule.type, pattern: rule.pattern });
      }
    }
    rootScanned++;
  }
  scannedFiles += rootScanned;
  console.log(`  scanned ${label}: ${rootScanned} tracked source file(s)`);
}

if (findings.length === 0) {
  console.log(`\n\u2713 verify:no-telemetry PASS — ${scannedRoots} repo root(s), ${scannedFiles} source file(s) scanned, 0 vendor signals found.`);
  console.log(`  Policy: docs/TELEMETRY.md`);
  console.log(`  Exceptions documented: ${EXCEPTIONS.length}`);
  process.exit(0);
}

console.error(`\n\u2717 verify:no-telemetry FAIL — ${findings.length} vendor signal(s) found:`);
for (const f of findings) {
  console.error(`  [${f.root}] ${f.file}`);
  console.error(`    vendor:  ${f.vendor} (${f.type})`);
  console.error(`    pattern: ${f.pattern}`);
}
console.error("");
console.error("Resolution paths:");
console.error("  1. Remove the telemetry call (default; matches docs/TELEMETRY.md policy).");
console.error("  2. If genuinely needed, author a CWP describing why, then add the file path");
console.error("     to EXCEPTIONS in scripts/verify-no-telemetry.mjs with the CWP id and reason.");
console.error("");
process.exit(1);
