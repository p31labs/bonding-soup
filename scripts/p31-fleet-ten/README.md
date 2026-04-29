# P31 fleet — ten local models (Ollama)

Operator-facing scripts:

- `setup.sh [--pull]` — `ollama pull` for distinct bases (when `--pull`), then `ollama create` for `p31-mechanic` … `p31-debrief` using merged prompts (`prompts/_shared-*.txt` + each `*.role.txt`).
- `verify.sh` — one constrained prompt per model; fails if expected marker / JSON is absent.
- `benchmark.sh` — wall-clock × output size (rough tok/s) plus `nvidia-smi` when available.

Environment overrides for base tags:

- `OLLAMA_QWEN_CODER` (default `qwen2.5-coder:7b`)
- `OLLAMA_QWEN3` (default `qwen3:8b`)
- `OLLAMA_PHI_QUICK` (default `phi4-mini:latest` — change if your registry uses another tag)

Repo proof without Ollama: `npm run verify:fleet-ten` (static structure + `bash -n` on these scripts).
