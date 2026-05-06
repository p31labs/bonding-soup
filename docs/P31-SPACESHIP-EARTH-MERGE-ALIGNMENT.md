# Spaceship Earth — Dashboard Merge & Integration

**Document:** P31-SPACESHIP-EARTH-MERGE-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** SE Three.js spatial shell + SIMPLEX /simplex data panel merge, room routing, cockpit state, coherence feed  
**Baseline:** SE alignment patch applied (viewPerspective fix, dead hook deleted, GC scratch objects, zustand ^5)

---

## 0. THE MERGE DECISION

From the May 2 ecosystem refactor:

> Spaceship Earth is the Three.js spatial shell. `/simplex` dashboard is the data-driven panel within it. They merge. The React route is `/simplex` inside the Spaceship Earth shell.

These are not two products. They are one surface with two layers:

| Layer | What It Is | Source |
|-------|-----------|--------|
| Spatial shell | Three.js geodesic dome, IVM grid, room navigation, molecule visualization | apps/web/ (Spaceship Earth) |
| Data panel | Spoon meter, LOVE balance, agent status, Q-Factor, med schedule | WCD-SIMPLEX-05 (4 React components) |

The data panel renders INSIDE the spatial shell. Not as a separate route. Not as a separate page. The `/simplex` route loads Spaceship Earth, which mounts the SIMPLEX panel as a HUD overlay on the cockpit view.

---

## 1. ROOM ROUTING ARCHITECTURE

Spaceship Earth uses hash-based room routing (no react-router dependency).

**Registry:** `rooms/index.ts` → `ROOMS` array  
**Pattern:** Each room = one import + one array entry

| Room | Hash | Status | Source |
|------|------|--------|--------|
| Observatory | `#observatory` | Live | ObservatoryRoom.tsx |
| Collider | `#collider` | WCD-SE01 (authorized) | ColliderRoom.tsx |
| Soup | `#soup` | Planned | SoupEngine feed from CARS |
| Breathing | `#breathing` | Planned | 4-4-6 pulsing atoms |
| Calcium | `#calcium` | Planned | MEDIC agent feed |
| Buffer | `#buffer` | Planned | HERALD agent feed |
| SIMPLEX | `#simplex` | WCD-SIMPLEX-05 | 4 data panel components |

Adding a room = one import + one `ROOMS.push()`. The Collider (WCD-SE01) proved the pattern. Everything after is mechanical.

---

## 2. COCKPIT STATE (POST-ALIGNMENT PATCH)

The March 14 alignment patch fixed critical issues:

| Issue | Fix | File |
|-------|-----|------|
| `cameraMode` → `viewPerspective` | All references updated via sed | ImmersiveCockpit.tsx |
| `useAutopoieticLoop` dead hook | Deleted file + all imports | useAutopoieticLoop.ts (DELETED) |
| GC allocation in animate loop | 6 module-scope scratch objects + 5 find-replace | ImmersiveCockpit.tsx |
| zustand ^4 → ^5 | Package bump | package.json |
| OrbitState not exported | Export injected | observatoryBuilder.ts |
| SovereignShell dead import | Stripped | SovereignShell.tsx |

**Verification post-patch:**
```bash
cd spaceship-earth
npx tsc --noEmit          # 0 errors
npm run build             # clean
npx vitest run            # 7 suites pass
grep -rn "cameraMode.*GODHEAD\|GODHEAD.*cameraMode" src/  # 0 results
```

---

## 3. COHERENCE FEED (CARS → SE)

SoupEngine produces coherence data. Spaceship Earth consumes it to drive the dome visualization.

| Data | Source | SE Consumer | Binding |
|------|--------|------------|---------|
| Coherence ψ (0–1) | SoupEngine.tickCoherence() | Dome opacity/glow | `--p31-coherence-psi` CSS var |
| Breath phase | SoupEngine.tickBreath() | Atom pulse rhythm | `--p31-breath-phase` CSS var |
| Zone temperature | SoupEngine.getZoneTemperature() | Dome color temperature | `--p31-zone-temperature` CSS var |
| Molecule count | SoupEngine local state | Observatory star count | Direct Zustand read |
| LOVE balance | STEWARD agent via /api/love | Wallet glow intensity | API poll or WS |
| Q-Factor | ORACLE agent via /api/synthesis | Dome structural integrity viz | API poll |

**Gap:** No live data pipe from SoupEngine to SE exists yet. The CSS variable bindings are spec'd in `soup-quantum.css` but not wired to the SE Three.js render loop.

**Fix (WCD-CARS-INTEG-01):** SoupEngine exposes coherence/breath/zone as a Zustand slice. SE subscribes. The Three.js render loop reads the slice values each frame to modulate dome appearance.

---

## 4. SIMPLEX DASHBOARD COMPONENTS (WCD-SIMPLEX-05)

4 React components that compose the data panel:

| Component | Data Source | What It Shows |
|-----------|-----------|---------------|
| SpoonMeter | /api/state | Current spoons / max, daily burn rate, refill ETA |
| LoveBalance | /api/love | LOVE balance, recent ledger entries, earning rate |
| AgentStatus | /api/health | 11-agent grid, each showing UP/DOWN/STALE |
| QFactorDial | /api/synthesis | Q-Factor score (0–1), 4-vertex breakdown (energy, tasks, environment, creation) |

**Mounting:** These render as a HUD overlay in the ImmersiveCockpit. Workshop layout — sidebar (data panel) + main (3D dome). Sidebar collapses to icons on mobile. Gray Rock default: sidebar collapsed, one number visible (Q-Factor). Alive: sidebar expanded on intent.

**Dependency:** Needs live SIMPLEX Worker for API endpoints. WCD-SIMPLEX-02 (Worker deploy) must complete before WCD-SIMPLEX-05 can wire real data.

---

## 5. 10-PATTERN AUDIT (COMPLETED)

The Spaceship Earth 10-pattern audit was completed pre-production-2026-04-28 tag. All 10 patterns verified clean:

1. No hardcoded colors (all on `--p31-*` tokens)
2. Reduced-motion media query on all animations
3. Focus-visible on all interactive elements
4. Semantic HTML structure (landmarks, headings)
5. Touch targets ≥ 48px
6. Color contrast ≥ 4.5:1 (AA)
7. No `any` types in TypeScript
8. All Zustand stores typed
9. Build clean, tsc clean
10. Test suites pass

---

## 6. WCD SEQUENCE

| WCD | Scope | Effort | Dep |
|-----|-------|--------|-----|
| WCD-SE-01 | Collider Room integration (pattern proof) | 1 day | None |
| WCD-SE-02 | SoupEngine → SE Zustand coherence bridge | 1 day | CARS-OPT-01 |
| WCD-SE-03 | #simplex room mount + 4 dashboard components | 2 days | SIMPLEX-02 (Worker live) |
| WCD-SE-04 | #breathing room (4-4-6 atom pulse) | 1 day | SE-02 (breath data) |
| WCD-SE-05 | #calcium room (MEDIC agent feed) | 1 day | SIMPLEX-02 |
| WCD-SE-06 | #soup room (SoupEngine embed) | 2 days | CARS-OPT-01 |
| WCD-SE-07 | Mobile Workshop layout (sidebar → bottom sheet) | 1 day | SE-03 |

---

*The dome is the dashboard. The rooms are the features. The geometry holds the data.*
