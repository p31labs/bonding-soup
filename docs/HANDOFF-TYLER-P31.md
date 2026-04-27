# Handoff — Tyler (P31 technical onboarding)

**Purpose:** One place to **open, clone, and verify** the P31 stack without spelunking.  
**Audience:** Tyler — engineering / product context (beta + board-track per **`P31 COGNITIVE PASSPORT — v5.md`** roster).  
**Updated:** 2026-04-26  

**Do not put secrets, tokens, or production keys in email or chat.** Use **1Password / Cloudflare / GitHub** org tooling; rotate if anything leaks.

---

## 1. Live surfaces (click first)

| What | URL | Notes |
|------|-----|--------|
| **Technical hub (Cockpit)** | [https://p31ca.org/](https://p31ca.org/) | Astro hub; product grid, dome, registry-driven |
| **Operator shell (G.O.D.)** | [https://p31ca.org/ops/](https://p31ca.org/ops/) | Glass probes from ecosystem manifest, density dial, edge shift readout; links to local + EPCP |
| **Wye → Delta story** | [https://p31ca.org/delta](https://p31ca.org/delta) | Public narrative; short [https://p31ca.org/why](https://p31ca.org/why) |
| **K₄ mesh navigator** | [https://p31ca.org/connect.html](https://p31ca.org/connect.html) | Three.js cage + satellites |
| **BONDING (molecular)** | [https://bonding.p31ca.org/](https://bonding.p31ca.org/) | Shipped builder + relay |
| **EPCP command center (edge)** | [https://command-center.trimtab-signal.workers.dev/](https://command-center.trimtab-signal.workers.dev/) | Fleet / audit plane; **Cloudflare Access** on sensitive routes |
| **Public machine index** | [https://p31ca.org/p31-public-surface.json](https://p31ca.org/p31-public-surface.json) | Trust pages, endpoints, schema |
| **Creator economy contract** | [https://p31ca.org/creator-economy.json](https://p31ca.org/creator-economy.json) | CI-verified JSON |
| **Org site (parallel)** | [https://phosphorus31.org/](https://phosphorus31.org/) | Separate repo/deploy from p31ca |

**Stripe Checkout (donations)** lives on **`donate-api.phosphorus31.org`** (Worker `donate-api`). There is **no** separate `api.phosphorus31.org` host in fleet until DNS + Worker are deployed.

---

## 2. Source repositories

| Repo | Role | Typical path on disk |
|------|------|----------------------|
| **[p31labs/bonding-soup](https://github.com/p31labs/bonding-soup)** | **P31 home** — `p31-constants.json`, `p31-ecosystem.json`, passport, `scripts/` (verify, glass, local command center) | `~/p31` or `~/bonding-soup` |
| **[p31labs/andromeda](https://github.com/p31labs/andromeda)** | **Monorepo** — `04_SOFTWARE/p31ca` (hub), Workers (k4-*, command-center, donate-api, …) | `~/p31/andromeda` next to home |

**Multi-root:** Home `.gitignore` often excludes **`andromeda/`** and **`phosphorus31.org/`**; they have **separate remotes**. Clone both side by side for full `npm run verify` + hub build.

---

## 3. Operator shell v1.1.0 (merged)

| Item | Link |
|------|------|
| **PR** | [p31labs/andromeda#55](https://github.com/p31labs/andromeda/pull/55) — merged **2026-04-26** — hub **Ops** nav + **G.O.D.** banner, `/ops/` glass **summary** line, CWP **v1.1.0** closure |
| **Deploy** | `p31ca-hub` workflow deploys **Pages** after merge; confirm **`/`** and **`/ops/`** on **p31ca.org** match the PR (allow a few minutes if CI just finished). |

---

## 4. Read order (docs)

1. **[`P31-ROOT-MAP.md`](../P31-ROOT-MAP.md)** — where Soup vs Andromeda vs org site live.  
2. **[`docs/README-REVIEW-DOCS.md`](README-REVIEW-DOCS.md)** — curated index: ship bar, review bundle, Workers supplement, **CWP** pointers, **MVP inventory**.  
3. **[`AGENTS.md`](../AGENTS.md)** — agent rules, **`npm run command-center`**, **`npm run verify`**, mesh, deploy shortcuts.  
4. **Operator UI CWP:** `andromeda/04_SOFTWARE/p31ca/docs/CONTROLLED-WORK-PACKAGE-INTERACTIVE-OPERATOR-UI.md` (`CWP-P31-UI-2026-01`, v1.1.0).  
5. **Command-center deep dive (for implementers):** [`docs/HANDOFF-PROMPT-COMMAND-CENTER.md`](HANDOFF-PROMPT-COMMAND-CENTER.md).  
6. **Edge trust:** `andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`.

---

## 5. Machine truth (no invented URLs)

| File | What it is |
|------|------------|
| **`p31-live-fleet.json`** (home root) | **Bundled live sites + all Workers** (verified mesh URLs, allowlist fleet, hub paths) — hand to collaborators as one JSON |
| **`p31-constants.json`** (home root) | Operator-locked EIN, mesh Worker URLs, payment health URLs, Larmor Hz, paper DOIs |
| **`p31-ecosystem.json`** (home root) | Glass probe list + deployables; templates `{{mesh.*}}`, `{{payment.*}}` |
| **`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`** | Hub routes, redirects contract, canonical numbering slice |

After editing constants: **`npm run apply:constants`** (home) then **`npm run verify:constants`**.

---

## 6. Local dev (Tyler’s machine)

```bash
# 1) Clone both repos (example layout)
mkdir -p ~/p31 && cd ~/p31
git clone https://github.com/p31labs/bonding-soup.git .
git clone https://github.com/p31labs/andromeda.git andromeda

# 2) One-shot setup (Node 20 — see .nvmrc)
npm run setup

# 3) Default gate
npm run verify

# 4) Optional: strict CI parity (mesh + hub build)
node scripts/p31-ci.mjs

# 5) Live probes (needs network)
npm run ecosystem:glass

# 6) Clickable local buttons (whitelisted npm only) — opens http://127.0.0.1:3131
npm run command-center
```

**Hub-only work:** `cd andromeda/04_SOFTWARE/p31ca && npm run hub:ci` (about regen + verify + build + dist check).

---

## 7. “Three command centers” (mental model)

| Layer | Where | What |
|-------|-------|------|
| **Local G.O.D.** | `npm run command-center` → **127.0.0.1:3131** | verify, mesh, ecosystem glass, shift status, monetary, PR helpers — **your laptop only** |
| **Hub shell** | **https://p31ca.org/ops/** | Read-mostly glass table + links; mutations stay on Workers |
| **EPCP** | **command-center…workers.dev** | Fleet, D1, R2, Access-gated operator actions |

---

## 8. Entity (public)

**P31 Labs, Inc.** — Georgia nonprofit corporation; **EIN 42-1888158**; **501(c)(3) determination pending.**  
Marketing copy must stay aligned with **`p31-constants.json`** → `organization`.

---

## 9. Checklist for W.J. before sending Tyler

- [ ] GitHub **org invite** sent (read or triage role as appropriate).  
- [ ] Tyler has link to **this file** (or PDF export of it).  
- [ ] Confirm **#55** merged and **p31ca.org** shows **Ops** + banner (or note “pending deploy”). *External: GitHub + production; not asserted by repo `verify`.*  
- [ ] Optional: **Cloudflare** Access policy if Tyler needs **EPCP** write paths (not required to read glass).  
- [ ] Optional: add Tyler to **Slack/Discord** ops channel if you use one.  

---

## 10. Single paragraph to paste to Tyler

> Start at **https://p31ca.org/** and **https://p31ca.org/ops/**. Technical source is split: **bonding-soup** (home constants + verify scripts) and **andromeda** (p31ca hub + Workers). Read **`docs/HANDOFF-TYLER-P31.md`** in the home repo and follow **`docs/README-REVIEW-DOCS.md`** for the full doc ladder. On your machine: **`npm run setup`** then **`npm run verify`**; use **`npm run command-center`** for one-click checks. Open PR for hub UI: **https://github.com/p31labs/andromeda/pull/55** (merge status in GitHub). No secrets in chat — use org vault.

---

*Maintainer: bump the “Updated” date if URLs, PR id, or fleet facts change.*
