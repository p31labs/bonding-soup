# P31 Starfield

Ambient canvas mesh (“weather,” not notifications): spoon density drives particle count and drift; voltage shifts coral ratio; optional bursts for system events; hearth breath at the bottom; `prefers-reduced-motion` draws one static frame.

**Canonical source:** `design-assets/starfield/p31-starfield.js` — run `npm run sync:p31-starfield` before hub deploy so `andromeda/04_SOFTWARE/p31ca/public/lib/` matches; proof: `npm run verify:starfield`.

**Live demo (hub):** [https://p31ca.org/lib/starfield-demo.html](https://p31ca.org/lib/starfield-demo.html) — local copy: `design-assets/starfield/demo.html` (synced beside `/lib/p31-starfield.js` as `public/lib/starfield-demo.html`).

**Contract:** `resolveStarfieldConfig()` → `initStarfield(canvas, config)`; optional `fireBurst(type)`. Full behavioral map: `design-assets/starfield/README.md`.

**Ambient mesh touches (vision — not ship-bar):** twenty-three surface-specific behaviors — birthdays, calcium window, cursor cadence, favicon, audio, presence, empty-room convergence, etc.: [`docs/P31-STARFIELD-MESH-TOUCHES.md`](P31-STARFIELD-MESH-TOUCHES.md).
