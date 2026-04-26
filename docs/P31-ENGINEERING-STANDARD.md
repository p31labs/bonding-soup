# P31 engineering standard

**Status:** normative for this workspace.  
**Last updated:** 2026-04-26

This document is the **single checklist** agents and humans use before calling work “merge-ready” or “shipped.” Package READMEs and WCDs add detail; **this file wins** when a quick rule is needed.

---

## 1. Principles

1. **Machine gates beat prose.** If `npm run verify`, `release:check`, or monorepo CI disagree with chat or a review doc, **fix the code or the doc**—do not ship on narrative alone.
2. **No invented mesh or fleet numbers.** K₄ counts, worker URLs, and LIVE hub data come from **live bindings**, **`p31.ground-truth.json`**, or **generated hub data**—not from memory or stale markdown.
3. **Immutability after publish.** Zenodo DOIs, WCD IDs, and canonical numbering namespaces follow **`docs/CANONICAL-NUMBERING.md`**; corrections are new records/versions, not silent edits.
4. **Secrets never in git.** Tokens live in env, `wrangler secret`, or GitHub Actions secrets only. See **§5**.

---

## 2. Home repository (BONDING Soup root)

Applies to the repo that contains `p31-constants.json`, `cognitive-passport/`, and `scripts/`.

| Gate | Command | When |
|------|---------|------|
| Default CI | **`npm run verify`** | Every change that touches passport, constants, style, egg-hunt, or `src/**/*.ts`. |
| Release | **`npm run release:check`** | Before merge or tag; includes **p31ca** build when `andromeda/04_SOFTWARE/p31ca` exists. |
| Extended | **`npm run validate:full`** | Optional; network + live audits (see `validate-p31-full.sh`). |

**Operator-locked values:** edit **`p31-constants.json`**, then **`npm run apply:constants`** and **`npm run verify:constants`**.

**Universal UI canon:** source **`andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json`** (in a full checkout). Regenerate CSS via **`npm run apply:p31-style`**; verify via **`npm run verify:p31-style`**.

**Cognitive Passport:** after generator edits, **`npm run sync:passport`** then **`npm run verify:passport`**. Do not hand-edit the p31ca mirror.

---

## 3. Andromeda monorepo (`andromeda/`)

When that tree is present, it has its **own** git remote and **production bar** defined in **`andromeda/docs/ENTERPRISE_QUALITY.md`**:

- Root **`pnpm install`**, **`pnpm run quality`**, **`pnpm run build`**, **`pnpm run test`**.
- **p31ca.org** hub: **`p31ca-hub.yml`** / **`npm run hub:ci`** (or equivalent) green before merge.
- **Security:** `npm run security:check` in p31ca per **`docs/SECURITY-RUNBOOK.md`** when touching workers or dependencies.

**Design tokens** are **tracked** under **`04_SOFTWARE/design-tokens/`**; p31ca scripts consume `p31-universal-canon.json`. Do not fork a second canon JSON.

**`docs/files/` (Andromeda):** large binaries (**PDF, docx, tarballs, `mnt/` exports**) are **gitignored**; keep Zenodo PDFs and legal scans **out of git** unless you adopt **Git LFS** explicitly. Tooling (`zenodo_upload.py`, `zenodo_results.json`, `.env.example`) stays tracked.

---

## 4. Launch and operations

- **`docs/ENTERPRISE-LAUNCH-PREP.md`** — secrets rotation, CI merge path, deploy surfaces, post-Zenodo housekeeping.
- **`docs/MVP-DELIVERABLES-INVENTORY.md`** — what is LIVE vs adjacent vs concept (grant-facing).

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

**P31 home** (BONDING Soup root): add **`git remote add origin <url>`** if missing, push a branch, then **`gh pr create`** so **`.github/workflows/`** runs on PRs to `main`.

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
