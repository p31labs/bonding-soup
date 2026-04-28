# GEODESIC — static builder, progressive coach, and K₄ live room

**Status:** shipped (p31ca) · **Code:** `andromeda/04_SOFTWARE/p31ca/public/geodesic.html` · **Ground-truth key:** `routes.geodesic` in `p31ca/ground-truth/p31.ground-truth.json` · **Updated:** 2026-04-26

This document is the **human- and agent-facing** specification for the **GEODESIC** surface: the Three.js structure builder, the **5-track progressive on-ramp** (coach), and the optional **Durable Object–backed K₄** multi-user room. The design intentionally mirrors **BONDING**’s `TutorialOverlay` and quest progression patterns (short steps, celebration toasts, skip with no penalty, `localStorage` resume) so the **learning curve** stays approachable for younger players, including those used to **Roblox-style** pick-up-and-play without reading a manual.

---

## 1. Public URLs and redirects

- **Static builder:** `https://p31ca.org/geodesic.html` or `/geodesic` (may 308-redirect; query params are preserved).
- **K₄ live (expert, no coach):** append **`?room=<id>`** where `<id>` is `1–64` characters from `[a-zA-Z0-9_-]`. Example: `https://p31ca.org/geodesic?room=k4-family`.
- **Worker (authoritative K₄ state):** `wss://geodesic-room.<account>.workers.dev` — the production hostname is recorded in the **note** of `p31.ground-truth.json` and in the **inline** `WS_BASE` in `geodesic.html` (update both when the deployment URL changes). Package: `andromeda/04_SOFTWARE/geodesic-room/`.

---

## 2. Two modes (mutually exclusive on load)

| Mode | Trigger | Coach | 3D content |
|------|---------|--------|------------|
| **On-ramp** | No `?room=`, or invalid `room` | **On** (unless campaign finished / skipped) | Seeded **tet**, toolbar, campaign |
| **K₄ live (expert)** | Valid `?room=` | **Off** (hidden) | BONDING-style family labels on a **tetra**; WebSocket to **GeodesicRoom** DO |

Live mode is **expert on purpose:** no hand-holding, same URL pattern for “join this room” sharing. The coach is suppressed via `isLiveMode` and `renderCoach` / `fireCoachEvent` early returns.

---

## 3. Progressive tracks and unlocks (the “learning curve”)

The campaign is defined **inline** in `geodesic.html` as `CAMPAIGN.tracks[]`. Each **track** has:

- `id` — machine id  
- `label`, `emoji` — coach copy  
- `unlock` — **array of DOM element `id`s** to unlock when the player **finishes the previous** track and **enters** this track (applied in `advanceCoach` via `coachUnlockThrough` after a full track rolls forward)  
- `steps[]` — each step: `id`, `msg` (imperative, one line), `emoji`, `waitFor`, optional `celebration` (center toast, ~2.2s)

**Child-friendly verbs** in the design (not in code ids): *Look → Move → Connect → Build → Share.*

| Order | Track id | Verbs (design) | What the player does | Unlocks (toolbar / actions) |
|------:|----------|------------------|------------------------|--------------------------------|
| 0 | `explorer` | **Look** | **Orbit** the scene (OrbitControls **`start`**, not `change` — avoids first-frame false completes), then **scroll** to zoom | *(none; advances to next track)* |
| 1 | `scootch` | **Move** | **Drag** the first (green) tet to the **pulsing teal ring** (XZ reach check; `RING_POS` vs `shapes[0]`) | *(none)* |
| 2 | `sticky` | **Connect** | **Add** a second tet, **turn on Auto-snap**, **release** a drag that triggers a real **corner snap** | `btn-snap` (unlocked when you **enter** this track) |
| 3 | `builder` | **Build** | **Add an octahedron**; then **any tap** on the canvas after a build drag | `btn-oct`, `btn-ico`, `btn-cube` |
| 4 | `mesh` | **Share** | **any_tap** to acknowledge **Join Live Room** | `btn-join-room` |

**Locked tools:** `button.locked` — **~22% opacity**, `pointer-events: none`, **not** `display: none` so kids see the **full palette** coming. Unlock removes the class in `coachUnlockThrough`.

**Skip:** `skipCampaign()` sets `coachDone`, saves progress, `coachUnlockThrough` the last track index, hides the placement ring, refreshes the help HUD. **No penalty** — same philosophy as BONDING.

---

## 4. Persistence — `localStorage`

- **Key:** `geodesic:progress:v1`
- **Value:** `JSON` `{ "track": number, "step": number, "done": boolean }`  
- **Load:** IIFE on parse sets `coachTrackIdx`, `coachStepIdx`, `coachDone` before first paint.  
- **Save:** `saveCoachProgress()` on step advances.  
- **Resume unlocks:** On boot (no `?room=`), `coachUnlockThrough(coachTrackIdx)` restores **all** `unlock` rows for tracks `0..coachTrackIdx` **inclusive**, so re-opened sessions match in-session tool access (e.g. Auto-snap after returning mid–Sticky).  
- **Cleared** only if the user clears site data or you bump the key (`v2`) and migrate in code.

---

## 5. Event protocol (`fireCoachEvent` and `waitFor`)

`fireCoachEvent(type)` is a no-op when `coachDone` or `isLiveMode`.

| `waitFor` in step | Fired as `type` | Where it is emitted |
|--------------------|-----------------|----------------------|
| `orbit` | `orbit` | OrbitControls **`start`** (first user orbit only; `_coachOrbitFired` gate) |
| `zoom` | `zoom` | `wheel` (first) **or** Orbit `end` after **pinch dolly** (camera–target distance change from `start` to `end`) |
| `ring_reached` | `ring_reached` | After a **builder** pointer-up, `checkRingReach()` if ring exists and `shapes[0]` is within XZ distance of `RING_POS` |
| `shape_count:2` | `shape_count:N` | `addShape` after push — `N = shapes.length` |
| `snap_enabled` | `snap_enabled` | `toggleAutoSnap` when turning **on** |
| `snap_used` | `snap_used` | `tryCornerSnap` when a real snap delta is applied |
| `shape_added:oct` | `shape_added:oct` | `addShape` with `type` `oct` |
| `any_tap` | `any_tap` | End of a **build** pointer-up (after `tryCornerSnap` / `checkRingReach`); do **not** use for K₄ drags in live mode (coach is off) |
| (equality) | same string | `fireCoachEvent` advances when `step.waitFor === type` or `any_tap` / `shape_count` / `shape_added` rules match (see `fireCoachEvent` in source) |

**Order bug avoided:** the **first** `addShape('tet')` runs in the same boot `else` branch **after** the campaign and `fireCoachEvent` are defined, so the seed tet does not throw on load.

---

## 6. UI components (BONDING-aligned)

| UI | Role |
|----|------|
| `#coach` / `#coach-card` | Main coach card, bottom-left **“Clippy zone”** (safe area aware) |
| `#coach-min` | Minimizes to pill |
| `#coach-pill` | `coachUnminimize` on tap; shows step `emoji` and `m/n` |
| `#coach-toast` | Center-bottom celebration (`.show` = visible) |
| `skip` | `skipCampaign()` |
| `info-help` / `#hud-text` | Non-campaign “spatial building” help when coach is not active; K₄ line overrides in `enterLiveMode` |

**Placement ring (Scootch):** `THREE.TorusGeometry` on the XZ plane, **pulse** scale in `animate`, removed on `hidePlacementRing` (track transition / skip).

---

## 7. Interaction contract (static builder)

- **Left pointer down on shape** (capture): if not live, pick **Group**, drag on **Y-locked** horizontal plane, **setPointerCapture**. **stopPropagation** so Orbit does not steal.  
- **Left on empty** background: **Orbit** as usual.  
- **K₄** (live): only vertex spheres; same pointer pipeline with different hit targets.  
- **Context menu** suppressed on the canvas to reduce accidental browser UI.

---

## 8. K₄ live room (Durable Object)

- **GeodesicRoom** (see `geodesic-room` package): 4 vertices, default labels (family cage), **WebSocket** broadcast, `GET /api/geodesic/:id/state` snapshot.  
- **Builder shapes (live):** Shared **x,y,z** and tabletop **rotY** (yaw, radians) on **`ADD_SHAPE`** / **`MOVE_SHAPE`** — wire **`p31.geodesicRoomWire/0.2.1`**; normative types in **`geodesic-room/src/index.ts`** and **`@p31/shared/geodesic-room-wire`**.  
- **Security inventory:** `p31ca/security/worker-allowlist.json` — public rooms by name, POC; document **P2** auth in allowlist `notes` if you harden.  
- **p31** operator note: the live mesh is **not** the same product as the **K₄** “cage” Worker (`k4-cage`); **geodesic-room** is a **separate** package so family-mesh production traffic stays isolated.

---

## 9. Mobile and touch (responsive)

- **Viewport:** `width=device-width, initial-scale=1` in `geodesic.html`.
- **3D surface:** `touch-action: none` on the WebGL canvas to reduce the browser taking scroll gestures during orbit/drag.
- **Pointer model:** The builder uses the **Pointer Events** API (with `setPointerCapture`) so a single code path supports mouse and touch; Orbit **pinch = dolly (zoom)**, one finger on empty = orbit.
- **Explorer “zoom” step:** Fires on **`wheel`** (desktop) **or** on Orbit `end` when **camera–target distance** changed between `start` and `end` of a gesture (covers **pinch-to-zoom** on phones, without relying on the wheel event).
- **UI:** A **`max-width: 640px`** block increases toolbar button **min height/width (40px)**, tucks the stats panel, allows the HUD and coach toasts to wrap. Very small phone screens in landscape may still have a **tall wrapping toolbar**—acceptable for a first pass; a future “scissors” or sheet menu could reclaim canvas height.
- **Copy:** The zoom line in the **Explorer** track and the **info-help** blurb call out **pinch** for zoom.

**Not a separate native app;** expect best results on a **landscape** phone for canvas area, and use **iOS 13+** (Pointer Events) for full drag/ capture behavior.

## 10. Operations

- **Change campaign copy or steps:** edit the `CAMPAIGN` object in `public/geodesic.html` and bump `localStorage` key if you break old saves, or document migration.  
- **Solo JSON snapshot (portable tableau):** Canonical schema **`p31.geodesicBuildSnapshot/1.0.0`** in `ground-truth/geodesic-build-snapshot.json`; TypeScript import **`@p31/shared/geodesic-build-snapshot`** (`GEODESIC_BUILD_SNAPSHOT_SCHEMA`, `GeodesicBuildSnapshotPayload`); mirrored as `GEODESIC_BUILD_SNAPSHOT_SCHEMA` in `public/geodesic.html`. Verifier **`npm run verify:geodesic-build-snapshot`** (p31ca prebuild) — **ground-truth ≡ HTML ≡ shared** literal. **`Export` / `Import`** on the page (solo): position, tabletop **rotY**, wire/solid prefs, snap pref, Maxwell fingerprint — one file replaces a gallery of screenshots ; teach forward.
- **Change worker URL:** `WS_BASE` in `geodesic.html` + `p31.ground-truth.json` `routes.geodesic.note` + any hub copy that links to live mode.  
- **CI:** `cd andromeda/04_SOFTWARE/p31ca && npm run verify:ground-truth` — the `geodesic` **route** and **label** are part of the contract.  
- **Full hub gate:** `npm run hub:ci` in p31ca per `DEPLOY.md` after public HTML edits.

---

## 11. Related P31 documents

- **Game engine (Unity, Godot, Unreal, …) + same WebSocket wire:** `docs/GEODESIC-GAME-ENGINE-INTEGRATION.md` — `wss` + JSON, `GET /state`, limits; `geodesic-room/README.md`  
- **Synergetic / dome stack (product epics, not the same as this on-ramp):** `docs/WORK-PACKAGE-SYNERGETIC-GEODESIC-STACK.md`  
- **BONDING** reference implementation (React): `andromeda/04_SOFTWARE/bonding` — `TutorialOverlay.tsx`, `QuestHUD`, `store/gameStore`, `engine/tutorial`, `engine/quests`  
- **Root map (where this doc lives):** `P31-ROOT-MAP.md` §5

---

*P31 Labs, Inc. · EIN 42-1888158 — documentation for the technical hub; not child-directed marketing. Parental guidance for shared live URLs (`?room=`) is recommended.*
