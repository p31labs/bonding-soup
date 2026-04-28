#!/usr/bin/env bash
# Installs ~/.local/bin/p31 → scripts/p31-launcher.sh (C.A.R.S. home repo; npm name still bonding-soup).
set -euo pipefail
SELF="${BASH_SOURCE[0]}"
if command -v realpath >/dev/null 2>&1; then
  SELF="$(realpath "$SELF")"
elif readlink -f / >/dev/null 2>&1; then
  SELF="$(readlink -f "$SELF")"
fi
ROOT="$(cd "$(dirname "$SELF")/.." && pwd)"
LAUNCHER="$ROOT/scripts/p31-launcher.sh"
TARGET="${HOME}/.local/bin/p31"
mkdir -p "${HOME}/.local/bin"
chmod +x "$LAUNCHER"
ln -sf "$LAUNCHER" "$TARGET"
echo "C.A.R.S. home repo: $ROOT"
echo "Installed: $TARGET -> $LAUNCHER"
if ! command -v p31 >/dev/null 2>&1; then
  echo ""
  echo "Add ~/.local/bin to PATH (pick one):"
  echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc && source ~/.bashrc"
  echo "  # or for zsh: >> ~/.zshrc"
else
  echo "p31 is on PATH — try: p31 boot"
fi
