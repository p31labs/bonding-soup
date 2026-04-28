#!/usr/bin/env bash
# Symlink p31 into ~/.local/bin so it works from any terminal (no npm global PATH required).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAUNCHER="$ROOT/scripts/p31-launcher.sh"
TARGET="${HOME}/.local/bin/p31"
mkdir -p "${HOME}/.local/bin"
chmod +x "$LAUNCHER"
ln -sf "$LAUNCHER" "$TARGET"
echo "Installed: $TARGET -> $LAUNCHER"
if ! command -v p31 >/dev/null 2>&1; then
  echo ""
  echo "Add ~/.local/bin to PATH (pick one):"
  echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc && source ~/.bashrc"
  echo "  # or for zsh: >> ~/.zshrc"
else
  echo "p31 is on PATH — try: p31 boot"
fi
