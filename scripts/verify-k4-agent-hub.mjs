#!/usr/bin/env node
/**
 * verify-k4-agent-hub — manifest + worker + static page parity.
 *
 * Asserts:
 *   1. p31-k4-agent-hub.json: schema p31.k4AgentHub/1.0.0; 4 vertices; 6 edges.
 *   2. K₄ invariant |E| = n*(n-1)/2; every vertex has 3 distinct neighbors.
 *   3. Every vertex has anchor + verb + personalDock + ≥1 skill.
 *   4. Edge set is the full set of C(4,2)=6 unordered pairs.
 *   5. Bipartite cover lists 4 personal-tetra docks (structure/connection/rhythm/creation).
 *   6. packages/k4-agent-hub/wrangler.toml declares 4 DO classes (one per vertex).
 *   7. packages/k4-agent-hub/src/topology.js mentions all 4 vertex ids.
 *   8. agents.html references all 4 hub ids (case-insensitive).
 *
 * Read-only. No partial-clone tolerance needed — all artefacts ship in the
 * home repo (no andromeda/ dependency).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const EXPECTED_VERTICES = ["forge", "counsel", "scholar", "scribe"];
const EXPECTED_DOCKS = ["structure", "connection", "rhythm", "creation"];
const EXPECTED_ANCHORS = new Set(["teal", "coral", "phosphorus", "lavender", "butter", "cyan", "amethyst"]);
const EXPECTED_SCHEMA = "p31.k4AgentHub/1.1.0";
const EXPECTED_FEDERATION_SCHEMA = "p31.k4AgentHubFederation/1.0.0";
const EXPECTED_FAMILY_VERTICES = ["will", "sj", "wj", "christyn"];

const MANIFEST = path.join(root, "p31-k4-agent-hub.json");
const WORKER_PKG = path.join(root, "packages/k4-agent-hub");
const WRANGLER_TOML = path.join(WORKER_PKG, "wrangler.toml");
const TOPOLOGY_JS = path.join(WORKER_PKG, "src/topology.js");
const CRYPTO_JS = path.join(WORKER_PKG, "src/crypto.js");
const DISPATCHER_JS = path.join(WORKER_PKG, "src/dispatcher.js");
const AGENTS_HTML = path.join(root, "agents.html");
const SMOKE_SCRIPT = path.join(root, "scripts/k4-agent-hub-smoke.mjs");
const P31CA_MIRROR = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/agents.html");

function fail(msg) {
  console.error(`verify-k4-agent-hub: ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`verify-k4-agent-hub: ${msg}`);
}

function readJson(p) {
  if (!fs.existsSync(p)) fail(`missing ${path.relative(root, p)}`);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`invalid JSON in ${path.relative(root, p)} — ${e.message}`);
  }
}

function readText(p) {
  if (!fs.existsSync(p)) fail(`missing ${path.relative(root, p)}`);
  return fs.readFileSync(p, "utf8");
}

// ----- 1. Manifest schema & shape -------------------------------------------
const manifest = readJson(MANIFEST);
if (manifest.schema !== EXPECTED_SCHEMA) {
  fail(`schema must be ${EXPECTED_SCHEMA} (got ${manifest.schema})`);
}
if (!manifest.topology || manifest.topology.kind !== "K4") {
  fail("topology.kind must be K4");
}
if (manifest.topology.vertices !== 4 || manifest.topology.edges !== 6) {
  fail(`topology must declare 4 vertices and 6 edges; got ${manifest.topology.vertices}/${manifest.topology.edges}`);
}
if (!Array.isArray(manifest.vertices) || manifest.vertices.length !== 4) {
  fail("manifest.vertices must be an array of 4");
}
if (!Array.isArray(manifest.edges) || manifest.edges.length !== 6) {
  fail("manifest.edges must be an array of 6");
}

// Vertex ids
const ids = manifest.vertices.map((v) => v.id);
for (const v of EXPECTED_VERTICES) {
  if (!ids.includes(v)) fail(`vertex id "${v}" missing from manifest.vertices`);
}
if (new Set(ids).size !== 4) fail("manifest.vertices ids are not unique");

// Per-vertex required keys
for (const v of manifest.vertices) {
  if (typeof v.id !== "string") fail(`vertex missing id`);
  if (typeof v.verb !== "string") fail(`vertex ${v.id} missing verb`);
  if (typeof v.anchor !== "string" || !EXPECTED_ANCHORS.has(v.anchor)) {
    fail(`vertex ${v.id} anchor "${v.anchor}" not in K₄ anchor palette`);
  }
  if (!EXPECTED_DOCKS.includes(v.personalDock)) {
    fail(`vertex ${v.id} personalDock must be one of ${EXPECTED_DOCKS.join(", ")}`);
  }
  if (!Array.isArray(v.skills) || v.skills.length < 1) fail(`vertex ${v.id} has no skills`);
  for (const s of v.skills) {
    if (typeof s.id !== "string") fail(`vertex ${v.id} has a skill without an id`);
    if (typeof s.label !== "string") fail(`vertex ${v.id}.skill ${s.id} missing label`);
  }
}

// Skill ids unique across the entire hub
const allSkillIds = manifest.vertices.flatMap((v) => v.skills.map((s) => s.id));
if (new Set(allSkillIds).size !== allSkillIds.length) {
  fail(`skill ids are not unique across the hub: ${allSkillIds.join(",")}`);
}

// Edges: K₄ formula |E| = n*(n-1)/2 = 6
const expectedPairs = new Set();
for (let i = 0; i < EXPECTED_VERTICES.length; i++) {
  for (let j = i + 1; j < EXPECTED_VERTICES.length; j++) {
    expectedPairs.add([EXPECTED_VERTICES[i], EXPECTED_VERTICES[j]].sort().join("|"));
  }
}
const actualPairs = new Set();
for (const e of manifest.edges) {
  if (typeof e.from !== "string" || typeof e.to !== "string") fail(`edge missing from/to: ${JSON.stringify(e)}`);
  if (e.from === e.to) fail(`edge self-loop on ${e.from}`);
  if (!ids.includes(e.from) || !ids.includes(e.to)) {
    fail(`edge references unknown vertex: ${e.from}↔${e.to}`);
  }
  const key = [e.from, e.to].sort().join("|");
  if (actualPairs.has(key)) fail(`duplicate edge ${e.from}↔${e.to}`);
  actualPairs.add(key);
}
for (const p of expectedPairs) {
  if (!actualPairs.has(p)) fail(`missing K₄ edge ${p.replace("|", "↔")}`);
}

// Bipartite cover
if (!Array.isArray(manifest.bipartiteCover?.pairs) || manifest.bipartiteCover.pairs.length !== 4) {
  fail("bipartiteCover.pairs must be an array of 4");
}
const bipartiteAgents = manifest.bipartiteCover.pairs.map((p) => p.agent);
const bipartitePersonals = manifest.bipartiteCover.pairs.map((p) => p.personal);
for (const v of EXPECTED_VERTICES) {
  if (!bipartiteAgents.includes(v)) fail(`bipartiteCover missing agent ${v}`);
}
for (const d of EXPECTED_DOCKS) {
  if (!bipartitePersonals.includes(d)) fail(`bipartiteCover missing personal dock ${d}`);
}
if (new Set(bipartiteAgents).size !== 4 || new Set(bipartitePersonals).size !== 4) {
  fail("bipartiteCover pairs are not 1-to-1");
}

// Dock protocol shape (light check)
const dp = manifest.dockProtocol;
if (!dp || dp.version !== "1.0.0" || !Array.isArray(dp.endpoints) || dp.endpoints.length < 4) {
  fail("dockProtocol must declare version 1.0.0 and at least 4 endpoints");
}
const requiredEndpointPaths = ["/v1/dock", "/v1/topology"];
for (const want of requiredEndpointPaths) {
  if (!dp.endpoints.some((e) => e.path === want)) fail(`dockProtocol.endpoints missing ${want}`);
}

// v1.1.0 — signed dock + family triadic cover + federation + dispatcher
if (!dp.auth?.signedDock || dp.auth.signedDock.alg !== "Ed25519") {
  fail(`dockProtocol.auth.signedDock must declare alg Ed25519 (v1.1.0)`);
}
if (!dp.auth?.signedCallEnvelope) fail(`dockProtocol.auth.signedCallEnvelope missing (v1.1.0)`);

const triadic = manifest.triadicCover;
if (!triadic || !Array.isArray(triadic.vertices) || triadic.vertices.length !== 4) {
  fail("triadicCover.vertices must be an array of 4 family vertices (v1.1.0)");
}
const familyIds = triadic.vertices.map((v) => v.id);
for (const id of EXPECTED_FAMILY_VERTICES) {
  if (!familyIds.includes(id)) fail(`triadicCover missing family vertex ${id}`);
}
for (const v of triadic.vertices) {
  if (!EXPECTED_DOCKS.includes(v.personalDock)) fail(`family ${v.id} bad personalDock ${v.personalDock}`);
  if (!EXPECTED_VERTICES.includes(v.guardianAgent)) fail(`family ${v.id} bad guardianAgent ${v.guardianAgent}`);
}
const childVertices = triadic.vertices.filter((v) => v.role === "child");
if (childVertices.length !== 2) fail(`expected exactly 2 child vertices in family (got ${childVertices.length})`);
for (const c of childVertices) {
  if (c.gate !== "child-mesh-unlock") fail(`child ${c.id} must carry child-mesh-unlock gate`);
}

const fed = manifest.federation;
if (!fed || fed.schema !== EXPECTED_FEDERATION_SCHEMA) fail(`federation.schema must be ${EXPECTED_FEDERATION_SCHEMA}`);
if (!Array.isArray(fed.endpoints) || fed.endpoints.length < 3) fail("federation must declare at least 3 endpoints");
for (const want of ["/v1/federation", "/v1/federation/peer"]) {
  if (!fed.endpoints.some((e) => e.path === want)) fail(`federation.endpoints missing ${want}`);
}
// v1.3.0+ — anchor pact, P2P dispatch, WS fanout, family cage wire (soft check via index.js)

const disp = manifest.skillDispatcher;
if (!disp || !disp.ollama || disp.ollama.envVar !== "OLLAMA_BASE_URL") {
  fail("skillDispatcher.ollama.envVar must be OLLAMA_BASE_URL");
}

ok(`manifest OK — schema ${manifest.schema}, vertices ${ids.join(",")}, edges ${manifest.edges.length}, family ${familyIds.join("/")}, federation ${fed.schema}`);

// ----- 2. Worker package: wrangler.toml + topology.js ----------------------
const wrangler = readText(WRANGLER_TOML);
for (const v of EXPECTED_VERTICES) {
  const className = v[0].toUpperCase() + v.slice(1) + "Hub";
  if (!wrangler.includes(className)) {
    fail(`wrangler.toml missing DO class ${className}`);
  }
}
if (!wrangler.includes("k4-agent-hub")) {
  fail(`wrangler.toml worker name must be "k4-agent-hub"`);
}
if (!wrangler.includes("[[migrations]]") || !wrangler.includes("new_sqlite_classes")) {
  fail(`wrangler.toml missing SQLite migration block`);
}
ok(`wrangler.toml OK — declares ${EXPECTED_VERTICES.length} DO classes`);

const topology = readText(TOPOLOGY_JS);
for (const v of EXPECTED_VERTICES) {
  if (!topology.includes(`"${v}"`)) fail(`src/topology.js missing vertex id "${v}"`);
}
if (!topology.includes(EXPECTED_SCHEMA)) {
  fail(`src/topology.js does not reference SCHEMA ${EXPECTED_SCHEMA}`);
}
for (const id of EXPECTED_FAMILY_VERTICES) {
  if (!topology.includes(`"${id}"`)) fail(`src/topology.js missing FAMILY vertex "${id}"`);
}
if (!topology.includes("FAMILY_VERTICES") || !topology.includes("TRIADIC_COVER")) {
  fail(`src/topology.js missing FAMILY_VERTICES / TRIADIC_COVER exports (v1.1.0)`);
}
ok(`topology.js OK — references 4 agent + 4 family vertex ids, schema, triadic cover`);

// ----- 2b. Crypto + dispatcher modules present ------------------------------
const WORKER_INDEX_JS = path.join(WORKER_PKG, "src/index.js");
const crypto = readText(CRYPTO_JS);
for (const symbol of [
  "Ed25519", "verifyEd25519", "canonicalDockString", "canonicalCallString",
  "PEER_DISPATCH_SCHEMA", "canonicalPeerDispatchString",     // v1.4.0
  "FAMILY_DOCK_SCHEMA", "canonicalFamilyDockString",         // v1.6.0
]) {
  if (!crypto.includes(symbol)) fail(`src/crypto.js missing required symbol "${symbol}"`);
}
ok(`crypto.js OK — Ed25519 sign/verify + canonical envelopes + peer/family dock schemas`);

const workerIndex = readText(WORKER_INDEX_JS);
for (const route of [
  "/v1/anchor/register",      // v1.3.0 anchor pact
  "/v1/federation/dispatch",  // v1.4.0 P2P dispatch
  "/v1/family/dock",          // v1.6.0 family cage wire
]) {
  if (!workerIndex.includes(route)) fail(`src/index.js missing route "${route}"`);
}
ok(`index.js OK — anchor pact + federation P2P + family dock routes (v1.3–v1.6)`);

const dispatcher = readText(DISPATCHER_JS);
for (const symbol of ["tryOllama", "structuredEcho", "OLLAMA_BASE_URL"]) {
  if (!dispatcher.includes(symbol)) fail(`src/dispatcher.js missing required symbol "${symbol}"`);
}
ok(`dispatcher.js OK — Ollama HTTP route + simplex-cloud + structured-echo fallback`);

const WS_EVENTS_JS = path.join(WORKER_PKG, "src/ws-events.js");
const wsEvents = readText(WS_EVENTS_JS);
for (const symbol of ["WS_EVENT_SCHEMA", "buildBroadcastEvent", "buildCallEvent"]) {
  if (!wsEvents.includes(symbol)) fail(`src/ws-events.js missing required symbol "${symbol}"`);
}
ok(`ws-events.js OK — hibernatable WS fanout event builders (v1.5.0)`);

// ----- 2c. Smoke runner -----------------------------------------------------
const smoke = readText(SMOKE_SCRIPT);
for (const route of ["/v1/manifest", "/v1/dock", "/v1/forge/call", "/v1/cross/forge/scholar", "/v1/federation"]) {
  if (!smoke.includes(route)) fail(`scripts/k4-agent-hub-smoke.mjs missing route ${route}`);
}
ok(`smoke.mjs OK — exercises manifest + signed dock + call + cross + federation`);

// ----- 3. Static hub navigator parity --------------------------------------
function checkAgentsHtml(label, raw) {
  const text = raw.toLowerCase();
  for (const v of EXPECTED_VERTICES) {
    if (!text.includes(v)) fail(`${label} missing reference to vertex "${v}"`);
  }
  if (!text.includes("p31.k4agenthub")) {
    fail(`${label} should reference the schema id (p31.k4AgentHub/1.x.x)`);
  }
  if (!text.includes("k₄,₄,₄") && !text.includes("triadic cover")) {
    fail(`${label} should reference the K₄,₄,₄ triadic cover (v1.1.0)`);
  }
  if (!text.includes("federation")) {
    fail(`${label} should reference the federation panel (v1.1.0)`);
  }
}
checkAgentsHtml("agents.html", readText(AGENTS_HTML));
ok(`agents.html OK — vertex ids, schema, triadic cover, federation`);

if (fs.existsSync(P31CA_MIRROR)) {
  checkAgentsHtml("p31ca/public/agents.html mirror", readText(P31CA_MIRROR));
  ok(`p31ca/public/agents.html mirror OK`);
} else {
  ok(`p31ca/public/agents.html mirror not present (partial clone — skipped)`);
}

// ----- Done -----------------------------------------------------------------
ok(`OK — K₄ agent worker tetrahedron in canon parity v1.6.0 (${ids.length} vertices · ${manifest.edges.length} edges · 4 family · anchor-pact · P2P-dispatch · WS-fanout · family-cage-wire)`);
process.exit(0);
