#!/usr/bin/env node
/**
 * Verify the P31 Labs bug bounty program is fully wired:
 *  — security portal HTML exists with EIN footer
 *  — PGP key file exists
 *  — hall-of-fame and egg-hunt pages exist
 *  — p31-constants.json has security section with required fields
 *  — schema contract file exists
 *  — securityEmail reachable from constants
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EIN = "42-1888158";
const SECURITY_SCHEMA = "p31.bugBounty/1.0.0";
const SECURITY_EMAIL = "security@p31ca.org";

let pass = 0;
let fail = 0;

function check(label, condition, hint = "") {
  if (condition) {
    console.log(`  ✓  ${label}`);
    pass++;
  } else {
    console.error(`  ✗  ${label}${hint ? `  — ${hint}` : ""}`);
    fail++;
  }
}

function fileExists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fileContains(rel, needle) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8").includes(needle);
  } catch {
    return false;
  }
}

console.log("\nverify:bug-bounty\n");

// ── 1. Security portal pages ──────────────────────────────────────────────
console.log("1. Security portal pages");
const secDir = "phosphorus31.org/website/security";
check("security/index.html exists",       fileExists(`${secDir}/index.html`));
check("security/pgp-key.txt exists",      fileExists(`${secDir}/pgp-key.txt`));
check("security/policy.txt exists",       fileExists(`${secDir}/policy.txt`));
check("security/hall-of-fame.html exists",fileExists(`${secDir}/hall-of-fame.html`));
check("security/egg-hunt.html exists",    fileExists(`${secDir}/egg-hunt.html`));

// ── 2. EIN footer on every security page ─────────────────────────────────
console.log("\n2. EIN present on security pages");
for (const page of ["index.html", "hall-of-fame.html", "egg-hunt.html"]) {
  check(`${page} contains EIN ${EIN}`, fileContains(`${secDir}/${page}`, EIN),
    `add EIN to footer of ${secDir}/${page}`);
}
check("policy.txt contains EIN", fileContains(`${secDir}/policy.txt`, EIN),
  `add EIN to ${secDir}/policy.txt`);

// ── 3. Security email in portal pages ────────────────────────────────────
console.log("\n3. Security email present");
for (const page of ["index.html", "hall-of-fame.html", "egg-hunt.html", "policy.txt"]) {
  check(`${page} contains ${SECURITY_EMAIL}`,
    fileContains(`${secDir}/${page}`, SECURITY_EMAIL));
}

// ── 4. p31-constants.json security section ────────────────────────────────
console.log("\n4. p31-constants.json security section");
const constants = JSON.parse(fs.readFileSync(path.join(root, "p31-constants.json"), "utf8"));
const sec = constants.security || {};

check("security section present",         !!constants.security);
check("security.email correct",           sec.email === SECURITY_EMAIL,
  `expected "${SECURITY_EMAIL}", got "${sec.email}"`);
check("security.schema correct",          sec.schema === SECURITY_SCHEMA,
  `expected "${SECURITY_SCHEMA}"`);
check("security.programLaunched present", !!sec.programLaunched);
check("security.budgetAnnual present",    typeof sec.budgetAnnual === "number");
check("security.responseTime.critical",   sec.responseTime?.critical === "24h");
check("security.responseTime.high",       sec.responseTime?.high === "48h");
check("security.bountyTiers.critical",    typeof sec.bountyTiers?.critical?.usd === "number");
check("security.scope.inScope is array",  Array.isArray(sec.scope?.inScope) && sec.scope.inScope.length >= 4);
check("security.scope.absolutelyOutOfScope has children entry",
  Array.isArray(sec.scope?.absolutelyOutOfScope) &&
  sec.scope.absolutelyOutOfScope.some(s => s.includes("children")));
check("security.portalUrl present",       !!sec.portalUrl);
check("security.hallOfFameUrl present",   !!sec.hallOfFameUrl);
check("security.eggHuntUrl present",      !!sec.eggHuntUrl);

// ── 5. Schema contract file ───────────────────────────────────────────────
console.log("\n5. Schema contract");
const schemaPath = "contracts/p31.bugBounty.schema.json";
check("contracts/p31.bugBounty.schema.json exists", fileExists(schemaPath));

if (fileExists(schemaPath)) {
  const schema = JSON.parse(fs.readFileSync(path.join(root, schemaPath), "utf8"));
  check("schema.$id is p31.bugBounty/1.0.0",   schema.$id === SECURITY_SCHEMA,
    `got "${schema.$id}"`);
  check("schema has required 'id' field",       schema.properties?.id?.type === "string");
  check("schema has required 'severity' field", schema.properties?.severity?.enum?.length >= 4);
  check("schema has required 'status' field",   schema.properties?.status?.enum?.length >= 2);
  check("schema has 'reporter' field",          !!schema.properties?.reporter);
  check("schema has 'reward' field",            !!schema.properties?.reward);
}

// ── 6. Larmor easter egg in policy.txt ───────────────────────────────────
console.log("\n6. Larmor easter egg");
check("policy.txt contains 863 Hz Larmor signature",
  fileContains(`${secDir}/policy.txt`, "863 Hz"),
  "add Larmor footer to policy.txt");

// ── Summary ───────────────────────────────────────────────────────────────
const total = pass + fail;
console.log(`\nverify:bug-bounty — ${pass}/${total} checks passed`);

if (fail > 0) {
  console.error(`\n${fail} check(s) failed`);
  process.exit(1);
}

console.log("OK");
