# Cryptographic consciousness & identity — research brief (example synthesis)

**Domain:** Digital ontology, cryptography, edge cognitive infrastructure  
**Context:** P31-style partition: **machine subject** (opaque routing id from passkey material) vs **human narrative** (Cognitive Passport + locked **audience matrix** v1.0.0) vs **SOULSAFE** lenses vs **SENTINEL live Context** (`S` + `fallback: static`).  
**Last updated:** 2026-04-28  
**Status:** Exemplar brief for external review — **not** a normative contract; engineering truth lives in code + `docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`.

---

## Executive summary

The architecture **decouples proof of key possession** from **self-narrative and consent-scoped disclosure**. The **audience matrix** is the operationalization of “who sees what.” **SENTINEL** supplies real-time **Context** when available; when not, exports **degrade to static / last-known**, matching the resilient “relay optional” pattern. SOULSAFE names **auditability and symbiosis**, not metaphysical claims.

---

## Vector 1 — Philosophy of the partitioned self

Web2 frequently **collapses** authenticator and persona (email/username as durable global correlator). Here, the opaque routing id avoids using the secret as biography: **narrative and consent live in Passport exports** governed by **`A`/`D`/`R`/`S`** cells.

Parallels to SSI/DID goals (minimum disclosure, pairwise presentation) emerge **without** mandating on-chain identifiers — routing is edge-local.

Cross-ref: **`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`**, **`docs/SOULSAFE-TETRA-SPEC.md`**.

---

## Vector 2 — Cryptographic consciousness & edge isolation

“Consciousness” in this brief means **delegated contextual state** constrained to an isolation boundary keyed to cryptographic possession. Psychological upside: fewer third-party watchers on inner narrative slices; downside: loss of passphrase/device can strand state — **recovery is a planned research track**, not repo fiction.

Operational bridge: **SIMPLEX v7 / SENTINEL** pushes selected signals into Context for matrix **`S`** cells; **silent feed ⇒ static fallback**, so the passport still exports meaningfully.

---

## Vector 3 — Policy & safety (nonprofit)

Stewardship includes **minimal retention**, clear **delete semantics** for DO-tethered narratives, and **no engagement-shaped identity**. SOULSAFE and **ETHICAL-STYLE-MAP** reject streak-as-identity and shame loops.

Cross-ref: `docs/ETHICAL-STYLE-MAP.md`, `docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`, hub **`creator-economy.json`** for public monetary commitments.

---

## Vector 4 — Future trajectories (research placeholders)

Risks: **credential loss ⇒ stranded DO** absent recovery. Discussed mitigation classes (ZK-flavored recovery prompts, quorum among cage-trusted **`u_*`** nodes) belong in future CWPs — **do not ship from this brief**.

---

## Bridge to engineering (required reading)

| Topic | Canonical doc |
|-------|----------------|
| Disclosure / profiles / Genesis | `docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md` |
| SOULSAFE | `docs/SOULSAFE-TETRA-SPEC.md` |
| Live Context + HA / crew | `simplex-v7/README.md`, matrix **S semantics** |
| Visual / token ethics | `docs/ETHICAL-STYLE-MAP.md`, `design-assets/README.md` |
