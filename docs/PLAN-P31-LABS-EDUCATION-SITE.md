# Plan: P31 Labs — full education site & stack (progressive, security-hardened)

**Status:** **E0 shipped** — static shell on p31ca: **`/education/`** · short **`/learn`**, **`/edu`**, canonical trailing slash via **`/education` → `/education/`**. **Machine proof:** `p31ca` **`npm run verify:ground-truth`** ( `fileSnippets` **`p31Labs.educationE0`**, `p31.labsEducation/0.1.0` in page). **Hub grid:** `id: education` in **`registry.mjs`** + **`hub-app-ids.mjs`**, about **`/education-about.html`**, `registryAppUrlInvariants` in ground-truth; **`hub:verify`** + **`hub:build`** in prebuild.  
**Audience:** operators, architects, and grant reviewers.  
**Normative security bar (hub):** `andromeda/04_SOFTWARE/p31ca/docs/SECURITY-RUNBOOK.md`, `andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`, and root **`docs/P31-ENGINEERING-STANDARD.md`**.  
**Last updated:** 2026-04-27

---

## 1. Purpose & position

| Goal | What “education” means here |
|------|-----------------------------|
| **Public trust** | A clear, accessible front door: what P31 Labs teaches, for whom, and under what safety posture (no dark patterns, age-appropriate copy per **`docs/ETHICAL-STYLE-MAP.md`**, **`docs/PLAN-KIDS-VIBE-CODING.md`** for youth). |
| **Sovereign learning** | **Progressive** in three senses: (1) **phased** releases (MVP → programs → credentials); (2) **progressive enhancement** (read/search works without heavy JS; rich labs enhance); (3) optional **PWA** where it helps (offline reading of public modules only — not for secrets). |
| **Single stack** | Reuse the **p31ca.org** technical hub pattern: static-first **Pages**, **Workers** only when state/auth/API is required, **ground-truth** + **alignment** for URLs and invariants, **CI** that already runs `verify` + `security:check` on the monorepo path. |

**Non-goals in v1:** A generic LMS (Canvas-class), third-party “learning cloud” that holds learner PII without a BAA-style story, or training models on user content. If AI tutoring appears later, it must align with the **edge/personal** boundaries in **`k4-personal`**, not anonymous public scrapers (see **§7**).

---

## 2. Information architecture (site map)

Work top-down; each level gets a **route contract** in **`p31.ground-truth.json`** and/or **`_redirects`** when it ships (same pattern as existing hub products).

| Tier | Example routes (illustrative) | Content | Auth |
|------|------------------------------|---------|------|
| **A — Discover** | `/education`, `/education/about`, `/education/ethics` | Mission, program overview, **non-technical** parent FAQ, link to 501(c)(3) / transparency pages as applicable | Public |
| **B — Catalog** | `/education/tracks/*`, `/education/modules/*` | Syllabi, learning objectives, prerequisite graph, “what you need installed” (local-first) | Public read |
| **C — Labs (static)** | `/education/labs/*` | Copy-pasteable exercises, checklists, links to **local** tools (passport, doc library, mesh-start dev links) | Public |
| **D — Gated (optional later)** | `/education/portal/*` | Progress, optional certificates, org cohorts | **WebAuthn / passkey** path already documented (`workers/passkey/`) or external IdP only if policy allows |
| **E — Community mesh** (adjacent) | Not “the course site” — deep links to **`planetary-onboard`**, **`mesh-start`**, **`k4-personal`** for **personal** agent scope (see **`docs/MESH-MAP-PERSONAL-START-PAGES.md`**) | Youth flows per **`docs/PLAN-KIDS-VIBE-CODING.md`** | CORS + isolate — **not** the same as public course HTML |

**Rule:** public education HTML **never** embeds long-lived API keys, cage secrets, or payment keys. Donor flows stay on existing **MAP / donate** surface (`verify:map-pipeline`).

---

## 3. Phased program (product, not just tech)

| Phase | Ship bar | Outcomes |
|------|----------|----------|
| **E0 — Foundation** | Static Pages only; new routes in **ground-truth** + about-page generation if in hub registry; **`npm run hub:ci`** + **`security:check`** | Launch `/education` shell + 3–5 “pillar” pages, PDF/download policy aligned with Andromeda **`docs/files/`** large-binary rule |
| **E1 — Catalog + search** | Home **`build:doc-index`** pattern **or** lightweight client index for `education/**` MDX/markdown; **`verify:alignment`** if new source rows | Browsable tracks, no accounts |
| **E2 — Labs** | Reuse **P31 style** + canon (`apply:p31-style`); a11y pass on components | Interactive checklists, embed Geodesic / hub links as **optional** |
| **E3 — Identity (optional)** | New Worker = **new `worker-allowlist` row** + `security:workers`; D1/KV as per passkey or new service | Cohort sign-in, progress — **only** with written data retention + COPPA/GDPR story for youth |
| **E4 — Partner / org** | Separate from “family mesh” unless contractually explicit | Branded subpaths or R2 + signed URLs for materials |

---

## 4. Stack (technical)

### 4.1 Delivery

| Layer | Choice | Why |
|-------|--------|-----|
| **Site** | **p31ca** `dist/` on **Cloudflare Pages** (existing pipeline) | Same headers story as **`EDGE-SECURITY`**, one deploy path |
| **App framework** | **Astro** (already p31ca) for new pages; static HTML in **`public/`** for thin pages if faster | Consistent with hub; static output |
| **Style** | **`p31-universal-canon.json`** + **`data-p31-appearance` hub** (and **`org`** if education needs org “light” on a subdomain) | No second design system |
| **Content** | MD/MDX in repo or small JSON (like **geodesic-campaign** pattern) with **verifiers** in CI | “Machine gates beat prose” per engineering standard |

### 4.2 When you need a Worker

| Capability | Pattern | Security hook |
|------------|---------|-----------------|
| Passkeys / login | **`workers/passkey/`** (extend) or new Worker with **separate** `wrangler` | **Allowlist** + CORS in **`security:workers`**; no wildcard credentialed CORS |
| Progress / quiz scores | D1 or DO (same as other DO patterns) | Rate limits, auth, no PII in static logs |
| File drops (zips) | **R2** + signed URL from Worker | No public R2 list; virus-scan policy in runbook for operator uploads only |

### 4.3 What stays **out** of the hot path

- **No** raw Stripe keys in static education pages — use existing donate/creator economy contracts if payments appear.
- **No** new “second ground truth” — extend **`p31.ground-truth.json`** for routes (`docs/P31-ALIGNMENT-SYSTEM.md` + **`p31ca` ground truth rule**).

---

## 5. P31 security protocols — explicit mapping

This table ties **education** work to **existing** commands and files. Nothing here replaces **`npm run security:check`** in **p31ca** for worker or dependency work.

| Protocol / control | Where it lives | Education site obligation |
|-------------------|----------------|----------------------------|
| **Dependency SCA** | `npm run security:audit` / `security:check` with suppressions in **`security/audit-suppressions.json`** | Any new `npm` deps for content tooling go through the same triage. |
| **Worker inventory** | `security:workers` → `build/security-inventory.json` (gitignored) | **Every** new Worker = **row in `security/worker-allowlist.json`** with auth + CORS notes. |
| **PQC / crypto surface** | `security:crypto` (quantum-core + passkey checks) | If education adds crypto (tokens, W3C, WebCrypto), do not bypass tests. |
| **Static headers** | `public/_headers` | Education routes inherit; do not weaken **X-Frame-Options** / **nosniff** for embed convenience without review. |
| **CSP** | Documented P2 in **EDGE-SECURITY** | New inline scripts in education = move toward build-time bundles or document CSP exception. |
| **Secrets** | `wrangler secret`, CI secrets only | No curriculum keys in git; see **P31-ENGINEERING-STANDARD §5**. |
| **SAST** | `p31-security.yml` Semgrep (report-only) + optional **security:lint** | Fix high findings on new auth paths. |
| **MAP / monetary** | `verify:map-pipeline` | If education sells seats or takes certification fees, same monetary hooks as other surfaces — **not** a separate “shadow” flow. |
| **Mesh URLs** | `p31-constants.json` + **`verify:ecosystem`** | “Try the mesh” links use **live** allowlisted URLs, not hand-pasted production URLs. |

**Release posture (production cut):** Prefer **`npm run release:public`** (root) when the education slice ships with hub changes — that chain includes **hub:ci** and **`security:check`**, matching **`P31-ENGINEERING-STANDARD`**.

---

## 6. Alignment & verify (home + monorepo)

| Artefact | Action when education becomes a “source of truth” |
|----------|---------------------------------------------------|
| **`p31-alignment.json`** | Add a **source** (e.g. `education-curriculum-manifest`) and **derivations** (e.g. generated index JSON, nav JSON). |
| **Root `npm run verify`** | Add a **`verify:education`** (or fold into `verify:p31ca-contracts`) that checks manifests + no forbidden paths, **or** keep everything inside p31ca and rely on `hub:ci`. |
| **Docs index** | If curriculum lives in `docs/`, the existing **`build:doc-index`** allowlist or manifest may need extending (`docs/doc-index.manifest.json`). |

---

## 7. Age, privacy, and “progressive” trust

- **Youth:** Follow **`PLAN-KIDS-VIBE-CODING`**: local-first code, **k4-personal** for the intended private channel; education **pages** are public and must not guilt or nag (ETHICAL-STYLE-MAP).  
- **COPPA / guardian consent:** Any U13-style flow needs legal review first — E0–E2 stay **no accounts**.  
- **“Progressive” UX:** Read-only catalog without JS; enhanced search and optional logged-in path later.  
- **AI:** If copy suggests AI tutors, name the **boundary** (local editor vs. mesh DO vs. public chat) to avoid a trust mismatch.

---

## 8. Definition of done (first education milestone)

1. **Routes** in **ground-truth** + `verify:ground-truth` green.  
2. **Hub** build: **`npm run hub:ci`** in p31ca.  
3. **Security:** **`npm run security:check`** in p31ca (triage P1 inventory warnings).  
4. **No secrets** in public trees; MAP unchanged or updated via **`verify:map-pipeline`**.  
5. **Style:** **`verify:p31-style`**; appearance tokens consistent with canon.  
6. **Content:** At least one **machine-checked** manifest (curriculum or nav) if you claim “versioned” curriculum.

---

## 9. Related docs (read in order)

| Order | Document |
|-------|----------|
| 1 | **`docs/P31-ENGINEERING-STANDARD.md`** — ship bar |
| 2 | **`andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`** — trust boundary |
| 3 | **`andromeda/04_SOFTWARE/p31ca/docs/SECURITY-RUNBOOK.md`** — operations |
| 4 | **`docs/P31-ALIGNMENT-SYSTEM.md`** + **`p31-alignment.json`** — ephemeralization |
| 5 | **`docs/PLAN-KIDS-VIBE-CODING.md`**, **`docs/ETHICAL-STYLE-MAP.md`** — audience + UI ethics |
| 6 | **`docs/ECOSYSTEM-PRODUCTION-11.md`** — fleet-level deploy and glass |

---

**Done (E0, 2026-04-27):** `public/education/index.html`, **`routes.p31LabsEducation`**, **`_redirects` + `edgeRedirects`**, **fileSnippet** in ground-truth, **alignment** source + derivation in **`p31-alignment.json`**. Live: **`https://p31ca.org/education/`** (after next Pages deploy).  
**Next step (E1+):** expand static catalog (still no Worker), or add search/index for `education/**` content. Any Worker → **allowlist** + **`security:check`**.
