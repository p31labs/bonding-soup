# P31 KV Namespace Map

**Document:** P31-KV-NAMESPACE-MAP  
**Date:** 2026-05-06  
**Scope:** All Cloudflare KV namespaces used by the P31 Worker fleet  
**Authority:** `p31-live-fleet.json` + `p31-constants.json` (URL truth); this doc is the KEY SCHEMA truth

---

## Rule

No two Workers may write to the same KV key pattern. Each namespace below declares its key schema. When a Worker adds a new key pattern, update this doc and the Worker's wrangler.toml binding in the same commit.

---

## Namespaces

### `system_state`

**Bound by:** command-center, simplex-worker (read-only from simplex)  
**Purpose:** Operator system state — live values updated by command-center, read by SIMPLEX agents

| Key | Type | Writer | Description |
|-----|------|--------|-------------|
| `spoons` | JSON `{value: number, max: number, updated_at: string}` | command-center | Current spoon budget |
| `love` | JSON `{total: number, updated_at: string}` | command-center | L.O.V.E. ledger total |
| `q_factor` | JSON `{value: number, updated_at: string}` | command-center | Q-Factor (mesh quality) |
| `ca_last_dose` | JSON `{timestamp: string, mg: number}` | command-center | Last calcium dose timestamp |
| `shift_state` | JSON `{active: boolean, started_at: string \| null}` | command-center | Operator shift status |
| `phos_state` | string (PHOS FSM state ID) | command-center | Current PHOS FSM state |

---

### `relay_rooms`

**Bound by:** bonding-relay (read/write), BONDING WebSocket clients (via relay)  
**Purpose:** C.A.R.S. multiplayer room state — ephemeral, TTL-gated

| Key Pattern | Type | Writer | Description |
|------------|------|--------|-------------|
| `room:{code}` | JSON RoomState | bonding-relay | Active room roster + soup state snapshot |
| `room:{code}:lock` | string (timestamp) | bonding-relay | Write lock for atomic room updates |

**TTL:** All room keys expire after 24h of inactivity (set via `expirationTtl`).

---

### `WAVE_CONTENT`

**Bound by:** social-engine (read/write)  
**Purpose:** Social post wave queue — scheduled content for broadcast

| Key Pattern | Type | Writer | Description |
|------------|------|--------|-------------|
| `queue:{platform}` | JSON `WaveQueueItem[]` | social-engine | Pending posts for platform |
| `sent:{platform}:{wave_id}` | JSON `{sent_at: string, post_id: string}` | social-engine | Sent post record |
| `hwm:{platform}` | string (ISO timestamp) | social-engine | High-water mark for dedup |

---

### `k4-personal` (personal agent state)

**Bound by:** k4-personal Worker  
**Purpose:** Personal agent memory — operator-scoped, isolated from mesh

| Key Pattern | Type | Writer | Description |
|------------|------|--------|-------------|
| `subject:{id}` | JSON SubjectState | k4-personal | Personal state for subject_id |
| `memory:{id}:{timestamp}` | JSON MemoryEntry | k4-personal | Episodic memory entry |
| `context:{session_id}` | JSON ContextWindow | k4-personal | Active session context window |

---

### `simplex` (D1 — not KV)

SIMPLEX agent state lives in **D1** (`simplex` database), not KV. See `P31-SIMPLEX-AGENT-FLEET-ALIGNMENT.md` §3 for the 22-table schema.

---

## Cross-Namespace Rules

1. **No cross-namespace writes** — a Worker may only write to namespaces declared in its `wrangler.toml` bindings.
2. **Key ownership** — each key pattern has exactly one writer. Multiple readers are allowed.
3. **TTL discipline** — ephemeral keys (room state, queue items) must set `expirationTtl`. Permanent keys (operator state) must not set TTL.
4. **JSON schema versioning** — all JSON values in `system_state` and `k4-personal` should include `updated_at` (ISO 8601). Breaking schema changes require a new key name, not overwriting the old one.

---

## Gaps (Future Work)

| Gap | WCD | Priority |
|-----|-----|----------|
| No automated check that two Workers don't claim the same key pattern | WCD-FLEET-01 | Medium |
| `relay_rooms` TTL not enforced in current bonding-relay code | WCD-FLEET-02 | Medium |
| `simplex-worker` KV bindings not yet created (D1 pending) | WCD-SIMPLEX-01 | High |
| `WAVE_CONTENT` `sent:*` keys accumulate indefinitely | WCD-FLEET-01 | Low |

---

*One namespace per concern. One writer per key. No cross-namespace writes.*
