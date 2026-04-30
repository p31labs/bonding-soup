# P31 fleet — ten local models (Ollama)

Operator-facing scripts:

- `setup.sh [--pull] [--with-continue]` — optional `ollama pull` for distinct bases (when `--pull`), then `ollama create` for `p31-mechanic` … `p31-debrief` using merged prompts (`prompts/_shared-*.txt` + each `*.role.txt`). PARAMETER lines (temperature, top_p, top_k, num_ctx, repeat_penalty, stop) come from `models.json`. With `--with-continue`, copies `andromeda/04_SOFTWARE/continue-p31/config.yaml` → `~/.continue/config.yaml`.
- `verify.sh` — one constrained prompt per model; fails if expected marker / triage JSON is absent.
- `benchmark.sh` — wall-clock × output size (rough tok/s) plus `nvidia-smi` when available.

Environment overrides for base tags:

- `OLLAMA_QWEN_CODER` (default `qwen2.5-coder:7b`)
- `OLLAMA_QWEN3` (default `qwen3:8b`)
- `OLLAMA_PHI_QUICK` (default `phi4-mini:latest` — change if your registry uses another tag)

Repo proof without Ollama: `npm run verify:fleet-ten` (static structure + `bash -n` on these scripts).

## Cursor integration (three lanes)

| Lane | What | Doc |
|------|------|-----|
| **A — MCP** | One tool per persona (`p31_mechanic`, …) | `scripts/ollama-mcp/README.md`, `~/.cursor/mcp.json` |
| **B — Tunnel** | `cloudflared` → trycloudflare URL for model picker | `scripts/ollama-tunnel.sh`, `docs/CWP-P31-OLLAMA-FLEET-2026-04.md` |
| **C — Continue** | Local sidebar, all-Ollama | `andromeda/04_SOFTWARE/continue-p31/config.yaml` |

**Hard ban:** do not use Lane B for `p31-counsel`, `p31-triage`, or `p31-phos` when content is operator-confidential (Cursor cloud verification). Use Lane A or C.

**Operator desk (browser, same :3131 host as command center):** read-only CONNECTION / glass / SIMPLEX — **`http://127.0.0.1:3131/desk`**, **`p31 open desk`**, or **`npm run command-center:open-desk`**. Not an Ollama lane; complements MCP when you want HTML instead of tool calls.

## Root npm aliases

- `npm run ollama:setup` / `ollama:verify` / `ollama:bench`
- `npm run ollama:tunnel` / `ollama:tunnel:status`
- `npm run verify:ollama-mcp` / `verify:ollama-tunnel-config` (on the root `verify` ship bar after `verify:fleet-ten`)
