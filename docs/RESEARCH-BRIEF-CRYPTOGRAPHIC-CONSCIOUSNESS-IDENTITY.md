# Research brief — cryptographic consciousness and identity

**Domain:** digital ontology, cryptography, and edge cognitive infrastructure  
**Context:** P31 Labs sovereign architecture (`k4-personal`, WebAuthn, Durable Object isolation)  
**Audience:** operators, grant reviewers, collaborators  
**Status:** research / philosophy — not a normative engineering spec (see **Limitations** below)  
**Related:** `docs/RESEARCH-PROMPT-GEMINI-CRYPTO-CONSCIOUSNESS-IDENTITY.md` (audit + Gemini prompt), `docs/SOULSAFE-TETRA-SPEC.md`, `docs/MESH-MAP-PERSONAL-START-PAGES.md`

---

## Executive summary

The P31 architecture decouples **proof of possession** (cryptographic subject routing) from **narrative and state** (human-authored and DO-held context). Opaque, WebAuthn-derived **`u_*` subject IDs** route each member to an isolated **Cloudflare Durable Object** (`k4-personal` / `PersonalAgent`), without using email or password as identity primitives.

This brief names that separation, explores why it is **ethically load-bearing** (not only a performance choice), and outlines policy and future-research directions. It does **not** assert that passkeys or hashes constitute phenomenological consciousness — it frames **cryptographic** and **ambient** language carefully for product and governance use.

---

## Vector 1 — the philosophy of the partitioned self

In many Web2 stacks, the authentication primitive (email or username) doubles as a **global** handle. Behaviors, relationships, and context are joined across surfaces and vendors, which weakens **ontological sovereignty** in the sense used in digital-identity literature: the subject does not control the join keys.

P31 partitions identity into:

| Layer | Role |
|-------|------|
| **Machine subject (`u_*`)** | Opaque routing primitive: **SHA-256** over the passkey **credential raw id** (see `p31.subjectIdDerivation/0.1.0` in `p31ca/public/lib/p31-subject-id.js` and the passkey Worker). It does not encode name, email, or biographics. It proves possession of a cryptographic credential, not “personhood.” |
| **Human narrative** | **Cognitive Passport** (portable human context, schema `p31.cognitivePassport`) and **DO-held** `state.profile` / related keys — **articulated** identity, operator-controlled what syncs where. |

This partition **rhymes with** self-sovereign identity (SSI) and decentralized identifier (DID) goals (separating identifiers from attributes and issuers) but **does not** ship DID documents or ledger anchoring today. Localized **Workers + Durable Objects** instantiate a **single-tenant “room”** per routed subject: narrative can evolve without rewriting the **`u_*`** anchor, within the limits of how credentials and storage are managed in product.

---

## Vector 2 — cryptographic assurance and edge isolation

**Operational meaning (strict):** conversational and configuration state for the personal agent lives primarily in **SQLite inside** the `PersonalAgent` Durable Object; **family cage** data and **personal** data are **not** merged by default (see `docs/MESH-MAP-PERSONAL-START-PAGES.md`).

**Interpretive framing (careful language):** isolation supports **privacy** and **agency**: the default join surface for cross-service surveillance is smaller than in a single global account graph. AI calls under SOULSAFE are orchestrated **inside** the same DO boundary with auditable artifacts (`docs/SOULSAFE-TETRA-SPEC.md`) — a **workflow and safety pattern**, not a claim that the model is conscious.

**Psychological language:** terms like “localized cortex” or “dormant consciousness” are **metaphors** for **resting state + explicit invocation** after passkey-authenticated use. They should not be read as neuroscience or philosophy-of-mind proofs.

---

## Vector 3 — policy and “soul” safety

**Nonprofit stewardship (P31 Labs — 501(c)(3) pending where applicable):** isolated enclaves imply **duty of care** proportional to stored context: clarity on retention, export, deletion, model changes, and minors’ paths.

- **SOULSAFE tetra:** four-lens fusion + audit trail (`soulsafe_runs`) aimed at **structured** response quality and safety — see the production spec. “Soul” here means **stewardship / symbiosis**, not metaphysical soul.
- **Engagement ethics:** `docs/ETHICAL-STYLE-MAP.md` rejects **streak-as-identity** and similar patterns; product copy should not substitute **manipulation** for **dignity**.
- **Right to be forgotten:** **Deletion of a DO or its data** is technically cleaner than multi-tenant fan-out in a giant shared warehouse — but **implementing** full erasure, backups, and KV edge cases is still **operational** work. The brief does not replace a **data lifecycle runbook** (see `k4-personal` README and CWP operator notes).

---

## Vector 4 — future trajectories and edge-case risks

### Digital amnesia (key loss)

If the user **loses** access to all passkeys bound to the **`u_*`** that routes their DO, **recovery** is not automatic: the system is designed to **avoid** a central password reset that re-identifies the user with PII by default. That is the **ethical trade**: strong locality can imply **high cost of key loss** unless recovery paths are designed and implemented with care.

### Speculative mechanisms (not shipped — research / future CWP candidates)

The following are **conceptual** directions only; they are **not** current product commitments:

1. **Zero-knowledge–style context escrow (placeholder name: ZKCE)**  
   A future design might let a user prove ownership of **high-entropy context** known inside the DO **without** exporting raw conversation text — e.g. for **credential rotation** or **backup** — using modern crypto and strict UX. Requires security review and abuse analysis.

2. **Sovereign mesh sharding (social recovery sketch)**  
   **Shamir secret sharing** or quorum-based recovery could, in theory, split **recovery authority** across **`subject_id`**-scoped trusted peers in the family mesh — **never** as a naive “upload seed to cloud.” Any real design must preserve **minimum necessary** disclosure and **prevent coercion** (especially for youth). **Not implemented** in-repo as of this brief.

Neither mechanism appears in **`p31.ground-truth.json`** until specified and verified.

---

## Limitations — how to use this document

- **Not** a substitute for `docs/P31-ENGINEERING-STANDARD.md`, security reviews, or legal advice.
- **Marketing** should avoid implying that **cryptographic routing** equals **psychological continuity** or **legal identity**.
- **Engineering** remains authoritative in **`andromeda/`** source and **`verify`** pipelines.

---

## Revision

| Field | Value |
|-------|--------|
| First publication | 2026-04-27 |
| Source | synthesized research aligned to P31 CWP primitives |
