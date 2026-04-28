#!/usr/bin/env bash
# Resolves real path (works when ~/.local/bin/p31 is a symlink).
set -euo pipefail
SELF="${BASH_SOURCE[0]}"
if command -v realpath >/dev/null 2>&1; then
  SELF="$(realpath "$SELF")"
elif readlink -f / >/dev/null 2>&1; then
  SELF="$(readlink -f "$SELF")"
fi
HERE="$(cd "$(dirname "$SELF")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
exec node "$ROOT/scripts/cli/index.mjs" "$@"
