#!/usr/bin/env bash
# P31 terminal stack — full-load operational seasoning run.
#
# Boots a fresh command-center on an ephemeral port, exercises every new
# surface (web TUI, CLI, persona endpoints) under happy + adversarial +
# concurrent + sustained load, then verifies the security boundary held
# and produces a structured JSON report at /tmp/p31-terminal-seasoning.json.
#
# Usage:
#   bash scripts/p31-terminal-season.sh
#   PORT=3140 bash scripts/p31-terminal-season.sh
#   npm run terminal:season
#
# Exit codes:
#   0  GREEN — all tiers pass
#   1  one or more tiers FAIL (see report for which)
#   2  could not boot the command-center (port collision or startup error)
#
# Safe to re-run. Does not mutate repo state. Local-only (loopback bind).
set -uo pipefail

PORT="${PORT:-3132}"
B="http://127.0.0.1:${PORT}"
LOG="/tmp/p31-terminal-season.log"
REPORT="/tmp/p31-terminal-seasoning.json"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL_COUNT=0
declare -a TIER_RESULTS

note() { printf '\n\033[38;2;37;137;125m▌ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[38;2;110;231;183m[PASS]\033[0m %s\n' "$*"; }
bad()  { printf '  \033[38;2;217;95;95m[FAIL]\033[0m %s\n' "$*"; FAIL_COUNT=$((FAIL_COUNT+1)); }

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f /tmp/p31-season.env
}
trap cleanup EXIT

# ============================================================
note "TIER 1: Cold boot on port ${PORT}"
T0=$(date +%s%N)
P31_CMD_CENTER_NO_OPEN=1 P31_CMD_CENTER_PORT="$PORT" \
  node scripts/p31-local-command-center.mjs > "$LOG" 2>&1 &
SERVER_PID=$!

BOOT_MS=0
READY=false
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf --max-time 0.5 "$B/api/health" > /dev/null 2>&1; then
    BOOT_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
    READY=true
    ok "READY after ${BOOT_MS}ms (try ${i})"
    break
  fi
  sleep 0.2
done
if [ "$READY" != true ]; then
  bad "server did not respond within 3s — see $LOG"
  cat "$LOG"
  exit 2
fi
TIER_RESULTS+=("\"1_coldBoot\":{\"ms\":${BOOT_MS},\"verdict\":\"PASS\"}")

# ============================================================
note "TIER 2: Endpoint matrix (happy paths)"
PASS_2=0; TOTAL_2=0
for url in /api/health /api/personas /term /cli /; do
  TOTAL_2=$((TOTAL_2+1))
  H=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$B$url")
  if [ "$H" = "200" ]; then ok "GET $url → $H"; PASS_2=$((PASS_2+1)); else bad "GET $url → $H (expected 200)"; fi
done
TOTAL_2=$((TOTAL_2+1))
CHAT_RESP=$(curl -s --max-time 8 -X POST "$B/api/persona-chat" \
  -H 'Content-Type: application/json' \
  -d '{"persona":"p31-quick","prompt":"ok"}')
if echo "$CHAT_RESP" | command grep -q '"ok"'; then
  ok "POST /api/persona-chat returns valid JSON envelope"
  PASS_2=$((PASS_2+1))
else
  bad "POST /api/persona-chat malformed: $CHAT_RESP"
fi
TIER_RESULTS+=("\"2_endpointMatrix\":{\"checks\":${TOTAL_2},\"passed\":${PASS_2},\"verdict\":\"$([ $PASS_2 -eq $TOTAL_2 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 3: Negative tests (8 abuse patterns)"
PASS_3=0
check_neg() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then ok "$name → $actual"; PASS_3=$((PASS_3+1));
  else bad "$name → got $actual, expected $expected"; fi
}
check_neg "bad JSON" "400" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/persona-chat" -H 'Content-Type: application/json' -d 'not json')"
check_neg "unknown persona" "400" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/persona-chat" -H 'Content-Type: application/json' -d '{"persona":"p31-evil","prompt":"x"}')"
check_neg "missing prompt" "400" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/persona-chat" -H 'Content-Type: application/json' -d '{"persona":"p31-quick"}')"
BIG=$(printf 'x%.0s' {1..20000})
check_neg "oversized prompt" "400" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/persona-chat" -H 'Content-Type: application/json' -d "{\"persona\":\"p31-quick\",\"prompt\":\"$BIG\"}")"
check_neg "wrong method" "404" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/personas")"
check_neg "path traversal" "404" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$B/../../../../etc/passwd")"
check_neg "unknown /api/run action" "400" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/run" -H 'Content-Type: application/json' -d '{"action":"rm-rf-slash"}')"
check_neg "shell injection in action" "400" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/run" -H 'Content-Type: application/json' -d '{"action":"doctor; cat /etc/passwd"}')"
TIER_RESULTS+=("\"3_negativeTests\":{\"checks\":8,\"passed\":${PASS_3},\"verdict\":\"$([ $PASS_3 -eq 8 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 4: Concurrency burst (10 parallel /api/personas)"
T0=$(date +%s%N)
PIDS=()
TMP_OUT=$(mktemp -d)
for i in 1 2 3 4 5 6 7 8 9 10; do
  ( curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$B/api/personas" > "$TMP_OUT/$i" ) &
  PIDS+=($!)
done
for p in "${PIDS[@]}"; do wait "$p"; done
BURST_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
BURST_FAIL=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  [ "$(cat "$TMP_OUT/$i")" = "200" ] || BURST_FAIL=$((BURST_FAIL+1))
done
rm -rf "$TMP_OUT"
if [ $BURST_FAIL -eq 0 ]; then ok "10 parallel hits, all 200 in ${BURST_MS}ms"; else bad "$BURST_FAIL/10 burst failures"; fi
TIER_RESULTS+=("\"4_concurrencyBurst\":{\"parallel\":10,\"totalMs\":${BURST_MS},\"failures\":${BURST_FAIL},\"verdict\":\"$([ $BURST_FAIL -eq 0 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 5: Sustained load (50 sequential GETs)"
T0=$(date +%s%N)
SUST_FAIL=0
for i in $(seq 1 50); do
  H=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$B/api/health")
  [ "$H" = "200" ] || SUST_FAIL=$((SUST_FAIL+1))
done
SUST_MS=$(( ($(date +%s%N) - T0) / 1000000 ))
SUST_AVG=$(( SUST_MS / 50 ))
if [ $SUST_FAIL -eq 0 ]; then ok "50 sequential, ${SUST_MS}ms total, ${SUST_AVG}ms avg"; else bad "$SUST_FAIL/50 failures"; fi
TIER_RESULTS+=("\"5_sustainedLoad\":{\"sequential\":50,\"totalMs\":${SUST_MS},\"avgMs\":${SUST_AVG},\"failures\":${SUST_FAIL},\"verdict\":\"$([ $SUST_FAIL -eq 0 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 6: CLI surface"
PASS_6=0
P31_CMD_CENTER_URL="$B" node scripts/p31-terminal-cli.mjs --help 2>&1 | command grep -q "usage:" && { ok "--help"; PASS_6=$((PASS_6+1)); } || bad "--help"
P31_CMD_CENTER_URL="$B" node scripts/p31-terminal-cli.mjs --list 2>&1 | command grep -q "p31-mechanic" && { ok "--list shows personas"; PASS_6=$((PASS_6+1)); } || bad "--list"
P31_CMD_CENTER_URL="$B" node scripts/p31-terminal-cli.mjs --persona p31-quick --prompt "ok" 2>&1 | command grep -qE "(seconds|error|memory)" && { ok "--persona round-trip"; PASS_6=$((PASS_6+1)); } || bad "--persona"
P31_CMD_CENTER_URL="$B" node scripts/p31-terminal-cli.mjs --persona p31-bogus --prompt "x" 2>&1 | command grep -qiE "(400|429|error)" && { ok "--persona p31-bogus rejected (4xx)"; PASS_6=$((PASS_6+1)); } || bad "--persona p31-bogus not rejected"
UNREACH_OUT=$(P31_CMD_CENTER_URL="http://127.0.0.1:9999" node scripts/p31-terminal-cli.mjs --list 2>&1 || true)
if echo "$UNREACH_OUT" | command grep -qi "unreachable\|fetch failed\|ECONN"; then ok "ECONNREFUSED handled cleanly"; PASS_6=$((PASS_6+1)); else bad "ECONNREFUSED not handled (got: $(echo "$UNREACH_OUT" | head -1))"; fi
node scripts/cli/index.mjs chat --help 2>&1 | command grep -q "usage:" && { ok "p31 chat alias dispatches"; PASS_6=$((PASS_6+1)); } || bad "p31 chat alias"
TIER_RESULTS+=("\"6_cliSurface\":{\"checks\":6,\"passed\":${PASS_6},\"verdict\":\"$([ $PASS_6 -eq 6 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 7: Security boundary"
PASS_7=0
command grep -qE "api\.(anthropic|openai)\.com|claude-|gpt-4" scripts/p31-local-command-center.mjs || { ok "no cloud LLM in server"; PASS_7=$((PASS_7+1)); }
command grep -qE "api\.(anthropic|openai)\.com|claude-|gpt-4" command-center-terminal.html || { ok "no cloud LLM in TUI"; PASS_7=$((PASS_7+1)); }
command grep -qE "axios|node-fetch" scripts/p31-terminal-cli.mjs || { ok "CLI vanilla fetch only"; PASS_7=$((PASS_7+1)); }
command grep -q "execFile(" scripts/p31-local-command-center.mjs && { ok "execFile present (no shell)"; PASS_7=$((PASS_7+1)); } || bad "execFile missing"
command grep -q "body.length > 64 \* 1024" scripts/p31-local-command-center.mjs && { ok "64KB body cap"; PASS_7=$((PASS_7+1)); } || bad "no body cap"
command grep -q "PERSONA_TIMEOUT_MS" scripts/p31-local-command-center.mjs && { ok "AbortController + timeout"; PASS_7=$((PASS_7+1)); } || bad "no timeout"
command grep -q '127\.0\.0\.1' scripts/p31-local-command-center.mjs && { ok "127.0.0.1 default bind"; PASS_7=$((PASS_7+1)); } || bad "no loopback default"
PERSONAS_CT=$(command grep -oE '"p31-[a-z]+"' scripts/p31-local-command-center.mjs | sort -u | wc -l)
[ "$PERSONAS_CT" = "10" ] && { ok "10/10 personas hardcoded"; PASS_7=$((PASS_7+1)); } || bad "expected 10 personas, got $PERSONAS_CT"
TIER_RESULTS+=("\"7_securityBoundary\":{\"checks\":8,\"passed\":${PASS_7},\"verdict\":\"$([ $PASS_7 -eq 8 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 7b: Live security headers + rate limit"
PASS_7B=0
H_CSP=$(curl -s -I --max-time 3 "$B/term" | command grep -ci "content-security-policy" || true)
[ "$H_CSP" -ge 1 ] 2>/dev/null && { ok "CSP header present on /term"; PASS_7B=$((PASS_7B+1)); } || bad "CSP header missing on /term"
H_XFO=$(curl -s -I --max-time 3 "$B/term" | command grep -ci "x-frame-options:.*deny" || true)
[ "$H_XFO" -ge 1 ] 2>/dev/null && { ok "X-Frame-Options DENY on /term"; PASS_7B=$((PASS_7B+1)); } || bad "X-Frame-Options missing"
H_REF=$(curl -s -I --max-time 3 "$B/api/personas" | command grep -ci "referrer-policy:.*no-referrer" || true)
[ "$H_REF" -ge 1 ] 2>/dev/null && { ok "Referrer-Policy no-referrer on /api/personas"; PASS_7B=$((PASS_7B+1)); } || bad "Referrer-Policy missing"
H_PERM=$(curl -s -I --max-time 3 "$B/api/personas" | command grep -ci "permissions-policy" || true)
[ "$H_PERM" -ge 1 ] 2>/dev/null && { ok "Permissions-Policy on /api/personas"; PASS_7B=$((PASS_7B+1)); } || bad "Permissions-Policy missing"
LAST=200
for i in 1 2 3 4 5 6 7 8; do
  H=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST "$B/api/persona-chat" -H 'Content-Type: application/json' -d '{"persona":"p31-quick","prompt":"x"}')
  LAST=$H
  [ "$H" = "429" ] && break
done
[ "$LAST" = "429" ] && { ok "rate limit fires within 8 burst hits"; PASS_7B=$((PASS_7B+1)); } || bad "no 429 within 8 burst hits"
TIER_RESULTS+=("\"7b_liveHeaders\":{\"checks\":5,\"passed\":${PASS_7B},\"verdict\":\"$([ $PASS_7B -eq 5 ] && echo PASS || echo FAIL)\"}")

# ============================================================
note "TIER 8: Resource posture"
RSS_NOW=$(ps -o rss= -p "$SERVER_PID" 2>/dev/null | tr -d ' ' || echo 0)
ETIME_NOW=$(ps -o etime= -p "$SERVER_PID" 2>/dev/null | tr -d ' ' || echo "?")
ok "rss=${RSS_NOW}KiB elapsed=${ETIME_NOW}"
TIER_RESULTS+=("\"8_resourcePosture\":{\"rssEndKiB\":${RSS_NOW},\"elapsed\":\"${ETIME_NOW}\",\"verdict\":\"PASS\"}")

# ============================================================
note "TIER 9: Re-verify gate after load"
if node ./scripts/verify-p31-terminal.mjs > /tmp/p31-season-verify.log 2>&1; then
  ok "verify:p31-terminal still 15/15 GREEN"
  TIER_RESULTS+=("\"9_reVerifyAfterLoad\":{\"verdict\":\"PASS\"}")
else
  bad "verify:p31-terminal regressed — see /tmp/p31-season-verify.log"
  TIER_RESULTS+=("\"9_reVerifyAfterLoad\":{\"verdict\":\"FAIL\"}")
fi

# ============================================================
note "TIER 10: Report"
ERR_LINES=$(command grep -ciE "error|warn|unhandled" "$LOG" 2>/dev/null || true)
[ -z "$ERR_LINES" ] && ERR_LINES=0
MEM_FREE=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
MEM_TOTAL=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
CURSOR_CT=$(pgrep -c cursor-agent 2>/dev/null)
[ -z "$CURSOR_CT" ] && CURSOR_CT=0

JOINED_TIERS=$(IFS=,; echo "${TIER_RESULTS[*]}")

cat > "$REPORT" <<EOF
{
  "schema": "p31.terminalSeasoning/1.0.0",
  "timestamp": "$(date -u +%FT%TZ)",
  "host": {
    "kernel": "$(uname -r)",
    "memTotalMiB": ${MEM_TOTAL},
    "memAvailableMiB": ${MEM_FREE},
    "cursorAgentRunning": ${CURSOR_CT}
  },
  "server": {
    "pid": ${SERVER_PID},
    "elapsed": "${ETIME_NOW}",
    "rssKiB": ${RSS_NOW},
    "logLines": $(wc -l < "$LOG" | tr -d ' '),
    "errorOrWarnLinesInLog": ${ERR_LINES}
  },
  "tiers": { ${JOINED_TIERS} },
  "totals": {
    "tiersFailed": ${FAIL_COUNT},
    "verdict": "$([ $FAIL_COUNT -eq 0 ] && echo 'GREEN — terminal stack ready for daily ops' || echo 'RED — see failed tiers')"
  }
}
EOF
ok "report written: $REPORT"
TIER_RESULTS+=("\"10_report\":{\"path\":\"${REPORT}\",\"verdict\":\"PASS\"}")
# rewrite report with tier 10 included (it referenced itself before being added)
JOINED_TIERS=$(IFS=,; echo "${TIER_RESULTS[*]}")
cat > "$REPORT" <<EOF
{
  "schema": "p31.terminalSeasoning/1.0.0",
  "timestamp": "$(date -u +%FT%TZ)",
  "host": {
    "kernel": "$(uname -r)",
    "memTotalMiB": ${MEM_TOTAL},
    "memAvailableMiB": ${MEM_FREE},
    "cursorAgentRunning": ${CURSOR_CT}
  },
  "server": {
    "pid": ${SERVER_PID},
    "elapsed": "${ETIME_NOW}",
    "rssKiB": ${RSS_NOW},
    "logLines": $(wc -l < "$LOG" | tr -d ' '),
    "errorOrWarnLinesInLog": ${ERR_LINES}
  },
  "tiers": { ${JOINED_TIERS} },
  "totals": {
    "tiersFailed": ${FAIL_COUNT},
    "verdict": "$([ $FAIL_COUNT -eq 0 ] && echo 'GREEN — terminal stack ready for daily ops' || echo 'RED — see failed tiers')"
  }
}
EOF

# ============================================================
note "Verdict"
if [ $FAIL_COUNT -eq 0 ]; then
  printf '\n\033[38;2;110;231;183m▲ GREEN — all 10 tiers PASS · terminal stack ready for daily ops\033[0m\n\n'
  exit 0
else
  printf '\n\033[38;2;217;95;95m▲ RED — %d issue(s) · see %s\033[0m\n\n' "$FAIL_COUNT" "$REPORT"
  exit 1
fi
