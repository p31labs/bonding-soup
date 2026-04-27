# P31 mission system — final deliverable (prep & assemble)

**Index note:** This file is the **operator-facing assembly sheet**; machine proofs remain **`p31-alignment.json`**, **`npm run verify`**, p31ca **`ground-truth`**, and public **`/creator-economy.json`**.

**Chosen deliverable (this file):** one **handoff + manifest** for the **mission system** — *build, create, connect*; *organize, scale* — grounded in **ephemeralization** and **ethical monetization**, plus **mobile browser mesh** (TLS, safe areas, PWA **links** not app-store walls), a **reproducible green bar**, and a **single URL index** (fleet portal). Everything else in-repo **links from here**; it does not replace the normative source documents.

**Status:** Living document; `pathsMustExist` in **`p31-facts.json`**. Re-run **`npm run build:doc-index`** after meaningful edits (ship bar).

---

## 1. What you get (outcomes)

| Outcome | Where |
|--------|--------|
| Mission + economics **intent** (keystone) | **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`** |
| **Map** of trees (where to edit) | **`P31-ROOT-MAP.md`** |
| **Alignment** (sources → derivations → verify) | **`p31-alignment.json`**, **`docs/P31-ALIGNMENT-SYSTEM.md`** |
| **All live app/page URLs** in one static page | **`fleet-portal.html`** ( **`npm run build:fleet-portal`** ); hub **`/fleet-portal`**, **ground-truth** `routes.fleetPortal` |
| **Ethical money** (CI) | p31ca **`ground-truth/creator-economy.json`**, public **`/creator-economy.json`**, **`verify:economy`** |
| **Agent / operator** on-ramp | **`AGENTS.md`**, **`docs/P31-PERSONAL-HOW-TO.md`** (HTML: **`p31-personal-howto.html`**) |
| **Search** over `docs/*.md` | **`docs/doc-library/index.html`**, **`build:doc-index`** |
| **Scaling / cadence** (Soup) | **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`**, **`docs/SOUP-ROOM-SCALE-RUNBOOK.md`**, **`npm run soup:room-scale`** |
| **Scale & PWA pack** (assembled drop) | **`docs/DELIVERABLE-BONDING-HOME-SCALE-PACK.md`** — manifest + proof for PWA icons/manifest, entry parity, room gate |
| **Mobile browser mesh (phone-first path)** | **`p31-universal-canon.json`** (`mobileMeshFirst`); **`p31-style-generate.mjs`** → **`p31-mesh-m-first`**, **`p31-mesh-tap`**. **p31ca:** `BaseLayout.astro`, `apply:mesh-m-first`, `apply:pwa-manifest`, **`/p31-mesh.webmanifest`**. **BONDING:** `apply:mesh-m-first:home`, `apply:pwa:home`, **`p31-bonding.webmanifest`**. |
| **Mission copy (hub + EBC)** | **`p31ca/src/data/p31-mission-trio.json`** → **`sync-connect-mission-ebc.mjs`** → static footers; **`verify-mission-trio`**. |
| **Production + monetary** (glass / fleet) | **`docs/ECOSYSTEM-PRODUCTION-11.md`**, **`p31-ecosystem.json`**, **`p31-live-fleet.json`** |

---

## 2. Prep (read & clone order)

1. **`AGENTS.md`** — rules, `verify` chain, 1b mission (create / connect / scale / organize), doc-library, hub pointers.
2. **`P31-ROOT-MAP.md`** — which directory for which change (home vs `andromeda` vs p31ca).
3. **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`** — keystone table, §6 Scale, §7 Organize.
4. **`docs/P31-ENGINEERING-STANDARD.md`** — definition of done (shippable work).
5. If touching money or URLs: **`p31-constants.json`**, **`p31.ground-truth`**, then **`apply:constants`** / **`verify`**.

**New machine:** from repo root **`npm run setup`** (see **`README.md`**) and optional **`npm run git:hooks`**.

---

## 3. Assemble (ordered commands)

Run at **repo root** unless noted.

```bash
# A. Full ship bar (home) — default “done” for this deliverable
npm run verify
```

**p31ca only (andromeda checkout):** when you change `public/*.html` generators, mission JSON, or hub registry, align static HTML and hub CI:

```bash
cd andromeda/04_SOFTWARE/p31ca
npm run hub:ci
# = hub:about:generate + apply:mesh-m-first + apply:pwa-manifest + verify
```

**BONDING home statics** (soup, doc-library shell, etc.) after path or manifest policy edits:

```bash
npm run apply:mesh-m-first:home
npm run apply:pwa:home
```

**Cognitive Passport** after editing `cognitive-passport/index.html` (keeps p31ca mirror + manifest transform):

```bash
npm run sync:passport
npm run verify:passport
```

**If andromeda + p31ca are present and you need hub parity + security:**

```bash
npm run polish
# or, minimal hub sync without full polish:
# npm run build:fleet-portal
# npm run build:doc-index
# (then sync doc-library to p31ca per AGENTS, if you publish the hub)
```

**Generated artefacts you should not hand-edit without also updating sources:**

- **`fleet-portal.html`** — regenerate: **`npm run build:fleet-portal`**
- **`docs/doc-library/index.json`** — **`npm run build:doc-index`**
- p31ca **`public/fleet-portal.html`** — produced by **polish** (CSS href rewrite) or manual copy per **`scripts/p31-polish.mjs`**

---

## 4. Definition of done (this deliverable)

- [ ] **`npm run verify:facts`** passes (includes this path when listed in **`p31-facts.json`** `pathsMustExist`).
- [ ] **`npm run verify:alignment`** passes.
- [ ] **`npm run verify`** passes (or your CI-equivalent: **`P31/ root verify` + `P31/ full stack`** with mesh strict as needed).
- [ ] **`npm run build:doc-index`** and **`npm run verify:doc-index`** pass after any doc that feeds the index changes.
- [ ] **`npm run build:fleet-portal`** run when **`p31-live-fleet.json`**, **`p31-ecosystem.json`**, or **`p31-constants.json`** change meaningfully; hub copy updated before hub deploy.
- [ ] If economics change: **`creator-economy.json`** ground-truth + public mirror, **`verify:economy`** in p31ca, **`verify:monetary`** at home; **30-day notice** per contract if you move versioned invariants.
- [ ] If mission copy or EBC footers: edit **`p31-mission-trio.json`**, run **`sync-connect-mission-ebc.mjs`**, then **`verify-mission-trio`** (p31ca prebuild includes these when the tree is full).
- [ ] If mobile/PWA statics: p31ca **`prebuild`** runs **`apply:mesh-m-first`** and **`ensure-pwa-manifest-link`**; home uses **`apply:mesh-m-first:home`** and **`apply:pwa:home`** (also chained in **`npm run polish`** after **`apply:constants`**).

---

## 5. One-line pitch

**P31 mission system (delivered):** *Create* with one source and verify; *connect* mesh and public contracts (including **`transparency.missionLink`** in **`/creator-economy.json`**); *organize* with map + alignment + index; *scale* without duplicate lore or silent economics; *monetize* only under a **public, CI-verified** creator-economy contract and **ethical** UI. **Phone web** gets first-class safe areas, tap targets, and optional PWA **manifest** — no app-store wall.

---

## See also

| Doc | Role |
|-----|------|
| **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`** | Full mission keystone (§6 Scale, §7 Organize) |
| **`docs/ETHICAL-STYLE-MAP.md`** | UI / pay / rewards ethics |
| **`README.md`**, **`docs/P31-ENGINEERING-STANDARD.md`** | Setup + done-ness |
