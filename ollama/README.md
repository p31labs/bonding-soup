# Ollama — pointer

The canonical local-inference fleet now lives at [scripts/p31-fleet-ten/](../scripts/p31-fleet-ten/) (10 personas: mechanic, firmware, counsel, narrator, triage, quick, phos, scribe, oracle, debrief). Source of truth is `models.json` plus the prompts under `prompts/` (`_shared-*.txt` preamble + per-persona `*.role.txt`). The previous five hand-authored `Modelfile.p31-*` files in this folder were merged into that bundle and removed; PARAMETER overlays (temperature, top_p, top_k, num_ctx, repeat_penalty, stop tokens) are now versioned per-entry in `models.json` and emitted by `lib/ollama-create-all.mjs`.

## Quick start

```bash
cd scripts/p31-fleet-ten
./setup.sh --pull   # pull bases, then ollama create all 10 personas
./verify.sh         # smoke-test (4-tier voltage JSON contract for p31-triage)
./benchmark.sh      # rough chars/sec per persona + GPU snapshot
```

Static repo proof (no Ollama needed): `npm run verify:fleet-ten`.

## Cursor pipes

See [.cursor/rules/p31-ollama-fleet.mdc](../.cursor/rules/p31-ollama-fleet.mdc) and [docs/CWP-P31-OLLAMA-FLEET-2026-04.md](../docs/CWP-P31-OLLAMA-FLEET-2026-04.md):

- **MCP bridge** (primary, local): [scripts/ollama-mcp/](../scripts/ollama-mcp/) → `~/.cursor/mcp.json`.
- **Cloudflare Tunnel** (model picker, opt-in): [scripts/ollama-tunnel.sh](../scripts/ollama-tunnel.sh).
- **Continue.dev** (privileged sidebar, no cloud): [andromeda/04_SOFTWARE/continue-p31/config.yaml](../andromeda/04_SOFTWARE/continue-p31/config.yaml).

## AMD ROCm (RX 6600 XT, gfx1032) host notes

If running on an RDNA2 GPU host:

- ROCm **6.4.1** (avoid known regressions).
- systemd overrides:
  - `HSA_OVERRIDE_GFX_VERSION=10.3.0`
  - `OLLAMA_FLASH_ATTENTION=false`

Full bring-up CWP: [docs/CWP-P31-OLLAMA-FLEET-2026-04.md](../docs/CWP-P31-OLLAMA-FLEET-2026-04.md).
