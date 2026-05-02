# P31 Public Roadmap

**Version:** 1.0.0  ·  **Schema:** `p31.roadmap/1.0.0` (this file is the canonical surface)  ·  **Cadence:** quarterly review; the operator updates the bottom of this file at each turn of the quarter.

This roadmap is a public commitment, not a marketing surface. The voice is plain. Items shipped are linked to commits. Items planned are honest about whether they need money or volunteer hours we do not yet have. Items removed are documented so that a future contributor can see why a thing went away.

The Roadmap is a companion to **`docs/P31-MANIFESTO.md`** (commitments C1–C10). Phase tags below correspond to Phases in **`docs/CWP-P31-PEER-COMP-2026-05.md`** §7.

---

## How to read this file

| Status | Meaning |
|--------|---------|
| **Shipped** | Lives in the repo today; verifier exists where applicable |
| **In progress** | Active work this quarter; commits visible on `main` |
| **Queued** | Acknowledged, scoped, waiting on a dependency or a quarter slot |
| **Funding-gated** | Cannot ship without dollars; tracked in `docs/FUNDING-GATED-ACTION-ITEMS.md` |
| **Held** | Decided not to do this quarter; reason given |
| **Cancelled** | Decided not to do, ever; the section explains why |

---

## Q3 2026 — Trust & transparency layer (current quarter)

The work in this quarter is the public-trust scaffolding the four peer companies (Meta, Apple, Signal, Mozilla) have hardened over decades. We are doing the small-scale version of each.

| ID | Item | Status | Notes |
|----|------|--------|-------|
| PEER-1A | `docs/P31-MANIFESTO.md` — public principles document | **Shipped** | Linked from hub footer; survives the public-voice gate |
| PEER-1B | `docs/security/advisories/` framework + first advisory (`P31SA-2026-001`) | **Shipped** | Stable URL pattern; first advisory documents the 2026-05-02 ecosystem hardening pass |
| PEER-1C | Hall-of-fame, security reporting channel, `.github/SECURITY.md` | **Shipped** | No bounty money in v1; clear reporting path |
| PEER-1D | `npm run verify:reproducible` gate | **Shipped** | Builds twice with `SOURCE_DATE_EPOCH` pinned, diffs `dist/`, fails on drift |
| PEER-1E | `docs/ROADMAP.md` — this file | **Shipped** | Quarterly cadence committed below |
| PEER-1F | `docs/CODE-OF-CONDUCT.md` | **Shipped** | Adapted Contributor Covenant 2.1 + DELTA-language adherence + medical-advice clause + K₄ confidentiality clause |
| PEER-1G | WCAG 2.2 AA audit framework + first pass | **In progress** | `npm run a11y:audit` (axe-core CLI shim); manual screen-reader walk pending; conformance statement lives at `/accessibility` |
| PEER-1H | `/financials` page placeholder | **Shipped** | Page live; commitment to publish 990 within 30 days of IRS ruling |
| PEER-1I | `/status` page | **Shipped** | Pulls from glass-box probes; no auth; mobile-friendly |
| PEER-1J | License clarity pass + `verify:license-headers` | **In progress** | MPL 2.0 default with documented exceptions; `docs/LICENSE-POLICY.md` shipped; header gate is the remaining work |

**Quarter close:** Phase 1 closes when all 10 items are shipped. The CWP at `docs/CWP-P31-PEER-COMP-2026-05.md` §11 is the handoff prompt for the new agent.

---

## Q4 2026 — Independent verification layer

| ID | Item | Status | Notes |
|----|------|--------|-------|
| PEER-2A | First annual transparency report | **Queued** | Covers 2025-09 (P31 incorporation) → 2026-08; published as PDF + HTML; Signal Foundation format |
| PEER-2B | Commission third-party security audit | **Funding-gated** | NLnet €15K could fund this; vendor candidates: Trail of Bits, NCC Group, Cure53; RFP template in `docs/security/audit-rfp-template.md` |
| PEER-2C | MLS protocol research spike | **Queued** | Read RFC 9420 end-to-end; pick a reference implementation; write `docs/spike/MLS-EVALUATION-2026-Q4.md`; this is a decision document, not a ship |
| PEER-2D | Telemetry posture document + `verify:no-telemetry` gate | **Queued** | Asserts no analytics endpoints (GA, Plausible, Fathom, Sentry) appear in client-side code |

**Quarter close:** Phase 2 closes when the transparency report is published, the MLS spike has a written decision, the telemetry doctrine is CI-enforced, and the audit is either funded or has a public RFP visibly seeking funding.

---

## Q1 2027 — Protocol foundations

| ID | Item | Status | Notes |
|----|------|--------|-------|
| PEER-3A | MLS implementation skeleton | **Queued** | Family K₄ mesh becomes an MLS group of 4 members; depends on Phase 2 spike picking the library |
| PEER-3B | i18n framework + first 5 languages (es, pt-BR, fr, ar, zh-Hans) | **Queued** | FormatJS or P31-built ICU consumer; volunteer translator workflow modeled on Pontoon |
| PEER-3C | Cognitive Passport E2EE backup | **Queued** | User-chosen passphrase; Argon2id key derivation; ciphertext stored in user's own R2 bucket or local file; depends on PEER-3A for sub-key derivation |
| PEER-3D | Standards positions register | **Queued** | First entry: MLS over Signal Protocol; format borrowed from Mozilla `standards-positions` repo |

---

## Continuous (starts at Phase 1 close)

| ID | Item | Notes |
|----|------|-------|
| PEER-4A | Contributor onboarding doc cross-linked from home + andromeda | |
| PEER-4B | Quarterly roadmap update cadence (this file, this quarter) | |
| PEER-4C | Public board meeting notes (501(c)(3) requirement; redacted version on hub) | |
| PEER-4D | First-time contributor good-first-issue label + triage policy | |

---

## Mobile distribution — six months out, gated on grant funding

| ID | Item | Notes |
|----|------|-------|
| PEER-5A | PWA hardening of `/term` (manifest, service worker, offline shell) | |
| PEER-5B | Lighthouse + PWA audit gate (`npm run pwa:audit`) | |
| PEER-5C | Capacitor / Tauri wrapper for App Store / Play Store presence — **only with grant funding** | |
| PEER-5D | Web Push (VAPID) infrastructure with opt-in UX | |

---

## Held / Cancelled

We track these to make decisions visible.

| Item | Decision | Reason |
|------|----------|--------|
| Native iOS / Android app without grant funding | **Held** | PWA covers the same surface at zero cost; native is six months and dollars we do not have |
| Cloud LLM lane for operator-confidential surfaces (counsel, triage, phos) | **Cancelled** | Hard ban per `.cursor/rules/p31-ollama-fleet.mdc`; the Ollama fleet is the operator-confidential substrate |
| Phone-number-based identity | **Cancelled** | Manifesto principle 1; non-negotiable |
| Engagement metrics dashboard (DAU/MAU/retention) | **Cancelled** | Off-doctrine; we measure ship cadence and fix-time |
| Centralized SFU we operate (for voice/video) | **Cancelled** | Voice on MLS or no voice; we will not stand up a SFU |
| Building a Signal / WhatsApp competitor | **Cancelled** | Doctrine 2 — we are family-scale, not consumer chat |

---

## How updates land here

1. The operator (or a contributor with a PR) edits this file and bumps the version line at the bottom.
2. The next quarterly review either confirms the Q-row remains accurate, or rewrites it in place.
3. Items moved between quarters keep their ID; only the **Status** and **Notes** columns change.
4. Cancellations are permanent — moving an item from **Cancelled** back to a Phase requires a manifesto-style public note.

---

## Quarterly review log

| Quarter | Review date | Operator initials | Note |
|---------|-------------|-------------------|------|
| Q3 2026 | 2026-05-02 | W.J. | Initial publication; Phase 1 in flight; agent draft, operator review pending tone pass |

---

*Roadmap version: 1.0.0 — 2026-05-02. Companion to `docs/P31-MANIFESTO.md` (Manifesto 1.0.0). Updates on a quarterly cadence; out-of-cycle edits are typo-class only.*
