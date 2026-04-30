# CWP-P31-K4-AGENT-HUB-WIRE-SIMPLEX-LANE — Simplex-v7 cloud fallback for K₄ agent dispatch

> **Status:** v1.0.0 closed — Ollama → simplex-cloud → echo chain live; 13 new dispatcher tests green.
>
> **Parent CWP:** `CWP-P31-K4-AGENT-HUB-2026-04` (v1.1.0 foundation + client).
>
> **Schema additions:** none (dispatcher is internal; public API contract unchanged).

## 0. Plain-language summary

Before this CWP, when a docked client called a k4-agent-hub skill and the local Ollama fleet
was unreachable, the Worker returned a structured echo — a skeleton reply with metadata but no
AI content. This CWP wires in the simplex-v7 crew as a cloud fallback so the operator gets a
real Anthropic-backed reply even when no Ollama process is running locally.

Dispatch priority after this CWP:

```
1. tryOllama        — local fleet via OLLAMA_BASE_URL      (preferred; private; zero egress cost)
2. trySimplexCloud  — simplex-v7 via SIMPLEX_BASE_URL      (fallback; Anthropic-backed)
3. structuredEcho   — always-succeeds skeleton             (final fallback; no AI content)
```

Each skill in the topology carries a `simplexLane` field naming the target simplex-v7 agent:

| Hub     | Sample skill          | simplexLane |
|---------|-----------------------|-------------|
| FORGE   | ts-worker             | FORGE       |
| COUNSEL | pro-se-georgia        | COUNSEL     |
| SCHOLAR | grants-synthesis      | SCHOLAR     |
| SCRIBE  | passport-mirror       | SCRIBE      |
| SCRIBE  | q-factor-patterns     | ORACLE      |
| COUNSEL | voltage-triage        | HERALD      |

Skills with `simplexLane: null` (e.g. `esp-firmware`, `phos-companion`) always fall to echo
when Ollama is absent — intentional: `phos-companion` is gated and should not hit cloud AI.

## 1. What changed

### simplex-v7 — new endpoint

`POST /api/k4/dispatch`

- Added `simplex-v7/src/skills/k4-dispatch.ts` — maps `agentId` to a system prompt, calls
  `runAnthropicUserMessage`, returns `{ ok, dispatcher: "simplex-v7", agentId, skillId,
  sessionId, reply, offline }`.
- Wired in `simplex-v7/src/skills/router.ts` — path added to `SKILL_PATHS`; handled before
  the GET routes block.
- Auth: same `OPERATOR_SECRET` Bearer / `X-Operator-Token` pattern as all skill routes.
- TypeScript: `npx tsc --noEmit` clean.

### k4-agent-hub — dispatcher

`packages/k4-agent-hub/src/dispatcher.js`

- Added `trySimplexCloud({ env, hubId, skill, input })`:
  - Reads `SIMPLEX_BASE_URL` + `SIMPLEX_OPERATOR_SECRET` from env.
  - Skips when `skill.simplexLane` is null.
  - POSTs `{ agentId, skillId, prompt }` to `/api/k4/dispatch` with 20 s timeout.
  - Soft-fails to `{ ok: false, … }` on network error or non-2xx.
- Updated `dispatch()`: `tryOllama → trySimplexCloud → structuredEcho`.
- Updated `structuredEcho` note: removed stale CWP-todo reference.

### k4-agent-hub — wrangler.toml

Added `SIMPLEX_BASE_URL = ""` with operator instructions.
`SIMPLEX_OPERATOR_SECRET` is a wrangler secret (not a var) — set via:

```
wrangler secret put SIMPLEX_OPERATOR_SECRET   # value = simplex-v7 OPERATOR_SECRET
```

### Tests

`packages/k4-agent-hub/test/dispatcher.test.mjs` — 13 new tests:

| Suite | Count |
|-------|-------|
| structuredEcho | 3 |
| tryOllama soft-fail | 2 |
| trySimplexCloud | 5 |
| dispatch() priority chain | 3 |

Full suite: 36/36 (was 23).

## 2. Operator setup (production)

```bash
# 1. Deploy simplex-v7 first (already deployed as simplex-worker).
#    Confirm OPERATOR_SECRET is set.
wrangler secret list --name simplex-worker

# 2. Wire the k4-agent-hub fallback.
cd packages/k4-agent-hub

# Set the simplex-worker URL in wrangler.toml [vars]:
#   SIMPLEX_BASE_URL = "https://simplex-worker.<sub>.workers.dev"

# Set the shared secret (matches simplex-worker OPERATOR_SECRET):
wrangler secret put SIMPLEX_OPERATOR_SECRET

# Deploy.
wrangler deploy

# 3. Smoke — call a skill with Ollama absent, verify dispatcher=simplex-cloud:
p31 agent-hub call forge ts-worker --prompt "write a /healthz handler" \
  --base https://k4-agent-hub.<sub>.workers.dev
# → { ok: true, dispatcher: "simplex-cloud", reply: "...", ... }
```

## 3. Known follow-ups

| Follow-up | Tag |
|-----------|-----|
| Rate-limit the `/api/k4/dispatch` path separately (cloud calls cost tokens) | `CWP-P31-K4-AGENT-HUB-WIRE-SIMPLEX-LANE-RL` |
| Stream simplex-v7 replies back via ReadableStream so TTFR drops | `CWP-P31-K4-AGENT-HUB-STREAM` |
| Hub-card promotion to p31ca registry | `CWP-P31-K4-AGENT-HUB-CARD` |
| Peer-to-peer signed messaging | `CWP-P31-K4-AGENT-HUB-FEDERATION-P2P` |
| Operator anchor pact (passkey → Ed25519 → tetra) | `CWP-P31-K4-AGENT-HUB-ANCHOR-PACT` |
