#!/usr/bin/env node
/**
 * When p31ca is present: quantum-family.html must keep the Phos handoff
 * bridge (garden_state.play_session + verifier anchors). Partial clone: skip.
 *   npm run verify:phos-play-session-bridge
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PAGE = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/quantum-family.html");

function die(msg) {
  console.error("verify-phos-play-session-bridge:", msg);
  process.exit(1);
}

if (!fs.existsSync(PAGE)) {
  console.log(
    "verify-phos-play-session-bridge: skip (no",
    path.relative(root, PAGE),
    "in this clone)"
  );
  process.exit(0);
}

const html = fs.readFileSync(PAGE, "utf8");
const need = [
  "__p31CourierPhosSnapshot",
  "buildUnifiedPhosPayload",
  "p31.playSession/1.0.0",
  "g-include-courier",
  "_handoff_bridge",
  "PHOS_HANDOFF_BRIDGE",
];
for (const s of need) {
  if (!html.includes(s)) die(`quantum-family.html missing ${JSON.stringify(s)}`);
}

console.log("verify-phos-play-session-bridge: ok");
