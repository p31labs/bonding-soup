# P31 mesh architecture — canon (shipped · next · doctrine)

**Schema:** human normative (`p31.meshArchitectureCanon/1.0.0` intent)  
**Verify:** `npm run verify:mesh-canon` — doc anchors + (when `andromeda/` is present) code invariants for the Shipped section  
**Related:** `docs/MESH-MAP-PERSONAL-START-PAGES.md` (phased PAR + bridge direction)

---

## Canonical summary (grant · README · regulator safe)

> The mesh is the edge-native K₄ substrate (KV topology + DO cells + explicit cage scope) that every surface reads or warms; apps are projections; the hard part is keeping personal spin state and shared cage geometry isolated until a consent-shaped bridge says otherwise.

This sentence claims only what exists today as **edge Workers + KV scoping + Durable Objects + static thresholds**. It does not claim LoRa hardware, end-to-end haptics, or bridge consent storage.

---

## Shipped (grounded in this repository today)

### Shared library: `k4-mesh-core`

- Package: `andromeda/04_SOFTWARE/packages/k4-mesh-core/`.
- **`scopes.js`** defines two **vertex label sets** on the same **K₄** graph:
  - **Family (root) scope:** vertices `will`, `sj`, `wj`, `christyn` and the six undirected edges between them.
  - **Personal scope:** vertices `a`, `b`, `c`, `d` and the six edges of the complete graph on those labels.
- KV keys are **scope-segmented** (e.g. `k4s:root:…` vs `k4s:personal:…`) so a Worker binding the same `K4_MESH` namespace **cannot address another scope’s keys by mistake** without constructing the other prefix — see `scopedVertexKey` / `scopedEdgeKey` in `scopes.js`.
- **`buildMeshPayload`** returns a **versioned** payload (`api.version` / `MESH_PAYLOAD_VERSION` — currently **`1.1.0`** in `scopes.js`, schema `p31.k4mesh.payload`) including `topology: 'K4'`, counts, `mesh: { vertices, edges }`, vitality fields, and `connect` hub metadata when passed in.

### Worker: `k4-personal` (personal cell)

- Path: `andromeda/04_SOFTWARE/k4-personal/`.
- **`GET /api/mesh`** — personal lattice only: **`buildMeshPayload(env, 'personal', …)`**. Vertices in JSON are **`a`–`d`**, not family names. **`personal-handlers.js`** header: *no family telemetry chain* on this path.
- Other mesh API routes (same Worker): `GET /api/health`, `GET /api/snapshot`, `GET /api/vertex/:id`, `POST /api/presence/:id`, `POST /api/ping/:from/:to`, `GET /viz`.
- **Durable Object:** `PersonalAgent` — **`/agent/:userId/*`** (chat, state, manifest, tetra-related behavior per package README).
- **HTML shell:** `GET /u/:userId/home` — tetra home page in Worker.
- **Hub static threshold:** `andromeda/04_SOFTWARE/p31ca/public/mesh-start.html` — probes Worker health, tetra / agent endpoints, SOULSAFE prefs sync; **single** static surface (no per-role branching yet).

### Worker: `k4-cage` (family cage)

- Path: `andromeda/04_SOFTWARE/k4-cage/src/index.js`.
- **Named vertices:** `will`, `sj`, `wj`, `christyn` (six edges as in file header).
- **REST:** `/api/mesh`, `/api/vertex/:id`, `/api/presence/:id`, `/api/ping/:from/:to`, `/api/edge/:a/:b`, telemetry routes, WebSocket room — see file header comment block.

### Physical design artefact

- **`design-assets/stl/P31_K4_Topology.stl`** — four vertices, six edges as a tangible spec (not a clinical or legal claim).

---

## Next (specified direction or partial links — not end-to-end product promises)

| Item | Status |
|------|--------|
| **Bridge consent** (`bridges[]`, Genesis attestation, cage reads only declared fields) | Described in `MESH-MAP-PERSONAL-START-PAGES.md`; **not** stored in DO state in-repo today. |
| **Per-role dock pruning** on `mesh-start.html` (e.g. one dock vs four) | Target UX; current page renders one tetra grid for all. |
| **SENTINEL → Home Assistant → MQTT → Node Zero → DRV2605L** | Pieces exist in separate trees; **full chain not operator-verified** on LAN hardware. |
| **LoRa / Node One relay mesh** | Product direction; **not** a shipped device in this repo. |
| **Narrative cage JSON** (vertex ids as first names, `cold_edges`, story-like `last_event` strings) | Useful **fiction for design reviews**; real **`k4-cage`** payloads follow Worker implementation — treat live `GET /api/mesh` as source of truth when debugging. |

---

## Doctrine (design metaphor — not hardware or clinical claim)

The following are **intentional analogies** for alignment, onboarding, and grant narrative. They are **not** assertions about calcium phosphate chemistry, medical devices, or quantum biology.

- **Posner / “calcium cage” / “phosphorus spins”** — maps **shared cage scope** vs **isolated personal DO state** to a familiar rigid-cluster image. The running code’s enforcement is **KV scope + Worker boundaries**, not a laboratory model.
- **K₄ as household** — four vertices and six edges describe **who must stay pairwise reachable** in the product story; operational membership and labels are **`p31-constants.json`**, passports, and Worker code — not this prose alone.
- **Mapping `a`→operator pillar, `b`→signals, …** — **product doctrine** (`dome`, passport, design docs). It is **not** a second `GET /api/mesh` schema: personal **`/api/mesh`** remains **`a`–`d`** until a future version explicitly versions a change.

When writing for **regulators or institutional partners**, lead with the **Canonical summary** and **Shipped** tables; use **Doctrine** only when the audience expects metaphor and you label it as such.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-29 | Initial canon: shipped / next / doctrine split + verifier. |
