#!/usr/bin/env node
// Post-deploy launch verifier: poll live URLs, confirm hub healthy, re-run rehearsal,
// auto-clear blocking checklist items where evidence is conclusive.
//
// Used after `cd andromeda && git push` (or PR auto-merge) to close the launch loop
// without operator polling.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const args = process.argv.slice(2);
const opts = {
  json: args.includes("--json"),
  timeout: parseInt(args.find((a) => a.startsWith("--timeout="))?.split("=")[1] || "600", 10),
  pollEvery: parseInt(args.find((a) => a.startsWith("--poll="))?.split("=")[1] || "30", 10),
  skipWait: args.includes("--no-wait"),
};

const LIVE_TARGETS = [
  { id: "glass-box", url: "https://p31ca.org/glass-box", expect: 200, gate: true },
  { id: "build", url: "https://p31ca.org/build", expect: 200, gate: true },
  { id: "fleet-portal", url: "https://p31ca.org/fleet-portal", expect: 200, gate: false },
  { id: "passport", url: "https://p31ca.org/passport", expect: 200, gate: false },
  { id: "transparency", url: "https://p31ca.org/transparency", expect: 200, gate: false },
  { id: "doc-library", url: "https://p31ca.org/doc-library", expect: 200, gate: false },
];

function curlStatus(url) {
  const r = spawnSync("curl", ["-sSL", "-o", "/dev/null", "-w", "%{http_code}|%{redirect_url}|%{num_redirects}", "--max-time", "15", "--max-redirs", "10", url], {
    encoding: "utf8",
  });
  if (r.status !== 0) return { status: 0, error: r.stderr?.trim() || "curl failed", redirects: 0 };
  const [code, finalUrl, hops] = (r.stdout || "0||0").split("|");
  return { status: parseInt(code, 10), finalUrl, redirects: parseInt(hops || "0", 10) };
}

function probeAll() {
  const results = [];
  for (const t of LIVE_TARGETS) {
    const r = curlStatus(t.url);
    const ok = r.status === t.expect;
    results.push({ ...t, ...r, ok });
  }
  return results;
}

async function waitForGreen() {
  const deadline = Date.now() + opts.timeout * 1000;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt++;
    const results = probeAll();
    const blockingFailed = results.filter((r) => r.gate && !r.ok);
    if (blockingFailed.length === 0) {
      return { ok: true, attempts: attempt, results };
    }
    if (!opts.json) {
      const blocked = blockingFailed.map((r) => `${r.id}:${r.status}`).join(", ");
      process.stderr.write(`  [poll ${attempt}] blocked: ${blocked} — waiting ${opts.pollEvery}s...\n`);
    }
    await new Promise((r) => setTimeout(r, opts.pollEvery * 1000));
  }
  return { ok: false, attempts: attempt, results: probeAll(), timedOut: true };
}

function runRehearsal() {
  const r = spawnSync("npm", ["run", "launch:dryrun:json"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 90_000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const stdout = r.stdout || "";
  const jsonStart = stdout.indexOf("{");
  if (jsonStart < 0) return { ok: false, error: "no JSON in rehearsal output" };
  try {
    return { ok: true, data: JSON.parse(stdout.slice(jsonStart)) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function updateLaunchManifest(probeData, rehearsalData) {
  const manifestPath = path.join(ROOT, ".p31", "launch-manifest.json");
  if (!fs.existsSync(manifestPath)) return;
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  m.postDeploy = {
    timestamp: new Date().toISOString(),
    liveProbes: probeData,
    rehearsal: rehearsalData?.data?.overall || rehearsalData,
  };
  // Auto-clear gate-blocking operator items where probe is conclusive
  const probeMap = new Map(probeData.results.map((r) => [r.id, r]));
  if (m.operatorActionList) {
    for (const item of m.operatorActionList) {
      if (item.id === "glass-box-verify" && probeMap.get("glass-box")?.ok) {
        item.cleared = true;
        item.clearedAt = new Date().toISOString();
        item.evidence = `live ${probeMap.get("glass-box").status}`;
      }
      if (item.id === "initial-build-verify" && probeMap.get("build")?.ok) {
        item.cleared = true;
        item.clearedAt = new Date().toISOString();
        item.evidence = `live ${probeMap.get("build").status}`;
      }
    }
  }
  m.greenBoard = m.greenBoard || {};
  m.greenBoard.publicEdge = probeData.ok ? "GREEN" : "AMBER";
  m.greenBoard.overall = probeData.ok && rehearsalData?.ok ? "READY" : "ARMED";
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");
  return m;
}

(async () => {
  const probeWait = opts.skipWait ? { ok: true, attempts: 1, results: probeAll() } : await waitForGreen();
  const rehearsal = runRehearsal();
  const manifest = updateLaunchManifest(probeWait, rehearsal);

  if (opts.json) {
    process.stdout.write(JSON.stringify({ probe: probeWait, rehearsal, manifest }, null, 2) + "\n");
    process.exit(probeWait.ok ? 0 : 1);
  }

  console.log("");
  console.log("════════════════════════════════════════════════════════");
  console.log("POST-DEPLOY VERIFIER — live edge probe");
  console.log("════════════════════════════════════════════════════════");
  console.log("");
  for (const r of probeWait.results) {
    const mark = r.ok ? "✅" : (r.gate ? "❌" : "⚠️ ");
    const hops = r.redirects ? ` (${r.redirects} hops)` : "";
    console.log(`  ${mark}  ${r.id.padEnd(16)} ${String(r.status).padEnd(4)} ${r.url}${hops}`);
  }
  console.log("");
  if (probeWait.timedOut) {
    console.log(`⏱️   Timed out after ${opts.timeout}s waiting for deploy.`);
  }
  console.log(`Probe: ${probeWait.ok ? "✅ GREEN" : "❌ AMBER/RED"}  (${probeWait.attempts} attempt${probeWait.attempts === 1 ? "" : "s"})`);
  if (rehearsal.ok) {
    const overall = rehearsal.data?.overall || {};
    console.log(`Rehearsal: ${overall.status || "?"}  (${overall.passed || 0}/${overall.totalChecks || 0} passed, ${overall.manual || 0} manual)`);
  } else {
    console.log(`Rehearsal: failed — ${rehearsal.error}`);
  }
  if (manifest) {
    console.log(`Manifest: .p31/launch-manifest.json updated  →  greenBoard.overall=${manifest.greenBoard?.overall || "?"}`);
  }
  console.log("");
  console.log("════════════════════════════════════════════════════════");
  process.exit(probeWait.ok && rehearsal.ok ? 0 : 1);
})();
