# P31 handoff — Fate 20 / d20 / mesh / command center (repo-grounded)

**Purpose:** Give a local coding agent a **single, honest map** of what exists in **this workspace** vs what appears only in external chats (e.g. Gemini “Trifecta”, Cloudflare `command-center` Worker, PeerJS mesh).  
**Audience:** Opus, Claude, Cursor, or any executor with repo access.  
**Rule:** Do not treat chat logs as deployed truth; use **files + `npm run verify`** as proof.

---

## 1. Conceptual split (avoid mixing layers)

| Layer | Meaning in P31 | Where it lives |
|--------|----------------|----------------|
| **Fate 20 (assistive)** | Twenty **orientation** outcomes, icosa / d20 metaphor, **client-only CSPRNG**, not legal evidence | `p31ca` `magic-crystal.html`, `d20-omnibus-icosa.html`, `p31-fate-twenty.json` |
| **OQE “20 contradictions”** | **Forensic** list (docket-sourced); narrative/theater UI (D20 radar, etc.) is **separate content** | **Shipped (scaffold):** `public/p31-oqe-twenty.json` (`p31.oqeTwenty/1.0.0`) + `public/oqe-icosa.html` + short **`/oqe`**; verifier `scripts/verify-oqe-icosa.mjs`. Do not mix with `p31-fate-twenty.json` |
| **K₄ mesh (product)** | Family / personal topology, Workers, `k4-personal`, hub static surfaces | `AGENTS.md`, `p31-constants.json`, `andromeda/04_SOFTWARE/k4-personal`, hub `connect.html`, etc. |
| **Local operator console** | **Whitelisted** `execFile` actions on **your machine** | Home repo `scripts/p31-local-command-center.mjs` + `scripts/command-center/*` |
| **Remote “command center” Worker** | Third-party or aspirational unless a `wrangler.toml` exists in **this** tree | **Not verified** in this handoff; do not assume `command-center.trimtab-signal.workers.dev` is this repo |

---

## 2. OQE icosa (forensic — p31ca)

| File | Role |
|------|------|
| `andromeda/04_SOFTWARE/p31ca/public/p31-oqe-twenty.json` | `p31.oqeTwenty/1.0.0`; **`contradictions` length 20**, faces **1..20**; curate with counsel; **not** Fate 20 copy |
| `andromeda/04_SOFTWARE/p31ca/public/oqe-icosa.html` | Browses faces; **no CSPRNG**; loads OQE JSON only; links to Oracle/D20 for assistive use |
| `andromeda/04_SOFTWARE/p31ca/scripts/verify-oqe-icosa.mjs` | CI: JSON shape, HTML strings, `ground-truth` routes, `_redirects` `/oqe` |
| `scripts/oqe-icosa-e2e.mjs` (home) | Playwright: `http.server` with **CWD = p31ca `public/`** → `oqe-icosa.html` + `p31-oqe-twenty.json` — `npm run test:oqe-icosa:e2e`; in **`p31:all`**; Task **P31: OQE icosa e2e** |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | Routes: `oqeTwentyLexicon`, `oqeIcosa` (`registryId: oqe-icosa`); `edgeRedirects` **/oqe**; `registryAppUrlInvariants` **oqe-icosa → oqe-icosa.html** |
| `andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs` + `hub-app-ids.mjs` | Hub card **oqe-icosa** (cockpit grid) + `oqe-icosa-about.html` via `generate-about-pages` — same id set rules as all hub products |

---

## 3. Canonical Fate 20 + d20 (production path — p31ca)

**Single lexicon (do not duplicate the 20 strings in HTML):**

| File | Role |
|------|------|
| `andromeda/04_SOFTWARE/p31ca/public/p31-fate-twenty.json` | Schema `p31.fateTwenty/1.0.0`; **`readings` length 20**; each `{ tag, tone, text }` |
| `andromeda/04_SOFTWARE/p31ca/public/magic-crystal.html` | Lattice Oracle; `fetch("/p31-fate-twenty.json", { cache: "no-store" })`; `/oracle` redirect |
| `andromeda/04_SOFTWARE/p31ca/public/d20-omnibus-icosa.html` | Ultimate Decision Maker; same fetch; **face 1..20 ↔ index order**; short URLs `/d20`, `/decide` |
| `andromeda/04_SOFTWARE/p31ca/scripts/verify-lattice-oracle.mjs` | CI gate: JSON shape + both HTML consumers + `_redirects` + `lattice.html` + `ground-truth` routes |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | Routes: `latticeOracle`, `fateTwentyLexicon`, `d20OmnibusIcosa`; `edgeRedirects` for `/oracle`, `/d20`, `/decide` |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/synergetic-manifest.json` | Lists `dome-astro` and `d20-omnibus-static` as sibling surfaces |

**Agent rules when editing:**

1. **Never** paste 20 readings back into `magic-crystal.html` or `d20-omnibus-icosa.html`; extend **`p31-fate-twenty.json`** only.
2. After JSON edits: `cd andromeda/04_SOFTWARE/p31ca && node scripts/verify-lattice-oracle.mjs`.
3. Preserve **honest randomness** (`crypto.getRandomValues`); do not fake “natural 20” by skewing distribution.
4. **Natural 20** on the die is a **UX seal** for face 20; the reading still comes from the **shared table** (face index 19).

---

## 4. Sovereign Cockpit dome (Astro) + Fate node

| File | Role |
|------|------|
| `andromeda/04_SOFTWARE/p31ca/src/pages/dome.astro` | Shell UI |
| `andromeda/04_SOFTWARE/p31ca/src/scripts/dome-cockpit.ts` | `VERTICES` / `EDGES`, inspector, **optional `links`** on nodes, **`?node=fate-twenty`** deep link, URL `replaceState` sync |

**Deep link examples:** `/dome/?node=fate-twenty`, `/dome/?node=oqe-icosa` (trailing slash per Astro; `oqe-icosa` is the forensic OQE vertex).  
**LAN / phone:** Dome is **static + Three** on p31ca; it is not the local npm command center.

---

## 5. Spikes & experiments (not the shipped hub lexicon)

| Path | Role |
|------|------|
| `spikes/d20-geodesic-icosahedron/README.md` | Index: Omnibus Three.js spike, CSS/React “holographic” D20, Natural 20 seal |
| `spikes/d20-geodesic-icosahedron/omnibus-icosa-three-r128.html` | Older Three r128 demo |
| `spikes/d20-geodesic-icosahedron/react/HolographicD20.tsx` | CSS-3D style component (Tailwind-oriented) |
| `spikes/d20-geodesic-icosahedron/react/GeodesicSeal.tsx` | Seal interaction; **lucide-react** (`Gem`, `Rotate3d`) |

**Agent rule:** Spikes are **not** wired to `verify-lattice-oracle`. If you port spike UI into p31ca, still keep **one** JSON lexicon for Fate 20 assistive copy.

---

## 6. Local command center (home repo — operator machine)

| Path | Role |
|------|------|
| `scripts/p31-local-command-center.mjs` | HTTP server, **whitelist** `POST /api/run`, serves UI |
| `scripts/command-center/command-center.js` | Client: filter, run actions, **in-page confirm** modal, **rewrites `127.0.0.1` → current host** for phone |
| `scripts/command-center/command-center.css` | Mobile docked output, safe areas, 48px taps |
| `scripts/command-center/server-smoke.mjs` | CI smoke: `/`, assets, **`/manifest.webmanifest`** |

**iPhone on same Wi‑Fi:** `P31_CMD_CENTER_LAN=1 npm run command-center` — see console for **LAN URL**; Safari → Add to Home Screen. **Security:** LAN bind exposes whitelisted actions to anyone on the network.

This is **not** a substitute for `k4-personal` or BONDING WebRTC; it is a **local build/verify remote control**.

---

## 7. What the long chat added narratively but did not canonize here

- **PeerJS “Delta mesh”** with no central server: requires **signaling** in practice; if you implement, specify TURN/STUN and security model; do not claim “no central server” without a design note.
- **0.1 Hz vagal pulse:** Larmor / breath UX appears in dome Layer 0 and docs; syncing across **P2P** is a separate feature with clock skew and consent.
- **Gemini-generated Cloudflare Worker HTML** (Carrie, ledger, legal/financial cards): treat as **prototype** unless the same files exist under `andromeda/` with tests.
- **Full legal docket synthesis:** operational for humans; **do not** embed in public static JSON without review.

---

## 8. Suggested build order for a local agent (“today”)

1. **Clone + partial Andromeda:** ensure `andromeda/04_SOFTWARE/p31ca` exists.  
2. **`npm run setup`** (home) per `AGENTS.md`.  
3. **`cd andromeda/04_SOFTWARE/p31ca && npm run verify`** (or at least `node scripts/verify-lattice-oracle.mjs` and `node scripts/verify-oqe-icosa.mjs`).  
4. **Local previews:** `npm run demo` (home, port 8080) and/or p31ca dev as per `P31-ROOT-MAP.md`.  
5. **Operator console:** `npm run command-center` (optional `P31_CMD_CENTER_LAN=1` for phone).

---

## 9. One-line mission for the model

**Extend the mesh only along verified edges:** one Fate lexicon file (assistive) + one OQE lexicon file (forensic) with separate verifiers, Fate consumer pages, OQE surface + `/oqe` redirect, ground-truth aligned; dome links for discoverability; local command center for build gates; spikes optional. Anything else is a **new CWP** with its own threat model.

---

*Handoff version: 2026-04-27 — aligned to repo layout under `/home/p31` (home + optional `andromeda/`).*
