# P31 shift report — closed backlog

**Updated:** 2026-04-26 (repo: P31 home + Andromeda checkout)  
**Purpose:** Single handoff after closing prior “open items” (F3, F4, F8 policy, CORS/Semgrep governance, mesh URL pipeline).

---

## Executive summary

All items that were previously listed as **backlog** for this track are **closed** either in **code** (CI, constants, validation shell, security inventory) or in **governance docs** (orchestrator definition of done, runbook table of closed policies). The mesh worker URL surface is **single-sourced** from `p31-constants.json` with `apply:constants` / `verify-constants`. GitHub **P31 CI** now runs on **every** push and pull request targeting **`main`** / **`master`** with **no path filters**, so merges cannot skip the job by touching only “unlisted” paths.

---

## Closed items (what “done” means)

| ID | Closure |
|----|---------|
| **F3** | Worker inventory excludes `*/docs/files/*`; allowlist covers discovered Workers; P1 CORS lines are **informational** per runbook (not a merge blocker). |
| **F4** | **`.github/workflows/p31-ci.yml`** — `push` + `pull_request` have **no `paths:`**; only `branches: [main, master]`. |
| **F8** | **Orchestrator** — `andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md` defines **definition of done** (Access or Bearer, rate limits, audit on mutating paths). Implementation is **deploy-time** on the Worker; static pages are not the auth layer. |
| **CORS P1 WARNs** | Documented as **closed policy** in **`SECURITY-RUNBOOK.md`** — triage via allowlist; CI does not fail on P1 CORS alone. |
| **Semgrep** | Documented as **report-only by design** until explicitly promoted to blocking. |
| **Mesh / agent / orchestrator URLs** | **`p31-constants.json`** `mesh.*` → `apply:constants` → `p31ca/src/data/p31-mesh-constants.json`, `dev-workbench.html`, generated TS; **`verify-constants`** enforces alignment. |

---

## Operator commands (ship bar)

| Goal | Command |
|------|---------|
| New clone | `npm run setup` |
| Default verify | `npm run verify` |
| Full hub + strict mesh (local parity with CI env) | `MESH_LIVE_STRICT=1 npm run p31:ci` or `npm run release:check` |
| Extended audits | `npm run validate:full` |
| p31ca security suite | `cd andromeda/04_SOFTWARE/p31ca && npm run security:check` |

---

## Reference paths

- Workspace map: **`P31-ROOT-MAP.md`**
- Engineering standard: **`docs/P31-ENGINEERING-STANDARD.md`**
- Edge / orchestrator policy: **`andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`**
- Security triage: **`andromeda/04_SOFTWARE/p31ca/docs/SECURITY-RUNBOOK.md`**
- CI: **`.github/workflows/p31-ci.yml`**

---

## Verification

- Root: `npm run verify` (passport, constants, style, p31ca contracts, egg-hunt, `tsc`).
- Worker inventory (p31ca): `node scripts/security/verify-worker-inventory.mjs` — expect allowlist match for all discovered `wrangler.toml` files (excluding `docs/files`).

---

*No open backlog items from this track; future work is normal product iteration, not these gates.*
