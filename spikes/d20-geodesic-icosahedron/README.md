# 20-Sided Geodesic Dice (Icosahedron) — consolidated reference

This folder consolidates code and notes for the **D20 / icosahedron** stack: Omnibus Three.js sphere, CSS-3D React “holographic” D20, and the **Natural 20** seal interaction.

## 1. Geodesic Omnibus sphere (Three.js standalone)

High-fidelity interactive 3D icosahedron; faces map to research papers; `Raycaster` for face clicks.

**Canonical (deployed hub):** `https://p31ca.org/d20` → **Ultimate D20** — 20 separate face meshes, **Three.js r160** + OrbitControls, **CSPRNG** roll + spin/settle, **Fate 20** text **same order** as `magic-crystal.html`, Natural 20 banner on face 20, `p31-style.css`. Synergetic manifest + ground-truth `threejs` pinned.

**Spike copy:** [`omnibus-icosa-three-r128.html`](./omnibus-icosa-three-r128.html)  
**Stack:** Three.js **r128** (CDN). Open locally or use the hub URL above.

## 2. Holographic reflective D20 (CSS-3D React)

Reflective-style D20 using CSS 3D transforms; 20 labeled points on a spherical lattice; no Three.js in this variant.

**File:** [`react/HolographicD20.tsx`](./react/HolographicD20.tsx)  
**Note:** Written for **Tailwind**-style utility classes; integrate into a Tailwind app or map classes to your design system.

## 3. “Natural 20” geodesic seal interaction

“Roll for sovereignty” flow ending in a **Natural 20** outcome.

**File:** [`react/GeodesicSeal.tsx`](./react/GeodesicSeal.tsx)  
**Note:** Includes embedded `<style>` for `animate-spin-slow` so it can run without extra Tailwind plugins. Still uses Tailwind-like utilities for layout/colors—adjust to **p31 titanium/glass** tokens when wiring into p31ca. Depends on **`lucide-react`** (`Gem`, `Rotate3d`). Runtime deps are listed in [`react/package.json`](./react/package.json).

### Vite demo (optional)

From `react/`: `npm install` then `npm run build` (output in `react/dist/`). `npm run dev` serves the two components with **Tailwind via CDN** in [`react/index.html`](./react/index.html). For production, prefer wiring the `.tsx` files into a Tailwind-configured app instead of the CDN.

## Synthesis (D20 protocols)

| Topic | Detail |
|--------|--------|
| **Geometry** | \(V = 12\), \(E = 30\), \(F = 20\) |
| **Logic** | Each face can represent one of **20 research papers** (Omnibus mapping). |
| **UI identity** | **Titanium / glassmorphic** tokens (cyan accent `#00f3ff`, dark base). |
| **Goal** | “Natural 20” as a **celebratory / success** state in the seal UX (product copy is author’s; keep assistive/ethics framing when shipping publicly). |

**Related (repo):** Epic **Fate 20** / icosa orientation — `docs/WORK-PACKAGE-SYNERGETIC-GEODESIC-STACK.md`. Hub **Lattice Oracle** (`p31ca` `magic-crystal.html`) uses **20 CSPRNG outcomes** aligned with icosa face count; geometry demos in this spike are separate visual/UX experiments.

---

*Geometry is destiny. The icosahedron is sealed.*
