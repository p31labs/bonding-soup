#!/usr/bin/env bash
# P31 fleet probe — one-command "is this host ready to actually run the fleet?"
#
# Reports a clean GREEN/AMBER/RED for each gate so the operator can answer
# the only real question: can I run cloud-vs-local from this machine right now?
#
# Exit codes:
#   0  = GREEN (fleet executable, all 10 personas resident)
#   1  = AMBER (fleet exists but some personas can't load — likely RAM)
#   2  = RED   (fleet not materialized; setup needed)
#
# Usage:
#   bash scripts/p31-fleet-ten/probe.sh           # full report, exit per status
#   bash scripts/p31-fleet-ten/probe.sh --json    # machine-readable JSON
#   bash scripts/p31-fleet-ten/probe.sh --quick   # skip per-persona load test
#
# Safe to run on any host; never modifies state.
set -uo pipefail

JSON=0
QUICK=0
for arg in "$@"; do
  case "$arg" in
    --json)  JSON=1 ;;
    --quick) QUICK=1 ;;
    --help|-h)
      sed -n '3,17p' "$0"; exit 0 ;;
  esac
done

reset() { printf '\033[0m'; }
green() { printf '\033[32m%s\033[0m' "$1"; }
amber() { printf '\033[33m%s\033[0m' "$1"; }
red()   { printf '\033[31m%s\033[0m' "$1"; }

# 1. ollama present?
have_ollama="no"
if command -v ollama >/dev/null 2>&1; then have_ollama="yes"; fi

# 2. ollama serve responsive?
serve_ok="no"
if [[ "$have_ollama" == "yes" ]]; then
  if curl -fsS --max-time 3 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    serve_ok="yes"
  fi
fi

# 3. memory snapshot
mem_total_kib="$(awk '/^MemTotal:/{print $2}' /proc/meminfo 2>/dev/null || echo 0)"
mem_avail_kib="$(awk '/^MemAvailable:/{print $2}' /proc/meminfo 2>/dev/null || echo 0)"
mem_total_mib=$(( mem_total_kib / 1024 ))
mem_avail_mib=$(( mem_avail_kib / 1024 ))

# 4. enumerate fleet personas present
fleet_present=0
fleet_missing=0
fleet_have=()
fleet_lack=()
expected=(p31-mechanic p31-firmware p31-counsel p31-narrator p31-triage p31-quick p31-phos p31-scribe p31-oracle p31-debrief)
if [[ "$serve_ok" == "yes" ]]; then
  resident="$(ollama list 2>/dev/null | awk 'NR>1{print $1}' | sed 's/:.*$//')"
  for p in "${expected[@]}"; do
    if echo "$resident" | command grep -Fxq "$p"; then
      fleet_present=$(( fleet_present + 1 ))
      fleet_have+=("$p")
    else
      fleet_missing=$(( fleet_missing + 1 ))
      fleet_lack+=("$p")
    fi
  done
fi

# 5. memory headroom math vs known persona footprints
phi4_floor_mib=2600
qwen_coder_floor_mib=4500
qwen3_floor_mib=5000
can_load_phi4="no"
can_load_qwen_coder="no"
can_load_qwen3="no"
if [[ $mem_avail_mib -ge $phi4_floor_mib ]]; then can_load_phi4="yes"; fi
if [[ $mem_avail_mib -ge $qwen_coder_floor_mib ]]; then can_load_qwen_coder="yes"; fi
if [[ $mem_avail_mib -ge $qwen3_floor_mib ]]; then can_load_qwen3="yes"; fi

# 6. live load test — only the smallest persona unless --quick
load_test_status="skipped"
load_test_error=""
if [[ "$QUICK" -eq 0 && "$serve_ok" == "yes" && "$can_load_phi4" == "yes" ]]; then
  load_test_status="running"
  resp="$(curl -fsS --max-time 60 -X POST http://127.0.0.1:11434/api/generate \
    -d '{"model":"p31-quick","prompt":"ok","stream":false,"keep_alive":0}' 2>&1)"
  if echo "$resp" | command grep -q '"response"'; then
    load_test_status="pass"
  else
    load_test_status="fail"
    load_test_error="$(echo "$resp" | head -c 200)"
  fi
fi

# 7. determine overall status
status="GREEN"
status_reason="all checks pass"
if [[ "$have_ollama" == "no" ]]; then
  status="RED"; status_reason="ollama not installed"
elif [[ "$serve_ok" == "no" ]]; then
  status="RED"; status_reason="ollama serve not responsive on 127.0.0.1:11434"
elif [[ $fleet_present -eq 0 ]]; then
  status="RED"; status_reason="no fleet personas materialized — run npm run ollama:setup"
elif [[ $fleet_missing -gt 0 ]]; then
  status="AMBER"; status_reason="$fleet_missing of ${#expected[@]} personas missing"
elif [[ "$can_load_phi4" == "no" ]]; then
  status="AMBER"; status_reason="even smallest persona over RAM ceiling (need ${phi4_floor_mib} MiB; have ${mem_avail_mib} MiB)"
elif [[ "$load_test_status" == "fail" ]]; then
  status="AMBER"; status_reason="load test failed: $load_test_error"
fi

if [[ "$JSON" -eq 1 ]]; then
  printf '{\n'
  printf '  "schema": "p31.fleetProbe/1.0.0",\n'
  printf '  "status": "%s",\n' "$status"
  printf '  "statusReason": "%s",\n' "$status_reason"
  printf '  "ollamaInstalled": "%s",\n' "$have_ollama"
  printf '  "ollamaServeResponsive": "%s",\n' "$serve_ok"
  printf '  "memTotalMiB": %d,\n' "$mem_total_mib"
  printf '  "memAvailMiB": %d,\n' "$mem_avail_mib"
  printf '  "personasExpected": %d,\n' "${#expected[@]}"
  printf '  "personasPresent": %d,\n' "$fleet_present"
  printf '  "personasMissing": %d,\n' "$fleet_missing"
  printf '  "canLoadPhi4": "%s",\n' "$can_load_phi4"
  printf '  "canLoadQwenCoder": "%s",\n' "$can_load_qwen_coder"
  printf '  "canLoadQwen3": "%s",\n' "$can_load_qwen3"
  printf '  "loadTestStatus": "%s",\n' "$load_test_status"
  printf '  "loadTestError": "%s"\n' "$(echo "$load_test_error" | sed 's/"/\\"/g')"
  printf '}\n'
else
  echo "━━ P31 fleet probe ━━"
  case "$status" in
    GREEN) echo "  status:        $(green GREEN) — $status_reason" ;;
    AMBER) echo "  status:        $(amber AMBER) — $status_reason" ;;
    RED)   echo "  status:        $(red RED)   — $status_reason" ;;
  esac
  echo "  ollama:        installed=$have_ollama serve=$serve_ok"
  echo "  memory:        total=${mem_total_mib} MiB · available=${mem_avail_mib} MiB"
  echo "  fleet:         ${fleet_present}/${#expected[@]} personas materialized"
  if [[ ${#fleet_lack[@]} -gt 0 ]]; then
    echo "                 missing: ${fleet_lack[*]}"
  fi
  echo "  ceilings:      phi4=$can_load_phi4 (${phi4_floor_mib} MiB) · qwen-coder=$can_load_qwen_coder (${qwen_coder_floor_mib} MiB) · qwen3=$can_load_qwen3 (${qwen3_floor_mib} MiB)"
  echo "  load test:     $load_test_status${load_test_error:+ — $load_test_error}"
fi

case "$status" in
  GREEN) exit 0 ;;
  AMBER) exit 1 ;;
  RED)   exit 2 ;;
esac
