# P31 reports generator

**Schema:** `p31.report/0.1.0` (envelope), `p31.reportsIndex/0.1.0` (committed manifest).

**Mandatory aggregates:** morning · midday · evening. Plus on-demand **urgent** reports and a weekly digest.

## Files

| Path | Role |
|------|------|
| `~/.p31/reports/YYYY/MM/DD/<id>.json` | Local archive (full envelope + body). |
| `~/.p31/reports/YYYY/MM/DD/<id>.md` | Markdown mirror. |
| `docs/reports/index.json` | Committed manifest (metadata only). |
| `docs/reports/promoted/<id>.md` | Opt-in committed report markdown. |
| `scripts/p31-reports.mjs` | Runner (subcommands). |
| `scripts/lib/reports/{sections,filing,render}.mjs` | Section builders, filing, markdown. |
| `scripts/verify-reports-index.mjs` | Schema gate (in `npm run verify`). |

## Commands

| Command | What |
|---------|------|
| `npm run reports:morning` | Aggregate covering last 12h. |
| `npm run reports:midday` | Aggregate covering last 4h. |
| `npm run reports:evening` | Aggregate covering last 12h + joy line. |
| `npm run reports:auto` | Picks slot by local time; warns if today's slot already filed (use `--force`). |
| `npm run reports:urgent -- "<headline>" --severity high --category incident --details "…"` | Surprise / incident; surfaces in next aggregate. |
| `npm run reports:weekly` | 7-day digest (counts, urgent breakdown, score range). |
| `npm run reports:latest` | Print latest report markdown (`--kind morning` to filter). |
| `npm run reports:search -- "<query>"` | Local archive substring search. |
| `npm run reports:promote <id>` | Copy a markdown report into `docs/reports/promoted/`. |
| `npm run reports:index` | Rebuild `docs/reports/index.json`. |

### Spoon mode

`npm run reports:auto -- --brief` — top section only.

## Sections (auto-included in aggregates)

1. **Launch readiness** — score, lanes, blockers, next-one (`/tmp/p31_launch_readiness.json` or `--refresh` to run).
2. **Live glass** — `/tmp/p31_glass_report.json` rollup; flags down rows.
3. **Drift since previous** — Δscore + Δblockers vs previous report of same kind.
4. **Urgent items since last aggregate** — pile of `urgent` reports filed since last `<kind>`.
5. **Recent commits** — `git log --since=<N> hours` (12h morning, 4h midday, 12h evening).
6. **Operator shift** — last in/out from `~/.p31/operator-shift.jsonl`.
7. **Trim tab** (morning + evening only) — calm joy line.

## Schedule (recommended cron / launchd)

The script is idempotent — calling `reports:auto` twice in the same slot prints "already filed" unless `--force`.

Linux cron (operator host):

```
# Mandatory aggregates
0  9  * * *  cd /home/p31 && /usr/bin/npm run reports:morning >>~/.p31/reports.cron.log 2>&1
0 13  * * *  cd /home/p31 && /usr/bin/npm run reports:midday  >>~/.p31/reports.cron.log 2>&1
0 19  * * *  cd /home/p31 && /usr/bin/npm run reports:evening >>~/.p31/reports.cron.log 2>&1

# Weekly digest, Sunday 8pm
0 20  * * 0  cd /home/p31 && /usr/bin/npm run reports:weekly  >>~/.p31/reports.cron.log 2>&1

# Index refresh after manual edits
@hourly      cd /home/p31 && /usr/bin/npm run reports:index   >>~/.p31/reports.cron.log 2>&1
```

## Severity rollup

`ok < notice < caution < urgent < critical`. The aggregate `summary.severity` = max across sections (skips ignored).

## Schema (envelope)

```jsonc
{
  "schema": "p31.report/0.1.0",
  "id": "morning-20260430-1130-abcd",
  "kind": "morning",
  "ts": "2026-04-30T15:30:00.000Z",
  "git": { "head": "abc123", "branch": "main" },
  "summary": {
    "headline": "morning · 92/100 · 5 critical gates",
    "severity": "caution",
    "ready": false,
    "score": 92,
    "blockers": [],
    "humanGatesPending": 5,
    "nextOne": "npm run launch:check legal-counsel-review met --note '<why>'"
  },
  "sections": [
    { "id": "readiness", "title": "Launch readiness", "status": "ok", "lines": [...], "data": {...} },
    ...
  ],
  "refs": ["..."]
}
```

For **urgent** reports, the envelope adds:

- `severity` — operator-supplied (`low|medium|high|critical`; default `high`).
- `category` — `incident|announcement|surprise|opportunity|custom`.
- `sections[0]` is `details` from the operator-supplied `--details` (or empty placeholder).

## Search

`npm run reports:search -- "donate-api"` — substring match across id, headline, kind, severity, and stringified sections.

## Promote / publish

`npm run reports:promote <id>` copies the markdown into `docs/reports/promoted/`. Useful for grant evidence, household handoff, or post-incident learning. Add to a PR like any other doc.

## Verify

`npm run verify:reports-index` validates `docs/reports/index.json` shape; `npm run verify:reports-automation` checks the simulation/daemon/inbox surfaces. Both are in the root `npm run verify` chain.

---

## Simulation

Sandbox the reports cadence into `~/.p31/reports-sim/<scenario>-<ts>/` so you can preview UI + filing without touching the live archive.

| Scenario | What it files |
|---|---|
| `steady-week` | 7 days × {morning, midday, evening} with realistic small score wobble + drift sections. |
| `incident-day` | Morning ok → midday with payments warning → urgent at 13:30 → evening rolls it up + Δscore −10. |
| `drift-down` | 7 mornings, score 95→75, drift section visible across days. |
| `urgent-storm` | Morning ok → 5 urgents through the day (mixed severity) → evening pile + critical incident. |

```bash
npm run reports:simulate -- --scenario steady-week
npm run reports:simulate -- --scenario incident-day
npm run reports:simulate -- --scenario drift-down
npm run reports:simulate -- --scenario urgent-storm

# Browse a sandbox
P31_REPORTS_HOME='/home/p31/.p31/reports-sim/steady-week-…' npm run reports:latest
```

Each sandbox includes a `manifest.json` listing every report it created. `P31_REPORTS_HOME` is the only override needed — the live commands read from whichever path it points at.

## Automation

### Reports daemon (in-process scheduler)

```bash
npm run reports:daemon                   # foreground; sleeps to next slot
npm run reports:daemon -- --once         # run next slot then exit
npm run reports:daemon -- --slots 8,12,18
npm run reports:daemon:status            # print last heartbeat
```

- Heartbeat at `~/.p31/reports-daemon.json` — schema `p31.reportsDaemon/0.1.0`.
- On startup, files **backfills** for any of today's slots that elapsed without a report (`kind=morning|midday|evening`, summary headline marks "backfill" via the underlying auto-skip path).
- Custom slots: `--slots 6,12,18` (24h hours, comma-separated).
- Stop cleanly with SIGINT / SIGTERM.

### systemd-user timers (recommended on Linux/Crostini hosts)

```bash
npm run reports:install-systemd                   # dry-run preview
npm run reports:install-systemd -- --apply        # write units
systemctl --user daemon-reload
systemctl --user enable --now p31-reports-morning.timer p31-reports-midday.timer p31-reports-evening.timer p31-reports-weekly.timer
```

Logs append to `~/.p31/reports.systemd.log`. Uninstall via `npm run reports:install-systemd -- --uninstall` (then `systemctl --user disable --now …`). Idempotent: re-running `--apply` is safe.

### Inbox watcher (frictionless surprise reporting)

Drop a file into `~/.p31/inbox/urgent/` from any synced location — Drive, Dropbox, SMB, IPFS sync — and the watcher converts it into an urgent report.

Accepted formats:

- `*.txt` / `*.md` — first line is headline; remainder is details. Optional front-matter:

  ```
  severity: high
  category: incident
  ---
  donate-api 502 storm
  Cloudflare 502 every ~30s; circuit-breaker not yet tripped.
  ```

- `*.json` — `{ "headline": "...", "severity": "high", "category": "incident", "details": "..." }`.

```bash
npm run reports:inbox                       # one-shot drain
npm run reports:inbox -- --watch            # poll every 10s
npm run reports:inbox -- --watch --interval 5
npm run reports:inbox -- --dir ~/Drive/p31-urgent  # alt dir (e.g. cloud)
```

Processed files move to `~/.p31/inbox/processed/` with `ok-` / `err-` prefix + UTC timestamp.

### Glass → urgent bridge

After `npm run ecosystem:glass`, run `npm run reports:from-glass` and any down/auth-failed probes auto-file a single urgent report. Dedupes by fingerprint within a 30-min window.

```bash
npm run ecosystem:glass && npm run reports:from-glass
```

`--threshold N` (min down rows to fire, default 1) and `--window 30` (dedupe minutes) tune the behavior. Severity = `high` (1–2 down) or `critical` (≥3 down).

### Verify gate

```bash
npm run verify:reports-automation
```

Confirms scripts exist, scenarios are correctly named, daemon heartbeat (if present) is well-formed, systemd units (if installed) reference the current repo path, and the inbox dir is reachable. In the root `npm run verify` chain.

---

## Public glass box (transparency terminal)

The committed `docs/reports/index.json` is **already public** — by design, it carries metadata only (kind, ts, severity, headline). To make it watchable, the repo ships a public-facing terminal page:

- **`glass-box.html`** — single-file HTML at the repo root. Streams synthetic playbacks of `verify:*` / `launch:audit` / `reports:simulate` / `ecosystem:glass` line-for-line; polls the real `reports/index.json` every 60s; offers a one-click client-side snapshot report.
- **Live URL:** `https://p31ca.org/glass-box` (short routes `/glass`, `/transparency`).
- **Build & verify:** `npm run build:glass-box` (mirrors page + index into `p31ca/public/`), `npm run verify:glass-box` (in root `npm run verify` — no-secret + structure check).
- **Spec:** `docs/P31-GLASS-BOX.md`.
- **Visual demos gallery:** `demos/index.html` → live `https://p31ca.org/visuals` — K₄ mesh · alignment graph · Larmor pulse · glass-box card. Build: `npm run build:demos`. Verify: `npm run verify:demos`. Prose tour: `docs/P31-DEEP-DIVE.md`. Captions: `demos/SOCIAL-CAPTIONS.md`.

Auto-pilot mode cycles through every surface so visitors who don't click anything still see motion. Pause / stop / 0.5×–4× speed are first-class. Every replayed line carries a `[SYN]` tag — synthetic is never disguised as live.
