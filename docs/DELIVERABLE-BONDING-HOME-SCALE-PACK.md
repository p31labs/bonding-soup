# Deliverable — BONDING Home **Scale & PWA Pack**

## Final deliverable (chosen)

**Name:** **BONDING Home — Scale & PWA Pack**  
**What it is:** One reviewable **home-repo** drop: PWA install surfaces for Soup and siblings, **when-scale** roadmap + **room-scale** protocol gate, **create/connect/ethical money** prose, **fleet portal** generator, **entry-page parity** (as-above strips), **passport** mirror/footer alignment — without a second source of truth or an app-store shell.

**Canonical manifest (this file):** file list, proof commands, commit stacks, PR paste block.  
**Mission-level handoff:** **`docs/P31-MISSION-SYSTEM-DELIVERABLE.md`** (full system; links here for this slice).

**Status:** Proof block: **`npm run verify`** && **`npm run soup:room-scale`** && **`npm run build:fleet-portal`**. Commit with the home-repo **Scale & PWA** pack (this file + assets in §1).  
**Date:** 2026-04-27  
**Pack version:** 1.1.0

---

## Proof (run in order)

```bash
npm run verify
npm run soup:room-scale
npm run build:fleet-portal
```

Optional before bonding deploy: **`npm run sync:soup-bonding`** (when active).  
Optional hub: **`npm run polish`** per **`AGENTS.md`**.

---

## 1. What’s in the box

### A. PWA / phone-ready home surfaces

| Asset | Role |
|-------|------|
| **`p31-bonding.webmanifest`** | `standalone` shell; local PNG icons under `p31-bonding-icons/` |
| **`p31-bonding-icons/*`** | SVG source + PNGs (`npm run generate:bonding-pwa-icons` when Andromeda `sharp` exists) |
| **`scripts/apply-pwa-manifest-bonding-html.mjs`** | Idempotent manifest + iOS meta across HTML |
| **`scripts/generate-bonding-pwa-icons.mjs`** | Rasterize icons |
| **`package.json`** | `apply:pwa:home`, `generate:bonding-pwa-icons` |

### B. When-scale + room gate

| Asset | Role |
|-------|------|
| **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`** | Phases 0–3, scale dimensions, Phase 1 gates |
| **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`** | Create / connect + ephemeralization + ethical monetization |
| **`docs/SOUP-ROOM-SCALE-RUNBOOK.md`** | Manual two-browser + reconnect drill |
| **`scripts/soup-room-scale.mjs`** | Runs **`npm run test:mock-ws`** + runbook pointer |
| **`package.json`** | `soup:room-scale` |
| **`tests/soup-room-scale/README.md`** | Placeholder for future Playwright (not on ship bar yet) |

### C. Fleet visibility

| Asset | Role |
|-------|------|
| **`scripts/build-fleet-portal.mjs`** | Generates **`fleet-portal.html`** |
| **`fleet-portal.html`** | Static URL index — regenerate after JSON changes |
| **`scripts/p31-polish.mjs`** | May mirror fleet + doc-library to p31ca per **`AGENTS.md`** |

### D. Entry parity

**`soup.html`**, **`poets-room.html`**, **`p31-personal-howto.html`**, **`docs/doc-library/index.html`**, **`docs/physics-learn/index.html`**, **`cognitive-passport/index.html`** (footer), **`fleet-portal.html`** (footer), **`scripts/p31-local-command-center.mjs`** (ribbon).

### E. Passport mirror

**`andromeda/04_SOFTWARE/p31ca/scripts/passport-p31ca-transform.mjs`** — footer + icons; hub footer → **`/doc-library/?q=PLAN-BONDING-SOUP-WHEN-SCALE`**. **`npm run sync:passport`** + **`npm run verify:passport`** after generator edits.

### F. Cross-links

**`AGENTS.md`** §1b–1c, **`P31-ROOT-MAP.md`**, **`README.md`**, **`docs/P31-ALIGNMENT-SYSTEM.md`**, **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`**, **`docs/ETHICAL-STYLE-MAP.md`**, **`docs/MVP-DELIVERABLES-INVENTORY.md`** (row **19a**), **`docs/README-REVIEW-DOCS.md`** (§5b).

---

## 2. Suggested commit assembly (stacked PRs optional)

1. **Docs + manifest:** `docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`, `docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`, `docs/SOUP-ROOM-SCALE-RUNBOOK.md`, `docs/DELIVERABLE-BONDING-HOME-SCALE-PACK.md`, `docs/MVP-DELIVERABLES-INVENTORY.md`, `docs/README-REVIEW-DOCS.md`, `docs/P31-MISSION-SYSTEM-DELIVERABLE.md` (touch only if outcomes row changes), ethics/alignment/agentic links, `AGENTS.md`, `P31-ROOT-MAP.md`, `p31-facts.json`.
2. **PWA:** `p31-bonding.webmanifest`, `p31-bonding-icons/`, PWA scripts, HTML heads.
3. **Scale gate:** `scripts/soup-room-scale.mjs`, `tests/soup-room-scale/README.md`, `package.json`.
4. **Fleet + entries:** `scripts/build-fleet-portal.mjs`, `fleet-portal.html`, command-center, entry HTML, `README.md`.
5. **Passport / p31ca:** `cognitive-passport/index.html`, transform, **`npm run sync:passport`**.

---

## 3. PR title + summary (paste)

**Title:** `deliver(home): BONDING Scale & PWA pack — manifest, room gate, fleet portal, entry parity`

**Summary:**

- Adds **`docs/DELIVERABLE-BONDING-HOME-SCALE-PACK.md`** as the single manifest for this drop; MVP inventory **19a** and review doc index **§5b** point here.
- PWA: **`p31-bonding.webmanifest`**, **`p31-bonding-icons/`**, apply/generate scripts; iOS-friendly meta on key HTML.
- Scale: **`docs/PLAN-BONDING-SOUP-WHEN-SCALE.md`**, **`docs/SOUP-ROOM-SCALE-RUNBOOK.md`**, **`npm run soup:room-scale`** (wraps **`test:mock-ws`**).
- Fleet: **`scripts/build-fleet-portal.mjs`**, **`fleet-portal.html`**; strips link when-scale + runbook across entry surfaces.
- Passport: footer + **`apple-touch-icon`** PNG; transform + **`sync:passport`** for hub mirror.
- **Proof:** `npm run verify` && `npm run soup:room-scale` && `npm run build:fleet-portal`.

---

## 4. Out of scope

- App Store / Capacitor  
- Production Soup WS host (mock + roadmap)  
- Changing **`creator-economy.json`** fee math (references only)

---

## 5. See also

| Doc | Role |
|-----|------|
| **`docs/P31-MISSION-SYSTEM-DELIVERABLE.md`** | Full mission assembly sheet |
| **`docs/MVP-DELIVERABLES-INVENTORY.md`** | Tier **19a** |
| **`docs/P31-ENGINEERING-STANDARD.md`** | Definition of done |
| **`docs/README-REVIEW-DOCS.md`** | Review order |
