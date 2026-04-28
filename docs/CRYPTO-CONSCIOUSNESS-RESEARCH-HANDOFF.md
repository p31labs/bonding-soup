# Cryptographic consciousness & identity — research handoff (Gemini / external LLM)

**Purpose:** Ground external research in **what the repository actually implements**, then explore philosophy and policy **without inventing features**.  
**Last updated:** 2026-04-28  
**Pair with:** `docs/CRYPTO-CONSCIOUSNESS-RESEARCH-BRIEF.md` (example synthesis), **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`** (LOCKED consent / export model), **`docs/SOULSAFE-TETRA-SPEC.md`** (bounded multi-lens fusion in the personal DO), **`simplex-v7/`** (SIMPLEX crew + **SENTINEL** live Context bridge).

---

## 1. Engineering truth (do not contradict)

| Layer | What exists | Key paths / contracts |
|-------|-------------|------------------------|
| Machine subject | Cryptographic anchor — opaque `u_*` routing derived from WebAuthn passkey material; edge-issued, zero PII in the id string | `andromeda/04_SOFTWARE/p31ca/workers/passkey/`, `k4-personal` Durable Object routing |
| Human narrative | Cognitive Passport — self-asserted machine slice + long-form doc; **separate** from WebAuthn secret | `cognitive-passport/index.html`, **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md` v1.0.0** |
| Live context | **SENTINEL** / SIMPLEX v7 — biometric + HA + queue; **S** cells use `pull_from_kv | fallback: static` (never fail closed) | `simplex-v7/`, D1 `automation_rules`, matrix doc |
| Attestation exports | Genesis-style hash + ISO on bundles where matrix marks **Genesis = A** | Described in audience matrix § schema consequences |
| Symbiosis / safety framing | SOULSAFE tetra — operational “lenses”, not metaphysical soul | `docs/SOULSAFE-TETRA-SPEC.md` |
| Topology | Cage vs global mesh isolation | `docs/MESH-MAP-PERSONAL-START-PAGES.md` |
| Ethical UI | No streak-as-identity, dignity defaults | `docs/ETHICAL-STYLE-MAP.md` |

---

## 2. Paste-ready research prompt

**Role:** You are a Principal Researcher bridging digital ontology, cryptography, and cognitive infrastructure.

**Context:** P31 Labs builds **sovereign cognitive infrastructure** at the edge. Identity is **partitioned**:

- **Machine subject:** opaque id, proves **key possession**, not personhood.
- **Human narrative:** Cognitive Passport — **audience-scoped disclosure** (`A`/`D`/`R`/`S` matrix); includes **`serialization_profile`** (lossy compression is explicit).
- **SOULSAFE tetra:** auditable fusion construct inside the isolation boundary.
- **SENTINEL:** bridges **physical / biometric state** into **Context** for exports that permit live reads, with **static fallback** when the mesh is silent.

**Task:** Explore sociological, philosophical, and architectural implications of this **exact** separation — four vectors:

1. **Philosophy of the partitioned self** (vs Web2 identifier collapse; parallels to SSI/DIDs **without** claiming we ship W3C DID methods unless cited from repo).
2. **Cryptographic consciousness & edge isolation** — benefits and limits of localized DO state keyed to anonymous routing ids.
3. **Policy & “soul” safety** — 501(c)(3) stewardship, retention, RTBF framing **consistent with deletion of DO-bound state**.
4. **Future trajectories** — key-loss / orphaning risks; **social recovery ideas are research-only** unless a CWP lands (no ledger requirement).

**Anti-hallucination rules:**

- Do **not** invent P31 SKU features; bind claims to Workers, DOs, WebAuthn, JSON registries cited above.
- Do **not** use distributed-ledger/tokenomics hype; describe **localized edge compute** honestly.
- Cite **`COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`** as the consent / disclosure contract.
- Acknowledge **SIMPLEX v7 agent crew + SENTINEL** as operational “cortex” scaffolding where relevant.

---

## 3. Cross-links

- **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`** — eight profiles, eighteen field groups, SENTINEL + Genesis rules.  
- **`docs/SOULSAFE-TETRA-SPEC.md`** — four-channel fusion contract.  
- **`design-assets/README.md`** — visuals stay token-aligned; research does not depend on them.
