# P31 release ladder — CI/CD spine (CWP-P31-SME-RELEASE-2026-01)

**Purpose:** Tie **what runs where** (PR, `main`, nightly, pre-deploy) to **apex proofs** P0–P3, without false confidence on partial clones.

**Related:** **`docs/P31-DEPLOY-CANON.md`** (Pages deploy paths), **`docs/P31-ENGINEERING-STANDARD.md`** (ship bar), **`AGENTS.md`** (local commands), root **`package.json`** scripts.

---

## Apex proofs (operator mental model)

| Tier | Meaning | Primary local command | CI home (`bonding-soup`) | Notes |
|------|---------|----------------------|---------------------------|-------|
| **P0** | Merge gate — must be green for protected `main` | `npm run verify` | Job **P31 / root verify** | Always runs; **no** `andromeda/` required for pass (p31ca steps skip inside scripts). |
| **P1** | Release-capable — mesh strict + hub build when tree present | `MESH_LIVE_STRICT=1 npm run p31:ci` | Job **P31 / full stack** (`p31-all.mjs`, preflight) | Needs **`andromeda/04_SOFTWARE/p31ca`** in checkout for hub build + strict mesh; home-only clone skips heavy steps but **P0 still passes**. |
| **P2** | Full operator bar — scorecard, e2e, glass, SAST (soft) | `npm run p31:all` | Same as **P31 / full stack** | Includes `validate:full`, Playwright smokes, ecosystem glass (soft), Semgrep (soft). |
| **P3** | Pre-Pages / manual deploy rehearsal | `npm run release:public` or `node scripts/p31-release-public.mjs` | **P31 Pages deploy + prod smoke** (`workflow_dispatch`) | Runs `p31-ci.mjs` then `wrangler pages deploy`; see deploy canon. |

**Security suite (p31ca):** **`security:check`** (B+C+E) runs inside **`p31-ci.mjs`** when `CI=true` and p31ca exists — i.e. bundled in **P1** on full checkouts, not a separate home proof when the subtree is absent.

---

## GitHub Actions — `p31labs/bonding-soup` (home)

| Workflow | Trigger | Check name(s) | Proof tier | Partial clone (`no andromeda/` in git) |
|----------|---------|---------------|------------|----------------------------------------|
| **`p31-ci.yml`** | `push` / `pull_request` → `main`, `master` | **P31 / root verify** | **P0** | Full `npm run verify` — passes. |
| Same | Same | **P31 / full stack** | **P1–P2** | `p31-all` runs; hub/e2e parts **skip or no-op** if p31ca path missing; job still intended to pass when only home artifacts exist. |
| **`p31-security.yml`** | `push` / `PR` (path filter) + weekly + `workflow_dispatch` | **P31 / security preflight** (meta), **Security (SCA + Workers + Crypto)**, **SAST (Semgrep)** | **P1** when p31ca present | **Preflight** always runs; security jobs **skip cleanly** when `andromeda/04_SOFTWARE/p31ca` is not in the **committed** tree (normal for default home remote). Run the same suite in **Andromeda** or locally with a full clone. |
| **`p31-pages-deploy.yml`** | `workflow_dispatch` only | *(job names in file)* | **P3** | **Requires** p31ca + `dist/` after `p31-ci.mjs` — fails fast if deploy attempted without build artifacts. |
| **`p31-pr-on-push.yml`** | Push to non-`main` branches | **P31 / ensure PR** | — | Automation only; not a merge gate. |

---

## GitHub Actions — `p31labs/andromeda` (monorepo)

| Workflow | Trigger | Role |
|----------|---------|------|
| **`p31ca-hub.yml`** | PR + push `main`, paths under `04_SOFTWARE/p31ca/**` | **Canonical p31ca CI + Pages deploy** on push to `main` — **`hub:ci`** then **`pages deploy`**. |

**Ordering:** Hub Pages should be **last** in a coordinated release: home P0/P1 green (or Andromeda PR green) → merge to Andromeda `main` → **p31ca-hub** deploy — or manual **P31 Pages deploy** from home with full tree + secrets.

---

## Branch protection — recommended check names

**Repository: `p31labs/bonding-soup`**

| Required? | Check name (exact) | Rationale |
|-----------|-------------------|-----------|
| **Required** | `P31 / root verify` | P0; always meaningful. |
| **Required** | `P31 / full stack` | P1/P2 apex on CI runners with full clone; if your org uses **sparse CI without Andromeda**, treat as informational or use a dedicated self-hosted runner with monorepo mirror. |
| **Optional** | `Security (SCA + Workers + Crypto)` | Skips on home-only remote; do not require unless the repo **tracks** `andromeda/04_SOFTWARE/p31ca` or you add a mirror job. |
| **Optional** | `SAST (Semgrep)` | Report-only / skip symmetry; same caveat. |
| **Optional** | `P31 / security preflight` | Always passes; informational only — usually **omit** from required list. |

**Repository: `p31labs/andromeda`**

| Required? | Check name | Rationale |
|-----------|------------|-----------|
| **Required** | *(p31ca-hub verify job title as shown in Actions)* | Hub build is authoritative for **p31ca.org** when merging hub changes there. |

---

## Developer fast path vs release path

| Path | Command | When |
|------|---------|------|
| **Fast (local / feature)** | `npm run verify` | Before commit; matches **P0**. |
| **Fast + loose mesh** | `MESH_LIVE_STRICT=0 npm run p31:ci` or `npm run release:local` | Offline or flaky edge. |
| **Release check** | `npm run release:check` / `npm run p31:ci` | Same as CI **p31-ci.mjs** (strict mesh in CI by default). |
| **Full bar** | `npm run p31:all` | Nightly or pre-release; includes e2e + validate:full. |
| **Public / donor-facing** | `npm run release:public` | Policy gate from **`p31-release-public.mjs`**. |

---

## Deploy day checklist — **p31ca Pages last**

1. **Green proofs:** `P31 / root verify` + `P31 / full stack` on the PR (or local `npm run p31:all` with `MESH_LIVE_STRICT=1` if CI cannot see mesh).
2. **Security:** If home CI skipped security (no p31ca in git), confirm **Andromeda** hub PR passed **`hub:ci`** (includes prebuild verifiers) or run **`npm run security:check`** locally in `p31ca/`.
3. **Merge** hub changes via the **canonical** track (**Andromeda** `main` for routine hub work, per **`P31-DEPLOY-CANON.md`**).
4. **Wait** for **`p31ca-hub.yml`** deploy on Andromeda **or** run home **`P31 Pages deploy + prod smoke`** only when carrying a **full** `andromeda/04_SOFTWARE/p31ca` tree and secrets.
5. **Smoke:** Optional Playwright prod smoke (`p31-pages-deploy` input) or hit **`https://p31ca.org/`** + critical routes from **`p31-ecosystem.json`** glass list.
6. **Record:** Note commit SHA deployed vs **`p31-live-fleet.json`** / ops glass if you maintain an operator log.

---

## Partial clone predictability

| Layout | `npm run verify` | `p31-ci.mjs` | `p31-all.mjs` | Home **P31 Security** workflow |
|--------|------------------|--------------|---------------|--------------------------------|
| Home only (no `andromeda/` in git) | Passes; skips p31ca-only steps via scripts | Passes after root verify; logs “no p31ca” | Skips hub build path; e2e may skip | Preflight **passes**; **Security** / **SAST** jobs **skipped** (not failed). |
| Full multi-root (Andromeda present) | Full bar including `verify:p31ca-contracts` when paths exist | Hub `npm run verify` + build + `security:check` in CI | Full e2e when Playwright paths exist | **Security** runs against p31ca subtree. |

**Rule:** Never interpret “skipped security job on GitHub” as “vulnerable” on home repo — interpret as “subtree not in this remote; proof runs elsewhere.”
