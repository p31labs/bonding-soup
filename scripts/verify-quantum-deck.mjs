#!/usr/bin/env node
/**
 * Card-suite core gate: @p31/quantum-deck unit tests + save schema envelope.
 * Skip: P31_SKIP_QUANTUM_DECK=1
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = path.join(root, "packages", "quantum-deck");
const schemaPath = path.join(pkg, "schema", "quantum-deck-save.schema.json");

function die(msg, code = 1) {
  console.error("verify-quantum-deck:", msg);
  process.exit(code);
}

if (process.env.P31_SKIP_QUANTUM_DECK === "1") {
  console.log("verify-quantum-deck: SKIP (P31_SKIP_QUANTUM_DECK=1)");
  process.exit(0);
}

if (!fs.existsSync(pkg)) {
  die("missing packages/quantum-deck — partial checkout?", 1);
}

let schema;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
} catch (e) {
  die(`invalid schema JSON: ${e && e.message}`, 1);
}
if (schema.$id !== "https://p31ca.org/schema/p31.quantumDeckSave/0.1.0") {
  die(`schema $id mismatch: ${schema.$id}`, 1);
}
if (schema.properties?.schema?.const !== "p31.quantumDeckSave/0.1.0") {
  die("schema.properties.schema.const must be p31.quantumDeckSave/0.1.0", 1);
}

const testDir = path.join(pkg, "test");
const testFiles = fs
  .readdirSync(testDir)
  .filter((f) => f.endsWith(".test.mjs"))
  .map((f) => path.join(testDir, f));
if (!testFiles.length) die("no *.test.mjs under packages/quantum-deck/test", 1);

const r = spawnSync(process.execPath, ["--test", "--test-reporter=spec", ...testFiles], {
  cwd: pkg,
  stdio: "inherit",
  env: process.env,
});
if (r.status !== 0) {
  die("node --test failed", r.status ?? 1);
}

const srcCore = path.join(pkg, "src", "deck.mjs");
const hubCore = path.join(
  root,
  "andromeda",
  "04_SOFTWARE",
  "p31ca",
  "public",
  "lib",
  "p31-quantum-deck-core.mjs",
);
if (fs.existsSync(path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "lib"))) {
  fs.mkdirSync(path.dirname(hubCore), { recursive: true });
  fs.copyFileSync(srcCore, hubCore);
  const srcBuf = fs.readFileSync(srcCore);
  const hubBuf = fs.readFileSync(hubCore);
  if (!srcBuf.equals(hubBuf)) {
    die(
      `hub mirror parity failed after copy — packages/quantum-deck/src/deck.mjs vs ${path.relative(root, hubCore)}`,
      1,
    );
  }
  console.log(
    "verify-quantum-deck: mirrored packages/quantum-deck/src/deck.mjs →",
    path.relative(root, hubCore),
  );
}

console.log("verify-quantum-deck: OK");
