# SPIKE — AppShell starfield persistence (p31ca consolidation gate)

**Track:** 2.5 (operator-added between Track 0 ship and Track 2 GEODESIC).
**Status:** queued. Not started.
**Time-box:** 2–4 days.
**De-risks:** 4–6 weeks of p31ca.org structural overhaul (7-route consolidation, AppShell with persistent starfield, dome orbit controls).
**Out of scope of GEODESIC:** GEODESIC ships in its own canvas; this spike is about the *shell* surrounding all routes.

---

## The architectural question this spike answers

> Can a single Three.js / starfield WebGL canvas survive **route navigation** on the p31ca Astro site (e.g. `/` → `/dome` → `/`) without re-initialising — i.e. without a black flash, a context loss, or a memory leak — on the **real operator hardware** (Pixelbook + iPhone via Tailscale + Camden Library Chromebook)?

If **yes** → the full p31ca consolidation (7-route AppShell, persistent atmosphere, lerp transitions between rooms) is feasible. We can spec the consolidation as a Tier-1 WCD and start it.

If **no** → fall back to SPA routing for p31ca (or scope-limit consolidation to 2–3 routes that share a Worker SPA boundary). Either way we know before we start the big rewrite.

Cost of being wrong without this spike: 4–6 weeks of work that has to be torn down. Cost of the spike: 2–4 days.

---

## Stop conditions

- Two routes (`/` and `/dome`) navigate back-and-forth **20×** with no visible black flash on a real Chromebook in field conditions (cellular tether, low battery, throttled CPU). → **green; proceed to consolidation spec.**
- WebGL context is lost on any navigation, OR memory grows unbounded (>20 MB / 20 navigations), OR FPS drops below 30 on Chromebook after sustained navigation. → **red; consolidation is blocked; document the failure and pivot to SPA routing.**
- Any of: bfcache breaks the canvas, Astro `transition:persist` mis-handles the canvas DOM node, Three.js renderer needs a `.dispose()` + re-init that visibly flashes. → **yellow; needs a workaround spike of its own; do not proceed to full consolidation.**

## Acceptance criteria (green path)

1. **One canvas, one context.** A single `<canvas>` element with a single `WebGL2RenderingContext` is created on first page load and never re-created during navigation between `/` and `/dome`.
2. **Persistence mechanism.** Astro `transition:persist` on the canvas + a top-level mount script that yields the canvas to whichever route currently owns the camera/scene config (atom of state, not destroy/recreate).
3. **Lerp transition.** The starfield camera position interpolates over ~600ms when navigating between routes — proves the canvas is the **same object across routes**, not two canvases swapped.
4. **No bfcache regression.** Back/forward navigation (browser back button, two-finger swipe on iPad) does not lose the WebGL context.
5. **Reduced-motion compliance.** With `prefers-reduced-motion: reduce`, the lerp is replaced by an instant snap; canvas still persists.
6. **Field test.** Operator drives 20 round-trips on a Chromebook + iPhone and reports "the sky stays."

## Out of scope of this spike

- The other 5 p31ca routes (only `/` and `/dome` need to be wired).
- GEODESIC interior (lighting, shadows, line weight) — that is Track 2.
- Atmosphere particle morphing across routes (queued for after consolidation lands).
- Mobile-only WebGL2 quirks not blocking the two-route case.

## Spike artefacts (if green)

- `andromeda/04_SOFTWARE/p31ca/src/components/AppShell.astro` — minimal shell with persistent canvas slot.
- `andromeda/04_SOFTWARE/p31ca/src/lib/starfield-singleton.ts` — module-level singleton owning the canvas + context.
- One-page report `andromeda/04_SOFTWARE/p31ca/docs/SPIKE-APPSHELL-RESULT.md` with: navigation count, FPS distribution, memory delta, screen capture or photo.
- A row in `p31-alignment.json` if the singleton becomes a derivation source.

## Spike artefacts (if red)

- One-page report `andromeda/04_SOFTWARE/p31ca/docs/SPIKE-APPSHELL-RESULT.md` documenting the failure mode (WebGL context loss class, browser, repro steps).
- A "do not consolidate" entry in `docs/PARKING-LOT.md` with the reason and the SPA-routing fallback plan.

---

## Why this is Track 2.5 (not Track 2 or Track 3)

This spike sits between **shipping the unification** (Track 0, done) and **GEODESIC interior polish** (Track 2). It does not block GEODESIC — GEODESIC ships in its own canvas regardless. But it **gates** the much larger p31ca structural overhaul, which is the next big architectural commitment. Doing the spike first means GEODESIC can ship in parallel without anyone needing to commit to a consolidation strategy yet.

The decision point ("consolidate vs SPA") is owned by the operator; this spike just produces the data.
