# SIC-POVM × K₄ — engineering map (metaphor)

**What this is:** a **short** alignment between four design axes and the P31 stack. **SIC-POVM** and **K₄** are used as **geometric metaphors** (same convention as `docs/EGG-HUNT.md`, `docs/SOULSAFE-TETRA-SPEC.md`). This is **not** clinical, legal, or settled quantum-biology advice.

**What this is not:** medical claims; family-law strategy; credentials or secret material; citing specific regulatory section numbers without a lawyer and current primary sources.

---

## 1. Physical substrate (local-first)

| Do | Why |
|----|-----|
| Prefer **local link** (e.g. SoftAP / LAN) for device ↔ phone when the product is “pairing + telemetry,” not general internet | Cuts ISP/cleartext paths for that hop; keep threat model explicit |
| **Segregate** WebSocket (or binary) from static HTTP (e.g. different port or path) | Avoids mixing upgrade traffic with page assets |
| **Haptics / pacing** as generic feedback | Non-invasive; **no** disease-treatment copy on the tin |
| **Canon numbers** (e.g. Larmor display) from `p31-constants.json` | **UI + CI coherence** with `docs/EGG-HUNT.md` — not a clinical readout |

**Do not:** ship prose that names **past secret leaks** or **exact** production PSKs. Rotate and redeploy; document in private runbooks only.

---

## 2. Topological network (K₄, Wye → Delta, edge)

| Concept | Use in architecture |
|---------|---------------------|
| **K₄** (4 nodes, 6 edges) | Mesh story: four vertices, full interconnection; “no orphan channel” as a *design* goal |
| **Wye vs Delta (electrical metaphor)** | **Wye:** dependency on a **single center** (ISP, one API, one court of appeal). **Delta:** **loop**; stress shares across the triangle; *open-delta* = degraded but non-zero operation—use as **reliability** narrative, not wiring instructions |
| **Rigidity (Maxwell count, 3D bar frameworks)** | Tetrahedral frame is a **small rigid** cell; use when explaining **isostatic** mesh design in docs/code comments |

| Cloudflare primitive | Fit | Poor fit |
|---------------------|-----|----------|
| **Durable Objects** | One logical coordinator per room / agent / graph shard; strong single-threaded consistency | Replaced by “sharded DO” for huge fan-out without design |
| **D1 (SQLite)** | Relational, transactional batches | Streaming every keystroke as one row (without batching) on tight quotas |
| **KV** | Infrequent flags, read-heavy | High-frequency state that must converge in seconds |
| **R2** | Large blobs, archives | Sub-millisecond turn-taking state |

**Verify** quotas, limits, and pricing against **current** Cloudflare docs before you bake numbers into runbooks.

**Client resilience:** PWA + **local persistence** (e.g. IndexedDB) + sync when `online` is a **pattern**; CRDT/merge strategy is a **product** choice, not implied by the metaphor alone.

---

## 3. Regulatory & evidence (product discipline)

| Layer | Rule of thumb |
|-------|-----------------|
| **Positioning** | “Lifestyle / stress / focus / coherence” for sensor-adjacent UX; **not** diagnosis or treatment of a named disease in marketing |
| **Hardware licenses** | If you open hardware, pick a real license (e.g. CERN-OHL variant) and apply it in-repo; do not hand-wave |
| **Software** | Match repo’s actual SPDX / root license |
| **Audit trails** | Hash-chained or append-only logs when you need **defensibility**; **Daubert** is a *court* test for *expert* methods—not automatic because you used SQLite |

---

## 4. Cognitive & UX (epistemic load)

| Pattern | Intent |
|---------|--------|
| **Catcher’s mitt** | One **primary** affordance per stressful flow; avoid parallel navigation and competing CTAs when load is high |
| **Glass box** | Operator-visible state and limits (what failed, what data left the device) |
| **Session / room** tokens | Prefer **short-lived, scoped** tokens for mesh rooms over heavy identity wizards for every action |

**FUTURE-AI (and similar) frameworks:** use as a **checklist** for governance; map each principle to an **implemented** control (logging, opt-out, bias review), not a slide deck.

---

## Synthesis: “1/3” (d = 2 SIC-POVM)

For a **qubit**, a SIC-POVM has **four** outcomes; pairwise overlaps are **1/3**. In this repo, use that as **metaphor only**: *balanced coupling between the four sections above*—not a numerical constant in your crypto or haptics.

**Rigorous treatment (definitions, Bloch-sphere tetrahedron, IC vs metaphor contract):** [SIC-POVM-MATHEMATICAL-APPENDIX.md](SIC-POVM-MATHEMATICAL-APPENDIX.md).

---

## Repo touchpoints (implementations to read)

| Area | Where |
|------|--------|
| Larmor + constants | `p31-constants.json` → `apply:constants` / `verify:constants` |
| Egg + metaphor | `docs/EGG-HUNT.md`, `docs/egg-hunt-manifest.json` |
| SIC math (rigorous appendix) | `docs/SIC-POVM-MATHEMATICAL-APPENDIX.md` |
| SOULSAFE four-effect fusion | `docs/SOULSAFE-TETRA-SPEC.md`, `andromeda/04_SOFTWARE/k4-personal` |
| Hub / edge products | `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`, `AGENTS.md` |

**Change control:** if you add claims that touch health or children’s data, run **legal review**; keep this file **metaphor + engineering** only.
