# CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE — Family cage wire: operator-signed family vertex dock

> **Status:** v1.0.0 closed — `POST /v1/family/dock`; canonical family dock string; guardian assignment; 6 new tests.
>
> **Schema:** `p31.familyDock/1.0.0`
>
> **Parent CWP:** `CWP-K4-AGENT-HUB` (v1.1.0 foundation).

## 0. Plain-language summary

Family vertices (will, S.J., W.J., christyn) were previously canonical metadata only — listed in
`FAMILY_VERTICES` but with no way to create an active dock session for them.

This CWP wires the family cage to the dock protocol: the cage operator signs a family dock request
with their Ed25519 key, and the k4-agent-hub creates a session on the appropriate guardian agent hub.

Guardian assignments (from `TRIADIC_COVER`):
| Family vertex | Role | Guardian agent | Personal dock | Gate |
|--------------|------|----------------|---------------|------|
| will | operator | forge | structure | — |
| christyn | co-parent | counsel | connection | — |
| S.J. | child | scholar | rhythm | child-mesh-unlock |
| W.J. | child | scribe | creation | child-mesh-unlock |

## 1. Canonical string (what operator signs)

```
${FAMILY_DOCK_SCHEMA}|${operatorClientId}|${vertexId}|${ts}
```

Example:
```
p31.familyDock/1.0.0|<UUID>|christyn|1714000000000
```

## 2. Files changed

### Worker (k4-agent-hub)
- `packages/k4-agent-hub/src/crypto.js` — `FAMILY_DOCK_SCHEMA` + `canonicalFamilyDockString()` (no CF deps)
- `packages/k4-agent-hub/src/index.js` — route `POST /v1/family/dock` → `handleFamilyDock`; creates an 8h family session via `writeSession()` on the guardian agent hub

### Handler logic (`handleFamilyDock`)
1. Parse body: `{ operatorClientId, publicKeyB64u, vertexId, ts, sig, childMeshToken? }`
2. Look up vertexId in `FAMILY_VERTICES` — 400 if unknown
3. Enforce `child-mesh-unlock` gate for S.J. and W.J. — 403 if `childMeshToken` missing
4. Verify ts skew (≤ 5 min)
5. Verify Ed25519 signature over canonical family dock string
6. Compute `allowedSkills` = guardian hub's skills minus any further gated skills
7. Write session via `writeSession(env, { clientId: "family:{vertexId}:{operatorClientId}", ... })`
8. Return `{ vertexId, role, ageBand, personalDock, guardianAgent, sessionId, allowedSkills, expiresAt }`

### Client package
- `packages/k4-agent-hub-client/src/index.mjs` — `familyDock(vertexId, { childMeshToken })` method

### Tests
- `packages/k4-agent-hub/test/family-cage-wire.test.mjs` — 6 tests

## 3. Flow

```bash
# Dock as co-parent:
const sess = await client.familyDock("christyn");
# → { vertexId: "christyn", guardianAgent: "counsel", sessionId: "...", allowedSkills: [...] }

# Dock as child (operator must supply childMeshToken):
const sess = await client.familyDock("sj", { childMeshToken: "cage-op-token" });
# → { vertexId: "sj", guardianAgent: "scholar", ageBand: "minor", ... }

# Use the family session to call a skill on the guardian hub:
const res = await client.call("counsel", "pro-se-georgia", { prompt: "..." }, sess.sessionId);
```

## 4. Test counts

| Package | Tests | Suites |
|---------|-------|--------|
| k4-agent-hub (family-cage-wire.test.mjs) | 6 | 3 |
| **New total** | **6** | **3** |

Cumulative: k4-agent-hub 56/56 · k4-agent-hub-client 13/13.

## 5. Known follow-ups

| Follow-up | Tag |
|-----------|-----|
| Passkey hardware co-sign on anchor pact | `CWP-P31-K4-AGENT-HUB-ANCHOR-PACT-V2` |
| k4-cage Worker service-binding for live vertex presence | `CWP-P31-K4-AGENT-HUB-CAGE-PRESENCE` |
| Family vertex WebSocket fanout (dock events to guardian hub stream) | `CWP-P31-K4-AGENT-HUB-WS-DOCK-FANOUT` |
