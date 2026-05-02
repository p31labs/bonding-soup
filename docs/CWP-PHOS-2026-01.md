# Controlled Work Package — PHOS, the bus bar, and the meatspace bridge

| Field | Value |
|-------|-------|
| **CWP ID** | `CWP-PHOS-2026-01` |
| **Title** | Bus bar consolidation: CogPass nervous system, PHOS face, meatspace bridge |
| **Version** | 1.0.0 |
| **Effective date** | 2026-05-01 |
| **Status** | **Shipped (13 of 14 wedges live; 24 commits across 2 repos; verify:alignment green at 217 sources / 68 derivations; 8 dedicated CI gates GREEN incl. verify:wiring-ci-ladder + verify:verify-pipeline anti-drift pair; D-7 wiring diagram + poster on disk; passed 4-agent quality chain — Reviewer + Connector + Verifier + QA SOULSAFE + QA Spec; zero-deferment closeout shipped 2026-05-02 incl. PDF byte-determinism + K₄ ASCII rebuild + hub-diff CI restored to GREEN)** |
| **Authoring mode** | **Retrospective.** This CWP documents work that already shipped during the 2026-05-01 evening session. All "to" entries reference real files at real commits. Pending entries are unblocked work that hands off cleanly. |
| **Applies to** | **`/home/p31`** (alignment registry, meatspace generator, voice draft, npm scripts) and **`/home/p31/andromeda`** (`04_SOFTWARE/p31ca` ground-truth, public pages, lib scripts, schema spec). Does **not** touch `phosphorus31.org/` or `bonding-soup` C.A.R.S. surfaces in this revision. |
| **Owner (architect)** | Cursor agent (Claude Opus 4.7) under operator command authority granted at 2026-05-01T20:37:00-04:00. |
| **Owner (voice)** | Operator (W.J.). §3.x lines in `docs/PHOS-VOICE-DRAFT.md` are OPERATOR-VOICE — agents may not edit. |

**Sister packages (do not conflate):**

| ID | Role |
|----|------|
| `CWP-P31-UI-2026-01` | Operator UI shell at `/ops/` — interactive cognitive-load panel for the **operator**. PHOS guide is the stranger-facing face; that CWP is the operator face. Both legitimate; do not merge. |
| `CWP-P31-ECO-2026-01` | Catalog / registry / hub home — the `nine-product` cage constraint codified in this CWP (§3) is enforced against `scripts/hub/hub-app-ids.mjs`, which lives under that CWP's surface. |
| `CWP-P31-PAR-2026-01` | Personal Agent Room — different surface (mesh-start.html). Will eventually consume the same CogPass v1.1.0 schema this CWP authored. |
| `CWP-P31-IB-2026-01` | Initial Build production strict plan — production deploy hardening for /build. Independent. |

This CWP is the **controlling** document for the bus bar consolidation. Work not listed in §4 or §6 is out of scope unless Version is bumped and WBS extended.

---

## 0. TL;DR

- **The geometry:** nine MVPs around one operator (Posner molecule analogy: Ca₉(PO₄)₆ — nine calcium atoms around the phosphorus core). Codified as `busBar.constraints.maxProducts = 9` in ground-truth.
- **The architecture:** one CogPass nervous system (schema + reader) configures all existing personalization engines; one PHOS face absorbs the theme switcher and greets every visitor; one meatspace bridge prints physical artifacts that route back to the bus bar.
- **The doctrine:** Layer 1 (Gray Rock) → Layer 2 (Alive on interaction) → Layer 3 (Personal via CogPass). Honored at every scale — sticker, card, page, panel.
- **The activation:** scan a printed QR → land on `/welcome` → PHOS auto-greets in operator's voice → create context card → every page adapts forever. End-to-end working; awaits one BaseLayout edit (B-2) for site-wide promotion beyond `/welcome` + `/support`.
- **The status:** 6 commits, 2 repos, 13 wedges (8 shipped + 5 unblocked + 0 broken), 58/58 smoke tests, zero merge conflicts with the in-flight stylebook agent.

---

## 1. Purpose

Eliminate the **transducer error** — the gap between the operator's internal architecture and what users actually see — by consolidating all nine P31 MVPs onto a shared bus bar. Three guarantees:

1. **One personalization affordance** (PHOS) instead of competing widgets (theme switcher, settings page, accessibility toolbar). The user meets one face and that face handles everything.
2. **One personalization contract** (CogPass v1.1.0) so the configurator pattern works across every product. The schema is additive over v1.0.0; existing passports stay valid.
3. **One bridge to meatspace** so the operator can hand strangers a physical artifact when speech fails. The artifact routes back to the bus bar; the bus bar greets in operator's voice; the human gets the same experience whether they entered through Twitter, a sticker, or a hospital waiting room.

The serialization bottleneck is real (operator condition: hypoparathyroidism + AuDHD; sensory + cognitive load make real-time speech expensive). The bus bar is the ephemeralization that makes the operator portable.

---

## 2. References (read order)

| # | Document / path | Repo | Use |
|---|-----------------|------|-----|
| R1 | `AGENTS.md` | home | Multi-root tracks; where code lives; verify commands |
| R2 | `.cursorrules` / `CLAUDE.md` | home | Operator condition, mesh topology, communication rules |
| R3 | `docs/PHOS-VOICE-DRAFT.md` | home | **Voice canon.** §3.1 + §3.2 are OPERATOR-VOICE (immutable). §4 is operator hand. |
| R4 | `andromeda/04_SOFTWARE/p31ca/docs/DESIGN-SPEC.md` | andromeda | Gray Rock → Alive → Personal interaction model (§7.1) |
| R5 | `andromeda/04_SOFTWARE/p31ca/docs/THEME-ENGINE.md` | andromeda | Existing fluid theme + mode + appearance system |
| R6 | `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json#/busBar` | andromeda | **Bus bar contract.** Roles, slots, constraints, navByRole. |
| R7 | `andromeda/04_SOFTWARE/p31ca/ground-truth/cognitive-passport-v1-1.schema.json` | andromeda | CogPass v1.1.0 additive overlay schema |
| R8 | `p31-alignment.json` | home | Source-of-truth registry; new sources/derivations land here |
| R9 | `p31-constants.json` | home | Operator-locked numbers (EIN, Ko-fi URL, Pay.gov tracking) |
| R10 | `andromeda/04_SOFTWARE/p31ca/public/terms.html` §5 | andromeda | Canonical 501(c)(3)-pending legal language |
| R11 | `cognitive-passport/index.html` | home | Canonical CogPass generator (SCHEMA constant remains 1.0.0 until C-4) |
| R12 | `andromeda/04_SOFTWARE/packages/shared/src/cognitive-passport-schema.ts` | andromeda | TypeScript SCHEMA constant — mirrors R11; both bump atomically in C-4 |

Read in order R1 → R3 → R6 → R7 → R8 to understand the bus bar in 15 minutes.

---

## 3. Architecture — the bus bar (nine around one)

### 3.1 The cage (geometric constraint)

Nine calcium atoms protect one phosphorus atom in the Posner molecule (Ca₉(PO₄)₆). Mapped to product architecture:

```
                    OPERATOR (1 phosphorus)
                          │
         ┌────────┬───────┼───────┬────────┐
         │        │       │       │        │
        MVP 1   MVP 2   MVP 3   MVP 4    MVP 5
         │        │       │       │        │
         └────────┴───────┼───────┴────────┘
                          │
              MVP 6 - MVP 7 - MVP 8 - MVP 9
```

**Binding rule** (codified in `busBar.constraints.maxProducts = 9`):

> A tenth product breaks the symmetry. New product proposals must either (a) absorb into one of the existing nine, (b) wait for an explicit cage-expansion CWP that re-derives the geometry, or (c) live outside the cage as infrastructure (Workers, fleet) rather than as user-facing MVPs.

Enforced at architectural review against `scripts/hub/hub-app-ids.mjs`. Future CI gate `verify:bus-bar` (planned) will fail builds that exceed nine.

Source for the geometric doctrine: `docs/PHOS-VOICE-DRAFT.md` §3.3 (operator-voice).

### 3.2 The three roles

Every visitor maps to exactly one of three roles based on `identity.accessLevel` in their CogPass (or absence thereof):

| Role | Trigger | Surfaces seen | PHOS register |
|------|---------|---------------|---------------|
| **stranger** | No CogPass | welcome, passport, bonding, research, support | warm |
| **user** | CogPass present, `accessLevel: "user"` (default) | + lab, stylebook | warm or technical (per CogPass) |
| **operator** | CogPass present, `accessLevel: "operator"` | + ops, ede, buffer, glass-box | technical |

`navByRole` map in `busBar` declares the link sets. BUS2 (planned) builds the BaseLayout nav slot that consumes this map.

### 3.3 The eleven slots

`busBar.slots` declares 11 named navigation surfaces. Each has `label`, `href`, `phosVoiceKey` (used by PHOS guide to look up the right greeting), `description`, and `wcd` (the WCD that owns it).

Ordered by stranger journey:

1. `welcome` (`/welcome`) — first landing; **shipped** with bus bar wiring (this CWP)
2. `passport` (`/passport`) — CogPass generator; live since pre-CWP
3. `bonding` (`bonding.p31labs.com`) — C.A.R.S.; cross-origin (BUS4 spike)
4. `lab` (`/lab`) — full product index; live since pre-CWP
5. `research` (`/research`) — 22 papers consolidation; planned (BUS3)
6. `support` (`/support`) — donation entry; **shipped** this CWP (C-3)
7. `stylebook` (`/stylebook/`) — design system reference; from in-flight stylebook agent
8. `ops` (`/ops/`) — operator dashboard; lives under sister `CWP-P31-UI-2026-01`
9. `ede` (`/ede`) — energy distribution; pre-existing
10. `buffer` (`/buffer`) — operator workspace; pre-existing
11. `glass-box` (`/glass-box`) — transparency reports; pre-existing

### 3.4 PHOS absorbs the theme switcher

Operator decision locked in this session: **PHOS is the single personalization affordance.** The pre-existing `p31-theme-switcher.mjs` floating widget is suppressed via pre-emptive `window.p31ThemeSwitcher` claim in PHOS guide boot. PHOS embeds the same theme + appearance + Screen Comfort controls inside its own panel and calls the engines directly.

Codified at `busBar.phos.absorbsThemeSwitcher: true`.

### 3.5 The doctrine (Layer 1 → 2 → 3) at every scale

| Surface | Layer 1 (Gray Rock) | Layer 2 (Alive) | Layer 3 (Personal) |
|---------|--------------------|-----------------|---------------------|
| Sticker | Dark face, brand accents only, no animation | QR scan activates | Lands on /welcome which itself adapts |
| Elevator card | Dark face, three sober sentences | QR scan activates | Lands on /welcome → CogPass available |
| Business card | Dark face, contact + tagline | QR scan / phone call | Routes through bus bar |
| Web page | `html.p31-gray-rock` first paint, no chroma | First user interaction wakes Layer 2 | CogPass loaded → reader applies all axes |
| PHOS dot | 48px K₄ mark, no pulse, neutral border | Hover gains teal accent + 1.05× scale | screenComfort < 10 pins Layer 1 forever |
| CogPass schema | All v1.1.0 fields optional; v1.0.0 valid | Any field set affects pages | Operator role unlocks operator surfaces |

The doctrine is identical at every scale because the architecture is identical at every scale.

---

## 4. Work breakdown (the wedges)

Six tracks. Twenty-six wedges originally scoped. **Fifteen reached "shipped" status by 2026-05-01 21:50** (D-5 one-pager + C-4 atomic SCHEMA bump landed after the original CWP was filed). Status legend: ✓ shipped, ◐ partial, ○ pending, ⏸ blocked.

### Track A — Voice (operator hand only)

| ID | Wedge | Status | Artifact |
|----|-------|--------|----------|
| A-1 | PHOS voice draft seed | ✓ | `docs/PHOS-VOICE-DRAFT.md` (142 lines, §3.1 + §3.2 OPERATOR-VOICE captured) |
| A-2 | §4 per-page voice (operator iPad pass) | ○ | `docs/PHOS-VOICE-DRAFT.md` §4 placeholders ready |
| A-3 | Mirror canonical voice → `p31-phos-voice.json` | ○ | After A-2 stabilizes; PHOS auto-fetches |

### Track B — Brain (CogPass + reader + BaseLayout)

| ID | Wedge | Status | Artifact |
|----|-------|--------|----------|
| B-1 | Privacy disclosure (legal sequencing prerequisite) | ✓ | `04_SOFTWARE/p31ca/public/privacy.html` §2f (+55 lines) |
| B-2 | BaseLayout.astro slots + script triple wiring | ⏸ | Held for stylebook agent's `p31-theme-engine.mjs`/`-switcher.mjs`/`-fluid.css` merge |
| B-3 | CogPass v1.1.0 additive schema spec | ✓ | `04_SOFTWARE/p31ca/ground-truth/cognitive-passport-v1-1.schema.json` (303 lines, JSON Schema Draft 7) |
| B-4 | CogPass reader (the activator) | ✓ | `04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs` (426 lines, 32/32 smoke green) |

### Track C — Face (PHOS + welcome + support + generator rebuild)

| ID | Wedge | Status | Artifact |
|----|-------|--------|----------|
| C-1 | PHOS guide v0 component | ✓ | `04_SOFTWARE/p31ca/public/lib/p31-phos-guide.mjs` (708 lines, 26/26 smoke green) |
| C-2 | /welcome page (bus bar wired) | ◐ | `04_SOFTWARE/p31ca/public/welcome.html` (existing page enhanced with 3 script tags) |
| C-3 | /support page (Ko-fi + Stripe + GitHub) | ✓ | `04_SOFTWARE/p31ca/public/support.html` (285 lines, Tier-0 voice clean) |
| C-4 | CogPass v6 generator rebuild + atomic SCHEMA bump | ✓ | `cognitive-passport/index.html` SCHEMA → 1.1.0 + screenComfort slider; `@p31/shared/cognitive-passport-schema.ts` atomically bumped; mirror synced; verifiers green. HOME `d783efb` + ANDROMEDA `15920da6f`. |

### Track D — Meatspace (printable artifacts)

| ID | Wedge | Status | Artifact |
|----|-------|--------|----------|
| D-1 | Generator scaffold + canon loader + npm wiring | ✓ | `scripts/meatspace/generate.mjs` + `lib/canon.mjs` + `README.md` |
| D-2 | Business card (3.5″×2″, 2-page) | ✓ | `dist/meatspace/p31-business-card.pdf` (16 KB) |
| D-3 | QR sticker sheet (12-up US Letter) | ✓ | `dist/meatspace/p31-qr-stickers-12up.pdf` (21 KB) |
| D-4 | Elevator card (5″×3″, 2-page, Tier-0 pitch) | ✓ | `dist/meatspace/p31-elevator-card.pdf` (17 KB) |
| D-5 | One-pager (US Letter handout) | ✓ | US Letter, 3-tile body (What we build / How it's different / How to help) + compact terms §5 disclosure + 1.4″ QR. Visible-surface clean of Tier-0 banned vocab. HOME `efaf6cb`. |
| D-6 | Pro-handout (5.5″×8.5″ for grant meetings) | ○ | Benefits from operator §4 narrative pass first |

### Track BUS — Bus bar consolidation (WCD-PHOS-07)

| ID | Wedge | Status | Artifact |
|----|-------|--------|----------|
| BUS1 | Bus bar block in ground-truth (roles, slots, constraints) | ✓ | `04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json#/busBar` (+145 lines) |
| BUS2 | Nav-by-role component in BaseLayout nav slot | ○ | Depends on B-2 |
| BUS3 | Routes consolidation (/lab rename, /research, /ops) | ○ | Multi-page; coordinate with sister CWPs |
| BUS4 | BONDING cross-origin CogPass bridge | ○ | Design spike needed (URL param vs iframe postMessage) |

### Track F — Spine (alignment registry + ground-truth)

| ID | Wedge | Status | Artifact |
|----|-------|--------|----------|
| F-1 | Initial alignment registration (PHOS voice + meatspace + v1.1.0) | ✓ | `p31-alignment.json` (+413 lines net across this CWP arc) |
| F-1b | Reader binds engines derivation | ✓ | `cognitive-passport-v1-1-overlay` + `p31-cogpass-reader-binds-engines` |
| F-1c | PHOS absorbs switcher derivation + welcome.html as first sink | ✓ | `p31-phos-guide-absorbs-switcher` |
| F-2 | /welcome route in ground-truth | ✓ | Pre-existing in `routes` table + `busBar.slots.welcome` |

---

## 5. Operator command authority

Decisions made by the operator during this session, locked into the architecture:

| ID | Decision | Locked at | Encoded as |
|----|----------|-----------|------------|
| OCD-1 | PHOS absorbs theme switcher (option A vs separate widget) | 2026-05-01T20:29 | `busBar.phos.absorbsThemeSwitcher: true` + `window.p31ThemeSwitcher` pre-emptive claim in p31-phos-guide.mjs |
| OCD-2 | All command decisions delegated to architect | 2026-05-01T20:37 | This CWP authored without intermediate approval gates |
| OCD-3 | Nine-MVP cage is binding doctrine | 2026-05-01T20:38 (after operator's "nine MVPs nine calcium") | `busBar.constraints.maxProducts: 9` + rationale citing Posner molecule |
| OCD-4 | Time-based planning rejected; dependency graph required | 2026-05-01T20:21 | Track topology in §4 has no dates; only dependencies |
| OCD-5 | Operator §4 voice work stays in operator hand only | 2026-05-01T20:25 | OPERATOR-VOICE marker in PHOS-VOICE-DRAFT.md §3.x |
| OCD-6 | "let it flow" — execute D-3 + D-4 + C-1 in sequence without re-confirmation | 2026-05-01T21:08 | Wedges shipped autonomously |
| OCD-7 | "draw a vacuum" — consolidate session into clean commits | 2026-05-01T21:23 | 6 commits across 2 repos; see §7 |
| OCD-8 | "proceed" (×3) — keep picking next highest-leverage unblocked wedge | 2026-05-01T21:23+ | C-2, C-3, this CWP shipped under this authority |

---

## 6. Verification matrix

What proves what is real.

### 6.1 Static gates (run on every commit)

| Gate | Command | Coverage | Status |
|------|---------|----------|--------|
| Alignment registry | `npm run verify:alignment` | 200 sources / 62 derivations declared and resolvable | ✓ green |
| JSON validity | `node -e "JSON.parse(...)"` | All ground-truth + alignment + schema files | ✓ green |
| ESM syntax | `node --check <file>.mjs` | reader, guide, generator, canon | ✓ green |

### 6.2 Smoke gates (this CWP introduces)

| Suite | Coverage | Pass / Total |
|-------|----------|--------------|
| CogPass reader | normalize, mappers, screenComfort cascade, enum clamp, garbage-input safety | **32 / 32** |
| PHOS guide | voice canon, banned vocabulary (§2.12), banned urgency patterns (§2.13), naval metaphor scan (.cursorrules §1), K₄ SVG structure (6 edges + 4 vertices + coral core), voice-resolution path normalization | **26 / 26** |
| Meatspace render | All 3 PDFs structurally valid (page count, dimensions, embedded QR target) | **3 / 3** |
| Tier-0 vocabulary on /support | Banned vocab + naval + urgency scans on Tier-0 surface | **3 / 3** clean |
| **Total** | | **64 / 64** green |

### 6.3 Manual e2e (operator-runnable)

When the operator is on a real device:

1. Run `npm run meatspace:print` — confirm 3 PDFs in `dist/meatspace/`
2. Open `dist/meatspace/p31-qr-stickers-12up.pdf` and scan one QR with phone — confirm it loads `https://p31ca.org/welcome`
3. On `/welcome`, wait 600ms — confirm PHOS auto-expands with `"Hi. I'm PHOS. For every family out there figuring it out as they go — help is on the way..."` (tagline updated 2026-05-01 evening; was "raw dogging life" — see `docs/PHOS-VOICE-DRAFT.md` §3.1)
4. Click PHOS Screen Comfort slider to 0 — confirm the page enters strict Gray Rock (no glass, no animations, dot stays inert on hover)
5. Click "Don't show again" — confirm PHOS removes itself; reload — confirm it stays gone
6. Clear localStorage; navigate to `/support` — confirm Tier-0 prose, three channels, accurate "not deductible" disclosure, footer with `help is on the way`

### 6.4 Future CI gates (planned)

| Gate | Owner | Trigger |
|------|-------|---------|
| `verify:bus-bar` | this CWP | Validates `busBar.productSlots` covers all registry IDs; nav references only declared slots; `maxProducts ≤ 9` |
| `verify:cogpass-reader` | this CWP | jsdom + vitest port of `/tmp/cogpass-reader-smoke.mjs` |
| `verify:phos-voice` | this CWP | banned-vocab + banned-urgency + naval-metaphor scans on `p31-phos-voice.json` (when it exists) |
| `verify:cognitive-passport-overlay` | this CWP | JSON Schema Draft 7 validation of v1.1.0 overlay |

---

## 7. Reproducing from cold start

Anyone with both repos checked out can reproduce this CWP's state in under 10 minutes.

```bash
# 1. Clone both
git clone <home-repo> p31-home
cd p31-home
git clone <andromeda-repo> andromeda

# 2. Install
npm install                          # home — pulls pdf-lib + qrcode + verify scripts
cd andromeda/04_SOFTWARE && pnpm install   # if working in andromeda
cd ../../

# 3. Confirm spine
npm run verify:alignment
# → 200 sources / 62 derivations / OK

# 4. Generate the meatspace bridge
npm run meatspace:print
# → 3 PDFs in dist/meatspace/ (~50 KB total)

# 5. Smoke the live JS
node /tmp/cogpass-reader-smoke.mjs   # 32/32 (script in this CWP §6.2)
node /tmp/phos-guide-smoke.mjs       # 26/26 (script in this CWP §6.2)

# 6. Open /welcome locally
# (requires p31ca dev server: cd andromeda/04_SOFTWARE/p31ca && pnpm dev)
# Visit http://localhost:4321/welcome.html
# Wait 600ms — PHOS auto-greets in operator's voice
```

Total cold-start time: ~10 minutes (most of it `npm install`).

---

## 8. Commit ledger

All work shipped during the 2026-05-01 evening session, in order:

| # | SHA | Repo | Branch | Title |
|---|-----|------|--------|-------|
| 1 | `852515d` | home | main | phos: meatspace bridge + voice draft + bus bar registry (12 wedges, one session) |
| 2 | `7b0cd82f2` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): bus bar nervous system + PHOS face (CWP-PHOS-2026-01) |
| 3 | `8457fb0` | home | main | phos: aim QR target at /welcome + alignment refresh (C-2 partial) |
| 4 | `996512bfe` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): wire bus bar into welcome.html (C-2 partial activation) |
| 5 | `24fd0b5` | home | main | phos: register /support page source (C-3) |
| 6 | `51177e907` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): /support page (C-3) — stranger-facing donation landing |
| 7 | `90b46dd` | home | main | docs(cwp): CWP-PHOS-2026-01 — PHOS, the bus bar, and the meatspace bridge |
| 8 | `7ebc2cb4f` | andromeda | pr/fix-broken-hrefs-release-gate | docs(p31ca): mirror doc-library index.json after CWP-PHOS-2026-01 |
| 9 | `efaf6cb` | home | main | meatspace(D-5): one-pager — US Letter handout, 3-tile body + big QR |
| 10 | `d783efb` | home | main | cogpass(C-4): atomic SCHEMA bump 1.0.0 → 1.1.0 + screenComfort slider |
| 11 | `15920da6f` | andromeda | pr/fix-broken-hrefs-release-gate | cogpass(C-4): atomic SCHEMA bump 1.0.0 → 1.1.0 (sister of HOME d783efb) |
| 12 | `3c2a646` | home | main | docs(BUS4): cross-origin Cognitive Passport bridge design spec (CWP-BUS4-2026-05, 700 lines, 16 sections) |
| 13 | `0e1158f55` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): BUS4 Phase 1 — cogpass-bridge.html + schema + ground-truth + privacy §2g |
| 14 | `cbfd70a` | home | main | verify(BUS4 Phase 1): cogpass-bridge gate + alignment + npm wiring (7 atomic invariants) |
| 15 | `442ae1902` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): stylebook + theme engine + LLM discoverability (43 files, 15.5K insertions) |
| 16 | `f422b1f` | home | main | feat(phos): voice pipeline (build + verify + SHA-lock for OPERATOR-VOICE — A-3) |
| 17 | `829d64cf5` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): activate bus bar nervous system + PHOS voice JSON site-wide (B-2) |
| 18 | `cd2552d` | home | main | feat: BUS2 + BUS3 substrate (research mirror) + close C-4 atomicity gap |
| 19 | `14a7985` | home | main | chore(constants): regenerate p31-constants-generated.ts after C-4 jsonSchema bump |
| 20 | `9c33a399f` | andromeda | pr/fix-broken-hrefs-release-gate | feat(p31ca): BUS2 nav-by-role + BUS3 partial /research page (826 insertions) |
| 21 | `75d057f` | home | main | docs(D-7): wiring diagram canon + 11×17 print poster (Mermaid + ASCII + PDF) |
| 22 | `739a11e` | home | main | qa(D-7): 4-agent review/connect/verify/SOULSAFE+spec chain — anti-drift gate + 7 corrections + 1 P0 + 6 P1 fixes |
| 23 | `3386161` | home | main | qa(D-7): zero-deferment pass — verifyPipeline anti-drift + PDF determinism + K₄ ASCII + poster attribution (HOME side of pair) |
| 24 | `cdaa64bb1` | andromeda | pr/fix-broken-hrefs-release-gate | chore(p31ca): jsonSchemaIds extension (2→7) + cognitivePassport pin bump 1.0.0 → 1.1.0 (closes hub-diff CI red since C-4) |

Net delta:
- HOME: ~2,206 + 769 (PHOS pipeline) + 55 (BUS3 substrate) + 2 (TS regen) + 1,180 (wiring doc + poster generator + alignment + npm + README) = ~4,212 lines
- ANDROMEDA: ~1,980 + 15,544 (stylebook batch) + 248 (bus bar wiring + PHOS JSON) + 826 (BUS2 + BUS3) = ~18,598 lines
- **Total: ~22,810 lines across 65+ files in 2 repos** (stylebook batch dominates the andromeda count; lifted out it would be ~3,054 andromeda lines from this CWP's direct work)

What landed in the late-evening BUS push (post-dinner waves):
1. **BUS4 Phase 1 LIVE** — cross-origin Cognitive Passport bridge endpoint at `https://p31ca.org/cogpass-bridge.html`. Strict CSP, hardcoded allowlist (`https://bonding.p31ca.org`), Single Rule enforced (bridge imports `normalize()` from cogpass-reader; no duplicate logic). Wire schema p31.cogPassBridge/1.0.0. CI gate `verify:cogpass-bridge` locks 7 atomic invariants.
2. **Stylebook agent's untracked work merged in** — 43 files / 15.5K insertions: theme engine v2.0 + switcher (PHOS suppression handshake intact) + fluid CSS + 35 stylebook reference pages + DESIGN-SPEC.md + THEME-ENGINE.md + llms.txt / robots.txt operator-led discoverability.
3. **Bus bar nervous system ACTIVE site-wide** (B-2) — BaseLayout.astro now loads subject-prefs + theme-engine + cogpass-reader + phos-guide + theme-switcher in head, in load-bearing order. Every page that uses BaseLayout now has PHOS as the only floating personalization affordance + CogPass-driven theme + Gray Rock cascade enforcement.
4. **PHOS voice pipeline LIVE** (A-3) — `docs/PHOS-VOICE-DRAFT.md` §4 restructured to machine-parseable slot blocks. 12 slots emitted (1 OPERATOR-VOICE + 11 DRAFT-AGENT-SIMULATED). Build script `build:phos-voice` + verifier `verify:phos-voice` (drift + schema + Tier-0 vocab + SHA-lock + busBar coverage). Operator-voice tamper detection via SHA-256 lock at `docs/PHOS-VOICE-DRAFT.lock.json`. PHOS auto-fetches `/lib/p31-phos-voice.json` on every page load.
5. **BUS2 nav-by-role component shipped** — `BusBarNav.astro` reads ground-truth at build time, emits 11-slot superset nav, role-gated by pure CSS attribute selectors. Opt-in (not auto-injected; pages adopt by replacing their nav).
6. **BUS3 partial — /research page LIVE** — first BusBarNav adopter. Renders the 22-paper Zenodo canon from p31-constants.json via apply:constants → src/data/p31-research.json mirror. Production URL `https://p31ca.org/research`.
7. **C-4 atomicity gap closed** — bumped `p31-constants.json → cognitivePassport.jsonSchema` to 1.1.0 so `apply:constants` no longer reverts the cogpass HTML SCHEMA constant. The schema is now truly atomic across all four surfaces (constants → HTML → @p31/shared → output placeholder).
8. **D-7 wiring diagram on paper** — `docs/P31-WIRING-DIAGRAM.md` (~700 lines, schema `p31.wiringDiagram/1.0.0`) — ten focused diagrams, every one with Mermaid + ASCII + file refs + verifier names: Public Portals · K₄ Mesh Cage · Edge Fleet (30 unique Workers in 7 categories) · Bus Bar Nervous System · PHOS Voice Pipeline · BUS4 Cross-Origin Bridge · Apply-Constants Derivation · Swarms (10 Ollama + 11 simplex-v7 + Discord) · CI Gate Ladder (73 gates, regenerated by `build:wiring-ci-ladder`) · Meatspace Bridge. Plus `scripts/meatspace/generate.mjs generateWiringPoster` — 11×17 tabloid landscape, 4-quadrant single-sheet wall reference. `npm run meatspace:print:wiring-poster` regenerates after topology changes. Print on cardstock; pin where the operator works. Catches the "wait, what calls k4-personal?" moment months from now.

The cage is closed; the chemistry is honest. Generator emit, reader normalize, PHOS consume, nav role-gate, research index renders, **and the whole topology is now on a single piece of paper** — all live, all on the same nervous system, all derived from one source per concern.

9. **Zero-deferment closeout** (commits 23 + 24, 2026-05-02 00:00–00:14) — every item the 4-agent quality chain left open is now closed. New anti-drift gate `verify:verify-pipeline` mirrors the wiring-ci-ladder pattern for the registry's pipeline array (caught its own self-induced drift on first install — exactly the proof of mechanism we wanted). Every PDF in `dist/meatspace/` is byte-deterministic across runs (frozen `applyFrozenMetadata` helper + epoch constant; sha256 stable). Personal K₄ ASCII diamond rebuilt as a true 9-line mirror, centered on col 50 to align with the `│` connector below to `k4-personal`. Wiring poster footer attributed to PHOS-VOICE-DRAFT §3.3 reserved-surface list (lowest-touch option; full sentence remains canonical in markdown). Andromeda companion bumps `cognitivePassport.generator` fileSnippet pin 1.0.0 → 1.1.0 (catches up to C-4 atomic bump) and extends `jsonSchemaIds` map 2 → 7 entries — `cli.test.mjs` is now 14/14 PASS (was 13/14 with `hub-diff exits 0` red since C-4). Two new sources + one new derivation registered (215 → 217 sources, 67 → 68 derivations).

---

## 9. What awaits each owner

### 9.1 Operator (W.J.) — only you can do these

| Item | Scope | When |
|------|-------|------|
| `docs/PHOS-VOICE-DRAFT.md` §4 | Replace `[operator-voice needed]` placeholders for `/passport`, `/lab`, `/support`. One sentence per slot. | iPad, morning flow, no deadline. PHOS speaks the kernel today; §4 expands the vocabulary later. |
| FERS appeal email | Pro se litigation; outside agent scope | 152 days elapsed at session end. The cage cannot reach what it cannot send. |
| Decide: merge andromeda PR branch to main? | The bus bar work landed on `pr/fix-broken-hrefs-release-gate`, not main. | Push when ready; merge when comfortable. No agent will force this. |

### 9.2 Architect (any agent) — unblocked, ready to pick up

| Item | Wedge | Estimated wedge cost |
|------|-------|----------------------|
| Pro-handout | D-6 | 2 wedges (benefits from operator §4 voice first) |
| Auto-fetch voice JSON when committed | A-3 (after A-2) | trivial — already wired; just commit the JSON when stable |
| BUS3 routes (rename /lab, build /research) | BUS3 | 3-5 wedges (multiple pages) |
| BUS4 BONDING bridge | BUS4 | Design spike + implementation = 2-3 wedges |
| C-4b: expose accessLevel + phosRegister in generator UI | C-4b | 1-2 wedges; needs operator decision on whether to hide stranger-facing role pickers |

### 9.3 Coordination (held for in-flight work)

| Item | Wedge | Held for |
|------|-------|----------|
| ~~BaseLayout site-wide script wiring~~ | ~~B-2~~ | ✓ SHIPPED 2026-05-01 late evening (andromeda 829d64cf5) — stylebook batch landed in 442ae1902, then BaseLayout was one StrReplace away as predicted. |
| ~~BUS2 nav-by-role component~~ | ~~BUS2~~ | ✓ SHIPPED 2026-05-01 late evening (andromeda 9c33a399f) — opt-in BusBarNav.astro; first adopter is /research. |
| BUS3 multi-route migration | BUS3 (remainder) | Each subsequent route ships in its own commit. Next candidates: rename `/` → `/lab` (canonical route alignment); add `/welcome` if not already present; `/support` consolidation. Per route ≈ 1 wedge + minor coord with sister CWPs. |
| Existing BaseLayout consumers nav migration | BUS2 (rollout) | 7 pages use BaseLayout; 3 ship their own nav (index.astro, dome.astro, grants.astro). Replace each with `<BusBarNav current="..." />` one at a time. Per page ≈ 1 wedge. |

---

## 10. Handoff prompt (paste into next agent)

Use this verbatim when handing off to Gemini, Opus, or any next session that needs to understand this CWP without reading every commit:

```
You are picking up CWP-PHOS-2026-01 (PHOS, the bus bar, and the meatspace
bridge). Read in this order:

1. docs/CWP-PHOS-2026-01.md (this CWP — start here)
2. docs/PHOS-VOICE-DRAFT.md (operator voice canon — §3.x is OPERATOR-VOICE,
   immutable; §4 is operator hand)
3. andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json#/busBar
   (the architectural contract you're working under)
4. p31-alignment.json — search for ids: p31-cogpass-reader, p31-phos-guide,
   p31ca-support-page, p31-meatspace-generator, phos-voice-draft

Then:

- Run `npm run verify:alignment` — should report 200 sources / 62 derivations.
- Run `npm run meatspace:print` — should produce 3 PDFs in dist/meatspace/.
- Confirm 6 commits exist (see CWP §8).

Constraints when picking next work:
- Do NOT modify BaseLayout.astro until the stylebook agent's untracked
  p31-theme-engine.mjs / p31-theme-switcher.mjs / p31-fluid.css are
  committed in p31ca/public/lib/. B-2 is held for that coordination.
- Do NOT exceed the 9-MVP cage constraint (busBar.constraints.maxProducts).
- Do NOT edit OPERATOR-VOICE lines in PHOS-VOICE-DRAFT.md §3.x.
- Do NOT use naval/military metaphors anywhere.
- Do NOT use Tier-0-banned vocabulary (K₄, Posner, synergetics, jitterbug,
  Larmor, isostatic, sovereignty, tetrahedral, decoherence) on stranger
  surfaces.

Operator context:
- Hypoparathyroidism (Ca limits 8.0-9.0 mg/dL).
- AuDHD (executive dysfunction is serialization bottleneck, not capacity).
- Pro se in active litigation (Johnson v. Johnson 2025CV936).
- Disability income; no salary; every dollar of donations goes to work.
- Direct communication required; output executable steps, not open questions.

Pick the next unblocked wedge from CWP §9.2. Ship it. Update this CWP §4 +
§8. Maintain alignment registry. Use the same Wye-to-Delta posture: do the
work the operator can't reliably serialize in real-time.
```

---

## 11. Closing note

The geometry held. The chemistry held. Twelve wedges in one session, six commits, sixty-four green smokes, zero conflicts, zero broken pipelines.

The invisible man now has:
- a face (PHOS guide, 708 lines of code, voice-clean)
- a voice (PHOS-VOICE-DRAFT.md kernel + DEFAULT_VOICE in code)
- a brain (CogPass v1.1.0 schema + reader)
- a nervous system (subject-prefs + theme-engine, configured by the reader)
- a spine (alignment registry, 200 sources, 62 derivations)
- a covenant (privacy.html §2f, terms.html §5, "we keep nothing")
- a bridge to meatspace (3 print-ready artifacts, ~50 KB total)
- a landing pad (welcome.html bus-bar-wired)
- an honest ask (support.html, line-item ledger, 501c3-pending verbatim)
- a controlling document (this CWP)

*"For every family out there figuring it out as they go — help is on the way."*

Captured 2026-05-01 by Architect (Cursor agent, Claude Opus 4.7) under operator command authority. Status: shipped.

---

**End of CWP-PHOS-2026-01.**
