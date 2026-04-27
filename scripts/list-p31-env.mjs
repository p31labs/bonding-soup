#!/usr/bin/env node
/**
 * Print P31_* catalog from p31-env-manifest.json (human table or JSON).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "p31-env-manifest.json");

function load() {
  if (!fs.existsSync(manifestPath)) {
    console.error("list-p31-env: missing p31-env-manifest.json");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function pad(s, n) {
  const t = String(s);
  return t.length >= n ? t.slice(0, n) : t + " ".repeat(n - t.length);
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const md = argv.includes("--markdown");

  const data = load();
  const vars = Array.isArray(data.variables) ? [...data.variables] : [];
  vars.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  if (asJson) {
    console.log(JSON.stringify({ schema: data.schema, variables: vars }, null, 2));
    return;
  }

  if (md) {
    console.log("| Name | Tier | Risk | Description |");
    console.log("|------|------|------|-------------|");
    for (const row of vars) {
      const esc = (s) =>
        String(s)
          .replace(/\|/g, "\\|")
          .replace(/\r?\n/g, " ");
      console.log(`| \`${esc(row.name)}\` | ${esc(row.tier)} | ${esc(row.risk)} | ${esc(row.description)} |`);
    }
    return;
  }

  const wName = Math.max(28, ...vars.map((v) => String(v.name).length));
  const wTier = Math.max(8, ...vars.map((v) => String(v.tier).length));
  const wRisk = Math.max(8, ...vars.map((v) => String(v.risk).length));

  console.log(`${pad("P31_* variable", wName)}  ${pad("tier", wTier)}  ${pad("risk", wRisk)}  description`);
  console.log(`${"-".repeat(wName)}  ${"-".repeat(wTier)}  ${"-".repeat(wRisk)}  ${"-".repeat(40)}`);
  for (const row of vars) {
    const desc = String(row.description).replace(/\s+/g, " ");
    console.log(`${pad(row.name, wName)}  ${pad(row.tier, wTier)}  ${pad(row.risk, wRisk)}  ${desc}`);
  }
  console.log("\nMachine JSON: npm run list:p31-env -- --json");
}

main();
