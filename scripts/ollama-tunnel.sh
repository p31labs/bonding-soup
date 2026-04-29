#!/usr/bin/env bash
# P31 Ollama Cloudflare Tunnel — exposes local Ollama /v1 via a public trycloudflare URL.
#
# Use case: Cursor's model picker requires a public HTTPS endpoint it can verify from
# Cursor's cloud. Run this in a foreground terminal (or via the command center) and
# paste the printed URL into Cursor → Settings → Models → "Override OpenAI Base URL"
# (append /v1).
#
# Snapshot: writes ~/.p31/ollama-tunnel.json with { url, started_at, port, pid }
# so other tools (command center, status helper) can show whether it's live.
#
# Hard reminder: prompts sent through this lane traverse Cursor's cloud verification.
# Do NOT route p31-counsel / p31-triage / p31-phos through the tunnel for operator-only
# content. See .cursor/rules/p31-ollama-fleet.mdc.
set -euo pipefail

OLLAMA_HOST="${P31_OLLAMA_HOST:-http://127.0.0.1:11434}"
SNAPSHOT_DIR="${HOME}/.p31"
SNAPSHOT_FILE="${SNAPSHOT_DIR}/ollama-tunnel.json"
LOG_FILE="${SNAPSHOT_DIR}/ollama-tunnel.log"

mkdir -p "${SNAPSHOT_DIR}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "ollama-tunnel: cloudflared not found on PATH" >&2
  echo "  Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" >&2
  exit 1
fi

# Smoke-test that ollama is up before opening a public tunnel.
if ! curl -sS --max-time 3 "${OLLAMA_HOST}/api/version" >/dev/null 2>&1; then
  echo "ollama-tunnel: ${OLLAMA_HOST} is not responding to /api/version" >&2
  echo "  Start with: ollama serve" >&2
  exit 2
fi

echo "ollama-tunnel: starting cloudflared --url ${OLLAMA_HOST}"
echo "ollama-tunnel: log -> ${LOG_FILE}"
echo "ollama-tunnel: snapshot -> ${SNAPSHOT_FILE}"

# Run cloudflared in the foreground; on SIGINT we clear the snapshot file so
# downstream watchers see "not running."
trap 'rm -f "${SNAPSHOT_FILE}"; exit 0' INT TERM

# Stream cloudflared output through a tee + node parser that writes the snapshot
# the moment a trycloudflare URL appears.
(
  cloudflared tunnel --no-autoupdate --url "${OLLAMA_HOST}" 2>&1
) | tee "${LOG_FILE}" | node "$(dirname "$0")/ollama-tunnel-status.mjs" --watch
