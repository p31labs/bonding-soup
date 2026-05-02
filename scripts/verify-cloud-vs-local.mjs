#!/usr/bin/env node
/**
 * Static verifier for the fleet-ten cloud-vs-local A/B harness.
 *
 * Checks that the harness exists, parses, declares the right CLI surface,
 * carries the operator-confidential persona ban, and uses the canonical
 * `merge-system-prompt` helper so the cloud lane sees the same shared
 * preamble + role file the local model has baked in.
 *
 * Skip: P31_SKIP_CLOUD_VS_LOCAL=1, or harness file missing (partial clone).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

if (process.env.P31_SKIP_CLOUD_VS_LOCAL === "1") {
  console.log("verify-cloud-vs-local: skip — P31_SKIP_CLOUD_VS_LOCAL=1");
  process.exit(0);
}

const HARNESS = path.join(root, "scripts", "p31-fleet-ten", "lib", "cloud-vs-local.mjs");
const WRAPPER = path.join(root, "scripts", "p31-fleet-ten", "cloud-vs-local.sh");
const CEILING_DOC = path.join(root, "scripts", "p31-fleet-ten", "HOST-CEILING.md");
const RULE_DOC = path.join(root, ".cursor", "rules", "p31-ollama-fleet.mdc");

if (!fs.existsSync(HARNESS)) {
  console.log("verify-cloud-vs-local: skip — harness missing (partial clone)");
  process.exit(0);
}

let fail = 0;
function ok(msg) { console.log("  [ OK ]", msg); }
function bad(msg) { console.log("  [FAIL]", msg); fail++; }

// 1. Harness parses as an ES module.
try {
  execSync(`node --check ${HARNESS}`, { stdio: "pipe" });
  ok("harness parses (node --check)");
} catch (e) {
  bad(`harness parse error: ${e.message}`);
}

const src = fs.readFileSync(HARNESS, "utf8");

// 2. CLI surface present.
const flagsRequired = ["--persona", "--prompt", "--prompt-file", "--json", "--skip-cloud"];
const missingFlags = flagsRequired.filter((f) => !src.includes(`"${f}"`));
if (missingFlags.length === 0) ok(`CLI surface: ${flagsRequired.join(" ")}`);
else bad(`missing CLI flags: ${missingFlags.join(", ")}`);

// 3. Operator-confidential persona ban present.
const sensitive = ["p31-counsel", "p31-triage", "p31-phos"];
const banPresent = sensitive.every((p) => src.includes(`"${p}"`));
const banLogic = src.includes("SENSITIVE_PERSONAS") && src.includes("operator-confidential");
if (banPresent && banLogic) ok(`operator-confidential ban: ${sensitive.join(", ")}`);
else bad(`operator-confidential ban missing or weak (sensitive set + logic)`);

// 4. Uses canonical merge-system-prompt (no ad-hoc concat that drifts from
//    what `ollama create` baked in).
if (src.includes("merge-system-prompt") && src.includes("buildSystemPrompt")) {
  ok("uses canonical buildSystemPrompt() (no drift from ollama-create)");
} else {
  bad("does not call buildSystemPrompt() from lib/merge-system-prompt.mjs");
}

// 5. Ollama HTTP API endpoint correct (no shell-out).
if (src.includes("/api/generate") && src.includes("OLLAMA_BASE")) {
  ok("local lane: POST /api/generate via fetch (no shell-out)");
} else {
  bad("local lane wiring missing /api/generate or OLLAMA_BASE");
}

// 6. Anthropic endpoint correct.
if (src.includes("api.anthropic.com/v1/messages") && src.includes("anthropic-version")) {
  ok("cloud lane: POST api.anthropic.com/v1/messages with version header");
} else {
  bad("cloud lane wiring incomplete (anthropic endpoint or version header)");
}

// 7. Schema versioned.
if (src.includes("p31.cloudVsLocal/")) {
  ok("output schema versioned (p31.cloudVsLocal/...)");
} else {
  bad("output JSON missing schema version");
}

// 8. Wrapper shell present + executable.
if (fs.existsSync(WRAPPER)) {
  const stat = fs.statSync(WRAPPER);
  if (stat.mode & 0o111) ok("wrapper script present and executable");
  else bad("wrapper script not executable (chmod +x)");
} else {
  bad("wrapper script missing");
}

// 9. Host ceiling doc present (companion artifact).
if (fs.existsSync(CEILING_DOC)) {
  ok("HOST-CEILING.md companion doc present");
} else {
  bad("HOST-CEILING.md companion doc missing");
}

// 10. Rule doc references the harness path (cross-link discipline).
if (fs.existsSync(RULE_DOC)) {
  const rule = fs.readFileSync(RULE_DOC, "utf8");
  if (rule.includes("cloud-vs-local") || rule.includes("ollama:vs-cloud")) {
    ok("rule doc cross-references cloud-vs-local harness");
  } else {
    console.log("  [INFO] rule doc does not yet reference cloud-vs-local — will add in next pass");
  }
}

console.log("");
if (fail > 0) {
  console.error(`verify-cloud-vs-local: FAIL (${fail} check(s) failed)`);
  process.exit(1);
}
console.log("verify-cloud-vs-local: OK");
