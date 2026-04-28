# C.A.R.S. — product naming (canonical)

**C.A.R.S.** expansions spell **Collaborative Affective Realtime Sim**.

**Social molecules:** people and local sim entities share one field — your molecules plus **ghost molecules** interpolated from networked peers (`SoupEngine`). Not “social soup”; the medium is simulated chemistry + affect overlay.

| Layer | Meaning |
|--------|---------|
| **Collaborative** | WebSocket rooms, roster, `playerState`, shared reactions field |
| **Affective** | Personalities (“emotional kinematics”), zones, valence/arousal/cognitive load |
| **Realtime** | Game loop + heartbeats + network interpolation (~2 Hz updates to ghosts) |
| **Sim** | Atoms, bonds, `SoupPhysics`, reactions, LOD |

**Wire (multiplayer, machine-gated):** **`cars-contract/p31.carsWire.json`** (`p31.carsWire/0.1.0`). **`npm run verify:cars-wire`** locks message `type` strings to **`Spikes/mock-ws-server/server.js`** + **`src/soup.ts`**.

**Legacy / repo:**

- **`bonding-soup`** — npm **`package.json` `name`** (unchanged; GitHub **`p31labs/bonding-soup`**). **CLI:** **`p31`** on **`PATH`** via **`npm run p31:link`** → **`~/.local/bin/p31`** (**`scripts/p31-launcher.sh`** resolves **`ROOT`**). See **`docs/P31-STARTUP-PACKAGE.md`** (exact **`/home/p31`** block for penguin).
- **`soup.html`**, **`soup:*`** scripts — filenames stay; **BONDING** in mission copy (labs EIN 424/32, etc.) is unrelated.

**Deployed URL:** `https://bonding.p31ca.org/soup` (bonding vertical; path unchanged).

**When-scale roadmap doc:** still `docs/PLAN-BONDING-SOUP-WHEN-SCALE.md` — title in-file uses **C.A.R.S.**; filename kept for stable links.

Last aligned: repo root **`README.md`**, this file, **`cars-contract/p31.carsWire.json`**, and **`scripts/verify-cars-wire.mjs`**.
