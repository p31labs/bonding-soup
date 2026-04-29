# P31 engineering standard

**Status:** normative for this workspace.  
**Last updated:** 2026-04-27

This document is the **single checklist** agents and humans use before calling work “merge-ready” or “shipped.” Package READMEs and WCDs add detail; **this file wins** when a quick rule is needed.

---

## 1. Principles

1. **Machine gates beat prose.** If `npm run verify`, `release:check`, or monorepo CI disagree with chat or a review doc, **fix the code or the doc**—do not ship on narrative alone.
2. **No invented mesh or fleet numbers.** K₄ counts, worker URLs, and LIVE hub data come from **live bindings**, **`p31.ground-truth.json`**, or **generated hub data**—not from memory or stale markdown.
3. **Immutability after publish.** Zenodo DOIs, WCD IDs, and canonical numbering namespaces follow **`docs/CANONICAL-NUMBERING.md`**; corrections are new records/versions, not silent edits.
4. **Secrets never in git.** Tokens live in env, `wrangler secret`, or GitHub Actions secrets only. See **§5**.

---

## 2. Home repository (C.A.R.S. root)

Applies to the repo that contains `p31-constants.json`, `cognitive-passport/`, and `scripts/`.

| Gate | Command | When |
|------|---------|------|
| First clone / new machine | **`npm run setup`** | Installs root + p31ca deps, `apply:constants` (+ `apply:p31-style` when design tokens exist), then **`verify`**. |
| Default CI | **`npm run verify`** | Alignment registry, passport, constants, **ecosystem** (probe templates + monetary invariants), **Andromeda MAP** (**`verify:map-pipeline`** — donate-api + donate page + no `sk_*` in public trees; skips if `andromeda/` missing), style, p31ca contracts (when `andromeda/` present), egg-hunt, **`verify:cars-wire`** (C.A.R.S. mock WS message types vs **`cars-contract/p31.carsWire.json`**), **doc index** (**`build:doc-index`** → **`verify:doc-index`**), **SIMPLEX** (**`verify:simplex`**, **`verify:simplex-email`**, **`verify:simplex-bootstrap`** — see **`docs/P31-ALIGNMENT-SYSTEM.md`**), `tsc`, **`soup:prep:check`**. |
| Payment / creator-economy (fast) | **`npm run verify:monetary`** | Full gate: re-runs ecosystem + constants + **MAP** + **`verify:economy`**. Use after edits to **`p31-constants.json`** `payment.*` (donate + **Stripe API** health URLs), **`p31-ecosystem.json`** monetary/probe rows, or creator-economy JSON. Skips p31ca steps on partial clone. |
| Git pre-commit (optional) | **`npm run git:hooks`** | Sets **`core.hooksPath`** to **`.githooks`**. When payment/economy paths are staged, **`.githooks/pre-commit`** runs **`verify:monetary`**. Bypass: **`P31_SKIP_MONETARY_HOOK=1 git commit`**. Also runs at end of **`npm run setup`**. |
| Release | **`npm run release:check`** | Before merge or tag; includes **p31ca** build when `andromeda/04_SOFTWARE/p31ca` exists. Match GitHub mesh strictness: **`MESH_LIVE_STRICT=1 npm run p31:ci`** (or `release:check` with CI env). Optional before hub release: **`npm run security:check`** in **p31ca** (triage P1 inventory warnings). |
| Public hub cut | **`npm run release:public`** | Root **`verify`** + strict mesh + **`p31ca` `hub:ci`** (about HTML regen) + **`security:check`**. Does not deploy. Flags: **`--content`** (enrich about pages), **`--no-security`**, **`--skip-install`**. |
| Extended | **`npm run validate:full`** | Optional; network + live audits (see `validate-p31-full.sh`). Report includes **P31 Ecosystem** + **MAP monetary surface** when Andromeda is present. Cage live checks use **`mesh.k4CageWorkerUrl`** from `p31-constants.json` (override env **`CAGE_BASE`** if needed). |

**GitHub `p31-ci.yml` (home):** runs on **every** push/PR to **`main`/`master`** (no path filters). **Root `npm run verify`** does **not** run **`verify:mesh`**; use **`npm run verify:mesh`** when changing k4-personal or live mesh URLs (`p31-constants.json` → `mesh.*`). For strict mesh parity with CI, **`MESH_LIVE_STRICT=1 node scripts/p31-ci.mjs`** or **`npm run release:check`**. When `andromeda/` is **not** in the checkout, the job is still a **home-only** pass (as before).

**Operator-locked values:** edit **`p31-constants.json`**, then **`npm run apply:constants`** and **`npm run verify:constants`**.

**Universal UI canon:** source **`andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json`** (in a full checkout). Regenerate CSS via **`npm run apply:p31-style`**; verify via **`npm run verify:p31-style`**. Generated variable tables: **`andromeda/04_SOFTWARE/design-tokens/DESIGN-TOKENS-REFERENCE.md`** (also **`npm run generate:design-token-docs`** without a full style regen). **p31ca static HTML drift:** **`npm run verify:style-alignment`** — `public/*-about.html` must link `p31-style.css`, set **`data-p31-appearance`**, and avoid hardcoded canon hex outside `<style>` custom properties (p31ca **`prebuild`** runs it after **`verify:p31-style`**; full public tree: **`P31_STYLE_ALIGN_GLOB=all`** with **`style-alignment-exclude.json`**).

**p31ca registry shells (`scripts/hub/registry.mjs` — relative `appUrl`, not `https`):** **`verify-public-app-shell`** requires `<link href="/p31-style.css">` in `<head>`. **`verify-internal-hub-links`** (runs after **`astro build`**) requires same-origin `href`/`src` to resolve under **`dist/`** or **`_redirects`**. Typical fixes: add missing **`/p31-style.css`**; prefer **`/p31-style.css`** over paths like **`cognitive-passport/p31-style.css`** that are not shipped at that URL; point “soup” exits from hub-hosted pages at **`https://bonding.p31ca.org/soup.html`** when **`soup.html` is not on the Pages tree.

**Cognitive Passport:** after generator edits, **`npm run sync:passport`** then **`npm run verify:passport`**. Do not hand-edit the p31ca mirror.

---

## 3. Andromeda monorepo (`andromeda/`)

**Canonical remote:** [https://github.com/p31labs/andromeda](https://github.com/p31labs/andromeda)

When that tree is present, it has its **own** git remote and **production bar** defined in **`andromeda/docs/ENTERPRISE_QUALITY.md`**:

- Root **`pnpm install`**, **`pnpm run quality`**, **`pnpm run build`**, **`pnpm run test`**.
- **p31ca.org** hub: **`p31ca-hub.yml`** / **`npm run hub:ci`** (or equivalent) green before merge.
- **Security:** `npm run security:check` in p31ca per **`docs/SECURITY-RUNBOOK.md`** when touching workers or dependencies.

**Design tokens** are **tracked** under **`04_SOFTWARE/design-tokens/`**; p31ca scripts consume `p31-universal-canon.json`. Do not fork a second canon JSON.

**`docs/files/` (Andromeda):** large binaries (**PDF, docx, tarballs, `mnt/` exports**) are **gitignored**; keep Zenodo PDFs and legal scans **out of git** unless you adopt **Git LFS** explicitly. Tooling (`zenodo_upload.py`, `zenodo_results.json`, `.env.example`) stays tracked.

---

## 4. Launch and operations

- **`npm run connection`** — CONNECTION spine (same mental model as mission **Connect**): wiring **`verify`**, deploy canon, ecosystem **`deployables`**, **`P31_*`** catalog, edge coherence commands, and live hub URLs — **`scripts/p31-connection.mjs`**; also **`npm run p31 -- connect`**.
- **`docs/P31-DEPLOY-CANON.md`** — production deploy spine: Andromeda **`p31ca-hub.yml`** vs bonding-soup manual **`p31-pages-deploy.yml`** vs local **`deploy:p31ca`**; secrets names; **`npm run list:p31-env`** / **`verify:p31-env`** for the **`P31_*`** catalog (**`p31-env-manifest.json`**).
- **`docs/ECOSYSTEM-PRODUCTION-11.md`** — full-fleet “everything connected” matrix: glass probes, deploy order, 11/10 Definition of Done across hub + K₄ + operator + monetary.
- **`docs/ENTERPRISE-LAUNCH-PREP.md`** — secrets rotation, CI merge path, deploy surfaces, post-Zenodo housekeeping.
- **`docs/MVP-DELIVERABLES-INVENTORY.md`** — what is LIVE vs adjacent vs concept (grant-facing).
- **`docs/FUNDING-GATED-ACTION-ITEMS.md`** — canonical list of action items blocked on funding (hardware / IP / domains).

---

## 5. Secrets (minimum list)

| Area | Pattern |
|------|---------|
| Cloudflare | `CLOUDFLARE_API_TOKEN`, account ID; Wrangler per package. |
| Zenodo / Forge | `ZENODO_TOKEN` (name may vary by workflow); rotate on exposure. |
| Stripe / Discord / social | Package README + `secrets-index.json` where applicable. |

Never paste tokens into issues, commits, or agent chat; revoke and rotate if exposed.

---

## 6. GitHub Actions and pull requests

**Andromeda** (`p31labs/andromeda`): many workflows use **`on: pull_request`**. Pushes to a branch **do not** substitute for an **open PR** against `main` if that workflow only lists `pull_request`. Keep a PR open (e.g. [**#49**](https://github.com/p31labs/andromeda/pull/49) for `ci/phosphorus31-workflow`) while iterating; merge when required checks are green.

**P31 home** (C.A.R.S. root): add **`git remote add origin <url>`** if missing, push a branch, then **`gh pr create`** so **`.github/workflows/`** runs on PRs to `main`. **Branch protection (GitHub → Settings → Rules):** require status checks **`P31 / root verify`** and **`P31 / full stack`** from workflow **`P31 CI`** (`.github/workflows/p31-ci.yml`) so pushes and PRs to **`main`/`master`** run **`npm run verify`**, then **`p31:all`** with **no duplicate** root verify after the preflight job).

**CLI:** use the **official** GitHub CLI (\`apt install gh\` on Debian). The npm package name **`gh`** is **not** GitHub CLI — uninstall it (\`npm uninstall -g gh\`) if it shadows `/usr/bin/gh`.

---

## 7. Definition of done (summary)

- [ ] **`npm run verify`** green on home root (full checkout).
- [ ] **`npm run release:check`** green when Andromeda + p31ca present.
- [ ] Andromeda: **`ENTERPRISE_QUALITY.md`** checklist and **p31ca-hub** (or declared replacement workflow) green on the PR.
- [ ] No new secrets or PII in diff; children referenced as **S.J. / W.J.** only in public artifacts.
- [ ] If `p31-constants.json` or canon JSON changed: **apply** + **verify** run and committed outputs updated.

---

*Ship boring: green CI, immutable public numbers, secrets outside the repo.*
