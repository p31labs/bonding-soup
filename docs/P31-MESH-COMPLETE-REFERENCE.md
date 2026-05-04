# P31 MESH — Complete Reference

**Document ID:** `p31.meshCompleteReference/1.0.0`  
**Schema:** `p31.meshArchitecture/1.1.0`  
**Status:** Living document — deployed state as of 2026-05-03  
**Verification:** `npm run verify:mesh` + `npm run verify:mesh-canon`

---

## Table of Contents

1. [The K₄ Mesh Architecture](#1-the-k₄-mesh-architecture)
2. [Mesh Workers Fleet](#2-mesh-workers-fleet)
3. [k4-personal (Personal Tetrahedron)](#3-k4-personal-personal-tetrahedron)
4. [k4-cage (Family Cage)](#4-k4-cage-family-cage)
5. [k4-hubs (Life-Context Fusion)](#5-k4-hubs-life-context-fusion)
6. [tetra-hub (Aggregator)](#6-tetra-hub-aggregator)
7. [k4-agent-hub (Agent Tetrahedron)](#7-k4-agent-hub-agent-tetrahedron)
8. [SOULSAFE Tetra](#8-soulsafe-tetra)
9. [Mesh API Contracts](#9-mesh-api-contracts)
10. [Topology Implementation](#10-topology-implementation)
11. [Physical Design Artifacts](#11-physical-design-artifacts)
12. [Verification & Operations](#12-verification--operations)

---

## 1. The K₄ Mesh Architecture

### 1.1 Canonical Summary

> The mesh is the edge-native K₄ substrate (KV topology + DO cells + explicit cage scope) that every surface reads or warms; apps are projections; the hard part is keeping personal spin state and shared cage geometry isolated until a consent-shaped bridge says otherwise.

### 1.2 The K₄ Complete Graph

Every P31 mesh unit is a **K₄** — 4 vertices, 6 edges, complete interconnection. No orphan channels. Every member one edge from every other.

```
            [a / will / FORGE]
           / |\                  \
          /  | \                   \
         /   |  \                    \
        /    |   \                     \
   [b / S.J. / COUNSEL]——[c / W.J. / SCHOLAR]
        \    |   /                     /
         \   |  /                    /
          \  | /                   /
           \ |/                  /
            [d / christyn / SCRIBE]
```

**K₄ Invariant:** `|E| = n(n-1)/2` = 4(3)/2 = **6 edges**

### 1.3 Three Scopes

| Scope | Vertices | Purpose | Isolation |
|-------|----------|---------|-----------|
| **Personal** | a, b, c, d | Individual's 4 life pillars | Isolated KV + DO |
| **Family Cage** | will, S.J., W.J., christyn | Household mesh | Separate Worker, shared scope |
| **Agent Hub** | FORGE, COUNSEL, SCHOLAR, SCRIBE | AI persona dispatch | 4 DOs, skill registry |

### 1.4 Composition Pattern

```
TETRA (4 vertices) ──┐
TETRA (4 vertices) ──┼──→ CLUSTER (16 vertices, 4 tetras)
TETRA (4 vertices) ──┤         │
TETRA (4 vertices) ──┘         ↓
                         HUB (64 vertices, 4 clusters)
                              │
                              ↓
                         MESH (open federation)
```

---

## 2. Mesh Workers Fleet

### 2.1 K₄ Trio (Core Mesh)

| Worker | Schema | Purpose | Key Routes |
|--------|--------|---------|------------|
| **k4-personal** | `p31.k4Personal/1.0.0` | Personal tetrahedron (pillars a-d) | `/api/mesh`, `/agent/:userId/*` |
| **k4-cage** | `p31.k4Cage/1.0.0` | Family cage (will, S.J., W.J., christyn) | `/api/mesh`, `/api/vertex/:id` |
| **k4-hubs** | `p31.k4Hubs/1.0.0` | Life-context hub fusion | `/api/hubs`, `/health` |

### 2.2 Mesh Support Workers

| Worker | Schema | Purpose |
|--------|--------|---------|
| **tetra-hub** | `p31.tetraHub/1.0.0` | Aggregator over K₄ trio |
| **k4-agent-hub** | `p31.k4AgentHub/1.1.0` | Agent tetrahedron (4 DOs) |
| **geodesic-room** | `p31.geodesicRoom/0.2.1` | Collaborative 3D shape sync |
| **bonding-relay** | `p31.bondingRelay/1.0.0` | C.A.R.S. WebSocket relay |

### 2.3 Deploy Order

```bash
# 1. k4-personal (personal cell)
cd andromeda/04_SOFTWARE/k4-personal
pnpm install
pnpm --filter k4-personal deploy

# 2. k4-cage (family cage)
cd andromeda/04_SOFTWARE/k4-cage
wrangler deploy

# 3. k4-hubs (life-context fusion)
cd andromeda/04_SOFTWARE/k4-hubs
wrangler deploy

# 4. tetra-hub (aggregator — requires service bindings)
cd workers/tetra-hub
npm run deploy
```

---

## 3. k4-personal (Personal Tetrahedron)

### 3.1 Architecture

**Path:** `andromeda/04_SOFTWARE/k4-personal/`

The personal mesh worker hosts:
- **REST API:** Mesh topology, health, snapshots
- **Durable Object:** `PersonalAgent` — per-user chat, state, reminders, energy
- **HTML Shell:** `GET /u/:userId/home` — tetra home page

### 3.2 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/health` | GET | Liveness check |
| `GET /api/mesh` | GET | Personal lattice only (vertices a-d) |
| `GET /api/snapshot` | GET | Full topology snapshot |
| `GET /api/vertex/:id` | GET | Vertex state |
| `POST /api/presence/:id` | POST | Update presence |
| `POST /api/ping/:from/:to` | POST | Edge ping |
| `GET /agent/:userId/health` | GET | DO health |
| `POST /agent/:userId/chat` | POST | Chat with SOULSAFE fusion |
| `GET /agent/:userId/state` | GET | DO state |
| `PUT /agent/:userId/state` | PUT | Update DO state |
| `GET /u/:userId/home` | GET | Tetra home HTML |

### 3.3 Personal Scope Isolation

From `k4-mesh-core/scopes.js`:

```javascript
// Two scopes on the same K₄ graph
export const PERSONAL_SCOPE = 'personal';   // vertices a, b, c, d
export const ROOT_SCOPE = 'root';           // vertices will, sj, wj, christyn

// KV keys are scope-segmented
export function scopedVertexKey(scope, vertexId) {
  return `k4s:${scope}:v:${vertexId}`;
}

export function scopedEdgeKey(scope, a, b) {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `k4s:${scope}:e:${x}:${y}`;
}
```

### 3.4 Mesh Payload

```javascript
// GET /api/mesh response
{
  "schema": "p31.k4mesh.payload",
  "api.version": "1.1.0",
  "topology": "K4",
  "vertices": 4,
  "edges": 6,
  "mesh": {
    "vertices": [
      { "id": "a", "label": "structure", "anchor": "teal" },
      { "id": "b", "label": "connection", "anchor": "coral" },
      { "id": "c", "label": "rhythm", "anchor": "phosphorus" },
      { "id": "d", "label": "creation", "anchor": "lavender" }
    ],
    "edges": [
      { "from": "a", "to": "b", "label": "safe to ship" },
      { "from": "a", "to": "c", "label": "design from research" },
      { "from": "a", "to": "d", "label": "write what you build" },
      { "from": "b", "to": "c", "label": "brief the brief" },
      { "from": "b", "to": "d", "label": "file the protect" },
      { "from": "c", "to": "d", "label": "publish the understanding" }
    ]
  },
  "vitality": {
    "spoons": 8,
    "max": 12
  }
}
```

---

## 4. k4-cage (Family Cage)

### 4.1 Architecture

**Path:** `andromeda/04_SOFTWARE/k4-cage/src/index.js`

Family cage with named vertices:
- `will` — operator
- `sj` — child (S.J.)
- `wj` — child (W.J.)
- `christyn` — co-parent

### 4.2 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/mesh` | GET | Family cage topology |
| `GET /api/vertex/:id` | GET | Vertex state |
| `POST /api/presence/:id` | POST | Update presence |
| `POST /api/ping/:from/:to` | POST | Edge ping between family members |
| `GET /api/edge/:a/:b` | GET | Edge state |
| `WS /room/:id` | WS | WebSocket room |

### 4.3 Family Cage JSON

```javascript
// GET /api/mesh response (k4-cage)
{
  "schema": "p31.k4cage.payload",
  "topology": "K4",
  "vertices": [
    { "id": "will", "role": "operator", "dock": "structure", "agent": "forge" },
    { "id": "sj", "role": "child", "dock": "rhythm", "agent": "scholar", "gate": "child-mesh-unlock" },
    { "id": "wj", "role": "child", "dock": "creation", "agent": "scribe", "gate": "child-mesh-unlock" },
    { "id": "christyn", "role": "co-parent", "dock": "connection", "agent": "counsel" }
  ],
  "edges": [
    { "from": "will", "to": "sj", "love": 3 },
    { "from": "will", "to": "wj", "love": 3 },
    { "from": "will", "to": "christyn", "love": 4 },
    { "from": "sj", "to": "wj", "love": 2 },
    { "from": "sj", "to": "christyn", "love": 3 },
    { "from": "wj", "to": "christyn", "love": 3 }
  ],
  "totals": { "love": 18, "edges": 6 }
}
```

### 4.4 Child Mesh Unlock Gate

Family vertices with `gate: "child-mesh-unlock"` require `childMeshToken` for family dock:

```javascript
// POST /v1/family/dock (k4-agent-hub)
{
  "operatorClientId": "will-001",
  "publicKeyB64u": "...",
  "vertexId": "sj",  // or "wj"
  "ts": 1234567890,
  "sig": "...",
  "childMeshToken": "..."  // Required for child-mesh-unlock
}
```

---

## 5. k4-hubs (Life-Context Fusion)

### 5.1 Architecture

Fuses life-context K₄ hubs — read-only roster of life-context docking points.

### 5.2 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /health` | GET | Liveness |
| `GET /api/hubs` | GET | Hub roster |

### 5.3 Hub Roster Response

```javascript
// GET /api/hubs
{
  "schema": "p31.k4hubs.roster",
  "hubs": [
    { "id": "work", "label": "Work", "mode": "bind" },
    { "id": "home", "label": "Home", "mode": "dock" },
    { "id": "school", "label": "School", "mode": "bridge" },
    { "id": "care", "label": "Care", "mode": "sync" }
  ]
}
```

---

## 6. tetra-hub (Aggregator)

### 6.1 Architecture

**Path:** `workers/tetra-hub/src/index.js`

Read-only aggregator over the K₄ edge trio. Service bindings to `K4_PERSONAL`, `K4_CAGE`, `K4_HUBS`.

### 6.2 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/health` | GET | Parallel health checks to trio |
| `GET /api/tetra` | GET | Fused meshes + hub list |

### 6.3 Tetra Hub Response

```javascript
// GET /api/tetra
{
  "schema": "p31.tetraHub/1.0.0",
  "gatheredAt": "2026-05-03T20:00:00Z",
  "topology": {
    "kind": "K4",
    "vertices": 4,
    "edges": 6,
    "note": "Personal lattice uses pillars a-d; family cage uses named vertices; k4-hubs fuses life-context rosters."
  },
  "faces": {
    "personal": { /* k4-personal /api/mesh */ },
    "cage": { /* k4-cage /api/mesh */ },
    "hubs": { /* k4-hubs /api/hubs */ }
  }
}
```

### 6.4 Implementation

```javascript
// workers/tetra-hub/src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/tetra") {
      const [personalMesh, cageMesh, hubsList] = await Promise.all([
        bindingJson(env.K4_PERSONAL, "/api/mesh"),
        bindingJson(env.K4_CAGE, "/api/mesh"),
        bindingJson(env.K4_HUBS, "/api/hubs"),
      ]);
      
      return Response.json({
        schema: "p31.tetraHub/1.0.0",
        gatheredAt: new Date().toISOString(),
        topology: { kind: "K4", vertices: 4, edges: 6 },
        faces: { personal: personalMesh, cage: cageMesh, hubs: hubsList },
      });
    }
  },
};
```

---

## 7. k4-agent-hub (Agent Tetrahedron)

### 7.1 Architecture

**Path:** `packages/k4-agent-hub/`

Cloudflare Worker hosting four K₄ agent hub Durable Objects:
- **FORGE** — make (TypeScript/Workers, firmware, one-liners)
- **COUNSEL** — protect (pro se Georgia, voltage triage, debrief)
- **SCHOLAR** — understand (grants, Q-factor patterns)
- **SCRIBE** — remember (passport mirror, phos companion)

### 7.2 Topology

```javascript
// packages/k4-agent-hub/src/topology.js
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
  { from: "scholar", to: "scribe",  label: "publish the understanding", verb: "understand·remember" },
];
```

### 7.3 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /v1/manifest` | GET | JSON manifest |
| `POST /v1/dock` | POST | Personal tetrahedron docks |
| `GET /v1/topology` | GET | K₄ adjacency, statuses, covers |
| `GET /v1/cross/{from}/{to}` | GET | Inter-hub edge call |
| `POST /v1/{hub}/call` | POST | Invoke skill |
| `WS /v1/{hub}/stream` | WS | WebSocket fanout |
| `POST /v1/federation/dispatch` | POST | Peer-to-peer signed dispatch |
| `POST /v1/family/dock` | POST | Operator-signed family vertex dock |
| `POST /v1/anchor/register` | POST | Ed25519 anchor pact |

### 7.4 Skill Registry

```javascript
export const SKILLS = {
  forge: [
    { id: "ts-worker",    ollamaPersona: "p31-mechanic",  simplexLane: "FORGE" },
    { id: "esp-firmware", ollamaPersona: "p31-firmware" },
    { id: "one-liner",    ollamaPersona: "p31-quick" },
  ],
  counsel: [
    { id: "pro-se-georgia", ollamaPersona: "p31-counsel", simplexLane: "COUNSEL" },
    { id: "voltage-triage", ollamaPersona: "p31-triage",  simplexLane: "HERALD" },
    { id: "post-incident",  ollamaPersona: "p31-debrief" },
  ],
  scholar: [
    { id: "grants-synthesis",  ollamaPersona: "p31-narrator", simplexLane: "SCHOLAR" },
    { id: "q-factor-patterns", ollamaPersona: "p31-oracle", simplexLane: "ORACLE" },
  ],
  scribe: [
    { id: "passport-mirror", ollamaPersona: "p31-scribe", simplexLane: "SCRIBE" },
    { id: "phos-companion",  ollamaPersona: "p31-phos",   gate: "child-mesh-unlock" },
  ],
};
```

### 7.5 Bipartite Cover (Personal → Agent)

```javascript
export const BIPARTITE_COVER = [
  { personal: "structure",  agent: "forge",   edge: "you build · forge tools" },
  { personal: "connection", agent: "counsel", edge: "you reach · counsel keeps" },
  { personal: "rhythm",     agent: "scholar", edge: "you pace · scholar charts" },
  { personal: "creation",   agent: "scribe",  edge: "you make · scribe records" },
];
```

### 7.6 Triadic Cover (Family → Personal → Agent)

```javascript
export const TRIADIC_COVER = [
  { family: "will",     personal: "structure",  agent: "forge",   ageBand: "adult" },
  { family: "sj",       personal: "rhythm",     agent: "scholar", ageBand: "minor", gate: "child-mesh-unlock" },
  { family: "wj",       personal: "creation",   agent: "scribe",  ageBand: "minor", gate: "child-mesh-unlock" },
  { family: "christyn", personal: "connection", agent: "counsel", ageBand: "adult" },
];
```

---

## 8. SOULSAFE Tetra

### 8.1 Architecture

**Status:** v0.1 shipped in `k4-personal`

Four-effect fusion: **structure**, **connection**, **rhythm**, **creation** specialists fused into one coherent response.

### 8.2 Goals

| Goal | Mechanism |
|------|-----------|
| Personal/private | All inference inside `PersonalAgent` DO |
| Four synced specialists | 5 AI calls per message (4 parallel + 1 fusion) |
| SOULSAFE gates | Fusion only when `energy.spoons >= 3` |
| Audit | `soulsafe_runs` table stores effects + model + timestamp |

### 8.3 API

```javascript
// POST /agent/:userId/chat
{
  "message": "What should I work on today?",
  "soulsafe": true  // Enable four-effect fusion
}

// Response
{
  "reply": "fused assistant text",
  "energy": { "spoons": 8, "max": 12 },
  "soulsafe": {
    "schema": "p31.soulsafeTetra/0.1.0",
    "effects": {
      "structure": "From a systems view...",
      "connection": "Considering your relationships...",
      "rhythm": "Pacing for your energy...",
      "creation": "What you'll want to remember..."
    },
    "modelId": "@cf/meta/llama-3.1-8b-instruct-fast"
  }
}
```

### 8.4 Retention

| Variable | Default | Meaning |
|----------|---------|---------|
| `SOULSAFE_RUNS_MAX_ROWS` | 800 | Max audit rows per user DO |
| `SOULSAFE_RUNS_MAX_AGE_MS` | 0 | Age eviction (0 = disabled) |

---

## 9. Mesh API Contracts

### 9.1 Schema Versions

| Component | Schema | Version |
|-----------|--------|---------|
| Personal mesh | `p31.k4Personal` | 1.0.0 |
| Cage mesh | `p31.k4Cage` | 1.0.0 |
| Hubs roster | `p31.k4Hubs` | 1.0.0 |
| Tetra hub | `p31.tetraHub` | 1.0.0 |
| Agent hub | `p31.k4AgentHub` | 1.1.0 |
| Federation | `p31.k4AgentHubFederation` | 1.0.0 |
| Family dock | `p31.familyDock` | 1.0.0 |
| Peer dispatch | `p31.peerDispatch` | 1.0.0 |
| Anchor pact | `p31.anchorPact` | 1.0.0 |
| SOULSAFE | `p31.soulsafeTetra` | 0.1.0 |

### 9.2 Common Response Shapes

```javascript
// Health response
{
  "schema": "p31.health",
  "ok": true,
  "service": "k4-personal",
  "worker": "k4-personal",
  "version": "1.0.0"
}

// Mesh payload (personal)
{
  "schema": "p31.k4mesh.payload",
  "api.version": "1.1.0",
  "topology": "K4",
  "vertices": 4,
  "edges": 6,
  "mesh": { /* vertices + edges */ },
  "vitality": { "spoons": 8, "max": 12 }
}

// Error response
{
  "ok": false,
  "error": "vertex_not_found",
  "message": "Vertex 'x' not found in scope 'personal'"
}
```

---

## 10. Topology Implementation

### 10.1 K₄ Invariant Validation

```javascript
// packages/k4-agent-hub/src/topology.js
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
    if (!SKILLS[v] || SKILLS[v].length === 0) {
      throw new Error(`Vertex ${v} has no skills registered.`);
    }
  }
  
  if (FAMILY_VERTICES.length !== 4) {
    throw new Error(`Family cage must have 4 vertices`);
  }
}
```

### 10.2 Adjacency Map Generation

```javascript
export const ADJACENCY = (() => {
  const map = Object.fromEntries(VERTEX_IDS.map((v) => [v, []]));
  for (const e of EDGES) {
    map[e.from].push(e.to);
    map[e.to].push(e.from);
  }
  return map;
})();

// Result:
// forge:   ["counsel", "scholar", "scribe"]
// counsel: ["forge", "scholar", "scribe"]
// scholar: ["forge", "counsel", "scribe"]
// scribe:  ["forge", "counsel", "scholar"]
```

### 10.3 Cross-Edge Validation

```javascript
async function handleCrossEdge(from, to, request, env) {
  // Validate vertices exist
  if (!VERTEX_IDS.includes(from) || !VERTEX_IDS.includes(to)) {
    return notFound(`cross-edge: unknown vertex ${from} or ${to}`);
  }
  
  // No self-loops
  if (from === to) {
    return ok({ ok: false, error: "cross-edge requires two distinct vertices" });
  }
  
  // Validate K₄ adjacency
  if (!ADJACENCY[from].includes(to)) {
    return ok({ ok: false, error: `no K₄ edge ${from}→${to}` });
  }
  
  // Check env flag
  if (env.ALLOW_CROSS_EDGES === "0") {
    return ok({ ok: false, error: "cross-edge calls disabled" });
  }
  
  // Dispatch to target hub
  const binding = HUB_BINDINGS[to];
  const stub = env[binding].get(env[binding].idFromName("singleton"));
  // ... forward request
}
```

---

## 11. Physical Design Artifacts

### 11.1 K₄ STL File

**Path:** `design-assets/stl/P31_K4_Topology.stl`

Four vertices, six edges as a tangible spec — tangible reference for the K₄ geometry.

### 11.2 Physical Tetrahedron

Future: printed K₄ STL + NFC/BLE could bias formation toward static tetrahedron (four vertices, six edges). Physical mesh meets field.

---

## 12. Verification & Operations

### 12.1 Mesh Verification Commands

```bash
# Full mesh verification (dry-run + live)
npm run verify:mesh

# Mesh canon verification (doc anchors + code invariants)
npm run verify:mesh-canon

# k4-personal only (dry-run)
npm run verify:k4-personal

# k4-agent-hub
npm run verify:k4-agent-hub

# Tetra-hub
npm run verify:tetra-hub

# Ecosystem glass (all probes)
npm run ecosystem:glass

# Mesh offline (dry-run only)
npm run verify:mesh-offline
```

### 12.2 Live Probe Checks

```bash
# Probe k4-personal health + mesh
curl -s {{mesh.k4PersonalWorkerUrl}}/api/health | jq .
curl -s {{mesh.k4PersonalWorkerUrl}}/api/mesh | jq .

# Probe k4-cage
curl -s {{mesh.k4CageWorkerUrl}}/api/mesh | jq .

# Probe tetra-hub
curl -s {{mesh.tetraHubWorkerUrl}}/api/tetra | jq .

# Probe k4-agent-hub
curl -s {{mesh.k4AgentHubWorkerUrl}}/v1/topology | jq .
curl -s {{mesh.k4AgentHubWorkerUrl}}/v1/manifest | jq .
```

### 12.3 Red Runbook (Mesh Down)

**Path:** `docs/runbooks/RUNBOOK-MESH-RED.md`

```bash
# When k4-personal fails in CI:
1. Check p31-constants.json mesh.k4PersonalWorkerUrl
2. Run: npm run apply:constants
3. Verify: npm run verify:mesh
4. Check Cloudflare Dashboard → Workers → k4-personal → Logs
5. If needed: pnpm --filter k4-personal deploy
```

### 12.4 Mesh Constants

From `p31-constants.json`:

```json
{
  "mesh": {
    "k4PersonalWorkerUrl": "https://k4-personal.trimtab-signal.workers.dev",
    "k4CageWorkerUrl": "https://k4-cage.trimtab-signal.workers.dev",
    "k4HubsWorkerUrl": "https://k4-hubs.trimtab-signal.workers.dev",
    "tetraHubWorkerUrl": "https://tetra-hub.trimtab-signal.workers.dev",
    "k4AgentHubWorkerUrl": "https://k4-agent-hub.trimtab-signal.workers.dev",
    "passkeyApiBasePath": "/api/passkey"
  }
}
```

Apply after edits:
```bash
npm run apply:constants
npm run verify:constants
```

---

## 13. References

| Document | Purpose |
|----------|---------|
| `docs/MESH-ARCHITECTURE-CANON.md` | Shipped · next · doctrine split |
| `docs/MESH-MAP-PERSONAL-START-PAGES.md` | PAR + bridge direction |
| `docs/SIC-POVM-K4-ARCHITECTURE.md` | K₄ geometric defense |
| `docs/SOULSAFE-TETRA-SPEC.md` | Four-effect fusion spec |
| `docs/P31-K4-AGENT-HUBS.md` | Agent hub operator spec |
| `docs/SIC-POVM-MATHEMATICAL-APPENDIX.md` | Rigorous QI definitions |
| `p31-alignment.json` | Machine registry |
| `p31-k4-agent-hub.json` | Agent hub manifest |

---

**End of Document**

*The mesh holds. Four vertices, six edges, no orphan channels.*
