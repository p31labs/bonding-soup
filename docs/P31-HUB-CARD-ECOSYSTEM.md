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

**Version:** 1.0.0 (2026)
