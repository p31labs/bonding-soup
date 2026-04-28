# Research handoff: cryptographic consciousness and identity

**Purpose:** Ground external AI research in what P31 actually implements today at the codebase level, then ask the model to explore the conceptual, philosophical, and policy space **without hallucinating** technical capabilities.

**Last updated:** 2026-04-27

**Deliverable (formal synthesis):** **`RESEARCH-BRIEF-CRYPTOGRAPHIC-CONSCIOUSNESS-IDENTITY.md`** — operator-ready four-vector brief keyed to this audit (philosophy, isolation, policy, futures).

---

## 1. Code audit — what “identity” means in-repo (engineering truth)

Before researching the philosophy, bound it by the **actual** primitives in this repository. The codebase splits “identity” into **distinct operational layers**:

| Layer | What exists | Key paths / contracts |
|--------|-------------|------------------------|
| **Machine subject** | Cryptographic anchor. **`u_*`** IDs derived via **SHA-256** from the passkey **credential rawId** (edge-issued, zero-PII). Proves **key possession** and **stable edge routing** — nothing more. | `andromeda/04_SOFTWARE/p31ca/workers/passkey/src/index.ts`; `p31ca/public/lib/p31-subject-id.js` (`p31.subjectIdDerivation/0.1.0`); `localStorage['p31_subject_id']` after success (`connect.html`, `auth.html`, `planetary-onboard.html`); routes to **`k4-personal`** via `PERSONAL_AGENT.idFromName(userId)` → `/agent/:userId/*`. |
| **Guest path** | **`guest_*`** subject ids when passkey is skipped — separate namespace. | `p31-subject-id.js` · `p31DeriveSubjectId` |
| **Human narrative** | Articulated context. **Cognitive Passport** (self-asserted narrative + JSON **`p31.cognitivePassport`**); **DO `state.profile`** for machine-held preferences. Separated from the WebAuthn secret; passport **complements** cage/mesh docs. | `p31ca/public/passport-generator.html` · home **`cognitive-passport/index.html`** · `docs/MESH-MAP-PERSONAL-START-PAGES.md` |
| **AI symbiosis** | **SOULSAFE tetra** — bounded, auditable multi-lens fusion inside the **same** Durable Object (`soulsafe_runs`, spoons gate). The term “soul” is a **safety / symbiosis** construct — **not** a metaphysical claim about machine consciousness. | `docs/SOULSAFE-TETRA-SPEC.md` · `k4-personal` `src/soulsafe-tetra.js` |
| **Topological isolation** | Personal scope does **not** leak family cage KV by default; bridge is explicit. | `docs/MESH-MAP-PERSONAL-START-PAGES.md` |
| **Ethical guardrails** | Explicit rejection of engagement-driven identity (e.g. **no streak-as-identity** as a manipulation pattern). | `docs/ETHICAL-STYLE-MAP.md` |

**Boundary for researchers:** Product language (“consciousness,” “soul,” “tetra”) maps to **UX, architecture metaphors, and human–AI workflow design** unless a named doc asserts a measurable claim. Cryptographic assurance ≠ phenomenological consciousness.

---

## 2. Paste-ready Gemini research prompt

Copy everything inside the fenced block below into a **new** Gemini (Advanced / long-context) session. Optional uploads: attach this file plus `SOULSAFE-TETRA-SPEC.md`, `MESH-MAP-PERSONAL-START-PAGES.md`, `ETHICAL-STYLE-MAP.md`.

```
Role: You are a Principal Researcher bridging digital ontology, cryptography, and cognitive infrastructure. Your job is to synthesize high-level philosophical concepts with rigid engineering primitives.

Context: P31 Labs is building sovereign cognitive infrastructure at the edge (Cloudflare Workers, Durable Objects, WebAuthn passkeys). We are exploring “cryptographic consciousness identity.” In our architecture, identity is strictly partitioned:

- The machine subject: an opaque, zero-PII subject_id (e.g. u_a1b2c3…) from SHA-256(WebAuthn passkey credential raw id bytes). It governs routing to an isolated PersonalAgent Durable Object (k4-personal). It proves possession, not personhood.

- The human narrative: a “Cognitive Passport” — self-asserted, human-readable state; related machine state lives in the isolated DO as state.profile — not merged with the WebAuthn secret.

- The SOULSAFE tetra: a four-channel (structure, connection, rhythm, creation) bounded fusion model plus audit hooks for human–AI symbiosis inside one DO — naming is stewardship/safety language, not a claim that the LM is conscious.

Research task:

Explore the sociological, philosophical, and architectural implications of “cryptographic consciousness identity” based on this separation of concerns.

Deliver a comprehensive research brief along four vectors:

Vector 1 — The philosophy of the partitioned self:
How does separating cryptographic proof-of-possession (passkey-derived u_* id) from the narrative self (Cognitive Passport + DO-held profile) change user agency compared to Web2, where email/username often conflates both? Draw careful parallels to self-sovereign identity (SSI) and decentralized identifiers (DIDs); note we do not currently ship DID documents.

Vector 2 — Cryptographic assurance and edge isolation:
If a user’s conversational context and AI interaction history reside in SQLite inside one edge-bound Durable Object tied to an anonymous key-bound id, what are the privacy and psychological affordances or risks relative to centralized profile harvesting (“panopticon” critique)? Stay bounded to Workers/DO semantics — no blockchain.

Vector 3 — Policy and “soul” safety:
Given SOULSAFE as an auditable multi-lens assistant pattern inside a nonprofit (501(c)(3) pending) stewardship frame, discuss ethical stewardship: data retention, right to be forgotten, transparency about model tiers, and resistance to manipulation patterns (explicitly include critique of streak-as-identity and similar engagement dark patterns).

Vector 4 — Future trajectories and edge-case risks:
What happens when cryptographic keys are lost — effectively “digital amnesia” for that keyed profile? Name two plausible social-recovery or key-rotation mechanisms that preserve the zero-mandatory-PII posture (ideas only; do not claim P31 has shipped them unless labeled speculative).

Anti-hallucination rules:

- Do not invent P31 features not described above; when uncertain, flag as hypothetical.
- Bound analysis to Workers, Durable Objects, WebAuthn passkeys, and local/passport JSON — not distributed-ledger tokenomics; we do not use blockchains for this identity layer.
- Academic, operator-focused tone; separate “philosophical speculation” from “actionable disclosure or policy bullets” using clear headings.
```

---

## 3. Optional attachments (same session)

| File | Why |
|------|-----|
| `docs/SOULSAFE-TETRA-SPEC.md` | SOULSAFE contract and gates |
| `docs/MESH-MAP-PERSONAL-START-PAGES.md` | Isolation vs cage, phased map |
| `docs/ETHICAL-STYLE-MAP.md` | Dignity, engagement ethics |
| `andromeda/04_SOFTWARE/p31ca/public/lib/p31-subject-id.js` | Exact `u_*` derivation |

---

## 4. Index

Run **`npm run build:doc-index`** from the P31 home root after substantive edits so **`docs/doc-library/index.json`** includes this file.
