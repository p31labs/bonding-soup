# P31 — K₄ agent worker tetrahedron hubs

> **Schema:** `p31.k4AgentHub/1.1.0` · **Manifest:** [`p31-k4-agent-hub.json`](../p31-k4-agent-hub.json) · **Verifier:** `npm run verify:k4-agent-hub` · **Smoke:** `npm run k4-agent-hub:smoke`
> **Public face:** [`agents.html`](../agents.html) · short route `/agents` · hub mirror `andromeda/04_SOFTWARE/p31ca/public/agents.html`
> **v1.1.0 changes:** signed Ed25519 dock + per-call envelope · K₄,₄,₄ family triadic cover (will/S.J./W.J./christyn) · federation peer registry · real Ollama dispatcher (env `OLLAMA_BASE_URL`) with structured-echo fallback · `/v1/metrics` aggregation

The personal tetrahedron has four docks (`structure`, `connection`, `rhythm`, `creation`). The agent tetrahedron has four hubs (`FORGE`, `COUNSEL`, `SCHOLAR`, `SCRIBE`) — one for each personal dock. Together they form a **K₄,₄ bipartite cover**: every personal vertex docks to one agent vertex, and the K₄ edges inside the agent tetrahedron let the hubs brief each other without the operator having to route work by hand.

This document is the operator-readable spec for the agent side. The personal side lives in `andromeda/04_SOFTWARE/k4-personal/src/personal-tetra.js`.

---

## Vision

You are the operator. You sit at the center pillar of your own tetrahedron. From its four vertices, four kinds of agent help reach upward:

- **Make** — code, deploy, scaffold, firmware. *Anvil*.
- **Protect** — legal drafting, hostile-mail triage, post-incident debrief. *Shield*.
- **Understand** — research synthesis, grants, pattern detection. *Book*.
- **Remember** — passport assembly, accommodation log, document foundry, child companion. *Quill*.

Each kind has a **hub** — a Cloudflare Durable Object backed by a Worker — and the four hubs together form a K₄ tetrahedron. When you make something (FORGE), the SCRIBE remembers; when COUNSEL needs context, it asks SCHOLAR; when SCHOLAR finds a pattern, FORGE turns it into code. Six edges, six handoffs, no operator-as-router.

You don't have to spell out which hub you want. The dock protocol picks the right vertex for the call you make and uses the K₄ adjacency to fan out only when fan-out helps.

---

## Topology

```
                      FORGE
                  (teal · make)
                       ◇
                     / | \
                   /   |   \
                 /     |     \
        COUNSEL ──── operator ──── SCHOLAR
        (coral)     (butter)      (phosphorus)
        protect                    understand
                 \     |     /
                   \   |   /
                     \ | /
                       ◇
                     SCRIBE
                 (lavender · remember)
```

- **4 vertices** — one per K₄ anchor color.
- **6 edges** — every vertex paired with every other; `n*(n-1)/2 = 6` (the K₄ edge invariant; `verify:k4-agent-hub` checks this).
- **1 inscribed pillar** — the operator at the center, in butter; not a vertex, the apex of the inscribed pyramid.
- **K₄,₄ cover** — the personal tetrahedron sits below, with its four vertices `structure / connection / rhythm / creation` each drawing one bipartite edge upward to its agent counterpart `forge / counsel / scholar / scribe`. Eight nodes, sixteen edges in the full bipartite picture.

### Vertex roles

| Vertex | Verb | Personal dock | K₄ anchor | Skills (Ollama persona · simplex-v7 lane) |
|---|---|---|---|---|
| `forge` | make | `structure` | teal | `p31-mechanic` (FORGE) · `p31-firmware` · `p31-quick` |
| `counsel` | protect | `connection` | coral | `p31-counsel` (COUNSEL) · `p31-triage` (HERALD) · `p31-debrief` |
| `scholar` | understand | `rhythm` | phosphorus | `p31-narrator` (SCHOLAR) · `p31-oracle` (ORACLE) |
| `scribe` | remember | `creation` | lavender | `p31-scribe` (SCRIBE) · `p31-phos` *(child-gated)* |

### K₄ edges (six)

| Edge | Label | Verb compound | Typical use |
|---|---|---|---|
| `forge`↔`counsel` | safe to ship | make · protect | "Build this API and tell me what could be sued over." |
| `forge`↔`scholar` | design from research | make · understand | "Read these three papers and scaffold the data model they imply." |
| `forge`↔`scribe` | write what you build | make · remember | "Assemble the runbook from this PR's diff." |
| `counsel`↔`scholar` | brief the brief | protect · understand | "What does the case law say about this scenario the operator just described?" |
| `counsel`↔`scribe` | file the protect | protect · remember | "Log this letter, classify the voltage, store the response template." |
| `scholar`↔`scribe` | publish the understanding | understand · remember | "Take the synthesis and turn it into a citable record." |

---

## Dock protocol — `p31.k4AgentHub/1.0.0`

A **personal tetrahedron** docks to the agent hub by hitting one endpoint:

### `POST /v1/dock`

```jsonc
{
  "clientId": "uuid",                    // stable identity of the personal tetrahedron
  "personalTetra": { /* p31.personalTetra/1.0.0 snapshot */ },
  "capabilities": ["ts-worker", "voltage-triage", "passport-mirror"],
  "publicKey": "optional Ed25519 (future: signed dock)"
}
```

Response:

```jsonc
{
  "sessionId": "uuid",                   // bearer credential for /v1/{hub}/* (24h)
  "hubs": [
    { "id": "forge",   "baseUrl": "https://k4-agent-hub.trimtab-signal.workers.dev/v1/forge",   "expires": "2026-05-01T22:00:00Z" },
    { "id": "counsel", "baseUrl": "https://k4-agent-hub.trimtab-signal.workers.dev/v1/counsel", "expires": "2026-05-01T22:00:00Z" },
    { "id": "scholar", "baseUrl": "https://k4-agent-hub.trimtab-signal.workers.dev/v1/scholar", "expires": "2026-05-01T22:00:00Z" },
    { "id": "scribe",  "baseUrl": "https://k4-agent-hub.trimtab-signal.workers.dev/v1/scribe",  "expires": "2026-05-01T22:00:00Z" }
  ],
  "allowedSkills": ["ts-worker", "voltage-triage", "passport-mirror"],
  "policies": { "rpm": 30, "burst": 8, "maxBody": 262144 }
}
```

### `POST /v1/{hub}/call`

```jsonc
{
  "sessionId": "uuid",
  "skillId":   "ts-worker",
  "input":     { /* per-skill payload */ },
  "stream":    false
}
```

Returns the per-skill output. If `stream=true`, the response is `text/event-stream` chunks until completion.

### `GET /v1/{hub}/health`

```jsonc
{ "ok": true, "hub": "forge", "load": 0.12, "skills": ["ts-worker", "esp-firmware", "one-liner"] }
```

### `GET /v1/topology`

Returns the K₄ adjacency, the four hubs' current statuses, and the bipartite cover for the calling personal tetrahedron. Powers the live K₄ visualization on `agents.html`.

### `GET /v1/cross/{from}/{to}`

Calls the inter-hub edge — e.g. `GET /v1/cross/forge/scholar` asks Scholar for context relevant to Forge's last call. Used when one hub needs another to enrich its answer.

### `WS /v1/{hub}/stream`

Optional duplex WebSocket for long-running invocations (a multi-minute synthesis, a triage that wants to ask a clarifying question, a build that streams stdout).

### Auth

- `dock` returns a `sessionId`.
- All subsequent calls present it as `Authorization: Bearer <sessionId>` *or* via a same-origin session cookie.
- Sessions are 24h, refreshable; rotate on policy change.

### Rate limits

- per client: **30 rpm**, burst 8
- per hub: **50 rps**, burst 20
- child-gated skills: **10 rpm**, burst 4

---

## Where to find what

| Concern | Path |
|---|---|
| Canon manifest | [`p31-k4-agent-hub.json`](../p31-k4-agent-hub.json) |
| Worker source | [`packages/k4-agent-hub/`](../packages/k4-agent-hub/) |
| Worker config | [`packages/k4-agent-hub/wrangler.toml`](../packages/k4-agent-hub/wrangler.toml) |
| Public face | [`agents.html`](../agents.html) |
| p31ca mirror | `andromeda/04_SOFTWARE/p31ca/public/agents.html` (after `npm run sync:agents` lands; until then, manual mirror) |
| Verifier | [`scripts/verify-k4-agent-hub.mjs`](../scripts/verify-k4-agent-hub.mjs) (`npm run verify:k4-agent-hub`) |
| Personal counterpart | `andromeda/04_SOFTWARE/k4-personal/src/personal-tetra.js` (`p31.personalTetra/1.0.0`) |
| Cognitive Passport audience map | [`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`](COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md) — drives `child` gate on SCRIBE.phos-companion |
| Local Ollama personas | [`.cursor/rules/p31-ollama-fleet.mdc`](../.cursor/rules/p31-ollama-fleet.mdc) |
| simplex-v7 cloud lanes | [`simplex-v7/src/agents/registry.ts`](../simplex-v7/src/agents/registry.ts) |

---

## Build / verify / deploy

### Verify

```
npm run verify:k4-agent-hub
```

Asserts:

1. Manifest has schema `p31.k4AgentHub/1.0.0`, four vertices, six edges, K₄ invariant `|E| = n*(n-1)/2`.
2. Each vertex has at least one skill, a personal-dock pairing, and an anchor color from the K₄ palette.
3. Each edge connects two distinct vertices and the edge set is the full set of `C(4,2) = 6` pairs.
4. The bipartite cover lists all four `personal → agent` pairs and matches the personal-tetra dock keys.
5. The Worker package has a `wrangler.toml` declaring four DO classes (one per vertex) and a `package.json`.
6. `agents.html` references all four hub IDs.

### Local dry-run

From the package:

```
cd packages/k4-agent-hub
npm install
npx wrangler dev --local
```

This mounts the Worker on `http://127.0.0.1:8787`. Hit `GET /v1/topology` to see the manifest topology echoed.

### Deploy (zero-budget Cloudflare)

```
cd packages/k4-agent-hub
npx wrangler deploy
```

Requires `CLOUDFLARE_API_TOKEN`. Routes default to `*.trimtab-signal.workers.dev/k4-agent-hub`. Operator can promote to `agents.p31ca.org` when DNS is ready.

---

## Public messaging (Tier-A copy)

> **Tagline:** Four hubs. One mesh. Your tetrahedron, their anvil-shield-book-quill.
>
> **Elevator:** P31's K₄ agent tetrahedron is four cooperating workers — Forge, Counsel, Scholar, Scribe — that your personal tetrahedron docks to. Each hub speaks one verb (make, protect, understand, remember). The six K₄ edges let them brief each other so a single ask reaches the right pair without the operator having to route it.

This copy is in `p31-k4-agent-hub.json` and is the source for `agents.html` and any future hub-product card. Public-voice avoid-list compliance is part of `verify:public-sanitization`.

---

## Ethics & guards

- **No child exposure without gate** — `SCRIBE.phos-companion` is gated by the same `p31_passport_child_mesh_unlocked` predicate as the Cognitive Passport's S.J./W.J. audience.
- **No operator impersonation** — agents do not represent themselves as the operator. `displayName` from a docked personal tetra is rendered as "*the operator*" in agent-to-agent edge calls; the agent never says "I am Will".
- **No credential pass-through** — the hub never forwards the operator's API keys to model providers. Local Ollama is preferred for confidential work (counsel, triage, phos) per `.cursor/rules/p31-ollama-fleet.mdc`.
- **No naval / submarine metaphors** — inherits CLAUDE.md / .cursorrules.
- **Spoon-aware** — when `executiveSpoonState ∈ {low, crisis}`, every hub reduces branching, prefers one-step replies, and never asks for confirmation it could infer.

---

## v1.1.0 features (now)

### Signed Ed25519 dock + per-call envelope

A personal tetrahedron may dock with a signed envelope. The hub verifies the signature against the supplied 32-byte Ed25519 public key, stores the public key in the session, and from that point requires every `/v1/{hub}/call` to carry a signed call envelope (`ts · nonce · sig` over `${skillId}|${stableJsonStringify(input)}|${ts}|${nonce}`). When `env REQUIRE_SIGNED_DOCK=1`, signed envelopes are mandatory; otherwise advisory.

Replay protection: each `nonce` is stored in KV with a 90-second TTL (4× for dock nonces). Clock skew is bounded at ±5 minutes.

The smoke runner generates a fresh keypair and exercises the full signed flow:

```bash
cd packages/k4-agent-hub && npm install && npm run dev
# in another terminal:
npm run k4-agent-hub:smoke    # against http://127.0.0.1:8787 by default
npm run k4-agent-hub:smoke -- --base https://k4-agent-hub.trimtab-signal.workers.dev
```

### K₄,₄,₄ family triadic cover

The agent tetrahedron sits above the personal tetrahedron, which sits above the family cage:

| Family vertex | Personal dock | Guardian agent | Gate |
|---|---|---|---|
| `will` (operator) | `structure` | `forge` | — |
| `sj` (child) | `rhythm` | `scholar` | `child-mesh-unlock` |
| `wj` (child) | `creation` | `scribe` | `child-mesh-unlock` |
| `christyn` (co-parent) | `connection` | `counsel` | — |

`/v1/topology` returns the full triadic cover so a UI can draw all three layers. The 3D view in `agents.html` shows the family layer as smaller spheres below the personal tetrahedron, with a butter pillar through all three centroids.

### Federation across operator instances

Run another K₄ agent tetrahedron next to yours and let them peer:

```
POST /v1/federation/peer
{ "instanceId": "...", "manifestUrl": "https://other-hub/v1/manifest",
  "publicKey": "...", "ts": ..., "sig": "..." }

GET  /v1/federation       → aggregated topology (self + cached peers)
DELETE /v1/federation/peer/{instanceId}
```

Peers are stored in KV with a 24h TTL (configurable via `PEER_TTL_SECONDS`), capped at 16. Peer registration is signature-required (`rejectUnsignedPeers: true`) — the same canonical form as a dock envelope.

### Real Ollama dispatcher

Each hub's `runSkill(skill, input)` first tries `${OLLAMA_BASE_URL}/api/generate` with the skill's `ollamaPersona` as `model` and the hub's verb hint in `system`. If `OLLAMA_BASE_URL` is unset, the network is unreachable, or the model isn't installed, it falls back to a structured echo with full skill metadata (`dispatcher: "echo"`).

```toml
# packages/k4-agent-hub/wrangler.toml
[vars]
OLLAMA_BASE_URL = "http://127.0.0.1:11434"   # dev with `wrangler dev --local`
OLLAMA_TIMEOUT_MS = "8000"
```

For production, expose your Ollama via the existing tunnel (`scripts/ollama-tunnel.sh`) and point `OLLAMA_BASE_URL` at the tunnel URL — the hub becomes the front door for the whole local fleet.

### Cross-edge service-binding briefings

The K₄ edges are no longer just metadata. Hubs invoke siblings via Durable Object service-binding stubs (sub-millisecond, no public hop). FORGE's `ts-worker` skill optionally pulls a brief from SCHOLAR (`input.askScholar`); COUNSEL's `voltage-triage` optionally files with SCRIBE (`input.fileWith === "scribe"`); SCHOLAR's `grants-synthesis` optionally publishes via SCRIBE.

`GET /v1/cross/{from}/{to}?ask=...` exposes the same machinery for ad-hoc inter-hub briefs.

### Aggregated metrics

`GET /v1/metrics` returns per-hub counters (`callsTotal`, `errorsTotal`, `callsRecent60s`, `avgMs`, `lastCallAt`) plus an aggregate row. Powers any future dashboard or simplex-v7 SCHOLAR ingest.

## Future (not in v1.1.0)

- **Simplex-v7 cloud lane wire-up** (`CWP-P31-K4-AGENT-HUB-WIRE-SIMPLEX-LANE`) — when the local Ollama is unreachable, fall through to the cloud SCHOLAR/COUNSEL/etc. lane that owns the same skill, instead of degrading to echo.
- **Peer-to-peer signed messaging** between federation peers (currently the registry is one-way: peers register but don't yet exchange signed work).
- **WebSocket fan-out** — broadcast topology changes to all docked clients.
- **Operator-locked anchor pact** — bind a personal Ed25519 keypair to the operator's passkey at first dock, store fingerprint hash in `p31-passport-anchor-pact.json`.
