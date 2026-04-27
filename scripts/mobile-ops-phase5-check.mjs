#!/usr/bin/env node
/**
 * CWP mobile ops — Phase 5: Connect — edge URLs (mesh, BONDING, passkey).
 * Usage: --skip-passkey-post
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const constantsPath = path.join(root, "p31-constants.json");

const skipPost = process.argv.includes("--skip-passkey-post");

function loadConstants() {
  return JSON.parse(fs.readFileSync(constantsPath, "utf8"));
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function getStatus(url, init) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(25000) });
  return r.status;
}

async function main() {
  console.log("P31 mobile ops — Phase 5 (Connect) check\n");
  const c = loadConstants();
  const mesh = c.mesh || {};
  const k4 = mesh.k4PersonalWorkerUrl || "https://k4-personal.trimtab-signal.workers.dev";
  const passkeyBase = "https://p31ca.org" + (mesh.passkeyApiBasePath || "/api/passkey");
  const registerBegin = passkeyBase.replace(/\/$/, "") + "/register-begin";

  const checks = [
    { name: "p31ca /connect (page)", url: "https://p31ca.org/connect" },
    { name: "BONDING public", url: c.bonding?.publicUrl || "https://bonding.p31ca.org/" },
    { name: "bonding-relay /health", url: "https://bonding-relay.trimtab-signal.workers.dev/health" },
    { name: "k4-personal /api/health", url: k4.replace(/\/$/, "") + "/api/health" },
  ];

  for (const { name, url } of checks) {
    const st = await getStatus(url, { method: "GET" });
    if (st !== 200) {
      console.error(`[x]  ${name}: ${st} ${url}`);
      process.exit(1);
    }
    console.log(`[ok]  ${st}  ${name}`);
  }

  const getPk = await getStatus(registerBegin, { method: "GET" });
  if (getPk !== 405) {
    console.error(`[x]  passkey register-begin GET: expected 405, got ${getPk}`);
    process.exit(1);
  }
  console.log(`[ok]  ${getPk}  passkey register-begin (GET disallowed, expected)`);

  if (!skipPost) {
    const r = await fetch(registerBegin, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(25000),
    });
    const t = await r.text();
    if (r.status !== 200) {
      console.error(`[x]  passkey POST register-begin: ${r.status} ${t.slice(0, 200)}`);
      process.exit(1);
    }
    if (!t.includes("challenge") && !t.includes("Challenge")) {
      console.warn("  (warn) POST body may not look like WebAuthn options — check if edge changed");
    }
    console.log(`[ok]  ${r.status}  passkey register-begin (POST + JSON)`);
  } else {
    console.log("[--]  skip passkey POST (--skip-passkey-post)");
  }

  console.log("\nPhase 5: OK — iPhone: Face ID on connect = manual; see docs/MOBILE-OPS-PHASE5.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
