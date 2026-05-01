#!/usr/bin/env node
/**
 * Independent home verifiers in one parallel wave (no ordering vs default `npm run verify`).
 * Safe subset: file/registry reads + cf-edge-lab wrangler dry-run (isolated package).
 *
 *   npm run verify:parallel-batch
 *
 * Does NOT replace `verify` — use for local iteration or `p31:converge`. CI remains serial verify.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** @type {{ id: string; rel: string }[]} */
const TASKS = [
  { id: "facts", rel: "scripts/verify-facts.mjs" },
  { id: "subscriptions", rel: "scripts/verify-subscriptions.mjs" },
  { id: "p31-env", rel: "scripts/verify-p31-env.mjs" },
  { id: "mesh-canon", rel: "scripts/verify-mesh-canon.mjs" },
  { id: "runbooks", rel: "scripts/verify-runbooks-index.mjs" },
  { id: "edge-lab", rel: "scripts/verify-edge-lab.mjs" },
];

/**
 * @param {{ id: string; rel: string }} t
 * @returns {Promise<{ id: string; code: number }>}
 */
function runOne(t) {
  return new Promise((resolve) => {
    const abs = path.join(root, t.rel);
    const child = spawn(process.execPath, [abs], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", () => resolve({ id: t.id, code: 1 }));
    child.on("close", (code) => resolve({ id: t.id, code: code ?? 1 }));
  });
}

async function main() {
  const t0 = Date.now();
  console.log(`verify-independent-batch: ${TASKS.length} tasks in parallel\n`);
  const results = await Promise.all(TASKS.map(runOne));
  const bad = results.filter((r) => r.code !== 0);
  const ms = Date.now() - t0;
  if (bad.length) {
    console.error(
      "\nverify-independent-batch: FAIL —",
      bad.map((b) => `${b.id}(${b.code})`).join(", "),
      `— ${ms}ms`
    );
    process.exit(1);
  }
  console.log(`\nverify-independent-batch: OK — ${ms}ms wall`);
  process.exit(0);
}

main();
