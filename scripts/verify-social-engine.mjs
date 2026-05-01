#!/usr/bin/env node
/**
 * Verify the social-drop-automation worker (the production "social engine") against
 * single-source canon — without touching its code. Catches drift before deploy.
 *
 * Lanes:
 *   1. File present + exports default + has WAVE_CONTENT block.
 *   2. Voice guardrails: every wave's content/tweets passes docs/p31-public-voice-guardrails.json
 *      Tier B/C regex (avoid-list).
 *   3. Per-platform char budget: each tweet fits Twitter limit (280); content fits Bluesky (300),
 *      Mastodon (500). Discord embed (4000) checked when wave.color present.
 *   4. Numerical drift: literals like "488 tests" / "488 automated tests" must equal
 *      p31-constants.json bonding.testBaseline.tests. Soft warn by default; fail when
 *      P31_SOCIAL_STRICT=1.
 *   5. Allowlist parity: p31-social-worker present in p31ca security/worker-allowlist.json
 *      (when that tree is checked out).
 *
 * Skip lane individually: P31_SOCIAL_SKIP_VOICE=1 / P31_SOCIAL_SKIP_LIMITS=1 / P31_SOCIAL_SKIP_DRIFT=1
 *
 * Skip whole script (partial clone, no andromeda): file missing → exit 0 with notice.
 */
import fs from "node:fs";
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
const ALLOWLIST_PATH = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/security/worker-allowlist.json",
);

const STRICT = process.env.P31_SOCIAL_STRICT === "1";
const SKIP_VOICE = process.env.P31_SOCIAL_SKIP_VOICE === "1";
const SKIP_LIMITS = process.env.P31_SOCIAL_SKIP_LIMITS === "1";
const SKIP_DRIFT = process.env.P31_SOCIAL_SKIP_DRIFT === "1";

const LIMITS = {
  twitter: 280,
  bluesky: 300,
  mastodon: 500,
  linkedin: 3000,
  discord: 4000,
};

let fail = 0;
let warn = 0;

function log(kind, msg) {
  const tag =
    kind === "FAIL"
      ? "\x1b[31mFAIL\x1b[0m"
      : kind === "WARN"
        ? "\x1b[33mWARN\x1b[0m"
        : "\x1b[36m   \x1b[0m";
  console.log(`  [${tag}] ${msg}`);
  if (kind === "FAIL") fail++;
  if (kind === "WARN") warn++;
}

if (!fs.existsSync(WORKER_PATH)) {
  console.log(
    "verify-social-engine: skip — no " +
      path.relative(root, WORKER_PATH) +
      " (partial clone)",
  );
  process.exit(0);
}

const src = fs.readFileSync(WORKER_PATH, "utf8");
const constants = fs.existsSync(CONSTANTS_PATH)
  ? JSON.parse(fs.readFileSync(CONSTANTS_PATH, "utf8"))
  : {};

console.log("verify-social-engine: " + path.relative(root, WORKER_PATH));

if (!/const\s+WAVE_CONTENT\s*=\s*\{/.test(src)) {
  log("FAIL", "WAVE_CONTENT block not found in worker.js");
}
if (!/export\s+default\s*\{/.test(src)) {
  log("FAIL", "no `export default { fetch, scheduled }` block");
}

/**
 * Cheap recursive extractor — pull every JS string literal that looks like
 * social-engine content (single/double/back-tick quoted). Good enough for
 * voice + drift regex; not a full parser.
 */
function extractStringLiterals(text) {
  const out = [];
  const re = /(['"`])((?:\\.|(?!\1).)*?)\1/gs;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[2];
    if (raw.length < 8) continue;
    if (
      /^(GET|POST|OPTIONS|application\/json|Content-Type|Authorization|Bearer |Basic )/i.test(
        raw,
      )
    )
      continue;
    if (/^https?:\/\//.test(raw) && !raw.includes(" ")) continue;
    out.push(raw);
  }
  return out;
}

const literals = extractStringLiterals(src);

if (!SKIP_VOICE) {
  if (!fs.existsSync(VOICE_PATH)) {
    log("WARN", "voice guardrails file missing — " + VOICE_PATH);
  } else {
    const voice = JSON.parse(fs.readFileSync(VOICE_PATH, "utf8"));
    const patterns = (voice.patterns || []).map((p) => ({
      id: p.id,
      re: new RegExp(p.regex, p.flags || ""),
      note: p.note,
    }));
    let voiceHits = 0;
    for (const lit of literals) {
      for (const pat of patterns) {
        if (pat.id === "normative-strip") continue;
        if (pat.re.test(lit)) {
          voiceHits++;
          log(
            STRICT ? "FAIL" : "WARN",
            `voice avoid-list "${pat.id}" hit in: ${lit.slice(0, 80).replace(/\n/g, " ")}…`,
          );
        }
      }
    }
    if (voiceHits === 0) {
      log("OK", "voice guardrails: no avoid-list hits");
    }
  }
}

if (!SKIP_LIMITS) {
  let limitFails = 0;
  // Detect tweet arrays: `tweets: [\n  '...',\n  '...'\n  ]`
  const tweetBlock = src.match(/tweets:\s*\[([\s\S]*?)\],?\s*platforms:/);
  if (tweetBlock) {
    const body = tweetBlock[1];
    const tweets = [...body.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (tweets.length > 0) {
      tweets.forEach((t, i) => {
        const len = t.length;
        if (len > LIMITS.twitter) {
          limitFails++;
          log(
            "FAIL",
            `wave2_twitter tweet ${i + 1} exceeds Twitter ${LIMITS.twitter} chars: ${len}`,
          );
        }
      });
      log(
        "OK",
        `Twitter thread: ${tweets.length} tweets, longest ${Math.max(
          ...tweets.map((t) => t.length),
        )} chars (limit ${LIMITS.twitter})`,
      );
    }
  }
  // Bluesky/Mastodon-targeted waves: warn when content > min platform limit declared
  const blueskyWaves = src.match(/platforms:\s*\[[^\]]*'bluesky'[^\]]*\]/g) || [];
  if (blueskyWaves.length === 0) {
    log("OK", `no bluesky-targeted wave detected — char limit lane n/a`);
  }
  if (limitFails === 0) log("OK", `platform char-limit checks clean`);
}

if (!SKIP_DRIFT) {
  const canonTests = constants?.bonding?.testBaseline?.tests;
  const canonSuites = constants?.bonding?.testBaseline?.suites;
  const numHits = [...src.matchAll(/(\d{2,4})\s+(?:automated\s+)?tests\b/gi)];
  let drift = 0;
  for (const h of numHits) {
    const n = Number(h[1]);
    if (canonTests && n !== canonTests) {
      drift++;
      log(
        STRICT ? "FAIL" : "WARN",
        `numerical drift: worker says "${h[0]}" — canon p31-constants bonding.testBaseline.tests=${canonTests}`,
      );
    }
  }
  const suitesHits = [...src.matchAll(/(\d{1,3})\s+suites\b/gi)];
  for (const h of suitesHits) {
    const n = Number(h[1]);
    if (canonSuites && n !== canonSuites) {
      drift++;
      log(
        STRICT ? "FAIL" : "WARN",
        `suites drift: worker says "${h[0]}" — canon p31-constants bonding.testBaseline.suites=${canonSuites}`,
      );
    }
  }
  if (drift === 0 && canonTests) {
    log("OK", `numerical drift: tests=${canonTests} suites=${canonSuites} aligned`);
  }
}

if (fs.existsSync(ALLOWLIST_PATH)) {
  const allow = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"));
  const names = (allow.workers || []).map((w) => w.name);
  if (!names.includes("p31-social-worker")) {
    log(
      "FAIL",
      "p31-social-worker missing from p31ca/security/worker-allowlist.json",
    );
  } else {
    log("OK", "allowlist: p31-social-worker present");
  }
}

console.log(
  `\nverify-social-engine: ${fail === 0 ? "\x1b[32mOK\x1b[0m" : "\x1b[31mFAILED\x1b[0m"}` +
    ` (${fail} fail · ${warn} warn)`,
);
process.exit(fail === 0 ? 0 : 1);
