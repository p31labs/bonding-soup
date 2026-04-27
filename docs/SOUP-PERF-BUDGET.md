# BONDING Soup — performance budget (Chromebook-class)

**Pairs with:** `docs/CWP-SOUP-MVP-SEQUENCE-2026-01.md` (step 2).  
**Scope:** `soup.html` + 2D canvas + `requestAnimationFrame` main loop, local static delivery (`npm run demo` or equivalent; **path/port:** `docs/SOUP-LOCAL-DEMO.md`).

---

## Why this exists

Household “first contact” often runs on **low-end laptops** (e.g. school **Chromebook** tier: ~4 GB RAM, modest integrated graphics, 1366×768–1920×1080). A small written budget keeps optimization **measured** instead of speculative.

---

## How to measure

1. **Preferred:** a **real Chromebook** (or similar), same LAN as the static server, load Soup after `npm run demo` (or your deployed `soup` URL). Let the sim run 2–5 minutes; interact occasionally (zones, co-presence if testing room).
2. **Quick console probe:** append **`?perf=1`** to **`soup.html`** — every **120 frames** the page logs **`[Soup perf] avg frame … ms`** to the browser console (wall time between animation frames). Pair with the **FPS** readout in the status row.
3. **Fallback:** **Chrome DevTools** → **Performance** → set **CPU: 6× slowdown**; record **10–20 s** while the bowl is active. Use this to approximate CPU-bound jank, not GPU or thermals.

Throttling **does not** replace a physical device when you need a ship/no-ship call on “does it feel okay.”

---

## Frame budget (main thread)

| Tier | Time per frame | Approx. steady FPS | Use |
|------|----------------|-------------------|-----|
| **Target** | **≤ ~16.7 ms** | **≥ ~60** | Primary goal when thermals and content allow. |
| **Acceptable (MVP)** | **≤ ~33.3 ms** | **≥ ~30** | Still shippable for co-presence + sim; file issues if **sustained** below 30 FPS at default limits. |

Map **in-app** feedback to the **FPS** readout in the status row. Confirm spikes and long tasks in the Performance panel **Main** and **Frames** tracks.

---

## MVP pass criteria

- **Median** frame time **≤ ~33 ms** (or in-app FPS **≥ ~30** sustained) on the test profile above with **default** sim parameters and **typical** room use (1–2 tabs, same `room` string, no artificial overload).
- No repeated **&gt; 200 ms** main-thread **long tasks** during normal play. Occasional GC or layout blips are acceptable if rare and not user-visible stutter.

---

## Static server vs sim (decision hook)

**Do not** replace `python3 -m http.server` / `npm run demo` with a custom static server **only** to fix frame drops. If **TTFB** or **transfer** dominates (e.g. consistent &gt; 100 ms TTFB on LAN for small assets), treat **delivery** as the bottleneck. If frame time is high while assets are **already cached**, optimize **render + physics** first (`CWP` step 3).

---

## Related

- `docs/PLAN-BONDING-SOUP-WHEN-SCALE.md` — when-scale phases and room gate.
- `docs/sprint-1-completion.md` — prior notes on fixed timestep, LOD, and 60 / 30 Hz split.
