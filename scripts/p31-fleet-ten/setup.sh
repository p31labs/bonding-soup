#!/usr/bin/env bash
# Pull base weights (optional) and create all ten P31 Ollama models from merged prompts.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found on PATH — install from https://ollama.com" >&2
  exit 1
fi

export OLLAMA_QWEN_CODER="${OLLAMA_QWEN_CODER:-qwen2.5-coder:7b}"
export OLLAMA_QWEN3="${OLLAMA_QWEN3:-qwen3:8b}"
export OLLAMA_PHI_QUICK="${OLLAMA_PHI_QUICK:-phi4-mini:latest}"

PULL=""
if [[ "${1:-}" == "--pull" ]]; then PULL="--pull"; fi

exec node ./lib/ollama-create-all.mjs $PULL
