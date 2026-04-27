#!/usr/bin/env node
/**
 * P31 VFR: AUTO or MANUAL bus with voltage (depth %) and frequency (Hz).
 * AUTO = full plant (strict mesh, full verify; glass off unless P31_VFR_AUTO_GLASS=1).
 * MANUAL = operator setpoints via ~/.p31/vfr.json and/or P31_VFR_VOLTAGE / P31_VFR_FREQUENCY.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolveVfrSync } from "./p31-vfr-resolve.mjs";
import { runFullAutomation } from "./p31-full-automation.mjs";

function usage() {
  console.log(`Usage: npm run vfr:auto | npm run vfr:manual

  vfr:auto     — V=100% F=60Hz (strict), full root verify; add P31_VFR_AUTO_GLASS=1 for glass
  vfr:manual   — setpoints from ~/.p31/vfr.json or P31_VFR_VOLTAGE / P31_VFR_FREQUENCY

  Manual law (file or env):
    voltage 0–100%  : depth — mesh ≥15%, root verify ≥45%, glass ≥80%
    frequency Hz     : F < 65 = loose live mesh, F ≥ 65 = MESH_LIVE_STRICT=1
  Example:  cp scripts/p31-vfr.json.example ~/.p31/vfr.json
`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    usage();
    process.exit(0);
  }

  let mode = /** @type {"auto"|"manual"|""} */ ("");
  const first = argv[0];
  if (first === "auto" || first === "manual") mode = first;
  else if (process.env.P31_VFR_MODE === "auto" || process.env.P31_VFR_MODE === "manual") mode = process.env.P31_VFR_MODE;
  else {
    console.error("Specify: auto | manual (or npm run vfr:auto / vfr:manual)");
    usage();
    process.exit(2);
  }

  const plan = resolveVfrSync({ mode });

  console.log("P31 VFR — " + plan.summary + "\n");

  const { failed } = await runFullAutomation({
    skipRootVerify: !plan.runRootVerify,
    runMesh: plan.runMesh,
    runGlass: plan.runGlass,
    meshLiveStrict: plan.meshLiveStrict,
    runPasskeyDryRun: plan.runPasskeyDryRun,
    verbose: true,
  });

  if (failed) {
    process.exit(1);
  }
  console.log("\nP31 VFR: all gates under current setpoints passed.");
  process.exit(0);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
