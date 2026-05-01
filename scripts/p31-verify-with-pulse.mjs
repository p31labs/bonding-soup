#!/usr/bin/env node
/**
 * Run `npm run verify` and, on success, append a real entry to
 * docs/verify-pulse.json via record-verify-pulse.mjs.
 *
 *   npm run verify:pulse
 *
 * Exit code: same as the inner `npm run verify`.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const t0 = Date.now();
let stepCount = 0;

console.log("verify:pulse: running `npm run verify`…");
const child = spawn("npm", ["run", "verify"], { cwd: root, stdio: ["inherit", "pipe", "inherit"] });
child.stdout.on("data", (b) => {
  const s = b.toString();
  process.stdout.write(s);
  // Each top-level npm script step starts with `> bonding-soup@…`.
  const matches = s.match(/^> bonding-soup@/gm);
  if (matches) stepCount += matches.length;
});

child.on("close", (code) => {
  const ms = Date.now() - t0;
  if (code === 0) {
    console.log(`\nverify:pulse: green in ${(ms / 1000).toFixed(1)}s · ${stepCount} steps · recording pulse…`);
    const rec = spawn("node", [path.join(root, "scripts/record-verify-pulse.mjs"), "--ms", String(ms), "--steps", String(stepCount), "--exit", "0", "--command", "verify:pulse"], { cwd: root, stdio: "inherit" });
    rec.on("close", (rc) => process.exit(rc || 0));
  } else {
    console.log(`\nverify:pulse: failed (exit ${code}) — not recording pulse.`);
    process.exit(code || 1);
  }
});
