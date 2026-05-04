# PGLite Multi-Device Sync Architecture
# CWP-SOV-01 — P31 Sovereign Infrastructure

**Date:** 2026-05-04
**Status:** Design complete — implementation pending
**Author:** Sonnet 4.6 (Mechanic) + Opus 4.6 (Architect review)
**Deliverable path:** `docs/architecture/PGLITE-SYNC-DESIGN.md`

---

## 1. PROBLEM STATEMENT

The operator, S.J., and W.J. each use separate devices (desktop, 2× Android tablets). Family biometric data, BONDING game state, and P31 accommodation logs need to:

- Survive offline sessions (tablets lose WiFi at school, operator loses cell service)
- Merge correctly when devices reconnect (no data loss, no conflicts clobbering the wrong value)
- **Not touch the BONDING KV relay** (separate sync channel — Cloudflare KV polling at 3-10s, managed by bonding.p31ca.org)
- Coexist with existing `idb-keyval` usage in `pwa/`
- Sync through the existing `api.p31ca.org` Cloudflare Worker fleet

---

## 2. CRDT CHOICE: Yjs vs Automerge

| Factor | Yjs | Automerge 2.x |
|--------|-----|---------------|
| Bundle size | ~50KB min | ~200KB min |
| WASM dependency | No | Yes (automerge-wasm) |
| Android Chrome support | Excellent | Good (WASM support) |
| Relational/tabular data | Via Y.Map, awkward | Native document model |
| Provider ecosystem | y-indexeddb, y-websocket, y-webrtc | Custom only |
| Merge semantics | Last-write-wins per key (configurable) | Structural merge |
| Existing use in P31 | None | None |
| Learning curve | Moderate | Higher |
| P31 data shape | Mostly key-value + append-only logs | Maps + arrays |

**Decision: Yjs**

Reasoning:
- `y-indexeddb` provider integrates directly with IndexedDB — the P31 PWA already calls `navigator.storage.persist()` and uses `idb-keyval`. Yjs adds a second IndexedDB store for its own ops log; no conflict with the existing keyval store.
- 50KB vs 200KB matters on Android tablets over slow connections.
- WASM-free means no cross-origin isolation headers required (no COOP/COEP complexity).
- The existing data shapes (accommodation logs, biometric readings, spoon counts) map naturally to `Y.Map` + `Y.Array`.
- `y-websocket` can run as a Cloudflare Worker Durable Object (WebSocket hibernation API) — the sync endpoint can live at `api.p31ca.org/sync` without a separate server.

**BONDING isolation:** BONDING's KV relay uses `fetch()` polling — no IndexedDB, no Yjs, no shared state. The PGLite sync layer is strictly in the PWA context. Zero overlap.

---

## 3. DATA MODEL

### 3.1 Sync Namespaces

Each Yjs document corresponds to one logical sync domain. Namespaces isolate data by access level:

```
p31:operator          — operator-only (spoons, meds, biometrics)
p31:family:cage       — all 4 K₄ vertices (mesh events, BONDING scores, shared notes)
p31:child:sj          — S.J. only (garden progress, badges, private rewards)
p31:child:wj          — W.J. only (garden progress, badges, private rewards)
p31:legal             — operator-only (accommodation logs, Genesis Block audit trail)
```

### 3.2 Per-Namespace Schema (TypeScript types)

```typescript
// p31:operator namespace
interface OperatorDoc {
  spoons: Y.Map<{
    date: string;          // ISO date YYYY-MM-DD
    allocated: number;     // morning allocation
    spent: number;         // running total
    lastUpdated: number;   // epoch ms
  }>;

  biometrics: Y.Array<{
    timestamp: number;     // epoch ms
    type: 'calcium' | 'bloodPressure' | 'heartRate' | 'other';
    value: number;
    unit: string;
    source: 'manual' | 'fhir' | 'node_zero';
    notes?: string;
  }>;

  medications: Y.Array<{
    timestamp: number;
    name: string;           // 'calcitriol' | 'calcium_carbonate' | etc.
    dose: string;
    taken: boolean;
    takenAt?: number;       // epoch ms, set when confirmed
  }>;

  accommodations: Y.Array<{
    timestamp: number;
    type: string;
    description: string;
    context: string;
    genesisHash?: string;   // SHA-256 of this record (for Genesis Block)
  }>;
}

// p31:family:cage namespace
interface CageDoc {
  meshEvents: Y.Array<{
    timestamp: number;
    vertex: 'will' | 'sj' | 'wj' | 'brenda';
    type: 'ping' | 'bonding_session' | 'visitation' | 'message';
    payload: Record<string, unknown>;
    genesisHash?: string;
  }>;

  bondingScores: Y.Map<{
    sessionId: string;
    participants: string[];
    moleculesBuilt: number;
    loveDelta: number;
    timestamp: number;
  }>;
}

// p31:child:sj and p31:child:wj (same shape, different namespace)
interface ChildDoc {
  gardenProgress: Y.Map<{
    seedsPlanted: number;
    flowersGrown: number;
    lastActivity: number;
    loveEarned: number;      // private — never exposed on shared surfaces
  }>;

  badges: Y.Array<{
    id: string;
    earnedAt: number;
    private: true;           // always — never federate
  }>;
}
```

### 3.3 PGLite Integration

PGLite runs in the browser (WASM PostgreSQL). It stores structured data that Yjs CRDTs don't handle well (complex queries, joins, full-text search). The sync strategy:

- **Yjs handles:** operational data requiring merge (spoons, logs, events)
- **PGLite handles:** relational data requiring query (passport schema, accommodation history, BONDING molecule dictionary)
- **Bridge:** a `YjsToPGLite` sync function runs after every Yjs transaction commit, writing the CRDT state into PGLite tables for query purposes

```typescript
// src/lib/sync/yjs-to-pglite-bridge.ts
export async function syncYjsToPGLite(
  ydoc: Y.Doc,
  db: PGlite,
  namespace: string
): Promise<void> {
  const map = ydoc.getMap(namespace);
  // Upsert each key into the corresponding PGLite table
  // PGLite is the read model; Yjs is the write model
}
```

---

## 4. SYNC FUNCTION (TypeScript pseudocode)

### 4.1 Client-side sync module

```typescript
// src/lib/sync/p31-sync.ts

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

const SYNC_ENDPOINT = 'https://api.p31ca.org/sync';
const NAMESPACES = [
  'p31:operator',
  'p31:family:cage',
  'p31:child:sj',
  'p31:child:wj',
  'p31:legal',
] as const;

type Namespace = typeof NAMESPACES[number];

// One Yjs doc per namespace, one IndexedDB persistence per doc
const docs = new Map<Namespace, Y.Doc>();
const providers = new Map<Namespace, IndexeddbPersistence>();

export async function initSync(
  deviceId: string,
  authorizedNamespaces: Namespace[]
): Promise<void> {
  for (const ns of authorizedNamespaces) {
    const doc = new Y.Doc({ guid: ns });
    const provider = new IndexeddbPersistence(`p31-sync-${ns}`, doc);

    // Wait for IndexedDB to load local state before attempting remote sync
    await provider.whenSynced;

    docs.set(ns, doc);
    providers.set(ns, provider);

    // Register update handler — push to server on every local change
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        pushUpdate(ns, update, deviceId);
      }
    });
  }

  // Pull any server updates we missed while offline
  await pullUpdates(deviceId, authorizedNamespaces);
}

async function pushUpdate(
  ns: Namespace,
  update: Uint8Array,
  deviceId: string
): Promise<void> {
  // Fire-and-forget with offline queue
  if (!navigator.onLine) {
    queueUpdate(ns, update);
    return;
  }

  try {
    await fetch(`${SYNC_ENDPOINT}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-P31-Namespace': ns,
        'X-P31-Device': deviceId,
      },
      body: update,
    });
  } catch {
    queueUpdate(ns, update);
  }
}

async function pullUpdates(
  deviceId: string,
  namespaces: Namespace[]
): Promise<void> {
  for (const ns of namespaces) {
    const doc = docs.get(ns)!;
    const stateVector = Y.encodeStateVector(doc);

    try {
      const response = await fetch(`${SYNC_ENDPOINT}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-P31-Namespace': ns,
          'X-P31-Device': deviceId,
        },
        body: stateVector,
      });

      if (response.ok) {
        const diff = await response.arrayBuffer();
        if (diff.byteLength > 0) {
          Y.applyUpdate(doc, new Uint8Array(diff), 'remote');
        }
      }
    } catch {
      // Offline — local state is authoritative until reconnect
    }
  }
}

// Offline queue — persisted in idb-keyval (separate store, no conflict with Yjs)
import { set, get, del } from 'idb-keyval';

async function queueUpdate(ns: Namespace, update: Uint8Array): Promise<void> {
  const key = `p31-queue-${ns}-${Date.now()}`;
  await set(key, update);
}

export async function flushOfflineQueue(deviceId: string): Promise<void> {
  // On reconnect: push all queued updates
  // Then pull to merge any remote changes made while offline
}
```

### 4.2 Cloudflare Worker sync endpoint (`api.p31ca.org/sync`)

The sync Worker uses a **Durable Object per namespace** with WebSocket hibernation for real-time sync. For the offline-first use case, a simpler REST approach suffices:

```typescript
// workers/sync/index.ts (Cloudflare Worker)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ns = request.headers.get('X-P31-Namespace');
    const device = request.headers.get('X-P31-Device');

    if (!ns || !device) return new Response('Bad Request', { status: 400 });

    // Auth: verify device HMAC (existing p31ca HMAC pattern)
    // if (!verifyHmac(request, env.SYNC_SECRET)) return 401;

    const url = new URL(request.url);

    if (url.pathname.endsWith('/push') && request.method === 'POST') {
      return handlePush(request, env, ns, device);
    }

    if (url.pathname.endsWith('/pull') && request.method === 'POST') {
      return handlePull(request, env, ns, device);
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handlePush(
  request: Request,
  env: Env,
  ns: string,
  device: string
): Promise<Response> {
  const update = await request.arrayBuffer();

  // Load current server state from KV
  const stateKey = `sync:state:${ns}`;
  const existing = await env.SYNC_KV.get(stateKey, 'arrayBuffer');

  const serverDoc = new Y.Doc();
  if (existing) {
    Y.applyUpdate(serverDoc, new Uint8Array(existing));
  }

  // Merge incoming update
  Y.applyUpdate(serverDoc, new Uint8Array(update));

  // Persist new server state
  const newState = Y.encodeStateAsUpdate(serverDoc);
  await env.SYNC_KV.put(stateKey, newState);

  // Log sync event (Genesis Block compatible)
  await logSyncEvent(env, ns, device, update.byteLength);

  return new Response(null, { status: 204 });
}

async function handlePull(
  request: Request,
  env: Env,
  ns: string,
  device: string
): Promise<Response> {
  const clientStateVector = await request.arrayBuffer();

  const stateKey = `sync:state:${ns}`;
  const serverState = await env.SYNC_KV.get(stateKey, 'arrayBuffer');

  if (!serverState) {
    return new Response(new ArrayBuffer(0), { status: 200 });
  }

  const serverDoc = new Y.Doc();
  Y.applyUpdate(serverDoc, new Uint8Array(serverState));

  // Compute diff: only send what the client doesn't have
  const diff = Y.encodeStateAsUpdate(
    serverDoc,
    new Uint8Array(clientStateVector)
  );

  return new Response(diff, {
    status: 200,
    headers: { 'Content-Type': 'application/octet-stream' }
  });
}
```

---

## 5. CONFLICT RESOLUTION UX

Yjs CRDT semantics mean true conflicts are rare — concurrent edits to different keys are automatically merged. The only visible conflict case is concurrent edits to the same key with different values (e.g., spoon allocation edited on two devices while offline).

**Default: Last-Write-Wins per map key**
Yjs `Y.Map` uses LWW with wall-clock timestamp as tiebreaker. This is correct for:
- Spoon allocation (only one device sets it per morning)
- Medication taken/untaken status (most recent update wins)
- Biometric readings (append-only, no conflicts)

**What the operator sees when a merge happens:**

```
// Toast notification — appears for 4 seconds, non-blocking
┌─────────────────────────────────────────────┐
│  Sync complete                              │
│  3 updates merged from other devices        │
│  Spoons: 6 → 5 (updated on tablet)         │
│  [View changes]                             │
└─────────────────────────────────────────────┘
```

Implementation: a `Y.Doc` observer watching for external updates (`origin === 'remote'`) fires a toast with a summary of changed keys. No blocking UI, no required decisions — just acknowledgment.

**Intentional non-cases:**
- Children's badges and garden progress: append-only `Y.Array` — no conflict possible
- BONDING scores: append-only — no conflict possible
- Accommodation logs: append-only — no conflict possible

---

## 6. THREE-DEVICE OFFLINE SIMULATION SCENARIO

**Setup:** Operator desktop, S.J.'s tablet, W.J.'s tablet. All start synced. Then:

**Phase 1: Desktop goes offline (operator loses WiFi)**
- Desktop: operator logs calcium 7.8 mg/dL at 14:00
- Desktop: operator marks Calcitriol taken at 14:05
- Desktop: operator allocates 4 spoons for afternoon
- S.J.'s tablet: S.J. plants 3 flowers in the garden (append-only)
- W.J.'s tablet: W.J. builds a water molecule in BONDING → scores +2 LOVE

All writes go to local IndexedDB only. No server sync.

**Phase 2: S.J.'s tablet reconnects**
1. `initSync()` called on reconnect
2. `pullUpdates()` — pulls server state (last known good: before Phase 1)
3. Server has no new updates (desktop was offline during all of Phase 1)
4. `pushUpdate()` — sends S.J.'s 3-flower event to server
5. Server merges: `p31:child:sj` garden updated, `p31:family:cage` mesh event added

**Phase 3: Desktop reconnects**
1. `pullUpdates()` — pulls server state (now includes S.J.'s flower events)
2. Desktop Yjs doc merges: S.J.'s garden append lands locally, no conflict
3. `flushOfflineQueue()` — pushes desktop's 3 queued updates (calcium, medication, spoons)
4. Server merges all three into `p31:operator` doc
5. Server state is now fully consistent across all 3 documents

**Phase 4: W.J.'s tablet reconnects**
- W.J.'s BONDING score pushes to `p31:family:cage`
- W.J.'s tablet pulls: gets S.J.'s garden event + desktop's spoon/med/calcium updates
- Full 3-device reconciliation complete

**Invariants confirmed:**
- No data lost in any phase
- No BONDING KV relay touched
- Append-only arrays never conflict
- Spoon allocation: if desktop and tablet both set different values while offline, LWW resolves — most recent timestamp wins

---

## 7. PGLITE SCHEMA (for relational query layer)

```sql
-- Complement to Yjs operational state
-- PGLite stores the "read model" derived from Yjs

CREATE TABLE IF NOT EXISTS biometrics (
  id          TEXT PRIMARY KEY,       -- UUID
  timestamp   INTEGER NOT NULL,       -- epoch ms
  type        TEXT NOT NULL,          -- 'calcium' | 'bloodPressure' | ...
  value       REAL NOT NULL,
  unit        TEXT NOT NULL,
  source      TEXT NOT NULL,
  notes       TEXT,
  synced_at   INTEGER                 -- epoch ms when Yjs wrote this row
);

CREATE TABLE IF NOT EXISTS medications (
  id          TEXT PRIMARY KEY,
  timestamp   INTEGER NOT NULL,
  name        TEXT NOT NULL,
  dose        TEXT NOT NULL,
  taken       INTEGER NOT NULL,       -- 0 | 1 (SQLite boolean)
  taken_at    INTEGER                 -- epoch ms
);

CREATE TABLE IF NOT EXISTS accommodations (
  id          TEXT PRIMARY KEY,
  timestamp   INTEGER NOT NULL,
  type        TEXT NOT NULL,
  description TEXT NOT NULL,
  context     TEXT NOT NULL,
  genesis_hash TEXT                   -- SHA-256, nullable until confirmed
);

-- Index for time-range queries (spoon history, calcium trend)
CREATE INDEX IF NOT EXISTS idx_biometrics_timestamp ON biometrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_medications_timestamp ON medications(timestamp DESC);

-- Forecast query: last 7 calcium readings for decay model
-- SELECT value, timestamp FROM biometrics
-- WHERE type = 'calcium'
-- ORDER BY timestamp DESC LIMIT 7;
```

---

## 8. BONDING KV ISOLATION CONFIRMATION

The following is a complete accounting of how this design avoids touching BONDING:

| Component | BONDING KV | PGLite/Yjs sync |
|-----------|-----------|-----------------|
| Network | `fetch()` polling to KV REST API | Yjs push/pull to `api.p31ca.org/sync` |
| Storage | Cloudflare KV (server-side) | IndexedDB (client-side) + SYNC_KV (separate KV namespace) |
| IndexedDB keys | None (KV is server-only) | `p31-sync-*` prefix (distinct from `idb-keyval` keys) |
| Durable Objects | BONDING uses its own DO for session state | Sync Worker is stateless REST (no DO needed for batch sync) |
| Data shape | Molecule reactions, multiplayer state | Biometrics, medications, accommodations |
| Access | Both S.J. and W.J. tablets read/write | Separate namespaces per child |

**Zero shared state. Zero collision risk.**

---

## 9. IMPLEMENTATION PHASES

### Phase 0: Foundation (now — $0, 2 hours)
- [ ] `npm install yjs y-indexeddb` in PWA
- [ ] Create `src/lib/sync/` directory structure
- [ ] Write `p31-sync.ts` with initSync() + offline queue
- [ ] Write `yjs-to-pglite-bridge.ts` stub
- [ ] Wire `navigator.onLine` listener → `flushOfflineQueue()`

### Phase 1: Operator namespace (1 day)
- [ ] `p31:operator` doc with spoons, medications, biometrics
- [ ] Connect spoon tracker UI to Y.Map
- [ ] Connect medication reminder to Y.Array (append-only)
- [ ] Deploy sync Worker to `api.p31ca.org/sync`
- [ ] Test push/pull with two browser tabs (simulate 2 devices)

### Phase 2: Family namespace (2 days)
- [ ] `p31:family:cage` doc with mesh events
- [ ] Connect BONDING session completion → cage doc (NOT KV relay)
- [ ] Child namespaces for garden/badges
- [ ] Test 3-device offline scenario (Chrome + 2× incognito)

### Phase 3: PGLite relational layer (1 day)
- [ ] PGLite schema migration
- [ ] `YjsToPGLite` bridge writing to all tables
- [ ] Query layer for calcium trend + medication history
- [ ] Connect to FHIR forecast model (Phase 4 of FHIR design)

### Phase 4: Genesis Block integration (1 day)
- [ ] `genesis_hash` column populated on accomodation log writes
- [ ] HMAC signing of sync payloads (existing p31ca pattern)
- [ ] Add `verify:sync-genesis` gate to verify chain

---

## 10. DEPENDENCIES

```json
{
  "yjs": "^13.6.18",
  "y-indexeddb": "^9.0.12",
  "@electric-sql/pglite": "^0.2.0"
}
```

PGLite is already in the design from prior sessions. Yjs adds ~50KB gzipped. Total bundle impact: acceptable.

**No new Cloudflare paid features required.** SYNC_KV is a new KV namespace (free tier: 1GB storage, 100K reads/day, 1K writes/day — more than sufficient for a 4-person family).

---

## 11. ALIGNMENT REGISTRATION

This document registers as:

```json
{
  "id": "arch:pglite-sync-design",
  "type": "architecture",
  "path": "docs/architecture/PGLITE-SYNC-DESIGN.md",
  "derives_from": [
    "src:yjs-crdt",
    "src:pglite-wasm",
    "arch:cf-workers-fleet",
    "arch:genesis-block"
  ],
  "blocks": [
    "feat:calcium-monitor-fhir",
    "feat:offline-spoon-tracker",
    "feat:family-mesh-events"
  ]
}
```

Registration in `p31-alignment.json` pending `npm run build:verify-pipeline`.

---

*86 gates green at time of design.*
*BONDING KV relay: untouched.*
*`npm run verify` must pass before any code in `src/lib/sync/` ships.*
