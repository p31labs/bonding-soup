#!/usr/bin/env node
/**
 * probe-public-sanitization — read-only market-readiness scanner.
 *
 * Scans the public-facing surface of the repo (HTML, Astro, public-tier
 * Markdown) for the kinds of strings a *public* release should not ship:
 *
 *   - PUBLIC-VOICE avoid-list terms (delve, empower, synergy, …)
 *   - Common AI-generated copy clichés (tapestry, paradigm shift, …)
 *   - Leaked private strings (operator full names, common-format secrets)
 *   - Stale review markers (TODO:, FIXME:, XXX:, HACK:, lorem ipsum, TKTK)
 *   - Rough-edge URL patterns (localhost in HTML chrome outside doc paths)
 *
 * Each finding is tagged Tier A / B / C based on file path:
 *   Tier A = face copy on Tier-A surfaces (cognitive-passport, soup,
 *            p31-personal-howto, p31-device-setup, fleet-portal, poets-room,
 *            p31ca hub product pages, p31ca/src/pages/*)
 *   Tier B = internal-but-shareable docs (docs/*.md, design docs)
 *   Tier C = scripts, code comments, build artifacts
 *
 * Output:
 *   default          -> markdown summary on stdout
 *   --json           -> JSON document on stdout
 *   --strict         -> exit non-zero on any Tier-A finding
 *   --write <path>   -> also write the JSON to the given path
 *
 * The probe never modifies files. Tier-A copy is the operator's domain —
 * the probe surfaces findings; humans decide.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// ---------------------------------------------------------------- args ---
const args = new Set(process.argv.slice(2));
const wantJson = args.has("--json");
const strict = args.has("--strict");
const writePathIdx = process.argv.indexOf("--write");
const writePath = writePathIdx >= 0 ? process.argv[writePathIdx + 1] : null;

// --------------------------------------------------------------- scope ---
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".astro", ".next",
  ".venv", "agent-transcripts", ".cursor", "_archive", ".vscode",
  "fonts", "vendor", "vendor-locked", "vendor-three", ".wrangler",
  "coverage", ".cache", ".turbo",
]);

const SCOPES = [
  // Tier A — outward-facing operator-authored surfaces
  { dir: root, label: "home-html", maxDepth: 2, exts: [".html"], tier: "A" },
  { dir: path.join(root, "cognitive-passport"), label: "cognitive-passport", maxDepth: 2, exts: [".html"], tier: "A" },
  { dir: path.join(root, "andromeda/04_SOFTWARE/p31ca/public"), label: "p31ca/public", maxDepth: 4, exts: [".html"], tier: "A" },
  { dir: path.join(root, "andromeda/04_SOFTWARE/p31ca/src/pages"), label: "p31ca/src/pages", maxDepth: 4, exts: [".astro"], tier: "A" },
  { dir: path.join(root, "phosphorus31.org"), label: "phosphorus31.org", maxDepth: 4, exts: [".html"], tier: "A" },
  // Tier B — share-with-grant / share-with-clinician documentation
  { dir: path.join(root, "docs"), label: "docs", maxDepth: 4, exts: [".md", ".html"], tier: "B" },
  // Tier C — auto-generated, tooling chrome
  { dir: path.join(root, "scripts"), label: "scripts", maxDepth: 3, exts: [".mjs", ".js"], tier: "C" },
];

// Files exempted from voice scanning because they ARE the avoid-list
// canon, the public-voice canon, the README of avoid-list, etc.
const EXEMPT_PATHS = new Set([
  "docs/PUBLIC-VOICE.md",
  "docs/p31-public-voice-guardrails.json",
  "docs/p31-delta-language.json",
  "docs/P31-DELTA-LANGUAGE.md",
  "docs/p31-delta-glossary.html",
  "docs/P31-UNIVERSAL-UI-VISION.md",
  "docs/PARKING-LOT.md",
  "docs/README-REVIEW-DOCS.md",
  "docs/PLAN-QUANTUM-CARD-SUITE.md",
  "docs/MARKET-READINESS-SWEEP.md",
  "docs/GEODESIC-CAMPAIGN.md",      // game-mechanic vocabulary uses "unlock"
  "docs/LAUNCH-ANNOUNCEMENT-COPY.md", // intentional public copy — operator name is the byline
  "docs/CWP-K4-AGENT-HUB.md",        // API spec — "child-mesh-unlock" is a token identifier
  "docs/CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE.md", // same
  "docs/P31-K4-AGENT-HUBS.md",       // same
  "AGENTS.md",
  "P31 COGNITIVE PASSPORT — v5.md",
  "scripts/probe-public-sanitization.mjs",  // self
  "scripts/verify-public-voice.mjs",
  "scripts/verify-delta-language.mjs",
]);

// ---------------------------------------------------------- categories ---
/** @typedef {{ id:string, regex:RegExp, label:string, suggestion:string }} Pattern */

/** Public-voice avoid-list (mirrors p31-public-voice-guardrails.json). */
const VOICE_PATTERNS = /** @type {Pattern[]} */ ([
  { id: "delve", regex: /\bdelve\b/i, label: "PUBLIC-VOICE avoid-list", suggestion: "explore / read / look at" },
  { id: "empower", regex: /\bempower\b/i, label: "PUBLIC-VOICE avoid-list", suggestion: "give … control / equip / let" },
  { id: "synergy", regex: /\bsynergy\b/i, label: "PUBLIC-VOICE avoid-list", suggestion: "fit / pairing / works-with" },
  { id: "revolutionary", regex: /\brevolutionary\b/i, label: "PUBLIC-VOICE avoid-list", suggestion: "new / different / clearer" },
  { id: "cutting-edge", regex: /cutting[\s-]+edge/i, label: "PUBLIC-VOICE avoid-list", suggestion: "current / new / under active dev" },
  { id: "unlock", regex: /\bunlock(s|ed|ing)?\b/i, label: "Prefer plain verbs (allowed in game-mechanic vocab)", suggestion: "open / give access to / activates" },
]);

/** AI-cliché extension (warn-only, Tier B+). */
const CLICHE_PATTERNS = /** @type {Pattern[]} */ ([
  { id: "tapestry", regex: /\btapestry\s+of\b/i, label: "AI-prose cliché", suggestion: "weave / set / collection" },
  { id: "paradigm-shift", regex: /paradigm[\s-]+shift/i, label: "AI-prose cliché", suggestion: "change / pivot / new approach" },
  { id: "game-changer", regex: /game[\s-]+chang(er|ing)/i, label: "AI-prose cliché", suggestion: "specific outcome statement" },
  { id: "seamless", regex: /\bseamless(ly)?\b/i, label: "AI-prose cliché", suggestion: "smooth / direct / no extra step" },
  { id: "best-in-class", regex: /best[\s-]+in[\s-]+class/i, label: "AI-prose cliché", suggestion: "drop or measure" },
  { id: "leverage", regex: /\bleverag(e|ing|es|ed)\b/i, label: "AI-prose cliché", suggestion: "use" },
  { id: "unleash", regex: /\bunleash(ed|ing|es)?\b/i, label: "AI-prose cliché", suggestion: "let / give / hand off" },
  { id: "harness", regex: /\bharness(es|ed|ing)?\s+(the|its|your|the\s+power|the\s+full)/i, label: "AI-prose cliché (narrowed)", suggestion: "use / draw on" },
  { id: "world-class", regex: /world[\s-]+class/i, label: "AI-prose cliché", suggestion: "drop or specify" },
  { id: "state-of-the-art", regex: /state[\s-]+of[\s-]+the[\s-]+art/i, label: "AI-prose cliché", suggestion: "current / specific tech mention" },
  { id: "navigate-complexities", regex: /navigate\s+(the\s+)?complex(ities|ity)/i, label: "AI-prose cliché", suggestion: "specific verb + object" },
  { id: "vibrant-ecosystem", regex: /vibrant\s+ecosystem/i, label: "AI-prose cliché", suggestion: "specific list" },
  { id: "robust-comprehensive", regex: /\brobust(\s+and\s+|\s+,\s+|\s+&\s+)comprehensive\b/i, label: "AI-prose cliché", suggestion: "specific verbs" },
  { id: "in-conclusion", regex: /^\s*in\s+conclusion\b/im, label: "AI-prose cliché opener", suggestion: "drop, or restate the thesis" },
  { id: "important-to-note", regex: /\b(it'?s|its)\s+important\s+to\s+note\b/i, label: "AI-prose hedge", suggestion: "drop or state plainly" },
  { id: "delve-into", regex: /\bdelve\s+into\b/i, label: "AI-prose cliché", suggestion: "look at / read / explore" },
]);

/** Stale review markers. */
const TODO_PATTERNS = /** @type {Pattern[]} */ ([
  { id: "todo-marker", regex: /\b(TODO|FIXME|XXX|HACK):/m, label: "stale review marker", suggestion: "resolve or move to issue tracker" },
  { id: "tktk", regex: /\bTKTK\b/, label: "writer's gap marker", suggestion: "fill in or remove" },
  { id: "lorem-ipsum", regex: /lorem\s+ipsum/i, label: "placeholder copy", suggestion: "replace with real copy" },
  { id: "placeholder-text", regex: /\b(?:placeholder|sample)\s+(?:text|copy|content)\b/i, label: "placeholder marker", suggestion: "replace with real copy" },
]);

/** Leaked private strings — never ship in a public bundle. */
const PRIVATE_PATTERNS = /** @type {Pattern[]} */ ([
  // Common credential prefixes (kept narrow to avoid matching legit identifiers).
  { id: "openai-key", regex: /\bsk-[A-Za-z0-9]{20,}\b/, label: "OpenAI key shape", suggestion: "rotate immediately and remove" },
  { id: "anthropic-key", regex: /\bsk-ant-[A-Za-z0-9_\-]{40,}\b/, label: "Anthropic key shape", suggestion: "rotate immediately and remove" },
  { id: "google-key", regex: /\bAIza[0-9A-Za-z_\-]{35}\b/, label: "Google API key shape", suggestion: "rotate immediately and remove" },
  { id: "github-pat", regex: /\bghp_[A-Za-z0-9]{36}\b/, label: "GitHub PAT shape", suggestion: "rotate immediately and remove" },
  { id: "slack-bot", regex: /\bxoxb-[0-9A-Za-z\-]{20,}\b/, label: "Slack bot token shape", suggestion: "rotate immediately and remove" },
  { id: "aws-key", regex: /\bAKIA[0-9A-Z]{16}\b/, label: "AWS access key shape", suggestion: "rotate immediately and remove" },
  // Operator full-name leak (children); never expand S.J. / W.J. in public.
  { id: "operator-full-name", regex: /\bWill[a-z]*\s+Johnson\b/i, label: "operator full name", suggestion: "use Operator / Parent / W.J." },
  { id: "child-fullname-sj", regex: /\bSavannah\s+Johnson\b/i, label: "child full name", suggestion: "use S.J." },
  { id: "child-fullname-wj", regex: /\bWeston\s+Johnson\b/i, label: "child full name", suggestion: "use W.J." },
]);

/** Rough-edge URL/markup patterns. */
const ROUGH_PATTERNS = /** @type {Pattern[]} */ ([
  { id: "javascript-void", regex: /href\s*=\s*["']javascript:void/i, label: "javascript: pseudo-link", suggestion: "use button or real anchor" },
  // localhost in non-script HTML — exclude common dev-doc ports + the static demo guidance
  { id: "localhost-prod", regex: /https?:\/\/localhost(?!:(?:11434|3131|8080|8081|8082|8787|8788|5173|4173|6379))/i, label: "non-dev localhost URL", suggestion: "remove or guard with env switch" },
]);

// --------------------------------------------------------------- walk ---
/** @type {string[]} */
const filesScanned = [];
/** @type {Array<{tier:string, scope:string, path:string, line:number, snippet:string, category:string, id:string, suggestion:string}>} */
const findings = [];

function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function relPath(abs) {
  return path.relative(root, abs).split(path.sep).join("/");
}

function scopeForFile(rel) {
  // First scope whose `dir` (relative) is a prefix of `rel`.
  for (const s of SCOPES) {
    const sd = path.relative(root, s.dir).split(path.sep).join("/");
    if (sd === "" ? !rel.includes("/") : rel.startsWith(sd + "/")) {
      return s;
    }
    if (sd === "" && !rel.includes("/")) return s;
  }
  return null;
}

function* walk(scope) {
  const baseDepth = scope.dir.split(path.sep).length;
  function* inner(dir, depth) {
    if (!fs.existsSync(dir)) return;
    if (depth > scope.maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        yield* inner(full, depth + 1);
      } else if (e.isFile()) {
        if (scope.exts.some((x) => e.name.toLowerCase().endsWith(x))) {
          yield full;
        }
      }
    }
  }
  yield* inner(scope.dir, baseDepth);
}

function scanContent(rel, scope, text) {
  const lines = text.split("\n");
  /** @param {Pattern[]} group @param {string} category @param {string} minTier */
  function probe(group, category, minTier) {
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      for (const p of group) {
        const m = ln.match(p.regex);
        if (m) {
          // Skip if the line is itself documenting the avoid-list term.
          if (/avoid[- ]list|guardrail|never\s+say|do\s+not\s+say|forbidden|banned|never\s+use|never\s+ship/i.test(ln)) continue;
          findings.push({
            tier: tierFor(scope.tier, minTier, category, p.id),
            scope: scope.label,
            path: rel,
            line: i + 1,
            snippet: ln.trim().slice(0, 200),
            category,
            id: p.id,
            suggestion: p.suggestion,
          });
        }
      }
    }
  }
  probe(VOICE_PATTERNS, "voice", "B");
  probe(CLICHE_PATTERNS, "cliche", "B");
  probe(TODO_PATTERNS, "todo", "C");
  probe(PRIVATE_PATTERNS, "private", "A");
  probe(ROUGH_PATTERNS, "rough", "B");
}

/** Choose the tier for a finding: file-tier OR pattern minTier — whichever is stronger.
 * Strength order A > B > C. Voice/cliché on Tier-A surfaces is Tier A.
 * Private patterns are always at least A (key in any tier == release blocker).
 */
function tierFor(fileTier, patternTier, category, id) {
  if (category === "private") return "A";
  // VOICE on a Tier-A surface is a Tier-A finding (would fail verify:public-voice
  // on watched files; must be cleared before public release).
  if (category === "voice" && fileTier === "A") return "A";
  // Cliché on Tier-A face copy is also Tier A — public face must be tight.
  if (category === "cliche" && fileTier === "A") return "A";
  // Otherwise honour file tier or pattern minimum, whichever is stronger.
  if (fileTier === "A") return "A";
  if (fileTier === "B" || patternTier === "B") return "B";
  return "C";
}

for (const scope of SCOPES) {
  for (const abs of walk(scope)) {
    const rel = relPath(abs);
    if (EXEMPT_PATHS.has(rel)) continue;
    const text = readSafe(abs);
    if (text == null) continue;
    filesScanned.push(rel);
    scanContent(rel, scope, text);
  }
}

// --------------------------------------------------------------- emit ---
const counts = {
  total: findings.length,
  A: findings.filter((f) => f.tier === "A").length,
  B: findings.filter((f) => f.tier === "B").length,
  C: findings.filter((f) => f.tier === "C").length,
};

const byCategory = {};
for (const f of findings) {
  byCategory[f.category] = (byCategory[f.category] || 0) + 1;
}

const report = {
  schema: "p31.publicSanitization/1.0.0",
  generatedAt: new Date().toISOString(),
  filesScanned: filesScanned.length,
  counts,
  byCategory,
  findings,
};

if (writePath) {
  fs.mkdirSync(path.dirname(path.resolve(writePath)), { recursive: true });
  fs.writeFileSync(path.resolve(writePath), JSON.stringify(report, null, 2));
}

if (wantJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  const lines = [];
  lines.push("# P31 public-release sanitization probe");
  lines.push("");
  lines.push(`scanned **${filesScanned.length}** files across ${SCOPES.length} scopes`);
  lines.push(`findings: **${counts.total}** (Tier A: **${counts.A}** · Tier B: **${counts.B}** · Tier C: **${counts.C}**)`);
  lines.push("");
  lines.push("## By category");
  for (const [k, v] of Object.entries(byCategory)) {
    lines.push(`- \`${k}\`: ${v}`);
  }
  lines.push("");
  for (const t of ["A", "B", "C"]) {
    const tierFindings = findings.filter((f) => f.tier === t);
    if (tierFindings.length === 0) continue;
    lines.push(`## Tier ${t} findings (${tierFindings.length})`);
    lines.push("");
    for (const f of tierFindings) {
      lines.push(`- \`${f.path}:${f.line}\` [${f.category}/${f.id}] — ${f.snippet}`);
      lines.push(`  · suggestion: ${f.suggestion}`);
    }
    lines.push("");
  }
  if (counts.total === 0) {
    lines.push("✓ no findings — public surface is clean.");
  }
  process.stdout.write(lines.join("\n") + "\n");
}

if (strict && counts.A > 0) {
  process.stderr.write(`probe-public-sanitization: ${counts.A} Tier-A finding(s) — release blocker.\n`);
  process.exit(1);
}
process.exit(0);
