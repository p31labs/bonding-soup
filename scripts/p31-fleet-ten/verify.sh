#!/usr/bin/env bash
# Smoke-test each fleet model with the domain-specific one-liner in models.json
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama not found on PATH" >&2
  exit 1
fi

exec node ./lib/verify-smoke.mjs
