# p31ca.org hub — card ↔ about ↔ app alignment

**Invariant:** `scripts/hub/registry.mjs` **id** set = `scripts/hub/hub-app-ids.mjs` **HUB_ALL_CARD_ORDER** set.  
**One card** on `/` per id (cockpit grid + prototypes section). **One** `public/{id}-about.html` per id, generated only from that list. **Launch** on each about page → `registry[].appUrl` (static path on p31ca or external production URL).

## Source files

| Role | Path |
|------|------|
| Card order (cockpit + prototypes) | `andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs` |
| Product copy, `appUrl`, `related[]` | `andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs` |
| Landing JSON for Astro | `src/data/hub-landing.json` (from `npm run hub:build` / `build-landing-data.mjs`) |
| About HTML | `node scripts/generate-about-pages.mjs` → `public/*-about.html` |
| Integrity | `node scripts/hub/verify.mjs` (prebuild) |

## Outliers removed / fixed

- **Before:** 23 registry apps had `*-about.html` but **no** card on the home grid. **Fix:** those ids were added to `HUB_COCKPIT_ORDER` so every registry app has a card.
- **Before:** `connect-about.html` and `planetary-onboard-about.html` existed **without** registry rows. **Fix:** added `connect` and `planetary-onboard` to `registry.mjs` and the hub id list; about pages are **regenerated** from the same template as other products (P31-styled, `p31-style.css`).

## Maintenance

1. **New surface:** add a row to `registry.mjs`, add the id to `hub-app-ids.mjs` (cockpit or prototype order), run `hub:build` + `generate-about-pages`, then `hub:verify`.
2. **Remove a surface:** remove id from both files, delete is not needed if you re-run `generate-about-pages` after shrink (or delete orphan `*-about.html` manually).
3. **`related[]`:** must only reference ids that exist in `registry.mjs` (enforced by existing hub verify loop).

## Posture labels (PRS)

When **`p31-production-readiness.json`** exists at the bonding-soup repo root (typical full checkout), `scripts/hub/build-landing-data.mjs` and `scripts/generate-about-pages.mjs` map each **hubCard** PRS tier to grid/about badges: **LIVE** (P0–P1), **BETA** (P2), **ALPHA** (P3), **CONCEPT** (P4). **HARDWARE** on `node-one` is preserved. Logic lives in **`scripts/hub/prs-production-posture.mjs`**. p31ca-only clones without the home file keep registry `statusLabel` only.

## Social Molecules / C.A.R.S. (`social-molecules`)

**Hub static app:** `public/social-molecules.html` — operator shell: boot veil, load menu (live soup, BONDING app, mesh assistant, field-only), settings (local prefs), upgraded field chat staging (local echo; real DO chat via `/mesh-start.html`). Header strip probes **`/p31-mesh-constants.json`**, **k4-personal `/api/health`**, and same-origin **`/api/health`** (Refresh repeats the snapshot; last-good time from cache if offline).

**Canonical short path:** `/cars` → `social-molecules.html` (see `ground-truth` `edgeRedirects` + `public/_redirects`).

**Registry:** `social-molecules` immediately after `bonding` in `hub-app-ids.mjs`; `related`: `bonding`, `buffer`, `planetary-onboard`. Live C.A.R.S. soup remains `https://bonding.p31ca.org/soup`; wire catalog `cars-contract/p31.carsWire.json` in bonding-soup repo.

## Poets room (`poets`)

**Home tree (C.A.R.S. repo):** `poets-room.html` — static lobby linking Cognitive Passport, doc library, mesh-start, geodesic, delta, and normative docs (SOULSAFE, geodesic campaign, MVP picture-book row).

**Andromeda / p31ca (same change set when the monorepo is checked out):**

1. Add `public/poets.html` — copy or adapt from home `poets-room.html` (keep hub absolute URLs; drop redundant “ship” section if the page is already on p31ca).
2. `scripts/hub/registry.mjs` — new row `id: "poets"`, `appUrl: "/poets.html"` (or `/poets` if served via clean path), title/description aligned with the lobby.
3. `scripts/hub/hub-app-ids.mjs` — include `poets` in `HUB_ALL_CARD_ORDER` (cockpit or prototypes).
4. `ground-truth/p31.ground-truth.json` + `public/_redirects` — optional short path `/poets` → `poets.html` if you want parity with other short URLs.
5. `npm run hub:build` → `node scripts/generate-about-pages.mjs` → `npm run hub:verify` (or full `hub:ci`).

**Version:** 1.0.0 (2026)
