#!/usr/bin/env node
/**
 * CWP mobile ops — Phase 4: Create / build — verify p31ca + bonding packages + scripts.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "package.json");
const bonding = path.join(root, "andromeda", "04_SOFTWARE", "bonding", "package.json");

function needScripts(label, sp, required) {
  for (const name of required) {
    if (!sp[name]) {
      console.error(`[x]  ${label}: missing script "${name}"`);
      process.exit(1);
    }
  }
}

function main() {
  console.log("P31 mobile ops — Phase 4 (Create) check\n");

  if (fs.existsSync(p31ca)) {
    const p = JSON.parse(fs.readFileSync(p31ca, "utf8"));
    needScripts("p31ca", p.scripts || {}, ["dev", "verify", "build", "predeploy", "deploy"]);
    console.log("[ok]  p31ca: dev, verify, build, deploy chain present");
  } else {
    console.log("[--]  p31ca not in tree — skip");
  }

  if (fs.existsSync(bonding)) {
    const p = JSON.parse(fs.readFileSync(bonding, "utf8"));
    needScripts("bonding", p.scripts || {}, ["dev", "test", "build"]);
    const devLine = p.scripts.dev || "";
    const portM = devLine.match(/--port\s+(\d+)/) || devLine.match(/port[=:\s]+(\d+)/i);
    console.log("[ok]  bonding: dev, test, build present" + (portM ? ` (dev port ${portM[1]})` : ""));
  } else {
    console.log("[--]  bonding not in tree — skip");
  }

  const home = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  if (!home.scripts?.verify || !home.scripts?.p31) {
    console.error("[x]  home: need verify + p31 script");
    process.exit(1);
  }
  console.log("[ok]  home: verify + p31 cli");

  console.log("\nPhase 4: OK — one dev server at a time; see docs/MOBILE-OPS-PHASE4.md");
}

main();
