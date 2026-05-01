#!/usr/bin/env node
/**
 * Render every social-engine wave + a 7-day schedule preview WITHOUT touching any platform.
 * Produces a manifest the operator can read before approving a deploy that ships new copy.
 *
 *   npm run sim:social
 *   npm run sim:social -- --wave wave2_twitter
 *   npm run sim:social -- --json
 *   P31_SIM_OUT=/tmp/p31-sim-social.json npm run sim:social
 *
 * Output (default): writes ~/.p31/simulations/social-<utc>/manifest.json + .md preview.
 * No fetch. No POST. Reads worker.js source + p31-constants.json + voice guardrails.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const WORKER_PATH = path.join(
  root,
  "andromeda/04_SOFTWARE/cloudflare-worker/social-drop-automation/worker.js",
);
const VOICE_PATH = path.join(root, "docs/p31-public-voice-guardrails.json");
const CONSTANTS_PATH = path.join(root, "p31-constants.json");

const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const next = args[i + 1];
    if (next != null && !next.startsWith("--")) {
      argMap[k] = next;
      i++;
    } else argMap[k] = true;
  }
}
const onlyWave = typeof argMap.wave === "string" ? argMap.wave : null;
const jsonMode = argMap.json === true;

const LIMITS = {
  twitter: 280,
  bluesky: 300,
  mastodon: 500,
  linkedin: 3000,
  discord: 4000,
  reddit: 40000,
  "ko-fi": 1500,
};

const SCHEDULE = [
  { id: "weekly_update", dayUtc: 1, hourUtc: 17, minute: 0, human: "Mon 17:00 UTC" },
  { id: "midweek", dayUtc: 3, hourUtc: 17, minute: 0, human: "Wed 17:00 UTC" },
  { id: "weekend_recap", dayUtc: 5, hourUtc: 17, minute: 0, human: "Fri 17:00 UTC" },
  { id: "kofi_digest", dayUtc: null, hourUtc: 17, minute: 20, human: "Daily 17:20 UTC" },
  { id: "zenodo_reminder", dayUtc: null, hourUtc: 13, minute: 0, dayOfMonth: 1, human: "1st of month 13:00 UTC" },
];

function fail(msg) {
  console.error("simulate-social-engine:", msg);
  process.exit(1);
}

if (!fs.existsSync(WORKER_PATH)) {
  console.log(
    "simulate-social-engine: skip — no " +
      path.relative(root, WORKER_PATH) +
      " (partial clone)",
  );
  process.exit(0);
}

const src = fs.readFileSync(WORKER_PATH, "utf8");
const constants = fs.existsSync(CONSTANTS_PATH)
  ? JSON.parse(fs.readFileSync(CONSTANTS_PATH, "utf8"))
  : {};
const voice = fs.existsSync(VOICE_PATH)
  ? JSON.parse(fs.readFileSync(VOICE_PATH, "utf8"))
  : { patterns: [] };

const voicePatterns = (voice.patterns || [])
  .filter((p) => p.id !== "normative-strip")
  .map((p) => ({ id: p.id, re: new RegExp(p.regex, p.flags || ""), note: p.note }));

/**
 * Naïve WAVE_CONTENT extractor — splits at top-level keys then captures
 * `title`, `content` (template literal), or `tweets` array of templates,
 * `platforms` array, `discord_only` flag.
 */
function extractWaves(text) {
  const block = text.match(/const\s+WAVE_CONTENT\s*=\s*\{([\s\S]*?)\n\};/);
  if (!block) fail("WAVE_CONTENT block not found");
  const body = block[1];
  // Split on top-level identifiers: `\n  identifier: {`
  const re = /\n  ([A-Za-z0-9_]+):\s*\{([\s\S]*?)\n  \},?/g;
  const out = {};
  let m;
  while ((m = re.exec(body))) {
    const id = m[1];
    const inner = m[2];
    const titleM = inner.match(/title:\s*['"`]([^'"`]+)['"`]/);
    const contentM = inner.match(/content:\s*`([\s\S]*?)`,?\s*(?:platforms|discord_only|}|$)/);
    const tweetsM = inner.match(/tweets:\s*\[([\s\S]*?)\],?\s*platforms/);
    const platformsM = inner.match(/platforms:\s*\[([\s\S]*?)\]/);
    const discordOnly = /discord_only:\s*true/.test(inner);
    let platforms = [];
    if (platformsM) {
      platforms = [...platformsM[1].matchAll(/['"`]([a-zA-Z0-9-]+)['"`]/g)].map((x) => x[1]);
    }
    let tweets = null;
    if (tweetsM) {
      tweets = [...tweetsM[1].matchAll(/`([\s\S]*?)`/g)].map((x) => x[1]);
    }
    out[id] = {
      id,
      title: titleM ? titleM[1] : id,
      content: contentM ? contentM[1] : null,
      tweets,
      platforms,
      discordOnly,
    };
  }
  return out;
}

function checkVoice(text) {
  const hits = [];
  for (const p of voicePatterns) {
    if (p.re.test(text)) hits.push({ id: p.id, note: p.note });
  }
  return hits;
}

function checkLength(text, platform) {
  const limit = LIMITS[platform];
  if (!limit) return { ok: true, len: text.length, limit: null };
  return { ok: text.length <= limit, len: text.length, limit, over: Math.max(0, text.length - limit) };
}

function nextScheduledFire(entry, fromTs = Date.now()) {
  // Returns ISO string of next fire time matching cron-like fields.
  const start = new Date(fromTs);
  for (let i = 0; i < 60; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    if (entry.dayOfMonth != null && d.getUTCDate() !== entry.dayOfMonth) continue;
    if (entry.dayUtc != null && d.getUTCDay() !== entry.dayUtc) continue;
    d.setUTCHours(entry.hourUtc, entry.minute, 0, 0);
    if (d.getTime() >= fromTs) return d.toISOString();
  }
  return null;
}

const waves = extractWaves(src);
const renderedWaves = {};
let failCount = 0;
let warnCount = 0;

for (const [id, w] of Object.entries(waves)) {
  if (onlyWave && id !== onlyWave) continue;
  const entries = [];
  if (w.tweets && w.tweets.length > 0) {
    w.tweets.forEach((t, i) => {
      const len = checkLength(t, "twitter");
      const voiceHits = checkVoice(t);
      if (!len.ok) failCount++;
      if (voiceHits.length) warnCount++;
      entries.push({ kind: "tweet", index: i + 1, text: t, twitter: len, voiceHits });
    });
  } else if (w.content) {
    const checks = {};
    for (const platform of w.platforms.length > 0 ? w.platforms : ["discord"]) {
      checks[platform] = checkLength(w.content, platform);
      if (!checks[platform].ok) failCount++;
    }
    const voiceHits = checkVoice(w.content);
    if (voiceHits.length) warnCount++;
    entries.push({ kind: "content", text: w.content, checks, voiceHits });
  }
  renderedWaves[id] = {
    id,
    title: w.title,
    platforms: w.platforms,
    discordOnly: w.discordOnly,
    entries,
  };
}

const upcoming = SCHEDULE.map((s) => ({
  schedule: s.human,
  wave: s.id,
  next: nextScheduledFire(s),
})).sort((a, b) => (a.next || "").localeCompare(b.next || ""));

const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const outDir = argMap.out
  ? path.resolve(String(argMap.out))
  : path.join(os.homedir(), ".p31", "simulations", `social-${stamp}`);

fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  schema: "p31.socialEngineSimulation/1.0.0",
  generatedAt: new Date().toISOString(),
  generatedBy: "scripts/simulate-social-engine.mjs",
  workerSource: path.relative(root, WORKER_PATH),
  constants: {
    bondingTests: constants?.bonding?.testBaseline?.tests ?? null,
    bondingSuites: constants?.bonding?.testBaseline?.suites ?? null,
  },
  upcoming,
  waves: renderedWaves,
  totals: {
    waves: Object.keys(renderedWaves).length,
    failures: failCount,
    warnings: warnCount,
  },
};

const manifestPath = path.join(outDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const md = renderMd(manifest);
const mdPath = path.join(outDir, "preview.md");
fs.writeFileSync(mdPath, md, "utf8");

const sharedOut = process.env.P31_SIM_OUT;
if (sharedOut) {
  fs.mkdirSync(path.dirname(sharedOut), { recursive: true });
  fs.writeFileSync(sharedOut, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

if (jsonMode) {
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(failCount === 0 ? 0 : 1);
}

console.log(`\nsimulate-social-engine: ${manifest.totals.waves} waves rendered`);
console.log(`  ${failCount} fails · ${warnCount} warns · 7-day schedule preview below\n`);
for (const u of upcoming) {
  console.log(`  ${u.schedule.padEnd(24)} → ${u.wave.padEnd(20)} next: ${u.next}`);
}
console.log(`\n  preview  ${path.relative(root, mdPath)}`);
console.log(`  manifest ${path.relative(root, manifestPath)}\n`);

if (failCount > 0) {
  console.error(`\n\x1b[31msimulate-social-engine: ${failCount} platform char-limit failures (waves would be silently truncated/rejected)\x1b[0m`);
  process.exit(1);
}

function renderMd(m) {
  const lines = [];
  lines.push(`# Social engine simulation — ${m.generatedAt}`);
  lines.push("");
  lines.push(`Source: \`${m.workerSource}\``);
  lines.push(
    `Canon: bonding ${m.constants.bondingTests ?? "?"} tests / ${m.constants.bondingSuites ?? "?"} suites`,
  );
  lines.push("");
  lines.push("## Next scheduled fires (UTC)");
  lines.push("");
  lines.push("| Schedule | Wave | Next fire |");
  lines.push("|----------|------|-----------|");
  for (const u of m.upcoming) {
    lines.push(`| ${u.schedule} | \`${u.wave}\` | ${u.next || "—"} |`);
  }
  lines.push("");
  lines.push("## Waves");
  lines.push("");
  for (const w of Object.values(m.waves)) {
    lines.push(`### \`${w.id}\` — ${w.title}`);
    lines.push(
      `Platforms: ${w.platforms.join(", ") || "(none)"}${w.discordOnly ? " · Discord only" : ""}`,
    );
    lines.push("");
    for (const e of w.entries) {
      if (e.kind === "tweet") {
        lines.push(`**Tweet ${e.index}** — ${e.twitter.len} / 280 chars${e.twitter.ok ? " ✓" : ` ✗ over by ${e.twitter.over}`}`);
        if (e.voiceHits.length)
          lines.push(`  voice: ${e.voiceHits.map((v) => v.id).join(", ")}`);
        lines.push("");
        lines.push("```");
        lines.push(e.text.trim());
        lines.push("```");
        lines.push("");
      } else {
        const tags = Object.entries(e.checks)
          .map(([p, c]) => `${p}: ${c.len}/${c.limit ?? "—"}${c.ok ? "" : " ✗"}`)
          .join(" · ");
        lines.push(`**Content** — ${tags}`);
        if (e.voiceHits.length)
          lines.push(`  voice: ${e.voiceHits.map((v) => v.id).join(", ")}`);
        lines.push("");
        lines.push("```");
        lines.push(e.text.trim());
        lines.push("```");
        lines.push("");
      }
    }
  }
  return lines.join("\n");
}
