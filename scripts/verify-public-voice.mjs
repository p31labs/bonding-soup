#!/usr/bin/env node
/**
 * Structural + grep guardrails for Tier B/C public copy (see docs/PUBLIC-VOICE.md).
 * Tier A remains human-gated — this script does not judge narrative quality.
 *   npm run verify:public-voice
 *   npm run p31 -- voice
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function die(msg) {
  console.error("verify-public-voice:", msg);
  process.exit(1);
}

function loadJson(rel) {
  const p = path.join(root, rel);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    die(`${rel}: ${e.message}`);
  }
}

function main() {
  const cfgPath = path.join(root, "docs", "p31-public-voice-guardrails.json");
  if (!fs.existsSync(cfgPath)) die("missing docs/p31-public-voice-guardrails.json");

  const cfg = loadJson("docs/p31-public-voice-guardrails.json");
  if (cfg.schema !== "p31.publicVoiceGuardrails/1.0.0") {
    die(`expected schema p31.publicVoiceGuardrails/1.0.0`);
  }

  const mdPath = path.join(root, "docs", "PUBLIC-VOICE.md");
  if (!fs.existsSync(mdPath)) die("missing docs/PUBLIC-VOICE.md");
  const md = fs.readFileSync(mdPath, "utf8");
  for (const anchor of cfg.requiredMdAnchors || []) {
    if (!md.includes(anchor)) {
      die(`docs/PUBLIC-VOICE.md must include anchor line ${JSON.stringify(anchor)}`);
    }
  }

  for (const req of cfg.requiredSubstrings || []) {
    const rel = req.path;
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) die(`missing required file ${rel}`);
    const text = fs.readFileSync(p, "utf8");
    if (!text.includes(req.mustContain)) {
      die(`${rel} must contain substring: ${JSON.stringify(req.mustContain)}`);
    }
  }

  const compiled = (cfg.patterns || []).map((row) => ({
    ...row,
    re: new RegExp(row.regex, row.flags || ""),
  }));

  let hits = 0;
  for (const w of cfg.watch || []) {
    const rel = w.path;
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) {
      if (w.optional) {
        console.log("verify-public-voice: skip optional missing —", rel);
        continue;
      }
      die(`missing watched file ${rel}`);
    }
    const text = fs.readFileSync(p, "utf8");
    const lines = text.split(/\r?\n/);
    for (const row of compiled) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (row.re.test(line)) {
          console.error(
            `verify-public-voice: FAIL pattern "${row.id}" in ${rel}:${i + 1}: ${line.trim()}`
          );
          hits++;
        }
      }
    }
  }

  if (hits > 0) {
    die(`${hits} guardrail hit(s) — fix copy or update docs/p31-public-voice-guardrails.json with justification`);
  }

  console.log(
    "verify-public-voice: ok — anchors + required strips +",
    (cfg.watch || []).filter((w) => fs.existsSync(path.join(root, w.path))).length,
    "watched file(s)"
  );
}

main();
