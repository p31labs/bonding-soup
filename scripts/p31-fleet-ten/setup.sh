#!/usr/bin/env bash
# Pull base weights (optional) and create all ten P31 Ollama models from merged prompts.
# Optional: --with-continue copies andromeda/04_SOFTWARE/continue-p31/config.yaml -> ~/.continue/config.yaml
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${DIR}/../.." && pwd)"
cd "$DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found on PATH — install from https://ollama.com" >&2
  exit 1
fi

export OLLAMA_QWEN_CODER="${OLLAMA_QWEN_CODER:-qwen2.5-coder:7b}"
export OLLAMA_QWEN3="${OLLAMA_QWEN3:-qwen3:8b}"
export OLLAMA_PHI_QUICK="${OLLAMA_PHI_QUICK:-phi4-mini:latest}"

PULL=""
WITH_CONTINUE=0
for arg in "$@"; do
  case "$arg" in
    --pull) PULL="--pull" ;;
    --with-continue) WITH_CONTINUE=1 ;;
    *) echo "setup.sh: unknown arg $arg" >&2; exit 2 ;;
  esac
done

node ./lib/ollama-create-all.mjs $PULL

if [[ "$WITH_CONTINUE" -eq 1 ]]; then
  CONT_SRC="${REPO_ROOT}/andromeda/04_SOFTWARE/continue-p31/config.yaml"
  CONT_DST="${HOME}/.continue/config.yaml"
  if [[ ! -f "$CONT_SRC" ]]; then
    echo "setup.sh: --with-continue requested but ${CONT_SRC} is missing (partial clone?)" >&2
    exit 3
  fi
  mkdir -p "${HOME}/.continue"
  cp "$CONT_SRC" "$CONT_DST"
  echo "setup.sh: synced ${CONT_SRC} -> ${CONT_DST}"
fi

echo "setup.sh: done"
