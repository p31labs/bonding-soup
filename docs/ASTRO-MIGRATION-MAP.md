# Astro Migration Map — Bin A Survivors
**Document ID:** `p31.astroMigrationMap/1.0.0`  
**CWP:** CWP-DESIGN-04  
**Status:** Prep complete — no code changes in this CWP  
**Surfaces:** passport · geodesic · delta-language (glossary) · observatory  

---

## Overview

The four Bin A surfaces are production standalone HTML files that predate the Astro pipeline. This document maps the extraction work needed to migrate them into the Astro 5 build. No migration happens here — this is the prep map only.

**Deployment targets after migration:**
| Surface | Current path | Astro target | Domain |
|---|---|---|---|
| `public/passport.html` | `/passport` | `/passport` | p31ca.org |
| `public/geodesic.html` | `/geodesic` | `/geodesic` | p31ca.org |
| `public/delta-language.html` | `/delta-language` | `/glossary` | phosphorus31.org |
| `public/observatory.html` | `/observatory` | `/observatory` | p31ca.org |

---

## 1. Component Extraction Map

All four surfaces share the same structural skeleton. Extraction splits into three layers:

### 1.1 `<BaseLayout>` content (identical across all surfaces)

These elements become the Astro `BaseLayout.astro` component:

```astro
---
// BaseLayout.astro props
const { title, description, ogImage } = Astro.props;
---
<!-- head: canonical fonts, token CSS, meta tags, OG -->
<!-- body.skip-link -->
<!-- nav.top-nav: P31 wordmark SVG + safe mode button -->
<!-- body.safe-toggle script: p31-safe-mode.js -->
<!-- PHOS router: p31-phos-router.js -->
<!-- phos-os.js -->
```

**Shared CSS classes extracted to `BaseLayout.astro` `<style>` or `p31-style.css`:**
- `.skip-link`
- `.btn-safe` / `.safe-toggle`
- `.top-nav`, `.nav-brand`
- `.page-wrapper`
- `.glass-card`
- `.header-row`, `.title-group`, `.tagline`
- `body.safe-mode` overrides

### 1.2 Page-specific `<Content>` (per surface)

Each surface becomes an Astro page at `src/pages/`:

| Surface | Astro page | Page component |
|---|---|---|
| passport | `src/pages/passport.astro` | `src/components/PassportGenerator.astro` |
| geodesic | `src/pages/geodesic.astro` | `src/components/GeodesicBuilder.astro` |
| delta-language | `src/pages/glossary.astro` | `src/components/DeltaGlossary.astro` |
| observatory | `src/pages/observatory.astro` | `src/components/DataObservatory.astro` |

### 1.3 Shared micro-components

| Component | Used by | Extracts from |
|---|---|---|
| `K4LogoSVG.astro` | All | Inline SVG in `.nav-brand` |
| `GlassCard.astro` | All | `.glass-card` div pattern |
| `SafeModeButton.astro` | All | `<button class="btn-safe safe-toggle">` |
| `PhosRouter.astro` | All | `<script src="/public/lib/p31-phos-router.js">` |

---

## 2. Dependency Audit

### 2.1 External CDN (must move to npm)

| Dependency | Current source | npm package | Version |
|---|---|---|---|
| Three.js core | `cdnjs.cloudflare.com/ajax/libs/three.js/r128` | `three` | `^0.128.0` |
| Three.js OrbitControls | `cdn.jsdelivr.net/npm/three@0.128.0/examples/…` | bundled with `three` | same |
| Inter font | `rsms.me/inter/inter.css` | `@fontsource-variable/inter` | `^5.x` |
| JetBrains Mono | `fonts.googleapis.com` | `@fontsource/jetbrains-mono` | `^5.x` |

**Note on fonts:** The Google Fonts / rsms.me approach is acceptable for standalone HTML through Gate 2. Self-hosting via `@fontsource` is required before Astro migration to eliminate the third-party font dependency per the privacy policy. No CDN calls at build time.

### 2.2 Inline scripts → TypeScript modules

| Surface | Inline script purpose | Target module |
|---|---|---|
| passport | Slider + localStorage + four-state logic | `src/scripts/passport-generator.ts` |
| geodesic | Three.js scene, geometry primitives, K₄ mesh | `src/scripts/geodesic-builder.ts` |
| delta-language | Search filter + anchor highlight | `src/scripts/delta-glossary.ts` |
| observatory | Data fetch + chart render | `src/scripts/observatory.ts` |

### 2.3 Internal P31 scripts (already at correct paths)

These do not need to change paths — they are resolved by Vite's public dir:

```
/public/lib/p31-qmu-tokens.css  → stays as Vite public asset
/public/lib/p31-safe-mode.js    → stays as Vite public asset
/public/lib/p31-phos-router.js  → stays as Vite public asset
/public/lib/phos-os.js          → stays as Vite public asset
/public/data/phos-intent-catalog.json → stays as Vite public asset
```

---

## 3. Route Mapping

### 3.1 Confirmed route targets (no collisions)

```
/passport     → src/pages/passport.astro        (p31ca.org)
/geodesic     → src/pages/geodesic.astro        (p31ca.org)
/glossary     → src/pages/glossary.astro        (phosphorus31.org)
/observatory  → src/pages/observatory.astro     (p31ca.org)
```

### 3.2 Redirect required

`delta-language.html` currently lives at `/delta-language`. After Astro migration the canonical path becomes `/glossary` on phosphorus31.org.

Add to `_redirects` (Cloudflare Pages):
```
/delta-language  /glossary  301
```

### 3.3 No collision check

These routes do not exist in any current Astro file under `andromeda/04_SOFTWARE/p31ca/src/pages/` or `phosphorus31.org/src/pages/`. Verified clean as of 2026-05-04.

---

## 4. public-line.json Status

All four surfaces are already registered in `docs/public-line.json`. Current gates (2026-05-04):

| Path | Gate | phosSlot |
|---|---|---|
| `/passport` | `live` | `passport` |
| `/geodesic` | — | — |
| `/delta-language` | `live` | `delta-language` |
| `/observatory` | — | — |

**Note:** The CWP-DESIGN-04 spec described adding these as `gate: "draft"` entries, but `/passport` and `/delta-language` are already `gate: "live"` and Gate 2 polished (CWP-DESIGN-05). No downgrade. When the Astro migration executes, update notes to reference the migration CWP.

---

## 5. Pre-Migration Checklist

Before any Astro migration CWP opens:

- [ ] `verify:p31-style` passes for all 4 surfaces
- [ ] All inline `:root` token blocks removed (done — CWP-DESIGN-02)
- [ ] Safe mode uses `p31-safe-mode.js` module (done — CWP-DESIGN-06)
- [ ] PHOS router active on all 4 surfaces (done — CWP-DESIGN-03)
- [ ] Gate 2 checklist complete for passport + glossary (done — CWP-DESIGN-05)
- [ ] Three.js CDN scripts tagged with `MIGRATION TODO` comments (done — passport: N/A, geodesic: tagged)
- [ ] npm packages identified with versions (see §2.1)
- [ ] `@fontsource` packages confirmed available for Inter + JetBrains Mono
- [ ] Redirect rule drafted for `/delta-language → /glossary`
- [ ] Component extraction map reviewed by operator

---

*Migration CWP to be opened separately. This document is read-only prep.*
