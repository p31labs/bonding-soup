# P31 Worker Fleet, Tetrahedrons, and Everything for Everybody Development Environment

**Document ID:** `p31.workerFleetTetraEnv/1.0.0`  
**Status:** Living document — reflects deployed state as of 2026-05-03  
**Scope:** Complete technical reference for all Workers, K₄ tetrahedron topology, and the Vibe coding environment

---

## Table of Contents

1. [Worker Fleet Overview](#1-worker-fleet-overview)
2. [Individual Tetrahedrons (K₄ Topology)](#2-individual-tetrahedrons-k₄-topology)
3. [Tetra Hub Architecture](#3-tetra-hub-architecture)
4. [Everything for Everybody Development Environment](#4-everything-for-everybody-development-environment)
5. [Integration Patterns](#5-integration-patterns)
6. [Implementation Code Reference](#6-implementation-code-reference)

---

## 1. Worker Fleet Overview

### 1.1 Fleet Topology

The P31 mesh runs on **Cloudflare Workers** — edge-deployed, serverless compute that respects the operator's medical constraints (hypoparathyroidism, AuDHD). The fleet follows K₄ geometry at every level.

| Worker | Purpose | Schema | Bindings | Live URL |
|--------|---------|--------|----------|----------|
| **k4-personal** | Personal tetrahedron (pillars a-d) | `p31.k4Personal/1.0.0` | KV, DO | `{{mesh.k4PersonalWorkerUrl}}` |
| **k4-cage** | Family cage (will, S.J., W.J., christyn) | `p31.k4Cage/1.0.0` | KV, DO | `{{mesh.k4CageWorkerUrl}}` |
| **k4-hubs** | Life-context hub fusion | `p31.k4Hubs/1.0.0` | KV, DO | `{{mesh.k4HubsWorkerUrl}}` |
| **tetra-hub** | Read-only aggregator over K₄ trio | `p31.tetraHub/1.0.0` | K4_PERSONAL, K4_CAGE, K4_HUBS | `{{mesh.tetraHubWorkerUrl}}` |
| **k4-agent-hub** | Agent tetrahedron (FORGE, COUNSEL, SCHOLAR, SCRIBE) | `p31.k4AgentHub/1.1.0` | 4 DOs, KV | `{{mesh.k4AgentHubWorkerUrl}}` |
| **geodesic-room** | Collaborative 3D shape sync DO | `p31.geodesicRoom/0.2.1` | DO, WS | `geodesic-room.trimtab-signal.workers.dev` |
| **donate-api** | Stripe checkout handler | `p31.donateApi/1.0.0` | KV, fetch | `donate-api.phosphorus31.org` |
| **command-center** | EPCP operator control plane | `p31.epcp/1.0.0` | KV, D1, Access | `command-center.trimtab-signal.workers.dev` |
| **agent-hub** | Simplex agent dispatch | `p31.agentHub/1.0.0` | KV | `{{mesh.agentHubWorkerUrl}}` |
| **orchestrator** | Workflow coordination | `p31.orchestrator/1.0.0` | D1, KV | `{{mesh.orchestratorWorkerUrl}}` |
| **social-worker** | Social platform bridge | `p31.socialWorker/1.0.0` | KV, Secrets | `social.p31ca.org` |
| **passkey** | WebAuthn registration/auth | `p31.passkey/1.0.0` | KV, D1 | `p31ca.org/api/passkey/*` |
| **cf-edge-lab** | Edge compute experiments | `p31.edgeLab/1.0.0` | — | `{{mesh.edgeLabWorkerUrl}}` |
| **bonding-relay** | C.A.R.S. WebSocket relay | `p31.bondingRelay/1.0.0` | DO, WS | Part of bonding-soup stack |

### 1.2 Fleet Verification

```bash
# Verify entire fleet liveness
npm run ecosystem:glass          # Fetches all glassProbes
npm run verify:mesh             # K₄ trio health
npm run verify:k4-agent-hub     # Agent tetrahedron
npm run verify:tetra-hub        # Aggregator health
npm run inventory:cf            # Wrangler inventory
```

### 1.3 Service Binding Topology

```
┌─────────────────────────────────────────────────────────────┐
│                      TETRA-HUB (aggregator)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ K4_PERSONAL │  │   K4_CAGE   │  │   K4_HUBS   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                 │
│    ┌────┴────────────────┴────────────────┴────┐            │
│    │         GET /api/tetra                    │            │
│    │   (fused personal + cage + hubs)         │            │
│    └──────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Individual Tetrahedrons (K₄ Topology)

### 2.1 The K₄ Complete Graph

Every P31 mesh unit is a **K₄** — 4 vertices, 6 edges, complete interconnection. No orphan channels. Every member one edge from every other.

```
        [FORGE] ────── safe to ship ────── [COUNSEL]
         /  \                               /  \
        /    \  design from research       /    \
       /      \                           /      \
  make·remember /        \           /        \ protect·understand
     /          \     /             \     /          \
    /            \   /               \   /            \
[SCRIBE] ──────── publish the understanding ─────── [SCHOLAR]
```

### 2.2 Tetrahedron Types

| Tetra Type | Vertices | Purpose | Live Instance |
|------------|----------|---------|---------------|
| **Personal** | a, b, c, d | Individual's 4 life pillars | `k4-personal` Worker |
| **Family Cage** | will, S.J., W.J., christyn | Household mesh | `k4-cage` Worker |
| **Agent Hub** | FORGE, COUNSEL, SCHOLAR, SCRIBE | AI persona dispatch | `k4-agent-hub` package |
| **Tetra-Cluster** | 4 linked tetras | 16-vertex collaboration | Vibe Phase 4 |
| **Vibe Hub** | 4 clusters | 64-vertex dev environment | Vibe Phase 5 |

### 2.3 K₄ Topology Constants

From `packages/k4-agent-hub/src/topology.js`:

```javascript
// Vertex identities (the four verbs)
export const VERTEX_IDS = ["forge", "counsel", "scholar", "scribe"];

// Personal tetra dock pairings
export const PERSONAL_DOCK_FOR = {
  forge: "structure",    // You build · forge tools
  counsel: "connection",   // You reach · counsel keeps
  scholar: "rhythm",       // You pace · scholar charts
  scribe: "creation",      // You make · scribe records
};

// Color anchors (universal canon)
export const ANCHOR_FOR = {
  forge: "teal",
  counsel: "coral",
  scholar: "phosphorus",
  scribe: "lavender",
};

// The six edges (C(4,2) = 6)
export const EDGES = [
  { from: "forge",   to: "counsel", label: "safe to ship",             verb: "make·protect" },
  { from: "forge",   to: "scholar", label: "design from research",     verb: "make·understand" },
  { from: "forge",   to: "scribe",  label: "write what you build",     verb: "make·remember" },
  { from: "counsel", to: "scholar", label: "brief the brief",          verb: "protect·understand" },
  { from: "counsel", to: "scribe",  label: "file the protect",         verb: "protect·remember" },
  { from: "scholar", to: "scribe",  label: "publish the understanding", verb: "understand·remember" },
];
```

### 2.4 Adjacency Map

Every vertex has exactly **3 neighbors** (n-1 for K₄):

```javascript
export const ADJACENCY = {
  forge:   ["counsel", "scholar", "scribe"],
  counsel: ["forge",   "scholar", "scribe"],
  scholar: ["forge",   "counsel", "scribe"],
  scribe:  ["forge",   "counsel", "scholar"],
};
```

### 2.5 Skill Registry

Each vertex hosts specialized skills mapping to Ollama personas:

```javascript
export const SKILLS = {
  forge: [
    { id: "ts-worker",    ollamaPersona: "p31-mechanic",  simplexLane: "FORGE" },
    { id: "esp-firmware", ollamaPersona: "p31-firmware",  simplexLane: null },
    { id: "one-liner",    ollamaPersona: "p31-quick",     simplexLane: null },
  ],
  counsel: [
    { id: "pro-se-georgia", ollamaPersona: "p31-counsel", simplexLane: "COUNSEL" },
    { id: "voltage-triage", ollamaPersona: "p31-triage",  simplexLane: "HERALD" },
    { id: "post-incident",  ollamaPersona: "p31-debrief", simplexLane: null },
  ],
  scholar: [
    { id: "grants-synthesis",  ollamaPersona: "p31-narrator", simplexLane: "SCHOLAR" },
    { id: "q-factor-patterns", ollamaPersona: "p31-oracle",   simplexLane: "ORACLE" },
  ],
  scribe: [
    { id: "passport-mirror", ollamaPersona: "p31-scribe", simplexLane: "SCRIBE" },
    { id: "phos-companion",  ollamaPersona: "p31-phos",   simplexLane: null, gate: "child-mesh-unlock" },
  ],
};
```

### 2.6 Family Cage (K₄,₄,₄ Triadic Cover)

Family vertices bridge personal → agent tetrahedrons:

```javascript
export const FAMILY_VERTICES = [
  { id: "will",     role: "operator",  personalDock: "structure",  guardianAgent: "forge",   ageBand: "adult", displayInitial: "W" },
  { id: "sj",       role: "child",     personalDock: "rhythm",     guardianAgent: "scholar", ageBand: "minor", displayInitial: "S.J.", gate: "child-mesh-unlock" },
  { id: "wj",       role: "child",     personalDock: "creation",   guardianAgent: "scribe",  ageBand: "minor", displayInitial: "W.J.", gate: "child-mesh-unlock" },
  { id: "christyn", role: "co-parent", personalDock: "connection", guardianAgent: "counsel", ageBand: "adult", displayInitial: "C" },
];

// Triadic cover: family → personal → agent
export const TRIADIC_COVER = [
  { family: "will",     personal: "structure",  agent: "forge",   ageBand: "adult", gate: null },
  { family: "sj",       personal: "rhythm",     agent: "scholar", ageBand: "minor", gate: "child-mesh-unlock" },
  { family: "wj",       personal: "creation",   agent: "scribe",  ageBand: "minor", gate: "child-mesh-unlock" },
  { family: "christyn", personal: "connection", agent: "counsel", ageBand: "adult", gate: null },
];
```

### 2.7 Topology Invariant Validation

```javascript
export function validateTopology() {
  const n = VERTEX_IDS.length;  // 4
  const expectedEdges = (n * (n - 1)) / 2;  // 6
  
  if (EDGES.length !== expectedEdges) {
    throw new Error(`K4 invariant violated: |E|=${EDGES.length} expected ${expectedEdges}`);
  }
  
  for (const v of VERTEX_IDS) {
    if (ADJACENCY[v].length !== n - 1) {
      throw new Error(`K4 invariant violated: vertex ${v} has ${ADJACENCY[v].length} neighbors`);
    }
  }
  
  // K₄,₄,₄ — family cage must have 4 vertices covering all personal docks
  if (FAMILY_VERTICES.length !== 4) {
    throw new Error(`Family cage must have 4 vertices`);
  }
}
```

---

## 3. Tetra Hub Architecture

### 3.1 Tetra-Hub Worker (Aggregator)

**Location:** `workers/tetra-hub/src/index.js`

Read-only Cloudflare Worker that aggregates the K₄ edge trio in one response.

**Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/health` | GET | Parallel health checks to k4-cage, k4-personal, k4-hubs |
| `GET /api/tetra` | GET | Fused JSON: personal + cage + hubs. Schema: `p31.tetraHub/1.0.0` |

**Code:**

```javascript
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-P31-Trace",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (request.method === "GET" && url.pathname === "/api/tetra") {
      const [personalMesh, cageMesh, hubsList] = await Promise.all([
        bindingJson(env.K4_PERSONAL, "/api/mesh"),
        bindingJson(env.K4_CAGE, "/api/mesh"),
        bindingJson(env.K4_HUBS, "/api/hubs"),
      ]);
      
      return Response.json({
        schema: "p31.tetraHub/1.0.0",
        gatheredAt: new Date().toISOString(),
        topology: {
          kind: "K4",
          vertices: 4,
          edges: 6,
          note: "Personal lattice uses pillars a-d; family cage uses named vertices",
        },
        faces: {
          personal: personalMesh,
          cage: cageMesh,
          hubs: hubsList,
        },
      });
    }
  },
};
```

### 3.2 K₄ Agent Hub Worker

**Location:** `packages/k4-agent-hub/src/index.js`

Cloudflare Worker hosting four K₄ agent hub Durable Objects.

**Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /v1/manifest` | GET | JSON manifest snapshot |
| `POST /v1/dock` | POST | Personal tetrahedron docks (Ed25519 signed) |
| `GET /v1/topology` | GET | K₄ adjacency, hub statuses, K₄,₄ + K₄,₄,₄ covers |
| `GET /v1/cross/{from}/{to}` | GET | Inter-hub edge call (adjacency-checked) |
| `POST /v1/{hub}/call` | POST | Invoke a skill |
| `WS /v1/{hub}/stream` | WS | Hibernatable WebSocket; broadcasts events |
| `POST /v1/federation/dispatch` | POST | Peer→peer signed skill dispatch |
| `POST /v1/family/dock` | POST | Operator-signed family vertex dock |
| `POST /v1/anchor/register` | POST | Ed25519 anchor pact registration |

**Durable Object Bindings (wrangler.toml):**

```toml
[[durable_objects.bindings]]
name = "FORGE"
class_name = "ForgeHub"

[[durable_objects.bindings]]
name = "COUNSEL"
class_name = "CounselHub"

[[durable_objects.bindings]]
name = "SCHOLAR"
class_name = "ScholarHub"

[[durable_objects.bindings]]
name = "SCRIBE"
class_name = "ScribeHub"
```

### 3.3 Hub Base Class

```javascript
// packages/k4-agent-hub/src/hub-base.js
export class HubBase {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.callsTotal = 0;
    this.errorsTotal = 0;
  }
  
  async fetch(request) {
    const url = new URL(request.url);
    this.callsTotal++;
    
    try {
      if (url.pathname.endsWith("/health")) {
        return Response.json({ ok: true, hub: this.hubId, load: this.getLoad() });
      }
      
      if (url.pathname.endsWith("/call")) {
        return await this.handleSkillCall(request);
      }
      
      if (url.pathname.endsWith("/edge")) {
        return await this.handleEdgeBrief(request);
      }
      
      return new Response("Not found", { status: 404 });
    } catch (e) {
      this.errorsTotal++;
      return Response.json({ ok: false, error: String(e) }, { status: 500 });
    }
  }
  
  getLoad() {
    return Math.min(1.0, this.callsTotal / 1000);
  }
}
```

### 3.4 Federation & P2P Dispatch

```javascript
// Peer registration (signed Ed25519)
async function handleFederationRegister(request, env) {
  const body = await request.json();
  const { instanceId, manifestUrl, publicKey, ts, sig } = body;
  
  // Verify timestamp skew
  const skew = Math.abs(Date.now() - ts);
  if (skew > 5 * 60 * 1000) return badRequest(`ts skew ${skew}ms exceeds 5min`);
  
  // Verify Ed25519 signature
  const pub = await importPublicKey(publicKey);
  const message = canonicalDockString({ clientId: instanceId, schema: manifestUrl, ... });
  const valid = await verifyEd25519({ publicKey: pub, message, signatureB64u: sig });
  
  if (!valid) return forbidden("peer signature did not verify");
  
  // Store peer record (TTL 24h default)
  await env.K4_AGENT_HUB.put(
    `${PEER_KV_PREFIX}${instanceId}`,
    JSON.stringify({ instanceId, manifestUrl, publicKey, expiresAt }),
    { expirationTtl: peerTtlSeconds }
  );
  
  return Response.json({ ok: true, schema: FEDERATION_SCHEMA, registered: instanceId });
}

// Peer-to-peer dispatch
async function handleFederationDispatch(request, env) {
  const body = await request.json();
  const { peerId, hubId, skillId, input, ts, sig } = body;
  
  // Lookup peer
  const peerRaw = await env.K4_AGENT_HUB.get(`${PEER_KV_PREFIX}${peerId}`);
  if (!peerRaw) return forbidden("peer not registered");
  
  // Verify dispatch signature
  const peer = JSON.parse(peerRaw);
  const pub = await importPublicKey(peer.publicKey);
  const canonical = canonicalPeerDispatchString({ peerId, hubId, skillId, ts });
  const valid = await verifyEd25519({ publicKey: pub, message: canonical, signatureB64u: sig });
  
  if (!valid) return forbidden("peer dispatch signature did not verify");
  
  // Dispatch to local hub
  const result = await dispatch({ env, hubId, skill, input });
  return Response.json({ ...result, federation: { peerId, schema: PEER_DISPATCH_SCHEMA } });
}
```

---

## 4. Everything for Everybody Development Environment

### 4.1 CWP-P31-VIBE-2026-06: Tetra-hub Vibcoding

**Status:** Phases 1-2.5 CLOSED as of 2026-05-02

The vibcoding development environment scales from **kid-button-click** through **operator-grade Cursor-equivalent** with **PHOS as the guide at every level**.

### 4.2 The 9-Level Spectrum

| Level | Surface | What User Does | PHOS Role | Tools Enabled |
|-------|---------|----------------|-----------|---------------|
| **0 — Witness** | `/vibe?lvl=0` | Reads, watches a build run | Narrates | None (read-only) |
| **1 — Button** | `/vibe?lvl=1` | Click colored buttons | "The blue button makes a sound" | Big buttons, sound, color |
| **2 — Glue** | `/vibe?lvl=2` | Drag atoms together | "These two atoms snap when close" | Geodesic shapes as code-blocks |
| **3 — Type a word** | `/vibe?lvl=3` | Type one word at a time | "Try `red`. It changes the color" | Tiny code box, token picker |
| **4 — Full sentence** | `/vibe?lvl=4` | Write a full statement | "This line might confuse the computer" | Monaco editor in-line |
| **5 — Project** | `/vibe?lvl=5` | Multi-file project | Suggests when stuck | PiP CLI, Monaco, file tree |
| **6 — Tetra** | `/vibe?lvl=6` | Operate inside 4-vertex tetra | Coordinates between vertices | Everything in 5 + tetra management |
| **7 — Cluster** | `/vibe?lvl=7` | Operate across 4 tetras | Cluster-wide coordination | Everything in 6 + cluster nav |
| **8 — Operator** | `/vibe?lvl=8` | Full Cursor-equivalent | Mechanic/counsel/oracle as needed | Everything. Direct shell, MCP bridge |

### 4.3 Composition Pattern: Tetra → Cluster → Hub → Mesh

```
TETRA (4 vertices) ──┐
TETRA (4 vertices) ──┼──→ CLUSTER (16 vertices, 4 tetras)
TETRA (4 vertices) ──┤         │
TETRA (4 vertices) ──┘         ↓
                         CLUSTER (16 vertices)
                              │
                              ↓
CLUSTER (16 vertices) ────→ HUB (64 vertices, 4 clusters)
CLUSTER (16 vertices) ────┤
CLUSTER (16 vertices) ────┤
CLUSTER (16 vertices) ────┘
                              │
                              ↓
                         MESH (open federation)
```

### 4.4 Vertex State (Per Vibcoding Tetra)

Each of the 4 vertices holds:

| Component | Storage | Schema |
|-----------|---------|--------|
| `vibe-sandbox` file tree | Durable Object SQLite | `p31.vibeSandbox/1.0.0` |
| PiP CLI session | DO memory + KV | Session-bound |
| PHOS persona memory | DO memory | Last 10 turns |
| CogPass-scoped config | Vertex-local | `p31.cogPassVertex/1.0.0` |

### 4.5 Edge Channels (6 per Tetra)

The 6 edges carry bidirectional state-sharing:

| Edge | Channel Type | Payload |
|------|--------------|---------|
| 1-2 | File sync | `p31.vibeFile/1.0.0` |
| 1-3 | Command output | ANSI stream |
| 1-4 | PHOS prompt | `p31.phosTurn/1.0.0` |
| 2-3 | CogPass snippet | Profile subset |
| 2-4 | Environment vars | `p31.vibeEnv/1.0.0` |
| 3-4 | Cross-vertex RPC | JSON-RPC subset |

### 4.6 PiP CLI Substrate

**Already exists** as `command-center-terminal.html` served at:
- `:3131/term` (original)
- `:3131/terminal` (alias)
- `:3131/vibe` (vibcoding entry)

**Features:**
- Chat to all 10 Ollama personas via `/api/personas` + `/api/persona-chat`
- Whitelisted command runner via `/api/run`
- PHOS auto-guidance after cmd finishes
- View mode for operator docs (`/api/view-doc?slug=boot-up`)

**Whitelist Contract:**

```javascript
// scripts/command-center/actions.registry.mjs
export const ACTIONS = {
  "home-doctor": { cmd: "npm", args: ["run", "doctor"], cwd: "home" },
  "home-verify": { cmd: "npm", args: ["run", "verify"], cwd: "home" },
  "home-fleet-probe": { cmd: "npm", args: ["run", "fleet:probe"], cwd: "home" },
  "home-deploy-p31ca": { cmd: "npm", args: ["run", "deploy:p31ca"], cwd: "home" },
  "home-p31-ci": { cmd: "npm", args: ["run", "p31:ci"], cwd: "home" },
  "home-fun": { cmd: "npm", args: ["run", "fun"], cwd: "home" },
  // ... andromeda-* and p31ca-* variants
};
```

### 4.7 Acceptance Test (Operator Runnable Today)

```bash
# Boot the PiP CLI
$ npm run command-center
$ open http://127.0.0.1:3131/vibe

# Test chat mode
# → pick PHOS persona → send message → see response

# Test cmd mode
# → click "doctor" card → see output
# → "Ask PHOS for the next move" appears

# Test view mode
# → click "view" tab → pick "boot-up" → see operator runbook
```

### 4.8 Phase Roadmap

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| **1** | CLOSED 2026-05-02 | CWP authored, `/vibe` entry, planetary-onboard polish |
| **2** | CLOSED 2026-05-02 | PiP CLI substrate adoption (`:3131/vibe` alias) |
| **2.5** | CLOSED 2026-05-02 | Voice cleanup, whitelist verifier, PHOS auto-guidance, view mode |
| **3** | NEXT | Monaco pane, tetra Worker (DO), vertex pivot UI, edge channels |
| **4** | QUEUED | Cluster Worker (4 tetras), MLS-bearing edges, bridge persona |
| **5** | VISION | Hub federation, open mesh, public vibcoding hub registry |
| **6** | FUTURE | i18n (es, pt, fr, ar, zh), mobile distribution |

### 4.9 Five Doctrines (Floor)

1. **Operator-condition-aware AI personas** — Every persona carries operator's medical/cognitive context
2. **K₄ family mesh as architectural primitive** — Vibcoding tetra IS a K₄
3. **Cognitive Passport as portable personalization** — No surveillance, local-only
4. **Measurable voice** — Passes `verify:public-voice` and `verify:delta-language`
5. **Sub-medical-grade by design** — PHOS guides, never diagnoses

---

## 5. Integration Patterns

### 5.1 Personal Tetra → Agent Hub Docking

```javascript
// POST /v1/dock
const dockResponse = await fetch("https://k4-agent-hub.trimtab-signal.workers.dev/v1/dock", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    clientId: "00000000-0000-4000-8000-000000000001",
    capabilities: ["ts-worker", "passport-mirror"],
    personalTetra: { schema: "p31.k4Personal/1.0.0", docks: { structure: "...", ... } },
    // Ed25519 signature optional but recommended
  }),
});

// Response includes session cookie + allowed skills
```

### 5.2 Cross-Edge Hub Call

```javascript
// GET /v1/cross/{from}/{to}?ask=...
const brief = await fetch("/v1/cross/forge/scholar?ask=What research applies?");
// Response: { ok: true, from: "forge", to: "scholar", edgeLabel: "design from research", brief: {...} }
```

### 5.3 Family Cage Wire

```javascript
// POST /v1/family/dock (operator-signed)
const familyDock = await fetch("/v1/family/dock", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    operatorClientId: "will-001",
    publicKeyB64u: "...",
    vertexId: "sj",  // or "wj"
    ts: Date.now(),
    sig: "...",  // Ed25519 signature
    childMeshToken: "...",  // Required for child-mesh-unlock gate
  }),
});
```

### 5.4 WebSocket Fanout

```javascript
// WS /v1/{hub}/stream
const ws = new WebSocket("wss://k4-agent-hub.trimtab-signal.workers.dev/v1/forge/stream");

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.schema === "p31.k4HubStream/1.0.0"
  // msg.event === "call-start" | "call-complete" | "edge-brief"
  // Broadcast to all docked clients
};
```

---

## 6. Implementation Code Reference

### 6.1 Tetra-Hub Worker (Complete)

```javascript
/**
 * Tetra Hub — read-only aggregator over the K₄ edge trio
 * @see workers/tetra-hub/README.md
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-P31-Trace",
  "Access-Control-Max-Age": "86400",
};

function withCors(res) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

async function bindingJson(service, path, init = {}) {
  if (!service) return { error: "binding_missing" };
  const req = new Request(`https://tetra.internal${path}`, {
    method: init.method || "GET",
    headers: init.headers,
    body: init.body ?? null,
  });
  try {
    const res = await service.fetch(req);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } 
    catch { body = { _parseError: true, status: res.status, snippet: text.slice(0, 800) }; }
    if (!res.ok) return { error: "upstream_http", status: res.status, body };
    return body;
  } catch (e) {
    return { error: "fetch_failed", message: String(e?.message ?? e) };
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      const [cageH, personalH, hubsH] = await Promise.all([
        bindingJson(env.K4_CAGE, "/api/health"),
        bindingJson(env.K4_PERSONAL, "/api/health"),
        bindingJson(env.K4_HUBS, "/health"),
      ]);
      const alive = (h) => Boolean(h && h.error === undefined);

      return withCors(Response.json({
        schema: "p31.tetraHubHealth/1.0.0",
        ok: true,
        worker: "tetra-hub",
        bindings: {
          K4_CAGE: Boolean(env.K4_CAGE),
          K4_PERSONAL: Boolean(env.K4_PERSONAL),
          K4_HUBS: Boolean(env.K4_HUBS),
        },
        upstream: {
          cage: { alive: alive(cageH), sample: cageH.error ? cageH : pickHealthSample(cageH) },
          personal: { alive: alive(personalH), sample: personalH.error ? personalH : pickHealthSample(personalH) },
          hubs: { alive: alive(hubsH), sample: hubsH.error ? hubsH : pickHealthSample(hubsH) },
        },
      }));
    }

    if (request.method === "GET" && url.pathname === "/api/tetra") {
      const [personalMesh, cageMesh, hubsList] = await Promise.all([
        bindingJson(env.K4_PERSONAL, "/api/mesh"),
        bindingJson(env.K4_CAGE, "/api/mesh"),
        bindingJson(env.K4_HUBS, "/api/hubs"),
      ]);

      return withCors(Response.json({
        schema: "p31.tetraHub/1.0.0",
        gatheredAt: new Date().toISOString(),
        topology: {
          kind: "K4",
          vertices: 4,
          edges: 6,
          note: "Personal lattice uses pillars a-d; family cage uses named vertices; k4-hubs fuses life-context rosters. This payload is three parallel reads, not a fourth mesh.",
        },
        faces: {
          personal: personalMesh,
          cage: cageMesh,
          hubs: hubsList,
        },
      }));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
};

function pickHealthSample(h) {
  if (!h || typeof h !== "object") return h;
  const out = {};
  for (const k of ["status", "ok", "service", "worker", "version"]) {
    if (h[k] !== undefined) out[k] = h[k];
  }
  return Object.keys(out).length ? out : { _note: "opaque health body" };
}
```

### 6.2 K₄ Topology Constants (Complete)

```javascript
// packages/k4-agent-hub/src/topology.js

export const SCHEMA = "p31.k4AgentHub/1.1.0";
export const FEDERATION_SCHEMA = "p31.k4AgentHubFederation/1.0.0";
export const FAMILY_CAGE_SCHEMA = "p31.familyCage/1.0.0";
export const FAMILY_DOCK_SCHEMA = "p31.familyDock/1.0.0";
export const PEER_DISPATCH_SCHEMA = "p31.peerDispatch/1.0.0";

export const VERTEX_IDS = ["forge", "counsel", "scholar", "scribe"];

export const PERSONAL_DOCK_FOR = {
  forge: "structure",
  counsel: "connection",
  scholar: "rhythm",
  scribe: "creation",
};

export const ANCHOR_FOR = {
  forge: "teal",
  counsel: "coral",
  scholar: "phosphorus",
  scribe: "lavender",
};

export const VERB_FOR = {
  forge: "make",
  counsel: "protect",
  scholar: "understand",
  scribe: "remember",
};

export const EDGES = [
  { from: "forge",   to: "counsel", label: "safe to ship",             verb: "make·protect" },
  { from: "forge",   to: "scholar", label: "design from research",     verb: "make·understand" },
  { from: "forge",   to: "scribe",  label: "write what you build",     verb: "make·remember" },
  { from: "counsel", to: "scholar", label: "brief the brief",          verb: "protect·understand" },
  { from: "counsel", to: "scribe",  label: "file the protect",         verb: "protect·remember" },
  { from: "scholar", to: "scribe",  label: "publish the understanding",  verb: "understand·remember" },
];

export const ADJACENCY = (() => {
  const map = Object.fromEntries(VERTEX_IDS.map((v) => [v, []]));
  for (const e of EDGES) {
    map[e.from].push(e.to);
    map[e.to].push(e.from);
  }
  return map;
})();

export const SKILLS = {
  forge: [
    { id: "ts-worker",   label: "TypeScript / Workers / Pages / D1",   ollamaPersona: "p31-mechanic", simplexLane: "FORGE",   gate: null },
    { id: "esp-firmware",label: "ESP-IDF / Node Zero firmware",          ollamaPersona: "p31-firmware", simplexLane: null,      gate: null },
    { id: "one-liner",   label: "Commit messages and one-liners",      ollamaPersona: "p31-quick",    simplexLane: null,      gate: null },
  ],
  counsel: [
    { id: "pro-se-georgia",label: "Pro se Georgia drafting",            ollamaPersona: "p31-counsel", simplexLane: "COUNSEL", gate: null },
    { id: "voltage-triage",label: "Hostile-mail voltage classification",ollamaPersona: "p31-triage",  simplexLane: "HERALD",  gate: null },
    { id: "post-incident", label: "Post-incident debrief",              ollamaPersona: "p31-debrief", simplexLane: null,      gate: null },
  ],
  scholar: [
    { id: "grants-synthesis", label: "Grants and research synthesis",   ollamaPersona: "p31-narrator", simplexLane: "SCHOLAR", gate: null },
    { id: "q-factor-patterns",label: "Q-factor / trimtab pattern detection", ollamaPersona: "p31-oracle", simplexLane: "ORACLE", gate: null },
  ],
  scribe: [
    { id: "passport-mirror",label: "Cognitive Passport assembly",        ollamaPersona: "p31-scribe", simplexLane: "SCRIBE",  gate: null },
    { id: "phos-companion", label: "Phos children companion-as-memory",  ollamaPersona: "p31-phos",   simplexLane: null,      gate: "child-mesh-unlock" },
  ],
};

export const BIPARTITE_COVER = [
  { personal: "structure",  agent: "forge",   edge: "you build · forge tools" },
  { personal: "connection", agent: "counsel", edge: "you reach · counsel keeps" },
  { personal: "rhythm",     agent: "scholar", edge: "you pace · scholar charts" },
  { personal: "creation",   agent: "scribe",  edge: "you make · scribe records" },
];

export const FAMILY_VERTICES = [
  { id: "will",     role: "operator",  personalDock: "structure",  guardianAgent: "forge",   ageBand: "adult", displayInitial: "W" },
  { id: "sj",       role: "child",     personalDock: "rhythm",     guardianAgent: "scholar", ageBand: "minor", displayInitial: "S.J.", gate: "child-mesh-unlock" },
  { id: "wj",       role: "child",     personalDock: "creation",   guardianAgent: "scribe",  ageBand: "minor", displayInitial: "W.J.", gate: "child-mesh-unlock" },
  { id: "christyn", role: "co-parent", personalDock: "connection", guardianAgent: "counsel", ageBand: "adult", displayInitial: "C" },
];

export const TRIADIC_COVER = FAMILY_VERTICES.map((f) => ({
  family: f.id,
  personal: f.personalDock,
  agent: f.guardianAgent,
  ageBand: f.ageBand,
  gate: f.gate ?? null,
}));

export function validateTopology() {
  const n = VERTEX_IDS.length;
  const expectedEdges = (n * (n - 1)) / 2;
  if (EDGES.length !== expectedEdges) {
    throw new Error(`K4 invariant violated: |E|=${EDGES.length} expected ${expectedEdges}`);
  }
  for (const v of VERTEX_IDS) {
    if (ADJACENCY[v].length !== n - 1) {
      throw new Error(`K4 invariant violated: vertex ${v} has ${ADJACENCY[v].length} neighbors, expected ${n - 1}`);
    }
    if (!SKILLS[v] || SKILLS[v].length === 0) {
      throw new Error(`Vertex ${v} has no skills registered.`);
    }
    if (!PERSONAL_DOCK_FOR[v]) {
      throw new Error(`Vertex ${v} has no personal-tetra dock pairing.`);
    }
  }
  if (FAMILY_VERTICES.length !== 4) {
    throw new Error(`Family cage must have 4 vertices (got ${FAMILY_VERTICES.length})`);
  }
  const expectedDocks = ["structure", "connection", "rhythm", "creation"];
  const docks = new Set(FAMILY_VERTICES.map((f) => f.personalDock));
  for (const d of expectedDocks) {
    if (!docks.has(d)) throw new Error(`Family cage missing personal dock ${d}`);
  }
}
```

### 6.3 Vibe PiP CLI Routes (Command Center)

```javascript
// scripts/p31-local-command-center.mjs

// Route handler for /term /terminal /vibe (ephemeralization — one HTML, three URLs)
if (pathname === "/term" || pathname === "/terminal" || pathname === "/vibe") {
  const html = await fs.readFile(
    path.join(repoRoot, "command-center-terminal.html"),
    "utf-8"
  );
  return new Response(html, { headers: { "content-type": "text/html" } });
}

// View-doc endpoint (read-only operator docs)
if (pathname === "/api/view-doc") {
  const slug = url.searchParams.get("slug");
  const DOC_SLUG_ALLOWLIST = {
    "boot-up": "docs/operator/BOOT-UP-AND-USE.md",
    "manifesto": "docs/FIVE-DOCTRINES.md",
    "vibe-cwp": "docs/CWP-P31-VIBE-2026-06.md",
    "peer-cwp": "docs/CWP-P31-PEER-COMP-2026-05.md",
    "agents": "AGENTS.md",
    "delta-language": "docs/P31-DELTA-LANGUAGE.md",
    "public-voice": "docs/PUBLIC-VOICE.md",
    "engineering-standard": "docs/P31-ENGINEERING-STANDARD.md",
  };
  
  if (!slug || !/^[a-z][a-z0-9-]{0,40}$/.test(slug)) {
    return new Response("Invalid slug", { status: 400 });
  }
  
  const docPath = DOC_SLUG_ALLOWLIST[slug];
  if (!docPath) {
    return new Response("Slug not allowlisted", { status: 403 });
  }
  
  try {
    const content = await fs.readFile(path.join(repoRoot, docPath), "utf-8");
    return new Response(content, { headers: { "content-type": "text/plain" } });
  } catch (e) {
    return new Response("Document not found", { status: 404 });
  }
}
```

---

## 7. Deployment & Operations

### 7.1 Deploy Order (K₄ Trio + Tetra-Hub)

```bash
# 1. k4-personal
pnpm --filter k4-personal deploy

# 2. k4-cage
wrangler deploy  # in k4-cage directory

# 3. k4-hubs
wrangler deploy  # in k4-hubs directory

# 4. tetra-hub (this worker — requires bindings)
cd workers/tetra-hub
npm run deploy
```

### 7.2 Wrangler.toml (Tetra-Hub)

```toml
name = "tetra-hub"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[services]]
binding = "K4_PERSONAL"
service = "k4-personal"

[[services]]
binding = "K4_CAGE"
service = "k4-cage"

[[services]]
binding = "K4_HUBS"
service = "k4-hubs"
```

### 7.3 Verification Commands

```bash
# Root verify (includes all fleet checks)
npm run verify

# Individual checks
npm run verify:tetra-hub
npm run verify:k4-agent-hub
npm run verify:mesh
npm run ecosystem:glass

# Inventory
npm run inventory:cf
```

---

## 8. References

| Document | Purpose |
|----------|---------|
| `docs/SIC-POVM-K4-ARCHITECTURE.md` | K₄ geometric defense |
| `docs/CWP-P31-VIBE-2026-06.md` | Vibcoding CWP (this doc's parent) |
| `docs/CWP-P31-PEER-COMP-2026-05.md` | Trust + transparency floor |
| `docs/AGENTIC-VIBE-INFRASTRUCTURE.md` | Vibe dev tied to verify gates |
| `docs/PLAN-KIDS-VIBE-CODING.md` | Household youth context |
| `packages/k4-agent-hub/README.md` | Agent hub developer guide |
| `workers/tetra-hub/README.md` | Tetra-hub operator guide |
| `p31-alignment.json` | Machine registry of sources |

---

**End of Document**

*The mesh holds. Lead with the constraint, not the possibility.*
