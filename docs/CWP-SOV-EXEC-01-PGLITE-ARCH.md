# CWP-SOV-EXEC-01: PGLite Multi-Device Sync Architecture
**Status:** DESIGN COMPLETE  
**Agent:** Claude Sonnet 4.6 (Mechanic)  
**Date:** 2026-05-06  
**Alignment:** p31-alignment.json → `cwp-sov-exec-01-pglite-sync`

---

## Overview

P31 needs a device-local database that syncs across the K₄ family mesh without cloud round-trips on every read. This document specifies the three-tier storage architecture and sync protocol.

**Constraint:** BONDING KV relay (`bonding.p31ca.org`) is a separate sync channel. Do not merge. Do not touch its polling loop.

---

## Three-Tier Storage Model

```
T1 (Device Local)          T2 (KV Relay)              T3 (D1 Cloud)
─────────────────          ──────────────             ──────────────
PGLite (WASM)              Cloudflare KV              D1 p31-telemetry
  └─ IndexedDB             api.p31ca.org/sync         (append-only log)
     (idb-keyval)
```

**T1 — Device Local (PGLite + IndexedDB)**
- `@electric-sql/pglite` v0.4.5 runs PostgreSQL in WASM, persists to IndexedDB
- All reads serve from T1. No cloud latency for operator UI
- `navigator.storage.persist()` already called — quota protection is active
- Coexists with existing `idb-keyval` usage (separate store name: `p31-pglite`)
- Schema: family biometrics, shift logs, spoon ledger, evidence catalog

**T2 — KV Relay (Cloudflare KV, Yjs delta encoding)**
- Yjs Y.Doc with `y-indexeddb` provider persists doc to IndexedDB (separate key)
- On `online` event: flush pending Yjs update vector to `api.p31ca.org/sync`
- Worker reads KV, merges update, writes merged state back
- Polling interval: 30s when online, paused when offline
- Key space: `sync:{deviceId}:{docId}` — never overlaps with BONDING keys

**T3 — D1 Append-Only Log**
- Sync Worker writes a receipt row to D1 `p31-telemetry` for every accepted merge
- Never DELETE from D1 (audit trail). Soft-delete via `deleted_at` column
- Read from T3 only for: history replay, new-device bootstrap, dispute evidence

---

## CRDT Choice: Yjs

**Decision: Yjs over Automerge.**

| Factor | Yjs | Automerge |
|--------|-----|-----------|
| Bundle size | ~75KB | ~300KB |
| Already installed | ✅ yjs@13.6.30, y-indexeddb@9.0.12 | ❌ |
| WASM requirement | No | Yes (Automerge v2) |
| CF Worker compat | ✅ pure JS | ⚠️ WASM in Workers is possible but adds complexity |
| Data model fit | Map/Array/Text | Same |
| Merge guarantees | CRDT (YATA algorithm) | CRDT (OpSet) |

Yjs wins on bundle size and the fact it is already declared in `package.json`. No new dependency needed.

---

## Data Model (Family Biometrics + Ops)

```typescript
// PGLite schema — T1 ground truth
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS ca_log (
    id        TEXT PRIMARY KEY,  -- ulid
    ts        INTEGER NOT NULL,  -- Unix ms
    level     REAL,              -- mg/dL
    dose_flag INTEGER DEFAULT 0, -- 1 = post-dose reading
    device_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS spoon_log (
    id        TEXT PRIMARY KEY,
    ts        INTEGER NOT NULL,
    delta     INTEGER NOT NULL,  -- negative = spent, positive = restored
    reason    TEXT,
    device_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shift_log (
    id        TEXT PRIMARY KEY,
    started   INTEGER NOT NULL,
    ended     INTEGER,
    mode      TEXT NOT NULL      -- 'normal' | 'hyperfocus' | 'lowspoon'
  );

  CREATE TABLE IF NOT EXISTS evidence (
    id        TEXT PRIMARY KEY,
    ts        INTEGER NOT NULL,
    category  TEXT NOT NULL,     -- 'medical' | 'legal' | 'comms' | 'financial'
    note      TEXT,
    file_ref  TEXT,              -- R2 object key if attachment
    tags      TEXT,              -- JSON array
    device_id TEXT NOT NULL
  );
`;
```

---

## Sync Function (TypeScript pseudocode)

```typescript
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { PGlite } from '@electric-sql/pglite';

const SYNC_ENDPOINT = 'https://api.p31ca.org/sync';
const DEVICE_ID = crypto.randomUUID(); // persisted in idb-keyval under 'p31-device-id'

let db: PGlite | null = null;
let ydoc: Y.Doc | null = null;

async function initSync(deviceId: string) {
  // T1: PGLite
  db = new PGlite('idb://p31-pglite');
  await db.exec(SCHEMA);

  // Yjs doc for delta tracking (separate from BONDING KV)
  ydoc = new Y.Doc({ guid: `p31-sync-${deviceId}` });
  const persistence = new IndexeddbPersistence(`p31-yjs-${deviceId}`, ydoc);
  await persistence.whenSynced;
}

async function pushToT2(deviceId: string) {
  if (!ydoc) return;
  const update = Y.encodeStateAsUpdateV2(ydoc);
  const payload = {
    deviceId,
    docId: `p31-sync-${deviceId}`,
    update: Array.from(update),
    ts: Date.now(),
  };
  const res = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

async function pullFromT2(deviceId: string) {
  if (!ydoc) return;
  const res = await fetch(`${SYNC_ENDPOINT}?deviceId=${deviceId}`);
  if (!res.ok) return;
  const { update } = await res.json() as { update: number[] };
  Y.applyUpdateV2(ydoc, new Uint8Array(update));
}

// Wire to online/offline events
window.addEventListener('online', () => {
  pushToT2(DEVICE_ID);
  pullFromT2(DEVICE_ID);
});
```

---

## Conflict Resolution UX

When a merge conflict occurs (two devices wrote the same field while offline):

**What Yjs does automatically (no operator action):**
- Numeric counters (spoons, Ca²⁺): last-writer-wins by Yjs logical clock
- Text fields (notes): YATA merges character-by-character, both writes preserved
- Array appends (evidence catalog): all entries preserved, sorted by timestamp

**What the operator sees:**
- A `⚡ Sync resolved` toast (2s, dismissible) — no action required
- In the Ca²⁺ log: both readings appear in chronological order
- In the evidence catalog: duplicates are merged by `id` (ULID is unique per device)
- No "conflict drawer" needed — Yjs convergence is silent by design

**Exception — hard conflict (same `id`, different `level`):**
- Detected in sync Worker by comparing sha256(payload) before write
- Worker writes BOTH rows with a `conflict_flag = 1` column
- MissionControl UI shows a yellow badge: `2 Ca²⁺ readings at 14:32 — tap to review`
- Operator taps → sees both values, chooses one → surviving record sync'd back

---

## 3-Device Offline Scenario

**Devices:** Will (Golf VW), S.J. (school tablet), W.J. (home tablet)

**Sequence:**
1. All three online. State synced: Ca²⁺ last reading 8.4 mg/dL, spoons 6/10
2. Cell service drops on VW. Will logs: spoon spend -2 (now 4), Ca²⁺ 7.8 mg/dL
3. S.J. tablet (wifi) logs: evidence item added (school dismissal text screenshot)
4. W.J. tablet (wifi) logs: nothing (pre-reader, passive)
5. VW regains cell → push: spoon delta + Ca²⁺ row
6. Merge at T2: spoon 6 - 2 = 4 (G-counter delta, idempotent). Ca²⁺ row appended.
7. S.J. tablet pulls: sees Will's Ca²⁺ update (rendered in MissionControl history)
8. All three devices converge to: spoons=4, Ca²⁺=[8.4, 7.8], evidence=[school-dismissal]

**BONDING is unaffected:** its KV keys are `bonding:*`, never touched by this sync path.

---

## Scaffold Code Location

```
andromeda/04_SOFTWARE/p31ca/src/lib/sync/
  index.ts          — initSync, pushToT2, pullFromT2 exports
  schema.ts         — SCHEMA constant + TypeScript row types
  conflict.ts       — hard-conflict detection + resolution types
```

---

## BONDING Isolation Guarantee

BONDING (`bonding.p31ca.org`) uses:
- KV key pattern: `bonding:game:*`, `bonding:session:*`
- Polling interval: 3-10s
- Worker: `bonding-worker` (separate deployment in `wrangler.toml`)

This sync system uses:
- KV key pattern: `sync:{deviceId}:{docId}`
- Push: event-driven (`online` event) + 30s background poll
- Worker: `api.p31ca.org/sync` (separate worker)

**Zero overlap. No shared KV namespaces.**

---

## Open Items (not blocking MVP)

| Item | Priority | Notes |
|------|----------|-------|
| Sync Worker implementation | HIGH | Scaffold: KV read/write + D1 receipt. ~100 lines. |
| `verify:pglite-sync` gate | MEDIUM | Check schema file exists + TypeScript compiles |
| R2 attachment upload path | LOW | `evidence.file_ref` column ready; upload endpoint TBD |
| E2E encryption of sync payload | LOW | Hybrid encrypt (postQuantum.ts) before `fetch()` to T2 |
| New-device bootstrap from T3 | LOW | `GET /sync?bootstrap=true` → D1 full history replay |
