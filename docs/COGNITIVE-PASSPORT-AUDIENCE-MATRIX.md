# Cognitive Passport — audience matrix (v5 field groups)

**Status:** **LOCKED — v1.0.0** (2026-04-28). Design decisions are frozen; **schema derivation** proceeds mechanically from this revision. Reopen only if `p31.cognitivePassport` major version, SENTINEL Context contract, MEDIC/COUNSEL rotation model, or Genesis attestation shape changes. **Registry:** `p31-alignment.json` sources `cognitive-passport-audience-matrix`, `cognitive-passport-v5-narrative`; derivation `cognitive-passport-audience-matrix-suite`. **Verify:** **`npm run verify:cognitive-passport-profiles`** (when `andromeda/` present — TypeScript matrix ≡ this doc); plus **`npm run verify:passport`** · **`npm run verify:cognitive-passport-schema`**.

**Structural model:** **Core / Context / Archive** maps to disclosure physics: Core = stable cage; Context = spin state (including **live SENTINEL** where marked); Archive = lattice history — **does not radiate by default**. **Research bridge:** philosophical framing of partitioned identity ↔ `docs/CRYPTO-CONSCIOUSNESS-RESEARCH-HANDOFF.md` (external LLM prompt) + **`docs/SOULSAFE-TETRA-SPEC.md`** (fusion safety).

**Cognitive prosthetic principle:** Every machine-facing export must include a **`serialization_profile`** (modality order, bandwidth/spoons, fidelity / lossiness). The passport is not only consent; it is **anti-noise** for the serialization bottleneck.

**Rotation (cognitive hygiene):** Stale context recreates the failure mode the passport prevents. **MEDIC** events → flag Context (and often Core-adjacent medical summaries). **COUNSEL** events → flag Archive and any legal-adjacent exports. “Invalidate previous agent block” is hygiene, not only security.

**Legend**

| Code | Meaning |
|------|--------|
| **A** | Allow in default export for this audience |
| **D** | Deny (must not appear; substitute with safe placeholder or omit) |
| **R** | Review before send (human gate; may redact or split) |
| **S** | **Live / Context** — prefer a **SENTINEL**-backed or KV-backed read for this field group — **with mandatory static fallback** (see below); never omit or fail closed |

### **S semantics (normative): `pull-from-KV | fallback: static`**

Cells marked **S** mean: **attempt live Context** (D1/KV/worker route as implemented in `simplex-v7`/SENTINEL). **If the feed is absent** — first boot, no wearable paired, Home Assistant not installed, queue cold, RPC timeout — the export **must still succeed** using, in order:

1. **Last-known good** Context snapshot already stored for that profile (stale-but-labeled counts as valid degraded mode), or  
2. **Operator-entered** overrides in Core/Context UI (manual spoons, manual safe-mode intent, typed note), same as filling a form when offline.

Same resilience pattern as **BONDING multiplayer**: bulletin board over relay — **relay down ⇒ local/offline truth still plays**. **S** is never a hard dependency; **empty or “loading forever” exports are forbidden** for profiles that ship **S** columns.

Schema sketch (for derivation): combine `intent: pull_from_sentinel_kv` **with** `fallback: static` referencing `.context.last_known` ∩ `defaults`, plus optional `explicit_operators`.

**Column → v5 mapping (source of truth for “field group”)**

| Col | v5 section(s) | Notes |
|-----|----------------|--------|
| PII | §1 | Name, DOB, address, phone, email, ORCID — highest sensitivity |
| Med | §1 diagnoses + acute/labs | Includes hypocalcemia narrative, psych differential |
| Cog | §1 cognitive profile | Serialization bottleneck, exec dysfunction, geometry — **`serialization_profile` lives here** |
| Comm | §1 communication + §12 overlaps | Tone, naval ban, no manic framing |
| Prof | §1 professional | DoD/GS/expertise — needed for SSA/court subsets |
| Fam | §2 + living arrangement | Relationships; children as **S.J./W.J.** vs fuller household |
| Org | §3 | Entity, EIN, bank/web, metaphor, shipped products |
| Leg | §4 | Johnson v. Johnson — posture, citations, counsel |
| Ben | §5 | SSDI/FERS, deadlines, safety net, vehicles where relevant |
| Fin | §6 | Account types, balances, GME boundary |
| Work | §7 | Immediate triage, sales, grants, legal motions |
| Vault | §8 | Excluded materials — **usually meta only** (“exists in vault”) not filenames |
| Comms | §9 | Cell shutoff, E911, fallbacks |
| Sched | §10 | Daily blocks, 9pm rules, Brenda cadence |
| Lex | §11 | Operator dialect — **high value for agents; dangerous in court** |
| Agt | §12 | Tool instructions — **core for Cursor/Claude; deny most human officials** |
| SENT | *(Context bridge)* | Spoons, HRV modifiers, sleep-derived allocation, safe-mode horizon — **not a v5 §; SENTINEL / D1** |
| Genesis | *(provenance)* | SHA-256 + ISO stamp + schema version — **legal contemporaneity weight** |

---

## Matrix (audiences × field groups)

Rows = audiences you actually serve. Cells = **A / D / R / S** (Genesis column: **A** = always attach attestations on bundle).

| Audience | PII | Med | Cog | Comm | Prof | Fam | Org | Leg | Ben | Fin | Work | Vault | Comms | Sched | Lex | Agt | SENT | Genesis |
|----------|-----|-----|-----|------|------|-----|-----|-----|-----|-----|------|-------|-------|-------|-----|-----|------|---------|
| **1 · Cursor agent (IDE)** | R | R | A | A | A | R | A | D | D | D | R | D | R | R | A | A | S | A |
| **2 · Claude session (CLI / Chat)** | R | R | A | A | A | R | A | D | D | D | R | D | R | R | A | A | S | A |
| **3 · New clinician** | A | A | A | A | A | R | R | R | R | D | R | D | A | A | R | R | S | A |
| **4 · SSA examiner / disability record** | A | A | A | A | A | R | R | R | A | D | A | D | A | A | D | D | R | A |
| **5 · Court (Judge Scarlett / filed exhibits)** | A | R | R | R | A | A | R | A | R | R | R | D | R | R | D | D | D | A |
| **6 · Brenda (ADA support)** | A | A | A | A | R | A | R | R | R | R | R | D | A | A | R | R | S | A |
| **7 · Tyler (beta tester)** | D | D | R | A | R | D | A | D | D | D | R | D | D | D | R | R | D | A |
| **8 · Kids — gated** | R | R | R | R | R | R | R | D | D | D | D | D | R | R | D | D | D | R |

### Row notes

**1–2 · Coding agents:** Minimize **PII** and **Fam** detail; deny **Leg / Ben / Fin / Vault**. **Lex + Agt** are the product — export must still carry **`serialization_profile`** so the model treats the slice as **lossy**. **SENT** = **S** (live Context when available; **always** `fallback: static` per **S semantics**). **Genesis** attaches so the operator can prove *what was said to the tool and when*.

**3 · Clinician:** Full **Med / Cog / Sched / Comms** continuity. **Leg / Ben / Work** often **R** (only if clinically or care‑coordination relevant). **Vault** stays **D** (no adversarial filename lists). **SENT** if your clinic workflow can accept a live or same‑day Context card.

**4 · SSA:** Function, history, **Ben** program facts, **Work** capacity narrative — **Lex / Agt** **D** (no agent dialect; no “tag-out” noise). **Leg** **R** only if already in your filed theory of the case. **SENT** usually **R** (static packet more typical than live feed).

**5 · Court:** **Leg + Fam (as in public record)** **A** where already filed; **Med** **R** unless entered as exhibit; **Lex / Agt** **D**; **SENT** **D** — exhibits are **timestamped static** + **Genesis**, not changing KV. **Vault** **D** always.

**6 · Brenda:** Broad **A** on practical support and safety; **Leg / Org / Fin** **R** (need-to-know). **SENT** **S** for caregiver alerts (spoons, safe mode).

**7 · Beta:** **Org + Comm + product Lex**; **D** on **PII / Med / Leg / Fam / Fin / Comms opsec**. **Genesis** **A** for build/provenance culture, not family legal weight.

**8 · Kids:** **Activation condition (normative — not “someday”).** Profile **`child`** stays **inactive** until **S.J. and/or W.J. holds a mesh‑scoped device identity** (Kid’s tablet / account pairing to the family mesh — same predicate family as Home Assistant **`device_tracker.sj_tablet` / `device_tracker.wj_tablet` → `home`** in **`simplex-v7/home-assistant/automations.reference.yaml`** (`automation.p31_kids_home_detected`) and the D1 seed **`kids_home_bonding_preload`** in **`simplex-v7/src/db/schema.sql`** / `automation_rules`). **First qualifying event** (first authenticated mesh presence worth binding to passport UX) enqueues **SCRIBE** to **draft** the age‑appropriate kid‑facing slice (operator review before send). Until then, row 8 is **out of export** — do not show a hollow “child” preset. Content rules: **R** or **D** by developmental stage; **Leg / Ben / Fin / Work / Vault / Lex / Agt** **D**; **Genesis** **R** (likely N/A for child-facing artifacts). **SENT** **D** here — no live telemetry to minors’ exports in v1; caregiver path is row 6.

---

## Schema & export consequences (mechanical derivation from this locked matrix)

1. **`serialization_profile`** is **required** on any export where **Cog = A** (and strongly recommended when **Cog = R** with machine assist).
2. **Profile IDs** line up with rows 1–8: `cursor-agent`, `claude-session`, `clinician`, `ssa`, `court`, `ada-support`, `beta`, `child` — with **`child` feature‑gated** until the mesh device activation condition in row **8** notes is met.
3. **Column → JSON field path:** each of the 18 field groups (PII … SENT) maps to a stable path under `core` / `context` / `archive` (e.g. `context.sentinel.context_ring` for **SENT** live+fallback bundle); **Genesis** maps to `export.provenance` on the wire.
4. **Cell → export rule:** **A** ⇒ `include`; **D** ⇒ `exclude` (or replace with safe constant); **R** ⇒ `redact_or_gate` (UI review step); **S** ⇒ `pull_from_kv` **∧** `fallback: static` (see **S semantics** above) — never `pull_from_kv` alone.
5. **SENTINEL column** defines which profiles **prefer** live reads for Context; all **S** rows honor **fallback: static** when silent.
6. **Genesis column** is **A** for every adult‑facing legal/medical/beta row; **R** for child — **hash + ISO + version** on the export bundle.
7. **Rotation:** When **Med** or **Leg** cells flip (or source data changes), invalidate prior exports for profiles that had **A/R** on affected columns — tie to **MEDIC** / **COUNSEL** event types.

---

## Canonical store (decision)

The **structured store renders markdown**; v5 prose is a **view**, not a second source. JSON Core/Context/Archive + audience projections → generator emits **markdown slice + JSON slice + Genesis attestation** from one graph.

---

## Next artifacts (generator · preview UX)

- Wire **`cognitive-passport/index.html`** (or successor) to **`@p31/shared/cognitive-passport-profiles`** preview + Genesis line.
- Extend **`verify:passport`** optional checks for resolved **S** fallback when SENTINEL mocks offline (integration).
