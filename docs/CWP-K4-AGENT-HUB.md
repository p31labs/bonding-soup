# CWP-P31-K4-AGENT-HUB-2026-04 — K₄ agent worker tetrahedron

> **Status:** v1.1.0 closed (foundation + client) · ready for live deploy + product-card promotion · next iteration is `CWP-P31-K4-AGENT-HUB-WIRE-SIMPLEX-LANE` for cloud-fallback dispatch.
>
> **Schemas:** `p31.k4AgentHub/1.1.0` (hub) · `p31.k4AgentHubFederation/1.0.0` (federation) · `p31.familyCage/1.0.0` (family layer) · `p31.k4AgentHubClientKey/1.0.0` (operator keypair on disk).
>
> **Sister CWPs:** `CWP-P31-PAR-2026-01` (Personal Agent Room — `andromeda/04_SOFTWARE/integration-handoff/`), `CWP-P31-IB-2026-01` (Initial Build), `CWP-P31-UI-2026-01` (Operator UI).

## 0. Plain-language summary

The K₄ agent worker tetrahedron is four cooperating Cloudflare Workers — **FORGE** (make), **COUNSEL** (protect), **SCHOLAR** (understand), **SCRIBE** (remember) — that any operator's personal tetrahedron can dock to. The four hubs form a complete K₄ graph (six edges); the personal tetrahedron forms a K₄,₄ bipartite cover with the agent layer; the family cage forms a K₄,₄,₄ triadic stack underneath. Every dock and every call is signed with Ed25519. The operator gets one keypair (`~/.p31/agent-hub-key.json`); the hub never sees a credential.

This CWP captures the v1.1.0 ship and the integration surface for the next session that picks it up.

## 1. Architecture (one screen)

```
                     FORGE (teal · make)
                            ◇
                          / | \
                        /   |   \
              COUNSEL ──── ⊙ ──── SCHOLAR        ← agent K₄ tetrahedron
              (coral)    operator   (phosphorus)   (4 vertices, 6 edges)
                        \   |   /
                          \ | /
                            ◇
                     SCRIBE (lavender · remember)
                            │
                  bipartite K₄,₄ docking edges
                            │
                            ▼
                    personal K₄ tetrahedron       ← p31.personalTetra/1.0.0
              (structure · connection · rhythm · creation)
                            │
                  triadic K₄,₄,₄ family edges
                            │
                            ▼
                       family cage K₄              ← p31.familyCage/1.0.0
                  (will · S.J. · W.J. · christyn)
```

**Vertex pairings (top-down):**

| Family | Personal dock | Guardian agent | Verb | Anchor | Gate |
|---|---|---|---|---|---|
| will (operator)   | structure   | forge   | make       | teal       | — |
| sj (child)        | rhythm      | scholar | understand | phosphorus | child-mesh-unlock |
| wj (child)        | creation    | scribe  | remember   | lavender   | child-mesh-unlock |
| christyn          | connection  | counsel | protect    | coral      | — |

## 2. What shipped in v1.1.0 (summary of code paths)

| Concern | Path |
|---|---|
| Canon manifest | `p31-k4-agent-hub.json` |
| Operator-readable spec | `docs/P31-K4-AGENT-HUBS.md` |
| Worker package | `packages/k4-agent-hub/` |
| Worker source — router | `packages/k4-agent-hub/src/index.js` |
| Worker source — topology + invariants | `packages/k4-agent-hub/src/topology.js` |
| Worker source — dock + auth | `packages/k4-agent-hub/src/dock-protocol.js` |
| Worker source — Ed25519 + canonical envelopes | `packages/k4-agent-hub/src/crypto.js` |
| Worker source — Ollama dispatcher + echo fallback | `packages/k4-agent-hub/src/dispatcher.js` |
| Worker source — DO base + cross-edge calls | `packages/k4-agent-hub/src/hub-base.js` |
| Worker source — four DO subclasses with edge briefings | `packages/k4-agent-hub/src/hubs.js` |
| Wrangler config (4 DOs + KV + env vars) | `packages/k4-agent-hub/wrangler.toml` |
| Worker unit tests (15 tests) | `packages/k4-agent-hub/test/topology.test.mjs` |
| Worker crypto tests (8 tests) | `packages/k4-agent-hub/test/crypto.test.mjs` |
| Operator-side client package | `packages/k4-agent-hub-client/` |
| Client tests (5 tests, end-to-end vs in-process mock hub) | `packages/k4-agent-hub-client/test/client.test.mjs` |
| Public face (Quantum Material U + Three.js K₄,₄,₄) | `agents.html` |
| Public face mirror | `andromeda/04_SOFTWARE/p31ca/public/agents.html` |
| Mirror sync script | `scripts/sync-agents-to-p31ca.mjs` |
| Live-hub smoke runner (Ed25519 round-trip + 9 routes) | `scripts/k4-agent-hub-smoke.mjs` |
| Verifier | `scripts/verify-k4-agent-hub.mjs` |
| `p31` CLI subcommand | `scripts/cli/agent-hub.mjs` |
| Alignment registry rows + derivation | `p31-alignment.json` |
| Root verify pipeline injection | `package.json` `verify` |

## 3. Public API contract (what the next session must not break)

### `POST /v1/dock`

Request body (all fields except the signed-envelope quartet are required; the quartet is required when `REQUIRE_SIGNED_DOCK=1` and advisory otherwise):

```jsonc
{
  "clientId":     "string ≥ 8 chars",
  "personalTetra": { "schema": "p31.personalTetra/1.0.0", "docks": { … } },
  "capabilities": ["ts-worker", "voltage-triage", … ],
  "publicKey":    "base64url 32-byte raw Ed25519 public key",
  "ts":           1234567890000,
  "nonce":        "string ≥ 8 chars",
  "sig":          "base64url Ed25519 signature over the canonical dock string"
}
```

Canonical dock string (UTF-8): `${clientId}|${personalTetra.schema}|${sortedCaps.join(',')}|${ts}|${nonce}`

Response:

```jsonc
{
  "ok": true,
  "signed": true | false,
  "schema": "p31.k4AgentHub/1.1.0",
  "sessionId": "uuid",
  "hubs":    [{ id, anchor, verb, personalDock, baseUrl, expires }, … 4 ],
  "edges":   [ … 6 K₄ edges ],
  "bipartite": [ … 4 personal↔agent rows ],
  "allowedSkills": [ … ],
  "policies": { rpm, burst, maxBody, childGated, requireSignedDock }
}
```

### `POST /v1/{hub}/call` (signed when session was signed-dock)

Request body:

```jsonc
{ "skillId": "ts-worker", "input": { … }, "ts": …, "nonce": "…", "sig": "…" }
```

Canonical call string: `${skillId}|${stableJsonStringify(input)}|${ts}|${nonce}`. The hub re-imports the public key from the session and verifies. Replay nonces are stored in KV with a 90s TTL.

### Other v1.1.0 routes

`GET /v1/manifest` · `GET /v1/topology` (live, with triadic) · `GET /v1/cross/{from}/{to}?ask=…` · `GET /v1/{hub}/health` · `GET /v1/{hub}/skills` · `GET /v1/{hub}/metrics` · `GET /v1/metrics` (aggregate) · `POST /v1/{hub}/edge` (sibling-only) · `WS /v1/{hub}/stream` · `GET /v1/federation` · `POST /v1/federation/peer` · `DELETE /v1/federation/peer/{instanceId}`.

## 4. Operator daily flow

```bash
# One-time: generate a keypair (or re-use the one from a previous session)
p31 agent-hub keypair

# Inspect the running hub
p31 agent-hub topology --base https://k4-agent-hub.trimtab-signal.workers.dev

# Sign + dock + see allowedSkills
p31 agent-hub dock --base https://k4-agent-hub.trimtab-signal.workers.dev

# Make something — signed call envelope, optional cross-edge enrichment
p31 agent-hub call forge ts-worker --prompt "scaffold a /healthz route in this Worker"

# Inter-hub brief (no skill invocation, just the K₄ edge ping)
p31 agent-hub cross forge scholar --ask "what does the operator's geodesic doc say about K₄?"
```

## 5. Verification gates

| Gate | Path | What it asserts |
|---|---|---|
| `npm run verify:k4-agent-hub` | `scripts/verify-k4-agent-hub.mjs` | Manifest + topology.js + wrangler + crypto + dispatcher + smoke + agents.html + p31ca mirror parity (8 invariants) |
| `npm run test:k4-agent-hub` | `packages/k4-agent-hub/test/*.test.mjs` | 23 unit tests (K₄ invariant, family triadic cover, Ed25519 round-trip, canonical envelopes) |
| `npm test --prefix packages/k4-agent-hub-client` | `packages/k4-agent-hub-client/test/*.test.mjs` | 5 end-to-end tests against an in-process mock hub |
| `npm run k4-agent-hub:smoke` | `scripts/k4-agent-hub-smoke.mjs` | 9 live-hub probes (manifest · signed dock · skills · signed call · cross · per-hub metrics · agg metrics · topology · federation) |
| `npm run k4-agent-hub:smoke:offline` | `scripts/k4-agent-hub-smoke.mjs --skip-network` | Shape-only + Node 20 SubtleCrypto check |
| `npm run sync:agents` | `scripts/sync-agents-to-p31ca.mjs` | Re-runs `verify:k4-agent-hub` after writing the mirror |
| `npm run sync:agents -- --check` | same | Exits 1 if home and mirror differ (CI parity gate) |

`verify:k4-agent-hub` is in the root `verify` pipeline (between `verify:quantum-deck` and `verify:discord-bot`) and registered in `p31-effective-bar.mjs` as always-run.

## 6. Configuration surface (env vars on the Worker)

| Var | Default | Purpose |
|---|---|---|
| `SESSION_TTL_SECONDS` | `86400` | Dock session lifetime |
| `RATE_LIMIT_RPM` | `30` | Per-client RPM (advisory, not enforced in v1.1.0) |
| `ALLOW_CROSS_EDGES` | `1` | Enable `/v1/cross/{from}/{to}` calls |
| `REQUIRE_SIGNED_DOCK` | `0` | When `1`, every dock MUST present a signed envelope |
| `OLLAMA_BASE_URL` | `""` | When set, hubs route skills to `${OLLAMA_BASE_URL}/api/generate` |
| `OLLAMA_TIMEOUT_MS` | `8000` | Ollama HTTP timeout |
| `PEER_TTL_SECONDS` | `86400` | Federation peer registry KV expiration |

## 7. Deployment recipe (next session — pick this up)

1. `cd packages/k4-agent-hub && npm install`
2. `wrangler kv:namespace create K4_AGENT_HUB` — paste the printed id into `wrangler.toml`
3. (Optional) Stand up the Ollama tunnel: `bash scripts/ollama-tunnel.sh` → put the resulting URL in `OLLAMA_BASE_URL`
4. (Optional) Set `REQUIRE_SIGNED_DOCK=1` for production
5. `npm run deploy` (needs `CLOUDFLARE_API_TOKEN`)
6. Test from operator host: `p31 agent-hub dock --base https://k4-agent-hub.<your-subdomain>.workers.dev`
7. Promote to `agents.p31ca.org` when DNS / zone routes are ready (mirror the passkey-worker zone-route pattern in `andromeda/04_SOFTWARE/p31ca/workers/passkey/`)

## 8. Known follow-ups (not in v1.1.0)

| Follow-up | Tag | Notes |
|---|---|---|
| Simplex-v7 cloud lane fallback | `CWP-P31-K4-AGENT-HUB-WIRE-SIMPLEX-LANE` | When local Ollama unreachable, fall through to FORGE/COUNSEL/SCHOLAR/SCRIBE simplex-v7 cloud crew lanes; needs the simplex-v7 offline-Ollama follow-up first |
| Hub-card promotion | `CWP-P31-K4-AGENT-HUB-CARD` | Add `k4-agent-hubs` to `andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs` + `hub-app-ids.mjs` + `*-about.html` + ground-truth route — Tier-A commitment, schedule with hub re-build |
| Peer-to-peer signed messaging | `CWP-P31-K4-AGENT-HUB-FEDERATION-P2P` | Currently the federation registry is one-way; v1.2.0 adds signed peer→peer skill brokerage |
| Operator anchor pact | `CWP-P31-K4-AGENT-HUB-ANCHOR-PACT` | Bind passkey → personal Ed25519 keypair → personal tetra; mirror fingerprint in `p31-passport-anchor-pact.json` |
| WebSocket fan-out | `CWP-P31-K4-AGENT-HUB-WS-FANOUT` | Broadcast topology changes to all docked clients on `/v1/{hub}/stream` |
| K₄ family Worker integration | `CWP-P31-K4-AGENT-HUB-FAMILY-CAGE-WIRE` | Wire `k4-cage` Worker so each family vertex docks too — currently family layer is canonical metadata only |

## 9. Public messaging (Tier-A, voice-checked)

> **Tagline:** Four hubs. One mesh. Your tetrahedron, their anvil-shield-book-quill.
>
> **Elevator:** P31's K₄ agent tetrahedron is four cooperating workers — Forge, Counsel, Scholar, Scribe — that your personal tetrahedron docks to. Each hub speaks one verb (make, protect, understand, remember). The six K₄ edges let them brief each other so a single ask reaches the right pair without the operator having to route it.

Source of truth for this copy: `p31-k4-agent-hub.json` → `publicMessaging`. Public-voice avoid-list compliance is part of `verify:public-sanitization`.

## 10. Ethics & guards (inherited)

- **No child exposure without gate** — `phos-companion` and family vertices `sj` / `wj` are gated on `child-mesh-unlock`.
- **No operator impersonation** — agents render the docked operator as "*the operator*" in agent-to-agent edge calls.
- **No credential pass-through** — hubs never forward operator API keys to model providers. Local Ollama lane is preferred for confidential work.
- **No naval / submarine metaphors** — inherits CLAUDE.md / .cursorrules.
- **Spoon-aware** — when `executiveSpoonState ∈ {low, crisis}`, hubs reduce branching and prefer one-step replies.
- **Operator key on disk** — `~/.p31/agent-hub-key.json` is created with `0600` and lives outside the workspace; `.gitignore` excludes `.p31/`.

---

**Closed by:** v1.1.0 ship, 2026-04-30. Verifier green, 28 unit tests across two packages, 5 client end-to-end, mirror in parity. Hub ready for live `wrangler deploy`.
