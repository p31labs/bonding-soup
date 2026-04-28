# P31 CLI / UI spinners — K₄ loading motifs

Standalone SVG files (inline CSS animation). Semantic mapping for command center, p31ca, and future `/simplex` dashboard.

| File | Token / color | Pattern | Use when |
|------|-----------------|---------|----------|
| `wye-sequence.svg` | `--p31-phosphorus` `#3ba372` | Sequential clockwise snap | Action running, editing, processing |
| `quantum-breath.svg` | `--p31-cyan` `#4db8a8` | Center pulse, then outer ring | Sync, SENTINEL heartbeat, live data fetch |
| `ghost-grid.svg` | `--p31-coral` `#cc6247` | Faint grid + node flicker | Auth / passkey, mesh discovery |

**Accessibility:** Respect `prefers-reduced-motion` when embedding in app shell (swap to static K₄ dot or opacity-only).

**Canon:** Hex values match `cognitive-passport/p31-style.css` (generated from `andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json` when Andromeda is present). Some full-page tools use a deeper void background (`#05080c`) for contrast; core semantic colors align with `--p31-*`.

**Integrate:** Command center V2 (`scripts/p31-local-command-center.mjs`) **inlines these three SVGs** next to the stdout status line. **Selection:** default **Wye**; **Breath** if `ACTION_META[id].network` is true; **Ghost** if the action id matches `/mesh|connection/i`. Animations disabled under `prefers-reduced-motion` via `command-center.css`. For other shells: `<img>`, inline SVG, or React wrapper.

