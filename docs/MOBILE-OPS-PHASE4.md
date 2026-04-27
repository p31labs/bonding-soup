# Mobile ops — Phase 4 (Create / build on Chromebook)

**CWP:** `CWP-P31-MOBILE-OPS-2026-01`  
**Goal:** A predictable **build** loop on one machine: edit → dev server (one at a time) → **verify** before deploy.

## Constraints (Chromebook / Crostini)

| Concern | Mitigation |
|--------|------------|
| RAM | Run **one** long-lived dev server at a time; use production URLs for other surfaces. |
| CPU | Astro / Vitest are OK; don’t run **p31:all** + **hub dev** + **bonding dev** in parallel. |
| WebGL e2e | `P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1` (and similar) if Playwright WebGL flakies. |
| pnpm (Andromeda) | From `andromeda/04_SOFTWARE`: `pnpm install` per monorepo README. |

## Commands (from home `~/p31`)

**p31ca (Astro hub)** — default dev port is **4321** (`npm run dev` in p31ca; see Astro).

```bash
cd andromeda/04_SOFTWARE/p31ca
npm run dev
# In another shell (stop dev first if RAM tight):
npm run verify
```

**BONDING (Vite)** — in this tree, **`dev` uses port 5188** (see `andromeda/04_SOFTWARE/bonding/package.json`).

```bash
cd andromeda/04_SOFTWARE/bonding
npm run dev
npm test
```

**Home (bonding-soup) root** — typecheck, soup prep, full bar:

```bash
cd ~/p31  # or your clone
npm run build
npm run verify
```

**Pre-deploy gate (same as Phase 3):** `npm run p31:converge` and/or full `npm run verify`, then p31ca `npm run deploy` when ready.

## Automated check

```bash
npm run mobile-ops:phase4
```

Verifies the **p31ca** and **bonding** package trees and expected **scripts** when present (no dev servers started).

**Version:** 1.0.0 — 2026-04-28
