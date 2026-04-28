# ZENODO SCAN — QUICK START

## Three ways to run it:

### 1️⃣ PYTHON SCRIPT (Fastest, local)

```bash
chmod +x zenodo_scan_local.py
python3 zenodo_scan_local.py --mode full --output-format json+markdown
```

**Output:** Two files:
- `zenodo_scan_YYYYMMDD_HHMMSS.json` (machine-parseable)
- `zenodo_scan_YYYYMMDD_HHMMSS.md` (human-readable)

**Requirements:** Python 3.7+, `curl` (built-in on macOS/Linux)

---

### 2️⃣ DIRECT PROMPT (No code, Claude/Ollama)

Copy the full `ZENODO_SCAN_AGENT.md` prompt into Claude or your local Ollama instance:

```bash
cat ZENODO_SCAN_AGENT.md | xargs -0 curl -d @- https://your-local-llm-endpoint
```

Or paste manually into Claude.ai and run the scan there.

---

### 3️⃣ LOCAL OLLAMA (Qwen or equivalent)

```bash
ollama run qwen2.5-coder:7b "$(cat ZENODO_SCAN_AGENT.md)"
```

This executes the scan within your local Ollama environment (no external API calls).

---

## WHAT YOU'LL GET

✅ **Consistency Matrix:**  
A 4×4 grid showing each paper (I–IV) against each vertex (Zenodo, Internal, Public, Repo)

⚠️ **Discrepancy Report:**  
List of any mismatches, missing DOIs, broken links, orphaned records

📊 **Health Score:**  
Percentage of ecosystem that is synchronized (aim for 95%+)

🔗 **Remediation Steps:**  
Specific actions to fix any gaps

---

## EXPECTED OUTPUT (Healthy State)

```json
{
  "consistency_score_percent": 95,
  "papers_found": 4,
  "papers_expected": 4,
  "discrepancies_found": 0,
  "health_summary": {
    "status": "healthy",
    "recommendation": "No action required"
  }
}
```

---

## IF SCAN FINDS ISSUES

Common discrepancies:

| Issue | Severity | Fix |
|-------|----------|-----|
| Missing ORCID in Zenodo metadata | ⚠️ | Edit Zenodo record → add `0009-0002-2492-9079` |
| DOI not in internal docs | ⚠️ | Add to CogPass, GOD GT, README |
| .zenodo.json missing | ⚠️ | Create file in repo root, add related_identifiers |
| URL returns 404 | 🔴 | Test link manually, update phosphorus31.org |
| Zenodo API unreachable | 🔴 | Check internet connection, retry |

---

## SCHEDULE

**Recommended:** Run weekly after any publication activity, or:
- After publishing a new paper to Zenodo
- After updating public sites
- Before submitting grants (to verify DOI count)

**Frequency option:** Add to cron:

```bash
# Every Monday at 10 AM
0 10 * * 1 python3 /path/to/zenodo_scan_local.py --mode full --output-format json+markdown >> zenodo_scan.log
```

---

## FILES

| File | Purpose | Run with |
|------|---------|----------|
| `ZENODO_SCAN_AGENT.md` | Full prompt for AI agents | Claude/Ollama |
| `zenodo_scan_local.py` | Executable Python script | `python3` |
| `zenodo_scan_*.json` | Machine-readable results | grep/jq/scripts |
| `zenodo_scan_*.md` | Human-readable results | editor/browser |

---

## SUPPORT

If scan fails:

1. **Check internet:** `curl -I https://zenodo.org`
2. **Check file paths:** Ensure CogPass, README, etc. are in working directory
3. **Check DOI format:** Should be `10.5281/zenodo.XXXXXXX`
4. **Run in verbose mode:** Add `--verbose` flag to Python script (if supported)

---

## NEXT STEPS AFTER SCAN

If all green (✅):
- No action needed
- Update grant applications with verified DOI count
- Share results with team

If issues found (⚠️ or 🔴):
- Prioritize by severity
- Fix in this order: Zenodo records → internal docs → public surface → repo files
- Re-run scan to verify fixes
- Document any schema changes

---

**Agent Authority:** SCHOLAR (Will Johnson's research intelligence agent)  
**Last Updated:** April 28, 2026  
**Next Review:** May 5, 2026
