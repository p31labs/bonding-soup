# Shift handover — P31 home automation and CI (2026-04-25)

This report summarizes work to unify **pre-merge and CI verification** under one home-repo command, align **GitHub Actions** with that bar, and document behavior for the next operator or agent.

---

## 1. Objectives (what we optimized for)

- **One local command** that matches the mental model “run everything that matters” before a merge: contracts, live mesh, hub build, security suite, extended validation, fleet visibility, E2E, optional SAST.
- **CI parity** so `main` is gated by the same script path where possible, without reintroducing three disconnected workflow steps.
- **Predictable E2E** on developer machines (Playwright + `astro preview`) without spurious failures from a stale or missing local preview port.

---

## 2. What ships today (commands)

| Command | What it does |
|--------|----------------|
| `npm run verify` | Root: passport, constants, p31-style, p31ca contracts (if tree), egg-hunt, `tsc`. |
| `npm run p31:ci` / `npm run release:check` | `scripts/p31-ci.mjs` — no strict mesh by default locally; k4 dry-run + mesh if present; p31ca `verify`+build if `andromeda/04_SOFTWARE/p31ca` exists. **In CI,** runs **p31ca `security:check` (B+C+E, skip A)** when p31ca is present, unless `--no-security`. |
| `npm run p31:ci:all` / `npm run release:all` | `MESH_LIVE_STRICT=1` + `p31-ci.mjs --security` — full hub chain + live mesh strict + security (local explicit). |
| `npm run p31:all` | **`scripts/p31-all.mjs`**: everything in `release:all` **plus** `validate-p31-full.sh`, `fleet:probe` (soft), Playwright (with `CI=true` in subprocess), `security:lint` (soft), Semgrep scan (soft if CLI missing). |
| `npm run validate:full` | `validate-p31-full.sh` only — scorecard, audits, report at `/tmp/p31_validation_report.json`. |

**Flags for `p31-all.mjs`:** `--skip-validate` `--skip-fleet` `--skip-e2e` `--skip-sast` `--skip-lint`

**`p31-ci.mjs` flags:** `--security` / `-s`, `--no-security`, `--content` / `-c`, `--skip-soup-tsc`, `--skip-install`, `--install` / `-i`

---

## 3. New and touched files (inventory)

| Path | Role |
|------|------|
| `scripts/p31-all.mjs` | Orchestrates the full bar (see section 2). |
| `scripts/p31-ci.mjs` | Runs p31ca `npm run security:check` after hub verify when `runSecuritySuite` (CI, or `--security`, and not `--no-security`). |
| `package.json` | Scripts: `p31:all`, `p31:ci:all`, `release:all`, etc. |
| `.github/workflows/p31-ci.yml` | Single main step: `node scripts/p31-all.mjs` with `CI=true`, `MESH_LIVE_STRICT=1`; prep step installs Semgrep via `pip` when p31ca exists; **timeout 45m**; path filters include `scripts/p31-all.mjs`. |
| `AGENTS.md` | Pointers to `p31:all`, `release:all`, and CI security behavior. |
| `.vscode/tasks.json` | Task “P31: p31:all (CI + validate:full + e2e + fleet + lint + SAST)”. |

---

## 4. Execution order inside `p31:all` (for debugging)

1. **p31-ci with security and strict mesh (env):** `MESH_LIVE_STRICT=1` and `node scripts/p31-ci.mjs --security`  
   - Includes root `npm run verify`, k4-personal + live mesh (when k4 path exists), p31ca `npm run verify` (prebuild + Astro build), then p31ca `security:check` (skip-A).  
2. **validate:full** — bash `validate-p31-full.sh` (unless `--skip-validate`).  
3. **Fleet** — `npm run fleet:probe` in p31ca (**soft**).  
4. **Playwright** — `npx playwright install --with-deps chromium` then `npm run test:e2e` with **`env.CI: "true"`** for the test subprocess only.  
5. **security:lint** — soft.  
6. **Semgrep** — `semgrep scan` with `p/javascript`, `p/typescript`, `p/security-audit` on `src` and `workers` under p31ca; **soft** if no CLI.

**Partial clone (no p31ca):** steps that require p31ca are skipped; `p31-ci` still completes the home chain per existing logic.

---

## 5. E2E gotcha (important for handover)

- **Root cause fixed:** `playwright.config.ts` uses `reuseExistingServer: !process.env.CI`. A local run without `CI` could reuse a bad process on `127.0.0.1:4321`, leading to **timeouts** on `page.goto`.  
- **Fix:** `p31-all.mjs` sets **`CI=true` only** for the `npm run test:e2e` child so a **fresh** `astro preview` webServer starts, matching GitHub behavior.  
- If someone runs `npm run test:e2e` **directly** in p31ca without `CI=true`, they may still see the old flakiness; recommend `CI=true npm run test:e2e` or use `npm run p31:all`.

---

## 6. Security and SAST: how pieces relate

- **`p31-ci` security** = p31ca `npm run security:check` = `run.mjs --skip-A` (SCA, worker inventory + CORS, PQC + passkey checks). P0 vs P1 policy unchanged; see `p31ca` SECURITY-RUNBOOK.  
- **`p31:all` Semgrep** = CLI scan aligned with **`.github/workflows/p31-security.yml`** `sast` job configs (not SARIF upload). In CI, Semgrep is installed in the **p31-ci.yml** job before `p31:all` runs. Locally, install: `pip install semgrep` or `brew install semgrep`. If absent, the step is skipped with a message (**non-fatal**).  
- **Weekly / path-filtered** `p31-security.yml` **still exists** for dedicated security paths, split phases, artifacts, and Semgrep **SARIF** upload. It is **not** removed; it complements the home `p31-ci` workflow.

---

## 7. Artifacts and reports

- **validate:full JSON:** `/tmp/p31_validation_report.json` (script also echoes path at end of run).  
- **p31ca security:** `andromeda/04_SOFTWARE/p31ca/build/security-report.json`, `build/security-inventory.json` (after `security:check`).  
- **Playwright:** HTML/trace under `p31ca/test-results/` on failure (per Playwright defaults).

---

## 8. Operational notes

- **Runtime:** A full `p31:all` can be **tens of minutes** (Astro build, security, validate shell script, browser deps, e2e, Semgrep). CI timeout is **45 minutes**.  
- **Path filters** on `p31-ci.yml`: if a change is outside the listed globs, the workflow may not run on push/PR; use **`workflow_dispatch`** or run `npm run p31:all` locally (documented in workflow header).  
- **k4-personal / mesh:** `MESH_LIVE_STRICT=1` is set for `p31:all` via the inner `p31-ci` env; home-only clone without Andromeda still passes the home parts of the chain.  
- **Escape hatch** for security in `p31-ci` only: `--no-security` (rare; e.g. debugging hub build in isolation).

---

## 9. Suggested follow-ups (not blockers)

- If **pip + Semgrep** on `ubuntu-latest** becomes flaky, pin a Semgrep version or switch to a maintained install action.  
- Consider **caching** Playwright browser binaries in GHA to shave minutes (standard pattern: `~/.cache/ms-playwright`).  
- **`validate:full`** intentionally overlaps with root `verify` in some checks; that is by design for the scorecard. If time becomes an issue, optional `--dedupe` in the shell script is a future optimization.

---

## 10. Quick verification one-liner (after clone + install)

From repo root (with `andromeda/04_SOFTWARE/p31ca` present):

```bash
npm ci && npm run p31:all
```

Faster dev loop (no validate / no semgrep, still exercises CI chain + e2e):

```bash
node scripts/p31-all.mjs --skip-validate --skip-sast
```

---

*Handover prepared for session close 2026-04-25. Next owner: use `AGENTS.md` and `P31-ROOT-MAP.md` for directory boundaries; this doc is about the **automation and CI** slice only.*
