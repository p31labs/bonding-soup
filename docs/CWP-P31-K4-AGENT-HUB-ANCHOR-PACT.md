# CWP-P31-K4-AGENT-HUB-ANCHOR-PACT — Operator anchor pact: Ed25519 → personal tetra

> **Status:** v1.0.0 closed — self-signed anchor pact; CLI create/show/verify/register/status; 13 new tests (8 client + 5 Worker).
>
> **Schema:** `p31.anchorPact/1.0.0` (full pact, disk) · `p31.anchorPactFingerprint/1.0.0` (public fingerprint, repo).
>
> **Parent CWP:** `CWP-P31-K4-AGENT-HUB-2026-04` (v1.1.0 foundation).

## 0. Plain-language summary

The anchor pact binds the operator's Ed25519 keypair (the mesh identity from
`~/.p31/agent-hub-key.json`) to their personal tetrahedron topology (`p31.personalTetra/1.0.0`).
The binding is a self-signed document — the private key signs a canonical string that includes
the public key fingerprint, the personal tetra schema, all four dock assignments, and a timestamp.

This creates a verifiable claim:
> "The holder of this Ed25519 private key asserts that their personal tetrahedron is
> wired as structure↔will, connection↔christyn, rhythm↔S.J., creation↔W.J."

V1 is self-signed. V2 (`CWP-P31-K4-AGENT-HUB-ANCHOR-PACT-V2`) will add the passkey
hardware layer so the device-bound WebAuthn credential co-signs the pact.

## 1. Canonical string (what is signed)

```
${schema}|${clientId}|${publicKeyB64u}|${personalTetraSchema}|${sortedDockPairs}|${createdAt}
```

where `sortedDockPairs` = `connection:v,creation:v,rhythm:v,structure:v` (keys sorted, colon-joined, comma-separated).

Example:
```
p31.anchorPact/1.0.0|<UUID>|<pubkeyB64u>|p31.personalTetra/1.0.0|connection:christyn,creation:wj,rhythm:sj,structure:will|1714000000000
```

## 2. Files changed

### Client package
- `packages/k4-agent-hub-client/src/anchor-pact.mjs` — canonical string builder, create/load/save/ensureAnchorPact, verifyAnchorPact, pactFingerprint
- `packages/k4-agent-hub-client/src/index.mjs` — anchor(), anchorStatus(), anchorRegister() methods on K4AgentHubClient; re-exports anchor-pact functions
- `packages/k4-agent-hub-client/package.json` — `"./anchor-pact": "./src/anchor-pact.mjs"` export added
- `packages/k4-agent-hub-client/test/anchor-pact.test.mjs` — 8 tests

### Worker (k4-agent-hub)
- `packages/k4-agent-hub/src/index.js` — ANCHOR_KV_PREFIX + ANCHOR_LIST_KEY constants; routes: POST /v1/anchor/register, GET /v1/anchor/status, GET /v1/anchor/{clientId}; handlers: handleAnchorRegister (verifies Ed25519 sig), handleAnchorStatus, handleAnchorGet
- `packages/k4-agent-hub/test/anchor.test.mjs` — 5 tests (canonical parity, Worker Ed25519 verification, KV round-trip)

### CLI
- `scripts/cli/agent-hub.mjs` — `anchor` subcommand: create / show / verify / register / status

### Repo root
- `p31-passport-anchor-pact.json` — public fingerprint stub (null until operator runs `anchor create`)

## 3. Operator flow

```bash
# 1. Create the anchor pact (first time only):
p31 agent-hub anchor create
# → writes ~/.p31/anchor-pact.json (0600)
# → prints public fingerprint

# 2. Verify the signature offline:
p31 agent-hub anchor verify
# → anchor-pact signature: VALID ✓

# 3. Register with a deployed hub:
p31 agent-hub anchor register --base https://k4-agent-hub.<sub>.workers.dev
# → { ok: true, schema: "p31.anchorPact/1.0.0", registered: "<clientId>", registeredAt: ... }

# 4. Check registered anchors on the hub:
p31 agent-hub anchor status --base https://k4-agent-hub.<sub>.workers.dev
# → { ok: true, count: 1, anchors: [{ clientId, publicKeyB64u, createdAt, registeredAt }] }
```

## 4. KV layout (Worker)

| Key | Value |
|-----|-------|
| `k4ah:anchor:{clientId}` | JSON anchor record (schema, clientId, publicKeyB64u, personalTetra, createdAt, registeredAt) |
| `k4ah:anchors:index` | JSON array of clientIds (capped at 64) |

## 5. Test counts

| Package | Tests | Suites |
|---------|-------|--------|
| k4-agent-hub-client (anchor-pact.test.mjs) | 8 | 3 |
| k4-agent-hub (anchor.test.mjs) | 5 | 3 |
| **New total** | **13** | **6** |

Cumulative: k4-agent-hub 41/41 · k4-agent-hub-client 13/13.

## 6. Known follow-ups

| Follow-up | Tag |
|-----------|-----|
| Passkey hardware co-sign (WebAuthn assertion attests the Ed25519 pubkey) | `CWP-P31-K4-AGENT-HUB-ANCHOR-PACT-V2` |
| Populate `p31-passport-anchor-pact.json` with real fingerprint on operator machine | Run `p31 agent-hub anchor create` then copy fingerprint fields |
| Family vertex anchor pacts (each vertex gets its own pact, signed by the cage operator) | `CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE` |
