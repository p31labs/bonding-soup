# The P31 Manifesto

**Version:** 1.0.0  ·  **Effective:** 2026-05-02  ·  **Schema:** human canon (no JSON; pairs with `docs/PUBLIC-VOICE.md` and `docs/P31-DELTA-LANGUAGE.md`).

P31 Labs, Inc. is a Georgia nonprofit (EIN 42-1888158, 501(c)(3) pending) built around a single neurodivergent operator with hypoparathyroidism. We serve a four-person family mesh today, and we publish the substrate so any other family — or any person walking in cold — can use what we built.

This document says what we believe. Everything else in the repo is either an attempt to live by these principles, or a debt we owe the principles.

---

## The five doctrines

These are not goals. These are the floor. Anything we ship that breaks one of them is broken on purpose, and we say so out loud.

1. **Operator-condition-aware AI.** Every assistive persona we build carries the operator's medical and cognitive condition into its system prompt. No persona may invent a court docket, prescribe a medical action, treat executive dysfunction as a deficit of intelligence, or use the metaphors that hurt. The doctrine is older than any single model. It survives model upgrades.
2. **The K₄ family mesh as architectural primitive.** Four vertices. Six edges. Closed cage. The mesh is not a chat product. It is a small, complete graph that scales by becoming many parallel small complete graphs. We do not aim for a billion users. We aim for many four-person meshes that hold.
3. **The Cognitive Passport as portable personalization without surveillance.** The passport lives in the user's browser. Our servers never see it. The user generates it, owns it, deletes it. Hand it to a different P31 instance and the same configuration applies. No account. No sync to a tower. No price.
4. **A measurable voice.** The DELTA language and the Public Voice doctrine are written down, machine-checked, and CI-enforced. We forbid urgency manipulation, marketing puff, naval metaphors, and engagement-maximization patterns at the build step, not after the fact. If a public string sounds like a brochure, the gate fails.
5. **Sub-medical-grade by design.** P31 does not diagnose, prescribe, or substitute for clinical care. This is not modesty. It is the architectural choice that lets a tool reach the people who need it most without a regulatory burden that would prevent it from existing. Apple Health makes regulatory claims; we deliberately do not.

If a future contributor or agent is tempted to import a peer practice that breaks one of these five, the doctrine wins. Document the conflict. Walk away.

---

## Ten principles

### 1. The user owns their personalization

The Cognitive Passport ships in the browser. If you want sync across devices, you choose a passphrase and we encrypt before storage — we never hold the plaintext. If you walk away, the data walks with you. There is no account to close, because there was never an account to begin with.

### 2. We collect nothing we do not need

The hub has no analytics. No Google Analytics, no Plausible, no Sentry, no behavioral telemetry of any kind. The status page (Phase 1) makes this auditable. The reproducible-build gate (Phase 1) makes it provable.

### 3. Local-first, with a cloud floor

The Ollama persona fleet runs on the operator's own laptop. The K₄ personal Worker holds family-scope state at the edge. No cloud LLM is ever called from operator-confidential surfaces (counsel, triage, child-companion personas). This is enforced by `.cursor/rules/p31-ollama-fleet.mdc` — a hard ban, not a guideline.

### 4. Open by default

Source is on GitHub. Contracts are JSON files in the repo. Schemas are versioned. Where we use a non-default license (the Cognitive Passport schema is CC0 to make it easy to copy), the exception is named in `docs/LICENSE-POLICY.md`. The default is permissive but explicit.

### 5. Plain language over performance

We do not say "unlock" when we mean "open." We do not say "empower" when we mean "help." We do not say "synergy." The avoid-list is in `docs/PUBLIC-VOICE.md` and the build fails if the words appear in watched copy. Plain language is a respect bar, not a style preference.

### 6. Accessibility is not a feature; it is the floor

Phase 1 of this Manifesto's first companion CWP commits to a WCAG 2.2 AA audit, remediation of all P0 and P1 findings, and a public conformance statement at `/accessibility`. The Cognitive Passport's `screenComfort` cascade is a real innovation, but it does not substitute for screen-reader compliance, dynamic-type respect, color-contrast audit, or motion-reduction conformance. We will do both.

### 7. Cryptography is borrowed, not invented

When messaging between humans is needed, we will adopt MLS (RFC 9420) — the IETF open standard. We will not write our own protocol. We use NIST FIPS 203 (ML-KEM) and 204 (ML-DSA) for post-quantum work. The passkey layer uses WebAuthn. Every primitive is documented in `docs/EDGE-SECURITY.md`.

### 8. Trust comes from third-party audit, not our own assurance

Phase 2 commits to commissioning an independent security audit (Trail of Bits, NCC Group, or Cure53 are the candidate vendors) and publishing the report in full. Phase 1 ships a public security advisory framework (`docs/security/advisories/`) with stable identifiers (`P31SA-YYYY-NNN`). We will fix in public.

### 9. Money does not buy attention here

The `creator-economy.json` contract codifies a 0% platform fee, no advertising ever, no surveillance monetization, and free room access. P31 Labs is funded by donations (Ko-fi today; grants in progress; the Stripe Worker at `donate-api.phosphorus31.org` handles tax-deductible giving once 501(c)(3) status lands). The 990 financial filings will be public on the hub the moment they are filed. Donor mechanics belong in the open.

### 10. The mesh is small on purpose

We are not Meta. We are not Apple. We are not Signal. We are not Mozilla. We borrow practices from each of them — Mozilla's manifesto-as-governance, Signal's audit cadence, Apple's accessibility rigor, Meta's discipline at low bandwidth — and we reject the parts that do not match the shape of a four-person family mesh. The honest peer comparison is not WhatsApp's group chat. The honest peer comparison is no peer. Sub-CWPs in `docs/CWP-P31-PEER-COMP-2026-05.md` track every one of those decisions.

---

## What we will not do

These are non-goals. We name them so that drift away from the doctrine is visible to the next contributor.

- **We will not collect phone numbers.** Not as identity. Not for verification. Not later.
- **We will not measure daily active users, retention curves, or engagement metrics.** They are off-doctrine. We measure ship cadence, fix-time on bug reports, and the verify chain green-rate.
- **We will not ship a voice or video product on top of unencrypted transport.** When we ship voice, it sits on MLS, or it does not sit.
- **We will not stand up a moderation team for chat-with-strangers.** P31 has no chat-with-strangers product. Family mesh has named members.
- **We will not require an app to participate.** Progressive Web App first. Native iOS and Android only with grant funding, and only as a wrapper around the same web surface.
- **We will not treat accessibility as an afterthought.** If a release breaks the audit and we cannot fix it the same week, the release is held.
- **We will not add a cloud LLM endpoint to operator-confidential surfaces.** Ever. The Ollama fleet rule is a hard ban.

---

## The commitments

Where the principles are abstract, these are the work:

| # | Commitment | Where it lives |
|---|------------|----------------|
| C1 | Public security advisories at stable URLs | `docs/security/advisories/` |
| C2 | Public Code of Conduct, enforced | `docs/CODE-OF-CONDUCT.md` |
| C3 | Public quarterly roadmap | `docs/ROADMAP.md` |
| C4 | Reproducible-build verification gate | `npm run verify:reproducible` |
| C5 | License clarity per-file | `docs/LICENSE-POLICY.md` + `npm run verify:license-headers` |
| C6 | Status page (no auth, real probes) | `/status` on the hub |
| C7 | Financials publication path (gated on 501(c)(3) ruling) | `/financials` on the hub |
| C8 | Independent security audit + published report | Phase 2 — `CWP-P31-AUDIT-2026-Q4` |
| C9 | Annual transparency report | Phase 2 — first edition covers 2025-09 → 2026-08 |
| C10 | MLS adoption for human-to-human messaging when shipped | Phase 3 — depends on Phase 2 spike |

This list grows as the Phases advance. It does not shrink without a public post explaining why.

---

## How this document changes

The Manifesto is versioned. Material edits bump the version, are signed in a commit by the operator, and are noted at the bottom of this file. Ornamental edits (typo fixes, link refreshes) do not bump the version. The 10 principles and the 5 doctrines do not move without a public decision and a 30-day notice on the hub — the same notice cadence the `creator-economy.json` contract codifies for fee changes. We change slowly because the people relying on us are changing slowly too.

---

## Where this fits

- **Strategic context:** `docs/CWP-P31-PEER-COMP-2026-05.md` (Section 5 lists the same five doctrines; this Manifesto is its public face).
- **Voice canon:** `docs/PUBLIC-VOICE.md`, `docs/P31-DELTA-LANGUAGE.md`, `docs/ETHICAL-STYLE-MAP.md`.
- **Engineering bar:** `docs/P31-ENGINEERING-STANDARD.md` and `npm run verify`.
- **Topology:** `docs/SIC-POVM-K4-ARCHITECTURE.md`, `docs/MESH-ARCHITECTURE-CANON.md`.
- **Operator condition (private to repo, not public face):** `CLAUDE.md`, `.cursorrules`.

---

## Closing

The four peers have decades of practice between them. We have weeks. What we lack in scale, we close in transparency. What we lack in headcount, we close in plain documentation. What we cannot match in hardware, we make irrelevant by running on a fifty-dollar Chromebook.

The mesh holds because it is small, because it is honest, and because the people inside it can see the floor under their feet.

— W. Johnson, Operator  ·  P31 Labs, Inc.  ·  2026-05-02

---

*Edition log:*

- **1.0.0 — 2026-05-02.** Initial publication. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` Phase 1.
