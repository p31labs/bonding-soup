# Mobile ops — Phase 2 (iPhone PWA + production touch surfaces)

**CWP:** `CWP-P31-MOBILE-OPS-2026-01`  
**Status:** operator checklist (repeat after hub deploy)

## 1. Local command center (PWA for “Add to Home Screen”)

The operator console is **`P31_CMD_CENTER_LAN=1` +** `node scripts/p31-local-command-center.mjs` (or `npm run morning`).

| Check | How |
|--------|-----|
| Apple “web app” meta | `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `theme-color` in generated HTML — see `scripts/p31-local-command-center.mjs` `<head>`. |
| Manifest | `GET /manifest.webmanifest` — `display: "standalone"`, `start_url` + `scope` `/`, `icons` 180/192/512 when `p31-bonding-icons/` is present. |
| Icons | `p31-bonding-icons/apple-touch-180.png` (+ 192/512) — run `npm run generate:bonding-pwa-icons` if missing. |
| Responsive | `GET /assets/p31-responsive-surface.css` **200** |

**iPhone (manual, same Wi-Fi):** Safari → `http://<Chromebook-LAN-IP>:3131` → Share → **Add to Home Screen** → open tile (standalone, no Safari chrome).

**Automated (home repo):** `npm run verify:command-center` includes `server-smoke` for the above (loopback, high port).

## 2. Production surface sweep (edge)

From the home repo (network):

```bash
npm run mobile-ops:phase2
```

Expect **HTTP 200** and `viewport: y` on each row. Tweak URLs in `scripts/mobile-ops-surface-sweep.mjs` if routes change (see `p31.ground-truth` / `_redirects`).

## 3. Full-bar regression

After HTML/CSS changes: `npm run verify` (root) as usual; touch layouts are not e2e-gated in Phase 2 — use a real iPhone for dome/connect WebGL and passkey (Phase 5).

**See also:** [PHASE3](MOBILE-OPS-PHASE3.md) (command) · [PHASE4](MOBILE-OPS-PHASE4.md) (create) · [PHASE5](MOBILE-OPS-PHASE5.md) (connect) · [PHASE6](MOBILE-OPS-PHASE6.md) (integration) · <code>npm run mobile-ops:full</code> (phases 2–5 script chain).

**Version:** 1.0.0 — 2026-04-28
