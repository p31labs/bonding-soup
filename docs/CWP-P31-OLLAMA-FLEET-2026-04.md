# CWP-P31-OLLAMA-FLEET-2026-04 — Ollama fleet finalization and Cursor pipe

**Status:** Shipped in repo (Apr 29, 2026). **Scope:** Single source of truth for ten local personas, three Cursor integration lanes, ship-bar proofs.

## Purpose

Collapse drift between ad-hoc Modelfiles and the versioned fleet bundle; give the operator deterministic `verify` gates plus a clear routing rule for **local vs cloud-exposed** inference when using Cursor.

## Canonical paths

| Concern | Path |
|--------|------|
| Personas + PARAMETER overlays | `scripts/p31-fleet-ten/models.json` |
| Role text + operator preamble | `scripts/p31-fleet-ten/prompts/` (`_shared-*.txt`, `*.role.txt`) |
| `ollama create` generator | `scripts/p31-fleet-ten/lib/ollama-create-all.mjs` |
| Static bundle gate | `npm run verify:fleet-ten` → `scripts/verify-fleet-ten.mjs` |
| Live smoke (needs `ollama serve`) | `bash scripts/p31-fleet-ten/verify.sh` |
| MCP bridge (Lane A) | `scripts/ollama-mcp/server.mjs` — `npm run verify:ollama-mcp` |
| Tunnel script (Lane B) | `scripts/ollama-tunnel.sh` + `scripts/ollama-tunnel-status.mjs` — `npm run verify:ollama-tunnel-config` |
| Continue sidebar (Lane C) | `andromeda/04_SOFTWARE/continue-p31/config.yaml` — sync `bash scripts/p31-fleet-ten/setup.sh --with-continue` |
| Agent routing rules | `.cursor/rules/p31-ollama-fleet.mdc` |
| Operator desk (read-only HTTP, same :3131 process) | `http://127.0.0.1:3131/desk` — `p31 open desk` / `npm run command-center:open-desk` — not Ollama; complements MCP for status |
| Pointer / ROCm host notes | `ollama/README.md` |

## Triage contract (OQE)

`p31-triage` smoke expects **strict JSON** parseable from stdout with:

- `voltage`: `GREEN` \| `YELLOW` \| `RED` \| `CRITICAL`
- `score`: integer 1–10
- `spoon_cost`: integer 0–5
- `summary`, `rationale`, `suggested_next`: non-empty strings
- `action`: `none` \| `respond` \| `buffer` \| `alert` \| `route_to_counsel`
- `reasons`: array of strings
- `escalate`: boolean

Enforced in `scripts/p31-fleet-ten/lib/verify-smoke.mjs`.

## Close conditions (definition of done)

1. `npm run verify:fleet-ten` — green (10 personas, parameters, prompts, `bash -n` on shell scripts).
2. `npm run verify:ollama-mcp` — green (static always; dynamic `tools/list` when `scripts/ollama-mcp/node_modules` present — run `npm install` in that folder once).
3. `npm run verify:ollama-tunnel-config` — green (tunnel script + status helper present and syntactically wired).
4. On a host with Ollama + weights: `cd scripts/p31-fleet-ten && ./setup.sh --pull && ./verify.sh` — all ten smokes pass including triage JSON.
5. Cursor: `~/.cursor/mcp.json` contains the `p31-ollama-fleet` server stanza (see `scripts/ollama-mcp/README.md`).
6. Operator-confidential work: **Lane C** (Continue) or **Lane A** (MCP) only — never **Lane B** (tunnel + model picker) for `p31-counsel`, `p31-triage`, or `p31-phos` (see rule file).

## Mapping to SIMPLEX v7 (informational)

Cloud crew: `simplex-v7/src/agents/registry.ts` (Anthropic today). Local fleet mirrors lanes (FORGE ↔ mechanic, COUNSEL ↔ counsel, HERALD ↔ triage, etc.) per `.cursor/rules/p31-ollama-fleet.mdc`. Offline Worker fallback is **out of scope** — track as `CWP-P31-SIMPLEX-OFFLINE-OLLAMA` if needed.

## ROCm / RX 6600 XT host

GPU bring-up lives on the operator’s metal host, not in CI. See `ollama/README.md` (HSA override, flash attention off, ROCm 6.4.1 pointer).

## References

- Registry: `p31-alignment.json` — `p31-fleet-ten-bundle`, sources `p31-ollama-mcp-bridge`, `p31-continue-extension-config` (optional), `verifyPipeline` includes `verify:ollama-mcp` and `verify:ollama-tunnel-config` after `verify:fleet-ten`.
- Command center: `scripts/command-center/actions.registry.mjs` — `ollama-setup`, `ollama-verify`, `ollama-bench`, `ollama-tunnel-start`, `ollama-mcp-verify`.
