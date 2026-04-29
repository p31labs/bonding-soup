# P31 Starfield

Canonical **2D canvas** ambient mesh: spoons → density/speed, voltage → coral ratio, hearth breath, event bursts. Weather, not notifications.

**Broader ambient catalog (23 touches across surfaces — specification only):** [`docs/P31-STARFIELD-MESH-TOUCHES.md`](../../docs/P31-STARFIELD-MESH-TOUCHES.md).

## Files

| File | Role |
|------|------|
| `p31-starfield.js` | `initStarfield(canvas, config)`, `resolveStarfieldConfig(url?)`, `configFromSpoons(spoons, safeMode)`, `applyVoltageToConfig(voltage, base)` |
| `p31-starfield.css` | Canvas sizing + `prefers-reduced-motion` |
| `demo.html` | Local demo — buttons for spoon states and burst types |

## API contract

- **Live state:** `resolveStarfieldConfig()` returns `{ config, hints }` — GETs `https://api.phosphorus31.org/api/state` (override with `window.__P31_STARFIELD_API__` or argument). On failure → nominal `config` + empty `hints`. Use `resolveStarfieldConfigFlat()` if you only need the legacy `StarfieldConfig` object.
- **Bursts:** call `api.fireBurst('ping'|'med'|'agent'|'hostile'|'love'|'bonding'|'touch')` on the object returned from `initStarfield`.
- **Mesh touches:** `p31-mesh-touches.js` (moon, FERS bias, birthdays, activity, constellation persistence, BroadcastChannel). `initStarfield` third argument: `{ surface, poetsMode, touchRipple, connectionAudio, pulsePollUrl }`.

## Behavioral map

- **10–12 spoons:** ~80 particles, fast drift, ~15% coral, bright hearth.
- **5–7 spoons:** ~50 particles, slower, more coral.
- **≤3 spoons:** ~25 particles, sparse, coral-heavy.
- **Safe mode:** ~12 particles, nearly static, dim (Gray Rock).
- **RED voltage:** higher coral ratio + hostile ring wave on `fireBurst('hostile')`.

## Reduced motion

When `prefers-reduced-motion: reduce`, animation stops after one static frame; bursts (except hostile ring draw in motion path — simplified to skip burst particles).

## Deploy

From repo root: `npm run sync:p31-starfield` copies into `andromeda/04_SOFTWARE/p31ca/public/lib/` (module, CSS, and `starfield-demo.html` next to the script so relative imports work). Live: `https://p31ca.org/lib/starfield-demo.html`. Proof: `npm run verify:starfield`.
