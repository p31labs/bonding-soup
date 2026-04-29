/**
 * Curated operator-facing micro-delight — calm, anti-FOMO, canon-aware.
 * @see docs/ETHICAL-STYLE-MAP.md (proportion, no streak-as-identity, no manufactured urgency)
 */
import fs from "node:fs";
import path from "node:path";

/** @param {string} s */
export function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * @param {string} repoRoot
 * @returns {{ larmorHz: number; bondingHint: string }}
 */
export function loadCanon(repoRoot) {
  try {
    const raw = fs.readFileSync(path.join(repoRoot, "p31-constants.json"), "utf8");
    const j = JSON.parse(raw);
    const hz = typeof j.physics?.larmorHz === "number" ? j.physics.larmorHz : 863;
    const url = typeof j.bonding?.publicUrl === "string" ? j.bonding.publicUrl.trim() : "";
    return { larmorHz: hz, bondingHint: url || "https://bonding.p31ca.org" };
  } catch {
    return { larmorHz: 863, bondingHint: "https://bonding.p31ca.org" };
  }
}

/** @param {string} line @param {number} larmorHz @param {string} bondingHint */
function applyReplacements(line, larmorHz, bondingHint) {
  return line.replace(/\{larmor\}/g, String(larmorHz)).replace(/\{bonding\}/g, bondingHint);
}

const LINES = [
  "Same bowl, same room — ship when you're ready, not when the calendar guilt-trips you.",
  "The bowl isn't a stadium: bounded rooms stay kind. (See docs/PLAN-BONDING-SOUP-WHEN-SCALE.md)",
  "{larmor} Hz in canon — one number, many honest surfaces. Egg-hunt CI keeps the whimsy from drifting away.",
  "Skipped verify steps on a partial clone aren't failure — they're topology. The effective bar tells the truth.",
  "Gray rock UI waits for you to speak first. The software isn't bored; it's respectful.",
  "Command center locked by default: the plot twist is safety, not obstacle course energy.",
  "Every green verify is a gift to Future-You — no streak counter required.",
  "Bonding lives at {bonding} — one public door; no 'beat everyone' scoreboard behind it.",
  "The doc library index is a constellation, not a race. Curiosity beats hustle culture.",
  "Frictionless isn't lazy — it's removing sand from gears so care work can breathe.",
  "ORACLE at 0 spoons said it best: empty cup, full day. Rest is a valid state machine.",
  "Alignment registry + verify: ephemeralization beats heroics. Let the machines remember the graph.",
  "Passkeys and mesh: tedious until they're not — then they're dignity infrastructure.",
  "Grant scaffold `done` flags: tiny dopamine from closure, not from comparison to strangers.",
  "Zenodo traction is bibliography hygiene, not a leaderboard. ORCID is the spine.",
  "The fleet portal is a map, not a race — URLs as evidence, not trophies.",
  "Runbooks RED are love letters to Future-You who is awake at 3am with a pager.",
  "Semgrep whispers 'maybe' — humans still say 'ship' or 'wait'. That's the game worth playing.",
  "Wrangler dry-run is rehearsal dinner: fewer surprises at the real deploy.",
  "C.A.R.S. reactions are metaphor, not metrics — chemistry for meaning, not for a score.",
  "If `?alive=1` feels like a cheat code, remember: you turned the lights on on purpose.",
  "The cognitive passport isn't homework — it's a mirror you choose to polish.",
  "Hub `hub:ci` is a group hug for the static site — everyone must breathe before Pages.",
  "Mirror-fixer dry-run is archaeology with a vacuum — dust off the doc hub without breaking bones.",
  "Poets-room and soup share a hallway in the repo — art and ops are neighbors, not enemies.",
  "K₄ isn't hype — it's a four-vector reminder that physics, network, compliance, and UX cohabit.",
  "When mesh live strict fails, the network is teaching you something. Listen before you mute.",
  "Donate flows behind `verify:monetary` — money paths get the same respect as crypto keys.",
  "Physics-learn eggs hide in plain sight: education that feels like discovery, not a pop quiz.",
  "The release ladder P0–P3 is a staircase, not a ski lift — you can pause on any landing.",
  "Git hooks that run verify on money files? That's a friend tapping your shoulder, not a cop.",
  "SIMPLEX strip on the command center: a heartbeat line for agents who prefer honesty over hype.",
  "Family-pack URL in doctor output: handoff is a ceremony, not a chore list.",
];

const LINES_SHORT = [
  "{larmor} Hz today — one constant, many surfaces.",
  "Verify is kindness to Future-You.",
  "Locked gate, steady hands — that's the plot twist.",
  "Partial clone? You're still reading the map correctly.",
  "Egg hunt in CI: joy as evidence, not loot.",
  "Same bowl — no stranger scoreboard.",
  "Rest beats grind. The bowl will be here tomorrow.",
  "Runbooks RED = 3am-you insurance.",
  "Ephemeralize once, smile often.",
  "Static site, steady soul.",
  "Loose mesh today, strict mesh when you're brave.",
  "Trim tab energy: small nudge, big course correction.",
  "No confetti required — green CI is enough glitter.",
];

/**
 * Tiny ASCII bowl — no animation; safe for logs and CI.
 * @returns {string}
 */
export function asciiBowl() {
  return [
    "       ___",
    "     .'   '.",
    "    /   ~   \\   same bowl",
    "    `-------´",
  ].join("\n");
}

/**
 * Deterministic-ish shuffle then take first `count` lines (unique per day unless roll).
 * @param {string} repoRoot
 * @param {number} count
 * @param {boolean} roll
 * @param {boolean} [short]
 * @returns {string[]}
 */
export function getOperatorJoyLines(repoRoot, count, roll, short = false) {
  const { larmorHz, bondingHint } = loadCanon(repoRoot);
  const pool = [...(short ? LINES_SHORT : LINES)];
  const day = new Date().toISOString().slice(0, 10);
  const seed0 = roll ? hashStr(`${day}:${process.pid}:${Date.now()}`) : hashStr(day);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = hashStr(`${seed0}:${i}`) % (i + 1);
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  const n = Math.min(Math.max(1, count), pool.length);
  const out = [];
  for (let k = 0; k < n; k++) {
    out.push(applyReplacements(pool[k], larmorHz, bondingHint));
  }
  return out;
}

/**
 * @param {string} repoRoot
 * @param {{ roll?: boolean; short?: boolean }} [opts]
 * @returns {string}
 */
export function getOperatorJoyLine(repoRoot, opts = {}) {
  const lines = getOperatorJoyLines(repoRoot, 1, opts.roll ?? false, opts.short ?? false);
  return lines[0] || "";
}

/** @param {string} s */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string[]} lines
 * @returns {string}
 */
export function joyListHtml(lines) {
  return `<ul class="cc-joy__list">${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`;
}
