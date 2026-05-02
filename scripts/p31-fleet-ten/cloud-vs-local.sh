#!/usr/bin/env bash
# Cloud-vs-local A/B harness wrapper. See lib/cloud-vs-local.mjs for full usage.
#
# Quick examples:
#   bash scripts/p31-fleet-ten/cloud-vs-local.sh --persona p31-mechanic --prompt "Refactor X."
#   ANTHROPIC_API_KEY=sk-... bash scripts/p31-fleet-ten/cloud-vs-local.sh \
#     --persona p31-quick --prompt "Write a 5-line commit message for adding GPU detection." \
#     --json /tmp/p31-bench/quick-vs-claude.json
#
# Hard ban: do NOT pass operator-confidential prompts to p31-counsel,
# p31-triage, or p31-phos through this script when ANTHROPIC_API_KEY is set —
# the harness blocks it; pass --skip-cloud for local-only.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/lib/cloud-vs-local.mjs" "$@"
