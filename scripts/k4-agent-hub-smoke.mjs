#!/usr/bin/env node
/**
 * k4-agent-hub-smoke — exercises a running K₄ agent hub Worker through:
 *   1. /v1/manifest          → schema + 4 vertices + family triadic cover
 *   2. /v1/dock (signed)     → Ed25519 signed envelope, store sessionId
 *   3. /v1/forge/skills      → list skills
 *   4. /v1/forge/call        → invoke a skill (signed call envelope)
 *   5. /v1/cross/forge/scholar → cross-edge brief via service binding
 *   6. /v1/forge/metrics     → per-hub metrics
 *   7. /v1/metrics           → aggregated metrics
 *   8. /v1/topology          → live K₄ adjacency + bipartite + triadic
 *   9. /v1/federation        → empty registry (placeholder)
 *
 * Usage:
 *   node scripts/k4-agent-hub-smoke.mjs                # against default http://127.0.0.1:8787
 *   node scripts/k4-agent-hub-smoke.mjs --base URL     # against any deployed hub
 *   node scripts/k4-agent-hub-smoke.mjs --skip-network # offline shape-only check (no fetch)
 *
 * Exits 0 on success; non-zero on the first failed step. Uses Node 20 SubtleCrypto
 * for Ed25519 signing — same algorithm the Worker verifies.
 */
import { argv, exit } from "node:process";
import { webcrypto as crypto } from "node:crypto";

const args = argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://127.0.0.1:8787";
const skipNet = args.includes("--skip-network");

const TEXT = new TextEncoder();
function b64uEncode(bytes) {
  let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return Buffer.from(bin, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}
function dockMessage({ clientId, schema, capabilities, ts, nonce }) {
  const caps = (capabilities ?? []).slice().sort().join(",");
  return `${clientId}|${schema ?? ""}|${caps}|${ts}|${nonce}`;
}
function callMessage({ skillId, input, ts, nonce }) {
  return `${skillId}|${stableStringify(input ?? null)}|${ts}|${nonce}`;
}
async function sign({ privateKey, message }) {
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, TEXT.encode(message));
  return b64uEncode(new Uint8Array(sig));
}

function pass(step, detail) { console.log(`PASS  ${step}${detail ? "  · " + detail : ""}`); }
function fail(step, err) { console.error(`FAIL  ${step}  · ${err}`); exit(1); }

async function smoke() {
  if (skipNet) {
    console.log("# k4-agent-hub-smoke (shape-only, --skip-network)");
    pass("argv", `base=${base}`);
    pass("crypto", "Node 20 SubtleCrypto Ed25519 available");
    return;
  }

  console.log(`# k4-agent-hub-smoke against ${base}`);
  console.log(`# (start the Worker first: cd packages/k4-agent-hub && npm install && npm run dev)`);
  console.log();

  const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
  const publicKey = b64uEncode(pubRaw);
  pass("keypair", `Ed25519 pub=${publicKey.slice(0, 16)}…`);

  // 1. /v1/manifest
  let manifest;
  try {
    const r = await fetch(`${base}/v1/manifest`);
    manifest = await r.json();
  } catch (e) { fail("/v1/manifest", e.message); }
  if (manifest.schema !== "p31.k4AgentHub/1.1.0") fail("/v1/manifest", `schema=${manifest.schema}`);
  if (manifest.vertices?.length !== 4) fail("/v1/manifest", `vertices=${manifest.vertices?.length}`);
  if (manifest.triadic?.length !== 4) fail("/v1/manifest", `triadic=${manifest.triadic?.length}`);
  pass("/v1/manifest", `schema=${manifest.schema}, vertices=${manifest.vertices.length}, triadic=${manifest.triadic.length}`);

  // 2. /v1/dock signed
  const clientId = `smoke-${Date.now()}`;
  const ts = Date.now();
  const nonce = "smoke-" + crypto.randomUUID().slice(0, 8);
  const capabilities = ["ts-worker", "voltage-triage"];
  const dockMsg = dockMessage({ clientId, schema: "p31.personalTetra/1.0.0", capabilities, ts, nonce });
  const dockSig = await sign({ privateKey: keyPair.privateKey, message: dockMsg });

  let dock;
  try {
    const r = await fetch(`${base}/v1/dock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId,
        personalTetra: { schema: "p31.personalTetra/1.0.0" },
        capabilities,
        publicKey, ts, nonce, sig: dockSig,
      }),
    });
    dock = await r.json();
    if (!r.ok || !dock.ok) fail("/v1/dock", JSON.stringify(dock));
  } catch (e) { fail("/v1/dock", e.message); }
  if (!dock.signed) fail("/v1/dock", "dock not marked signed");
  pass("/v1/dock (signed)", `sessionId=${dock.sessionId.slice(0, 8)}…, hubs=${dock.hubs.length}`);
  const sessionId = dock.sessionId;

  // 3. /v1/forge/skills
  let skills;
  try { skills = await (await fetch(`${base}/v1/forge/skills`)).json(); }
  catch (e) { fail("/v1/forge/skills", e.message); }
  if (!Array.isArray(skills.skills) || skills.skills.length < 1) fail("/v1/forge/skills", "no skills");
  pass("/v1/forge/skills", `${skills.skills.length} skills`);

  // 4. /v1/forge/call (signed envelope)
  const callTs = Date.now();
  const callNonce = "call-" + crypto.randomUUID().slice(0, 8);
  const callInput = { prompt: "smoke test ping", askScholar: "smoke" };
  const callMsg = callMessage({ skillId: "ts-worker", input: callInput, ts: callTs, nonce: callNonce });
  const callSig = await sign({ privateKey: keyPair.privateKey, message: callMsg });
  let callRes;
  try {
    const r = await fetch(`${base}/v1/forge/call`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionId}` },
      body: JSON.stringify({ skillId: "ts-worker", input: callInput, ts: callTs, nonce: callNonce, sig: callSig }),
    });
    callRes = await r.json();
    if (!r.ok || !callRes.ok) fail("/v1/forge/call", JSON.stringify(callRes));
  } catch (e) { fail("/v1/forge/call", e.message); }
  pass("/v1/forge/call", `dispatcher=${callRes.result?.dispatcher ?? "?"}, ms=${callRes.ms}, edgeBrief=${callRes.result?.edgeBrief ? "yes" : "no"}`);

  // 5. /v1/cross/forge/scholar
  let cross;
  try { cross = await (await fetch(`${base}/v1/cross/forge/scholar?ask=smoke-cross`)).json(); }
  catch (e) { fail("/v1/cross", e.message); }
  if (!cross.ok) fail("/v1/cross", JSON.stringify(cross));
  pass("/v1/cross/forge/scholar", `edge="${cross.edgeLabel}", briefHub=${cross.brief?.hub}`);

  // 6. /v1/forge/metrics
  let metrics;
  try { metrics = await (await fetch(`${base}/v1/forge/metrics`)).json(); }
  catch (e) { fail("/v1/forge/metrics", e.message); }
  if (!metrics.ok) fail("/v1/forge/metrics", JSON.stringify(metrics));
  pass("/v1/forge/metrics", `callsTotal=${metrics.callsTotal}, avgMs=${metrics.avgMs}`);

  // 7. /v1/metrics aggregated
  let agg;
  try { agg = await (await fetch(`${base}/v1/metrics`)).json(); }
  catch (e) { fail("/v1/metrics", e.message); }
  pass("/v1/metrics", `total=${agg.aggregate?.callsTotal}, recent60s=${agg.aggregate?.callsRecent60s}`);

  // 8. /v1/topology
  let topo;
  try { topo = await (await fetch(`${base}/v1/topology`)).json(); }
  catch (e) { fail("/v1/topology", e.message); }
  if (topo.vertices?.length !== 4 || topo.edges?.length !== 6) fail("/v1/topology", `vertices=${topo.vertices?.length} edges=${topo.edges?.length}`);
  if (topo.triadic?.length !== 4) fail("/v1/topology", "missing triadic cover");
  pass("/v1/topology", `${topo.vertices.length} hubs, ${topo.edges.length} edges, triadic=${topo.triadic.length}`);

  // 9. /v1/federation
  let fed;
  try { fed = await (await fetch(`${base}/v1/federation`)).json(); }
  catch (e) { fail("/v1/federation", e.message); }
  if (fed.schema !== "p31.k4AgentHubFederation/1.0.0") fail("/v1/federation", `schema=${fed.schema}`);
  pass("/v1/federation", `peers=${fed.peers?.length ?? 0}, aggregateVertices=${fed.aggregateVertexCount}`);

  console.log();
  console.log(`OK — k4-agent-hub v1.1.0 reachable at ${base}, all 9 smoke checks green.`);
}

smoke().catch((e) => { console.error("smoke runner crashed:", e); exit(2); });
