#!/usr/bin/env bash
# Rough throughput per model (stdout chars / wall time) + optional nvidia-smi line.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found on PATH" >&2
  exit 1
fi

exec node ./lib/benchmark.mjs
