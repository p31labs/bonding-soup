# CWP-P31-K4-AGENT-HUB-FEDERATION-P2P — Federation peer-to-peer signed skill dispatch

> **Status:** v1.0.0 closed — signed peer→peer skill brokerage; canonical dispatch string; 5 new tests.
>
> **Schema:** `p31.peerDispatch/1.0.0`
>
> **Parent CWP:** `CWP-K4-AGENT-HUB` (v1.1.0 foundation); builds on federation peer registration already in v1.1.0.

## 0. Plain-language summary

The federation layer already supported one-way peer registration (hub A records hub B in KV).
This CWP adds the reverse: a registered peer can send a **signed skill dispatch request** to the
hub it is registered with, and the hub will run the skill on behalf of the peer.

This creates P2P skill brokerage across mesh deployments:
> "The holder of this Ed25519 keypair (registered as peer `{instanceId}`) asks hub `counsel` to
> run skill `pro-se-georgia` with this input."

## 1. Canonical string (what peer signs)

```
${PEER_DISPATCH_SCHEMA}|${peerId}|${hubId}|${skillId}|${ts}
```

Example:
```
p31.peerDispatch/1.0.0|<UUID>|counsel|pro-se-georgia|1714000000000
```

`peerId` is the `instanceId` the peer used when calling `POST /v1/federation/peer`.

## 2. Files changed

### Worker (k4-agent-hub)
- `packages/k4-agent-hub/src/crypto.js` — `PEER_DISPATCH_SCHEMA` constant + `canonicalPeerDispatchString()` (co-located with `canonicalDockString`; no Cloudflare deps so testable from Node)
- `packages/k4-agent-hub/src/index.js` — route `POST /v1/federation/dispatch` → `handleFederationDispatch`; imports canonical helpers from `crypto.js`

### Handler logic (`handleFederationDispatch`)
1. Parse body: `{ peerId, hubId, skillId, input, ts, sig }`
2. Validate inputs and ts skew (≤ 5 min)
3. Look up peer by `k4ah:peer:{peerId}` in KV — 403 if missing or expired
4. Verify Ed25519 signature over canonical dispatch string using peer's stored `publicKey`
5. Find skill in `SKILLS[hubId]` — 400 if not found
6. Call `dispatch({ env, hubId, skill, input })` (Ollama → simplex-cloud → echo chain)
7. Return `{ ...result, federation: { peerId, schema: "p31.peerDispatch/1.0.0" } }`

### Client package
- `packages/k4-agent-hub-client/src/index.mjs` — `peerDispatch(peerBaseUrl, hubId, skillId, input)` method: signs canonical dispatch string, POSTs to `/v1/federation/dispatch`

### Tests
- `packages/k4-agent-hub/test/federation-p2p.test.mjs` — 5 tests

## 3. Flow

```bash
# 1. Register as peer at target hub (existing CLI):
p31 agent-hub federation  # (via registerAsPeer in client)

# 2. Dispatch a skill to the peer hub:
const result = await client.peerDispatch(
  "https://k4-agent-hub.<sub>.workers.dev",
  "counsel",
  "pro-se-georgia",
  { prompt: "Draft a motion to compel discovery." }
);
# → { ok: true, dispatcher: "echo"|"ollama"|"simplex-cloud",
#     federation: { peerId: "<clientId>", schema: "p31.peerDispatch/1.0.0" } }
```

## 4. Test counts

| Package | Tests | Suites |
|---------|-------|--------|
| k4-agent-hub (federation-p2p.test.mjs) | 5 | 3 |
| **New total** | **5** | **3** |

Cumulative: k4-agent-hub 46/46 · k4-agent-hub-client 13/13.

## 5. Known follow-ups

| Follow-up | Tag |
|-----------|-----|
| WebSocket fan-out to docked clients on topology change | `CWP-P31-K4-AGENT-HUB-WS-FANOUT` |
| K₄ family Worker integration (k4-cage vertices dock too) | `CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE` |
| Passkey hardware co-sign on anchor pact | `CWP-P31-K4-AGENT-HUB-ANCHOR-PACT-V2` |
