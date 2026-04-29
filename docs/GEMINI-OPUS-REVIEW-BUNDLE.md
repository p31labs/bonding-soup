# P31 workspace — Gemini / Opus review bundle

**Purpose:** One primary document for model or human review of the **P31 home** workspace: multi-root layout, P31 Labs entity status, technical hub (p31ca), automation, edge Workers, and operator/agent conventions.  
**Not:** Legal advice, medical advice, or guaranteed production URLs — see §11.  
**Last updated:** 2026-04-27

**Companion files:** `REVIEW-SUPPLEMENT-A-WORKFLOWS.md`, `REVIEW-SUPPLEMENT-B-WORKERS-AND-PACKAGES.md`, `REVIEW-SUPPLEMENT-C-ECO-CWP-AND-INTEGRATIONS.md`, `MVP-DELIVERABLES-INVENTORY.md` (tiered LIVE/MVP list + grant bullets), `README-REVIEW-DOCS.md` (reading order).

**Architecture spine (same as `AGENTS.md`):** `SIC-POVM-K4-ARCHITECTURE.md`, `AGENTIC-VIBE-INFRASTRUCTURE.md`, `PLAN-KIDS-VIBE-CODING.md`, `EGG-HUNT.md`.

---

## 1. How to use this document (reviewers)

1. Skim **§2–3** (topology and sites).
2. Read **§4** (p31ca hub) if touching hub, ground truth, or passport.
3. Read **§5** (automation) if touching CI, scripts, or deploy.
4. Read **§6** (edge/Workers) if touching Cloudflare packages.
5. Read **§7** (agent rules) before writing code — the Triad matters.
6. Skim **§8** (glossary) for unfamiliar P31 terms.
7. Use **§9** (file index) + **§10** (review checklist) as working references.

---

## 2. Workspace topology (multi-root)

The P31 workspace has two major code locations: **P31 home** (this tree’s root) and the **Andromeda** monorepo checkout. The canonical p31ca source lives at **`andromeda/04_SOFTWARE/p31ca/`**; a `p31ca/` symlink at the home root may or may not exist depending on checkout.

```
/home/p31/                        ← P31 home root
├── .github/workflows/p31-ci.yml  ← home CI
├── scripts/p31-ci.mjs            ← unified CI driver
├── scripts/verify-passport-sync.mjs
├── package.json                  ← root scripts (p31:ci, verify:all, release:check)
├── src/                          ← Bonding Soup (shared TS library)
├── cognitive-passport/           ← passport authoring
├── docs/                         ← this review bundle
├── P31-ROOT-MAP.md
├── AGENTS.md
└── andromeda/                    ← Andromeda monorepo checkout
    └── 04_SOFTWARE/              ← primary software tree
        ├── .github/workflows/    ← Andromeda-level CI
        ├── p31ca/                ← Astro technical hub (p31ca.org)
        ├── bonding/              ← BONDING standalone (SHIPPED March 10)
        ├── k4-cage/              ← K₄ mesh Worker
        ├── cloudflare-worker/     ← EPCP command-center, etc.
        ├── spaceship-earth/        ← Spaceship Earth PWA
        └── ...                    ← other packages (~24+ wrangler surfaces)
```

`phosphorus31.org/` may exist as a **parallel** tree (separate remote per `P31-ROOT-MAP.md`).

**Key rule:** P31 home and Andromeda are often **separate git repos** with different CI and deploy stories. Never assume a file in one is the same as a similarly named file in the other.

---

## 3. Three site tracks (separate deploys)

| Site | Stack | Deploy | Role |
|------|-------|--------|------|
| **p31ca.org** | Astro 5 static | Cloudflare Pages | Technical hub: product catalog, passport mirror, orchestrator, dome |
| **phosphorus31.org** | Astro (separate tree) | Cloudflare Pages | Public-facing narrative site |
| **bonding.p31ca.org** | React + R3F + Zustand + Vitest | Cloudflare Pages (or standalone) | BONDING game — **shipped March 10, 2026** |

**Do not** mix changes across these three in a single PR unless the operator explicitly requests a coordinated release.

---

## 4. p31ca technical hub

### 4.1 Ground truth

`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` is the **canonical machine-readable registry** for the P31 product catalog on p31ca.org. Changes to product metadata, status, or descriptions must stay consistent with this file, `_redirects`, and hub registry rules.

### 4.2 Passport

The Cognitive Passport (**CogPass**, long-form edition **5.1** per H1 in `P31 COGNITIVE PASSPORT — v5.md`; **filename v5** is historical—see **`docs/CANONICAL-NUMBERING.md`**) is the operator context document. It is mirrored from the root into p31ca via `scripts/verify-passport-sync.mjs` (and p31ca `passport:verify`). The passport is the authoritative source for operator identity, family context (children’s initials in public/legal contexts), product inventory, Triad of Cognition, glossary, schedule, and output preferences.

**Hard rule:** Never use submarine, naval, or military metaphors. The operator was a DoD **civilian** engineer, not military.

### 4.3 p31ca scripts (run from `andromeda/04_SOFTWARE/p31ca/`)

| Script | Action |
|--------|--------|
| `npm run verify` | `passport:verify` + `build` (prebuild chain + Astro) |
| `npm run ci` | Alias of `verify` |
| `npm run ci:content` | `generate` + `enrich` + `verify` (see `package.json` for exact `hub:about:*` names) |
| `npm run hub:build` | Regenerates hub-landing and related prebuild chain inputs |
| `npm run hub:verify` | Verify hub integrity |
| `npm run hub:about:generate` | Generate about page content |
| `npm run hub:about:enrich` | Enrich about pages from `hub-landing.json` |

### 4.4 Dual-site architecture

**Dual-site** pattern: `phosphorus31.org` (public narrative) + `p31ca.org` (technical hub). **Stripe Checkout** runs on **`donate-api.phosphorus31.org`** (Worker `donate-api`; pivot from HCB fiscal sponsorship, confirmed unresponsive). No separate **`api.phosphorus31.org`** host is in fleet until deployed.

---

## 5. Automation and CI

### 5.1 `scripts/p31-ci.mjs` (local / release:check driver)

Runs when you use **`npm run release:check`**, **`npm run p31:ci`**, **`npm run verify:all`**, or invoke the script directly. Order:

1. In CI (`CI=true`): **`npm ci`** at repo root (unless `--skip-npm-ci`).
2. **`npm run verify`** at root — **full** home ship bar: `verify:alignment` → `verify:passport` → `verify:constants` → `verify:ecosystem` → `verify:map-pipeline` → `verify:p31-style` → `verify:p31ca-contracts` (skips p31ca-only steps if no tree) → `verify:egg-hunt` → `build:doc-index` → `verify:doc-index` → `build` (`tsc`).  
   - With **`--skip-soup-tsc`**, root runs a **reduced** chain (`verify:passport`, `verify:constants`, `verify:p31ca-contracts`, `verify:egg-hunt` only) — not equivalent to full **`npm run verify`**; avoid for merge gates.
3. Optional **k4-personal** dry-run + **mesh live** when `andromeda/04_SOFTWARE/k4-personal` exists (`MESH_LIVE_STRICT=1` in CI by default).
4. If **`andromeda/04_SOFTWARE/p31ca` exists:** `npm ci` / `npm install` in p31ca, optional **`--content`** (hub about generate/enrich), then **`npm run verify` in p31ca** (prebuild + Astro build), then **`security:check`** in CI unless `--no-security`.

**Flags:** `--content` / `-c`, `--security` / `--skip-soup-tsc` / `--skip-install` / `--install` / `--skip-root-verify` / `--no-security` (see script header).

### 5.2 Root `package.json` scripts (home)

| Script | Action |
|--------|--------|
| `npm run verify` | Full bar — see **§5.1** step 2 (alignment through doc index + `tsc`) |
| `npm run p31:ci` | `p31-ci.mjs` — root verify + p31ca verify/build (+ security in CI) |
| `npm run p31:ci:content` | Same + about generate/enrich |
| `npm run verify:all` | Runs `p31:ci` |
| `npm run release:check` | Same as `p31:ci` |

### 5.3 GitHub Actions — home `.github/workflows/p31-ci.yml`

- **No path filters** — every push/PR to `main`/`master` runs.
- **Job 1 — “P31 / root verify”:** `npm ci` + **`npm run verify`** (same full bar as local — includes doc index, not `p31-ci.mjs` in this job).
- **Job 2 — “P31 / full stack”** (after job 1): **`node scripts/p31-all.mjs`** with `MESH_LIVE_STRICT=1` and preflight so root verify is not duplicated — extended scorecard, mesh, doc-library E2E, p31ca e2e, glass, Semgrep soft, etc. (see `p31-all.mjs` header).
- **`workflow_dispatch`** for manual runs.
- **Andromeda** workflows: see **Supplement A**; **04_SOFTWARE** also has product-specific workflows.

### 5.4 Andromeda workflow highlights

| Workflow | Purpose |
|----------|---------|
| `p31-automation.yml` | PR/push verify + **manual dispatch** deploy toggles |
| `p31ca-hub.yml` | p31ca hub pipeline |
| `monorepo-verify.yml` | Cross-package verification |
| `uptime.yml` | Cron: bonding, phosphorus, bonding-relay |
| `deploy-workers.yml` | Cloudflare Worker deployments |
| `cloudflare-secrets-smoke.yml` | Secrets smoke checks |

### 5.5 Local extended validation (home root)

| Command | Scope |
|---------|--------|
| **`npm run verify`** | Full home bar — **§5.1** step 2 (alignment, passport, constants, ecosystem, MAP, p31-style, p31ca contracts when present, egg-hunt, doc index, `tsc`). |
| **`./validate-p31-full.sh`** | Scorecard: local gates (incl. doc index) **plus** live mesh / operator audits, JSON report under `/tmp/` — needs network for live rows; may fail offline. |

---

## 6. Edge surface (Cloudflare Workers + Pages)

### 6.1 Production fleet (April 2026)

**10 Worker** (plus Pages) production posture described in operator docs: unified telemetry, KV-backed status patterns, shared **spoon** state in product metaphor. Exact bindings are per-`wrangler.toml`.

### 6.2 Key surfaces (illustrative)

| Surface | Role | Notes |
|---------|------|--------|
| **command-center (EPCP)** | Fleet / KPIs / D1 / R2 / panic | Documented in `cloudflare-worker/command-center/` |
| **k4-cage** | K₄ mesh + rooms + telemetry | `k4-cage/src/index.js` |
| **bonding** / relay | BONDING relay | See bonding package + `wcd33` / hub docs |
| **bouncer** | Gate | `BOUNCER_GATE_TOKEN` pattern |
| **genesis-gate** | Governance / telemetry | Worker |
| **p31-agent-hub** | Agent ↔ cage | Service bindings |
| **donate-api** | Monetary | Worker + tests |
| **donate-api.phosphorus31.org** | Stripe Checkout (pivot) | `04_SOFTWARE/donate-api` |
| **telemetry** | Ingest | telemetry-worker, etc. |
| **p31-cortex** | Cortex | Worker package |

**URLs** such as `command-center.trimtab-signal.workers.dev` or `k4-cage.trimtab-signal.workers.dev` are **examples**; verify live DNS and `wrangler.toml` names.

### 6.3 Auth patterns

- **Cloudflare Access:** JWT at edge for sensitive EPCP routes.
- **Bearer:** `ADMIN_TOKEN`, `AUTH_TOKEN`, `INTERNAL_FANOUT_TOKEN`, `BOUNCER_GATE_TOKEN` — per Worker.
- **Service bindings:** inter-Worker on-platform calls.
- **No end-user OAuth2 app** documented as universal across P31 products.

### 6.4 Data strategy (typical)

| Store | Role |
|-------|------|
| **D1** (e.g. `epcp-audit`) | Append-only operator / audit events |
| **KV** | Feature flags, prefs, status, room/spoon patterns |
| **R2** | Forensics, exports, artifacts |
| **Durable Objects** | k4-cage topology + family room patterns |

---

## 7. Agent rules (Triad of Cognition)

### 7.1 Roles (as of April 2026)

| Agent | Role | Allocation | Tagged IN | Tagged OUT |
|-------|------|------------|-----------|------------|
| **Sonnet / Claude Code** | Mechanic | 80% | UI, React, Python, debugging, WCD execution | Architecture, firmware |
| **Gemini** | Narrator | 15% | Grants, narrative, research synthesis | Code implementation |
| **DeepSeek** | Firmware | 4% | ESP32 C/C++, hardware registers | UI, architecture |
| **Opus** | Architect | 1% | QA, architecture, risk audits | Minor coding tasks |
| **KwaiPilot** | Node Zero FW | execution | Node Zero firmware execution | — |

### 7.2 Proven failure modes (as documented by operator)

| Agent | Mode | Description |
|-------|------|-------------|
| Gemini | “Chaplain” | Redirects to wellness/self-care instead of executing the task |
| Opus | Over-intervention | Expands scope, reopens settled architecture |
| Sonnet | Hallucination | Plausible code that doesn’t work — mitigate with tests, patches |

### 7.3 Rules

1. **Stay in your lane** — use the Triad table; tag out if outside “Tagged IN.”
2. **WCD discipline** — material changes to critical systems follow the Master Ops Manual / WCD process.
3. **Execute, don’t narrate** — dense technical directives expect diffs, commands, and minimal prose.
4. **Parking lot** — capture out-of-scope ideas in one line; do not expand scope.
5. **Parallel agents** — read `andromeda/04_SOFTWARE/p31ca/docs/PARALLEL_AGENT_COORDINATION.md` when touching `index.astro` / ground truth.
6. **No submarine/naval/military metaphors** in copy.
7. **Children’s OPSEC** — S.J. / W.J. only in public/legal contexts.

---

## 8. Glossary (operator dialect)

| Term | Meaning |
|------|---------|
| **K₄** | Complete graph on 4 vertices / tetrahedron framing in P31 theory; planar/volumetric framing per Paper IV / operator docs. |
| **Delta topology** | Resilient mesh target. |
| **Wye topology** | Centralized star; legacy pattern. |
| **Ground the floating neutral** | Triangulate truth, code, and law. |
| **Spoons** | Cognitive/physical energy (spoon theory). |
| **L.O.V.E.** | Ledger of Ontological Volume and Entropy — regulation / soulbound economy framing. |
| **Larmor frequency** | **863 Hz** canonical in P31 docs — ³¹P in Earth’s field. |
| **OQE** | Objective Quality Evidence. |
| **WCD** | Work Control Document. |
| **CWP** | Controlled Work Package. |
| **Tag-out** | Agent lockout / lane enforcement. |
| **EPCP** | Edge / Zero Trust control panel — EPCP Worker command surface. |
| **CogPass** | Cognitive Passport long-form; edition **5.1**; machine JSON uses **`p31.cognitivePassport/1.0.0`**. |
| **BONDING** | Shipped Mar 10, 2026; **424 tests / 32 suites** canonical. |
| **Node Zero** | ESP32-S3 + LVGL + QSPI display stack; firmware sprint. |
| **GRAY_ROCK** | Preserved UI skin. |

---

## 9. Key file index

| File | Role |
|------|------|
| `P31-ROOT-MAP.md` | Top-level directory guide |
| `AGENTS.md` | Agent rules |
| `package.json` (root) | `p31:ci`, `verify:all`, `release:check` |
| `scripts/p31-ci.mjs` | Unified CI driver |
| `scripts/verify-passport-sync.mjs` | Passport mirror verification |
| `.github/workflows/p31-ci.yml` | Home root CI |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | Canonical hub registry + `canonicalNumbering` (mirrors `CANONICAL-NUMBERING.md`) |
| `andromeda/04_SOFTWARE/p31ca/package.json` | p31ca scripts |
| `andromeda/04_SOFTWARE/bonding/` | BONDING app (shipped) |
| `andromeda/04_SOFTWARE/p31ca/` | Astro technical hub source |
| `andromeda/04_SOFTWARE/cloudflare-worker/command-center/` | EPCP Worker + reports |
| `andromeda/04_SOFTWARE/k4-cage/` | K₄ mesh Worker |
| `docs/REVIEW-SUPPLEMENT-*.md` | This review set |
| `docs/CANONICAL-NUMBERING.md` | Normative version / ID namespaces |

---

## 10. Review checklist

- [ ] `npm run p31:ci` passes at home root when the full tree is present.
- [ ] `tsc` / package checks clean for the scope you touched.
- [ ] WCD / CWP scope respected.
- [ ] Triad / lane respected.
- [ ] Children’s OPSEC (initials only where required).
- [ ] No submarine/naval/military metaphor copy.
- [ ] Ground truth + hub updated if product status changed.
- [ ] Passport sync verified if passport authoring changed.
- [ ] BONDING test counts: **424 tests / 32 suites** (not ad-hoc numbers from chat).
- [ ] Larmor: **863 Hz** in P31 copy unless a cited exception exists.
- [ ] L.O.V.E. expansion exact when expanded in user-facing text.

---

## 11. Reliability caveats

- **URLs:** `*.workers.dev` / `*.pages.dev` / custom hosts — verify in `wrangler.toml` and live DNS.
- **Legal / medical:** Context only; not advice.
- **Dates:** April 25, 2026 snapshot; confirm hearings, SSA/FERS, and docket with the operator.
- **501(c)(3):** Incorporation and EIN do **not** equal IRS determination; treat grants accordingly.

---

## 12. Current operational state (April 25, 2026)

### 12.1 Entity

P31 Labs, Inc. — Georgia domestic nonprofit (inc. Apr 3, 2026). EIN 42-1888158 (Apr 13, CP 575E). HCB fiscal sponsorship (ref 4XDUXX) unresponsive; **Stripe Checkout** via **`donate-api.phosphorus31.org`** Worker. EIN enables direct 501(c)(3) **application** path; determination is a separate step.

### 12.2 Products (snapshot)

| Product | Status | Notes |
|---------|--------|-------|
| **BONDING** | Shipped Mar 10 | 424/32; relay, R3F, Zustand, etc. per product docs |
| **Node Zero** | Firmware sprint | Waveshare ESP32-S3-Touch-LCD-3.5B; ESP-IDF 5.5.3; LVGL 8.4; AXS15231B QSPI; LoRa on SPI3_HOST pins per validated map; **avoid** Octal PSRAM kill zone (GPIO 33–37) |
| **Buffer** | ~85% | Per operator inventory |
| **Spaceship Earth** | In progress | PWA / dashboard narrative |
| **p31ca.org** | Live | Astro hub |
| **phosphorus31.org** | Live | Public narrative |

### 12.3 Research

**22** Zenodo publications under ORCID 0009-0002-2492-9079: P31 Research Series **I–XX** (20) + **2** standalone legal/public-interest papers. DOIs in **`p31-constants.json`** → `research.papers`; index **`docs/P31-ZENODO-PUBLICATION-REGISTRY.md`**. Paper IV: “Universal Bridge at the Phase Transition” — **10.5281/zenodo.19503542** (Apr 10, 2026). Papers **V–XX** batch **2026-04-26**. Paper XII (Sovereign Stack) **10.5281/zenodo.19782969** (published). Paper I (Tetrahedron / defensive) **10.5281/zenodo.19004485**.

### 12.4 Legal (snapshot)

April 16 contempt context; April 30 wellness baseline; void-order / O.C.G.A. § 9-11-58(b) thread per operator counsel strategy. Pro se in Johnson v. Johnson (2025CV936, Camden County). **Verify** current docket with operator.

### 12.5 FERS / SSA

FERS disability timeline and SF-3112 status per Master Ops / counsel; SSA consultative exams noted complete in operator record — **confirm** on any copy going to government.

### 12.6 Grants (snapshot)

Awesome Foundation $1K submitted; ESG revisited with EIN; other inquiries per operator table in README changelog.

### 12.7 Infrastructure (snapshot)

10-worker Cloudflare production fleet; unified telemetry; KV status patterns; shared spoon state in architecture docs. `ko-fi.com/trimtab69420`, `github.com/p31labs`, `will@p31ca.org`. WCD Batch 3 (WCDs 26–32) closed, `tsc` clean. Master Ops Manual: 1,445 lines, 11 CWPs, 41 WCDs.

---

*End of primary review bundle. See supplements A–C for detailed inventories.*
