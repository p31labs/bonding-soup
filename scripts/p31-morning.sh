#!/usr/bin/env bash
# P31 morning boot (CWP-MOBILE-OPS-2026-01 Phase 1) — one command after cold open:
# pull (best-effort) → p31:converge (warn on fail) → command center on LAN for iPhone.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "═══ P31 Morning Boot ═══"
echo "→ Repo: $ROOT"

if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  echo "→ Pulling home (main)…"
  git -C "$ROOT" pull --ff-only origin main 2>/dev/null || echo "  home: skip (not ff-only, no remote, or local changes)"
else
  echo "→ home: not a git checkout — skip pull"
fi

if [ -d "$ROOT/andromeda/.git" ]; then
  echo "→ Pulling andromeda (main)…"
  git -C "$ROOT/andromeda" fetch origin 2>/dev/null || true
  git -C "$ROOT/andromeda" pull --ff-only origin main 2>/dev/null || echo "  andromeda: skip (not ff-only or diverged)"
else
  echo "→ andromeda/ absent — skip monorepo pull"
fi

echo "→ TRIPER cert status…"
set +e
node "$ROOT/scripts/triper-status.mjs" --json 2>/dev/null | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try {
      const j = JSON.parse(d);
      const gate = j.gateStatus ?? 'UNKNOWN';
      const color = gate === 'AUTHORIZED' ? '\x1b[32m' : '\x1b[31m';
      const ageMs = Date.now() - new Date(j.certTimestamp ?? 0).getTime();
      const ageMin = Math.round(ageMs / 60000);
      const ageStr = ageMin < 60 ? ageMin+'m' : (ageMin/60).toFixed(1)+'h';
      const passed = (j.suites ?? []).filter(s=>s.passed).length;
      const total = (j.suites ?? []).length || 9;
      console.log('  ' + color + gate + '\x1b[0m — cert ' + ageStr + ' ago — ' + passed + '/' + total + ' suites');
    } catch { console.log('  (no cert — run: npm run test:triper:cert)'); }
  });
" 2>/dev/null || echo "  (triper-status unavailable)"
set -e

echo "→ Morning report (mandatory; soft if already filed today)…"
set +e
P31_REPORTS_NUDGE=1 npm run reports:auto -- --brief 2>&1 | sed 's/^/  /'
set -e

echo "→ Converge gate (P31_CONVERGE_SKIP_PASSKEY=1)…"
set +e
P31_CONVERGE_SKIP_PASSKEY=1 npm run p31:converge
CONVERGE_EXIT=$?
set -e
if [ "$CONVERGE_EXIT" -ne 0 ]; then
  echo "  ⚠ p31:converge exited $CONVERGE_EXIT — continuing to command center"
fi

echo "→ Starting command center (0.0.0.0:3131 — P31_CMD_CENTER_LAN)…"
P31_CMD_CENTER_LAN=1 node "$ROOT/scripts/p31-local-command-center.mjs" &
CMD_PID=$!
sleep 0.4

LAN_IP=""
if command -v hostname >/dev/null 2>&1; then
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LAN_IP" ] && command -v ip >/dev/null 2>&1; then
  LAN_IP=$(ip -4 -o route get 1.1.1.1 2>/dev/null | sed -n 's/.*src \([0-9.]*\).*/\1/p' | head -1)
fi
: "${LAN_IP:=<run hostname -I or check Wi‑Fi settings>}"

echo "  Command center PID: $CMD_PID"
echo "  Local:  http://127.0.0.1:3131"
echo "  iPhone: http://${LAN_IP}:3131"
echo ""
echo "═══ Ready. iPhone (same Wi‑Fi): http://${LAN_IP}:3131 ═══"
echo "═══ Stop:  kill $CMD_PID  (or pkill -f p31-local-command-center) ═══"
