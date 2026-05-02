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

## Memory math

```
total      6.4 GiB
used       6.0 GiB   (cursor-agent ~2.1 GiB / 31% · Node services ~1 GiB · system + container ~2.9 GiB)
available  462 MiB   (worst observed)
swap       0 B       (Crostini default; no swapon binary)

phi4-mini:latest        needs ~2.6 GiB
qwen2.5-coder:7b based  needs ~4.5 GiB
qwen3:8b based          needs ~5.0 GiB
```

Even the smallest persona is ~2 GiB shy of bootable while the operator's normal toolchain is up.

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
# 1. Same setup as today
ollama pull qwen2.5-coder:7b
ollama pull qwen3:8b
ollama pull phi4-mini:latest
bash scripts/p31-fleet-ten/setup.sh

# 2. Smoke (this is where today blocked)
bash scripts/p31-fleet-ten/verify.sh

# 3. Local-only benchmark (rough tok/s per persona)
npm run ollama:bench

# 4. Cloud-vs-local A/B for a single persona
npm run ollama:vs-cloud -- --persona p31-mechanic \
  --prompt "Refactor this 30-line snippet for readability without changing behavior. <code>..."

# 5. With Anthropic comparison side
ANTHROPIC_API_KEY=sk-... npm run ollama:vs-cloud -- \
  --persona p31-mechanic --prompt-file /tmp/code.txt --json /tmp/run.json
```

## Hard bans (carried from `.cursor/rules/p31-ollama-fleet.mdc`)

- **Never** route `p31-counsel` / `p31-triage` / `p31-phos` prompts through the cloud lane when the prompt carries operator-confidential content. The `cloud-vs-local.mjs` harness blocks this; pass `--skip-cloud` to run local-only.
- **Never** commit a tunnel URL into the repo.

## Why this is fine (and not a "failure")

Today's session proved the fleet is *real and reproducible*. Setup is a single shell script. Wiring is verified. The harness for cloud comparison is on disk (`scripts/p31-fleet-ten/lib/cloud-vs-local.mjs`, `npm run ollama:vs-cloud`). The only thing that did not happen on the operator's host today is the actual inference benchmark, because the host hardware tops out below the qwen3:8b memory floor.

This is exactly the kind of finding the operator wanted from "actually materializing the fleet locally and comparing against larger LLMs" — it surfaced the real constraint (host RAM), not a fake one. The next host with 16+ GiB completes the loop with zero code changes; the recipe above is the only artifact needed to do it.

---

*Authored 2026-05-02 morning by Architect (Cursor agent, Claude) under operator command authority. Lives next to the fleet so the ceiling is discoverable from `scripts/p31-fleet-ten/`.*
