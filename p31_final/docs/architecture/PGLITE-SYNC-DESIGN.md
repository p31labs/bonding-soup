# PGLite Multi-Device Sync Design (CWP-SOV-01)

## Overview
This document outlines the architectural approach for implementing multi-device synchronization using PGLite for P31ca.org, ensuring data sovereignty and consistency across sessions.

## 1. Conflict Resolution (CRDT)
- **Choice:** Automerge
- **Reasoning:** Robust, well-documented, and supports complex data structures efficiently for offline-first applications. It integrates well with the existing IndexedDB-based storage patterns.

## 2. Sync Flow
1. **Client Persistence:** Local PGLite instance (IndexedDB backend).
2. **Sync Trigger:** Mutation events (insert/update/delete) in PGLite are captured via triggers.
3. **Transmission:** Mutations are serialized as Automerge changes and queued for synchronization via the `api.p31ca.org/sync` Cloudflare Worker.
4. **Relay:** The Worker stores pending changes in KV/Durable Object (TBD, avoiding high costs).
5. **Conflict Resolution:** Automerge merges concurrent changes based on vector clocks.

## 3. Storage Integration
- Coexist with `idb-keyval` (used for simple preferences).
- PGLite tables will store structured application data.

## 4. TypeScript Skeleton

```typescript
// sync-engine.ts
import { PGlite } from '@electric-sql/pglite';
import * as Automerge from '@automerge/automerge';

export class P31SyncEngine {
  private db: PGlite;

  constructor(db: PGlite) {
    this.db = db;
  }

  async sync() {
    // 1. Fetch remote changes
    // 2. Apply with Automerge
    // 3. Push local changes
  }
}
```

## 5. Alignment
- Register in `p31-alignment.json` once implemented.
- Gate Check: Must pass `npm run verify:sov-sync` (TBD).
