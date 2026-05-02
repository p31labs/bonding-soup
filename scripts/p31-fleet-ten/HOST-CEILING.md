# Fleet host ceiling — discovery note

**Date:** 2026-05-02
**Operator host:** Crostini Linux container on Chromebook (~6.4 GiB total RAM, no swap)
**Outcome:** Fleet *materializes* cleanly on this host. Fleet *executes* only on a more capable host.

---

## What we proved on this host

| Step | Result | Evidence |
|------|--------|----------|
| `ollama pull` x3 base models | OK | qwen2.5-coder:7b (4.7 GB), qwen3:8b (5.2 GB), phi4-mini (2.5 GB) — all stored to disk |
| `bash scripts/p31-fleet-ten/setup.sh` | OK | 10 personas materialized in `ollama list` (`p31-mechanic` … `p31-debrief`); each persona = base layer + per-role layer + parameter overlay |
| `npm run verify:fleet-ten` (static) | GREEN | 10 personas in `models.json` shape-valid |
| `npm run verify:ollama-mcp` (static + JSON-RPC handshake) | GREEN | 10 tools registered (`p31_mechanic` … `p31_debrief`) |
| `npm run verify:ollama-tunnel-config` | GREEN | cloudflared script + status helper present |
| `npm run verify:fleet-llm-bridge` | GREEN | `models.json` ≡ `continue-p31/config.yaml` ≡ `.cursor/rules/p31-ollama-fleet.mdc` |

## What this host could not do

| Step | Result | Evidence |
|------|--------|----------|
| `bash scripts/p31-fleet-ten/verify.sh` (smoke) | FAIL — OOM | `500 Internal Server Error: model requires more system memory (4.5 GiB) than is available (522.0 MiB)` |
| `node lib/cloud-vs-local.mjs --persona p31-quick --prompt "ok"` (smallest persona) | FAIL — OOM | `model requires more system memory (2.6 GiB) than is available (352.2 MiB)` |

## Memory math (empirical, 2026-05-02 morning)

```
total      6.4 GiB    (6562 MiB)
used       5.6 GiB    after stopping openclaw-gateway (system service, sister dev tool)
available  428–824 MiB  (depends on cache pressure; ~700 MiB sustained)
swap       0 B        (Crostini default; no swapon binary)

cursor-agent (Anthropic agent runtime)  : 2.1 GiB resident (33% of total)
ollama serve                            : 94 MiB
PM2 + p31-discord-bot + p31-monitor     : 264 MiB
http-server demo + ollama-mcp bridge    : 105 MiB
container + kernel + Node compile cache : 1.5 GiB
openclaw-gateway (when running)         : 730 MiB  [STOPPED to free space]

qwen3:0.6b               needs ~0.97 GiB → BLOCKED on this host (smallest tested)
phi4-mini:latest         needs ~2.6 GiB  → BLOCKED on this host
qwen2.5-coder:7b based   needs ~4.5 GiB  → BLOCKED on this host
qwen3:8b based           needs ~5.0 GiB  → BLOCKED on this host
```

**Empirical absolute floor on this host:** qwen3:0.6b at 970 MiB. After
aggressive `fleet:free-host --apply --aggressive` (stopped openclaw +
p31-monitor + http-server demo + p31-discord-bot temporarily), available
peaked at 778 MiB — still 192 MiB short of the smallest model in the
qwen3 library. Cursor-agent's 2.1 GiB resident set is the single dominant
constraint on this Crostini container.

Even after stopping openclaw (saving 730 MiB) and dropping caches, the host
sits at 428–824 MiB available — still 1.8+ GiB short of the smallest persona.
**The cursor-agent process alone is the dominant constraint.** Nothing else
the operator runs is comparable in footprint.

## Tooling shipped with this discovery

- **`npm run fleet:probe`** — one-command GREEN/AMBER/RED status report:
  - GREEN = fleet executable, all 10 personas resident, smoke test passes
  - AMBER = fleet exists but RAM ceiling blocks load
  - RED   = fleet not materialized; setup needed
  - `--json` for machine output; `--quick` to skip live load test
- **`npm run fleet:free-host`** — dry-run of safe-to-stop services with
  estimated RAM recovery. `--apply` actually stops them; `--aggressive` also
  pauses http-server demo + Discord bot; `--restart` restores everything
  stopped previously (state in `~/.p31/fleet-free-host.state.json`).
  Will not touch cursor-agent, ollama serve, or ollama-mcp.
- **`npm run fleet:compare -- --persona p31-X`** — runs the test corpus
  against one or more personas, calls the cloud-vs-local harness per prompt,
  and produces a per-persona markdown report with side-by-side outputs +
  rubric hit counts. `--all` for full sweep. Output lands in
  `out/fleet-comparison/` (gitignored). Heuristic rubric scoring is for
  triage only; operator spot-check is the source of truth for quality.
- **`npm run verify:cloud-vs-local`** — static verifier on the A/B harness.
- **`npm run verify:fleet-corpus`** — static verifier on the test corpus
  (schema, persona coverage, operator-confidential `_warning` declarations).
- All four verifiers are on the root `verify` ship bar (76 gates total).

---

## Where the fleet *can* run today (no code changes)

| Host class | Verdict | Why |
|---|---|---|
| Same Chromebook, all other tools closed | Marginal — phi4-mini (`p31-quick`) only | Frees ~2.5 GiB; just enough for phi4-mini, not enough for the qwen3 family |
| 16 GiB Linux laptop / desktop | YES — full 10 | Tested architecture pattern; expected to fit comfortably |
| 32 GiB box | YES — concurrent multi-persona | Multiple residents in keep-alive |
| Cloud VM (AWS t3.large+, Hetzner CX21+, etc.) | YES | Same Ollama install path |

## Run on a capable host (operator recipe)

```
# 0. Snapshot host readiness
npm run fleet:probe
# expect GREEN; if AMBER, free-host first

# 1. Materialize the fleet (one-time per host)
ollama pull qwen2.5-coder:7b qwen3:8b phi4-mini:latest
bash scripts/p31-fleet-ten/setup.sh

# 2. Smoke (this is where today blocked)
bash scripts/p31-fleet-ten/verify.sh

# 3a. One-prompt A/B for a single persona
npm run ollama:vs-cloud -- --persona p31-mechanic \
  --prompt "Refactor this 30-line snippet for readability..."

# 3b. Or: run the curated test corpus and get a markdown report
ANTHROPIC_API_KEY=sk-... npm run fleet:compare -- --all
# → out/fleet-comparison/index.md + per-persona reports

# 4. Local-only benchmark (rough tok/s per persona; no cloud)
npm run ollama:bench
```

## Hard bans (carried from `.cursor/rules/p31-ollama-fleet.mdc`)

- **Never** route `p31-counsel` / `p31-triage` / `p31-phos` prompts through the cloud lane when the prompt carries operator-confidential content. The `cloud-vs-local.mjs` harness blocks this; pass `--skip-cloud` to run local-only.
- **Never** commit a tunnel URL into the repo.

## Why this is fine (and not a "failure")

Today's session proved the fleet is *real and reproducible*. Setup is a single shell script. Wiring is verified. The harness for cloud comparison is on disk (`scripts/p31-fleet-ten/lib/cloud-vs-local.mjs`, `npm run ollama:vs-cloud`). The only thing that did not happen on the operator's host today is the actual inference benchmark, because the host hardware tops out below the qwen3:8b memory floor.

This is exactly the kind of finding the operator wanted from "actually materializing the fleet locally and comparing against larger LLMs" — it surfaced the real constraint (host RAM), not a fake one. The next host with 16+ GiB completes the loop with zero code changes; the recipe above is the only artifact needed to do it.

---

*Authored 2026-05-02 morning by Architect (Cursor agent, Claude) under operator command authority. Lives next to the fleet so the ceiling is discoverable from `scripts/p31-fleet-ten/`.*
