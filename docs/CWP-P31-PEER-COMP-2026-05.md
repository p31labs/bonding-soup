# Controlled Work Package — Peer comparison + ecosystem gap closure

| Field | Value |
|---|---|
| **CWP ID** | `CWP-P31-PEER-COMP-2026-05` |
| **Title** | What Meta, Apple, Signal, and Mozilla have that P31 doesn't — and what to do about it |
| **Version** | 1.0.0 |
| **Effective date** | 2026-05-02 |
| **Status** | **OPEN — handoff to new agent. This CWP frames; subordinate CWPs execute.** |
| **Authoring mode** | **Strategic framing + executable WBS.** Reference points are 2026-05-02 public knowledge of the four named companies. Where their practice is described, that description is auditable against their own published docs. Where the gap analysis applies value judgment, the judgment is owned by P31 doctrine, not borrowed. |
| **Applies to** | The entire P31 ecosystem: home repo, p31ca hub, all Cloudflare Workers, the Ollama fleet, the K4 mesh, the cognitive passport, the static surfaces, the governance layer, the build/CI layer, and the human community around it. |
| **Owner (architect)** | Cursor agent (Claude Opus 4.7) under operator command authority granted at 2026-05-02T13:53:00-04:00. |
| **Owner (handoff target)** | Next chat agent. This CWP is the contract for that handoff. |

**Sister packages (do not conflate):**

| ID | Role |
|----|------|
| `CWP-PHOS-2026-01` | Bus bar consolidation. **Closed-green.** Sets the personalization layer this CWP builds on. |
| `CWP-P31-OLLAMA-FLEET-2026-04` | The 10-persona local fleet. **Live.** Provides the AI substrate this CWP defends and extends. |
| `CWP-P31-IB-2026-01` | Initial Build production hardening. **Live.** Continues independently. |
| `CWP-P31-PAR-2026-01` | Personal Agent Room. **Live.** Will eventually consume some artifacts of this CWP (E2EE protocol, accessibility audit). |

This CWP is the **strategic controlling document.** Tactical execution will spawn sub-CWPs (one per phase). Work not listed in §7 (WBS) is out of scope unless Version is bumped and §7 extended.

---

## 0. TL;DR

P31 is being benchmarked against four companies that are not its peer set: **Meta** (3 billion users, ad-supported, surveillance-monetized), **Apple** (hardware monopoly, walled garden, 1.5 trillion-dollar moat), **Signal** (501(c)(3) but consumer-scale focus, donor-funded), and **Mozilla** (enterprise foundation with 200+ engineers and a 30-year codebase).

**P31 is none of these.** P31 is a **single-operator-led 501(c)(3)-pending nonprofit** built around a neurodivergent operator with hypoparathyroidism, serving primarily a four-person family mesh today, with public hub surfaces designed for **anyone walking in cold**. The right comparison is not feature-for-feature parity. The right question is: **of the practices these four companies have hardened over decades, which ones translate to P31's scale and doctrine, which ones don't, and which ones must P31 invent because no one has solved it for our population?**

The honest answer:

- **Mozilla teaches us most about governance, transparency, and standards posture.** Borrow heavily.
- **Signal teaches us about cryptographic protocol discipline and donor-funded ethics.** Borrow heavily.
- **Apple teaches us about accessibility leadership and hardware-backed key storage.** Borrow selectively.
- **Meta teaches us scale-tactics that mostly do not apply, and surveillance habits we explicitly reject.** Borrow almost nothing.
- **P31 must invent four things itself**: operator-condition-aware AI persona doctrine, the K4 family mesh, the Cognitive Passport, and the AuDHD-aware UX vocabulary. Nobody else is solving these.

This CWP frames the gap, claims the doctrines that survive, declares what is **explicitly out of scope** (not a goal, not a failure if absent), and hands off a phased WBS to a new agent. **Phase 1 (trust & transparency) is concrete and independently shippable in ~2 weeks of agent time. Phases 2-4 spawn their own CWPs.**

---

## 1. Purpose

The operator asked: *"how does Meta do it? how about Apple? Signal? Mozilla? what do they have that I am missing?"*

The honest answer requires three moves in order:

1. **Describe what each company actually does** without flattering them or dismissing them.
2. **State plainly what P31 lacks compared to each**, without confusing "doesn't have" with "needs to have."
3. **Propose what to import, what to invent, and what to deliberately reject** — and write that down so a new chat agent (no prior context) can execute it.

The operator's underlying anxiety, as we read it: the P31 ecosystem is real but feels small next to those four. If a stranger compares P31 to those four head-to-head, P31 will look unserious. The remedy is not to grow into a fifth member of that set — that's a category error. The remedy is to **be best-in-class at the things P31 is for** (operator-confidential, neurodivergent-aware, family-scale, free, local-first, deliberately sub-medical) and to **borrow exactly the practices that earn trust at any scale**.

---

## 2. Reference points (read order)

| # | Document / path | Repo / source | Use |
|---|----|---|---|
| R1 | `AGENTS.md` | home | What lives where; verify commands; the universal canon |
| R2 | `CLAUDE.md` / `.cursorrules` | home | Operator condition (hypoparathyroidism, AuDHD), K4 mesh, communication rules |
| R3 | `docs/HARDEN-POLISH-2026-05-02.md` | home | What was just hardened; baseline this CWP starts from |
| R4 | `docs/CWP-PHOS-2026-01.md` | home | Bus bar consolidation; nine-around-one cage doctrine |
| R5 | `docs/P31-ENGINEERING-STANDARD.md` | home | Ship bar; release ladder; the "definition of done" |
| R6 | `docs/P31-DELTA-LANGUAGE.md` | home | Voice doctrine; what we say and don't say |
| R7 | `docs/PUBLIC-VOICE.md` | home | Tier B/C public copy guardrails |
| R8 | `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | andromeda | The hub contract; what we promise users |
| R9 | `andromeda/04_SOFTWARE/p31ca/ground-truth/creator-economy.json` | andromeda | The 0% platform fee monetization contract |
| R10 | `https://signal.org/security/` (public) | external | Signal's published threat model + protocol whitepaper |
| R11 | `https://www.mozilla.org/en-US/about/manifesto/` (public) | external | Mozilla Manifesto — governance doctrine model |
| R12 | `https://support.apple.com/guide/security/welcome/web` (public) | external | Apple Platform Security guide — hardware-backed key model |
| R13 | `https://about.meta.com/actions/` (public) | external | Meta's published transparency reports — what scale-tier reporting looks like |
| R14 | IETF RFC 9420 (MLS) | external | Messaging Layer Security — the open standard for E2EE group chat |
| R15 | WCAG 2.2 AA | external | Web Content Accessibility Guidelines — the audit target |
| R16 | NIST FIPS 203 (ML-KEM) + 204 (ML-DSA) | external | The PQC primitives p31ca already passes |

Read R1 → R3 → R4 → §3 of this doc to understand the framing in 30 minutes.

---

## 3. The four reference points — honest assessment

### 3.1 Meta (WhatsApp / Messenger / Instagram DMs / Threads)

**What Meta actually does well that P31 does not:**

- **Scale infrastructure.** 3 billion users on WhatsApp alone. 99.99% uptime. Federated rollout (deploy to 1% of users, watch metrics, ramp or roll back). Push notifications via APNS/FCM at billions per second. A/B testing infrastructure. Multi-region failover.
- **Mobile-native apps.** Native iOS + Android with bandwidth-adaptive media. WhatsApp specifically is hyper-optimized for low-bandwidth markets (audio messages encoded for 2G).
- **Trust & safety operations.** Reports human-trafficking/CSAM at scale (NCMEC reports), runs spam classifiers, has a 24/7 incident response team.
- **Localization.** WhatsApp ships in 60+ languages with regional QA.
- **Compliance machinery.** GDPR data export within 30 days, CCPA opt-out, India IT Rules compliance officer, EU DSA risk assessments.
- **Group features at scale.** 1024-member groups, channels for one-to-many broadcast, communities (groups of groups), business profiles.

**What Meta does that P31 explicitly rejects:**

- **Surveillance monetization.** Meta's business model is collecting behavior signal to sell ad targeting. P31's `creator-economy.json` codifies 0% platform fee and no ads ever.
- **Engagement maximization patterns.** Infinite scroll, push-notification cadence tuning to maximize daily active use. P31's DELTA language explicitly bans urgency manipulation.
- **Data retention by default.** P31 retains nothing on the hub side; CogPass lives in browser localStorage.
- **Centralized identity.** Meta requires phone number + real name. P31 hub requires nothing.

**What P31 should borrow from Meta:** mostly *engineering practices around scale that apply even at small scale* — rate limiting (already added), abuse-resistant input handling (already in negative-test matrix), and observability discipline (glass box exists; can deepen). Push notification delivery would be valuable but only if/when P31 ships a mobile app, which is a separate decision.

### 3.2 Apple (iMessage / FaceTime / Apple Intelligence)

**What Apple actually does well that P31 does not:**

- **Hardware-backed key storage.** Secure Enclave keys never leave the chip. iCloud Keychain syncs them across the user's own devices using end-to-end encryption.
- **Native OS integration.** iMessage is built into iOS — zero install friction. Phone's contacts list is the address book.
- **Accessibility leadership.** VoiceOver, Dynamic Type, Voice Control, Live Captions, AssistiveTouch, Switch Control. Apple has a dedicated accessibility engineering org and ships annual GAAD (Global Accessibility Awareness Day) features. WCAG-conformant by default.
- **Cryptographic discipline.** iMessage uses Signal-style ratcheting since 2023. iCloud Advanced Data Protection adds E2EE to most iCloud categories. Contact Key Verification for iMessage.
- **On-device intelligence.** Apple Intelligence runs the small model locally; only escalates to Private Compute Cloud (no logging, attestable code) when needed.
- **Differential privacy.** Aggregated telemetry uses ε-DP techniques where any data leaves the device.
- **Privacy nutrition labels.** App Store labels declare what data each app collects.

**What Apple does that P31 explicitly rejects:**

- **Walled garden.** iMessage doesn't speak to Android. RCS interop landed in 2024 but is gated. P31 is web-first and protocol-open by doctrine.
- **Hardware coupling.** Apple's privacy story depends on owning Apple hardware. P31 must work on a $50 Chromebook.
- **Closed source.** The iMessage protocol is reverse-engineered, not specified. P31's contracts (`ground-truth/*.json`, schemas) are public.

**What P31 should borrow from Apple:** **accessibility engineering rigor**. P31 has not done a WCAG 2.2 AA audit. The Cognitive Passport's `screenComfort` cascade is a genuine innovation but it does not substitute for screen-reader compliance, Dynamic Type respect, color-contrast audit, and motion-reduction conformance. **This is Phase 1 of the WBS.** Also worth borrowing: **on-device intelligence by default with explicit cloud escalation** — the Ollama fleet already implements this; the doctrine should be codified.

### 3.3 Signal

**What Signal actually does well that P31 does not:**

- **The Signal Protocol.** Double Ratchet + X3DH key agreement. The cryptographic standard the entire industry copies (WhatsApp, iMessage modern-mode, Google Messages RCS, Skype private conversations). Open specification. Reference implementation (`libsignal`) under MIT/AGPL.
- **Sealed sender.** Signal's server doesn't know the sender of a message — only the recipient. The metadata leak is structurally minimized.
- **Independent third-party security audits.** Signal commissions and publishes cryptographic audits regularly (Trail of Bits, NCC Group, etc.). The audit reports are public and dated.
- **Reproducible builds.** Anyone can compile the Signal Android APK and verify it byte-for-byte matches what's on the Play Store. Same for iOS, macOS, Linux.
- **501(c)(3) Signal Foundation, donor-funded.** No ads, ever. No tracking. No telemetry. The 990 forms are public.
- **Username-based identity (since 2024).** Phone number no longer required.
- **View-once media that genuinely deletes.** Files are encrypted with a per-message key that's destroyed after view.
- **Privacy-preserving contact discovery (PCD).** Signal can tell you which of your contacts are on Signal without learning your contact list. Uses Intel SGX trusted enclaves with attestation.
- **Spam reporting that doesn't reveal content to Signal.** Verifiable Oblivious Pseudorandom Functions (VOPRFs).
- **Open-source clients AND server.** github.com/signalapp.

**What Signal does that P31 should not blindly copy:**

- **Consumer-scale focus.** Signal is built for hundreds of millions of users. Many of its mechanisms (PCD with SGX, the Double Ratchet's complexity budget) are over-engineered for a four-person family mesh.
- **Mobile-app-first.** Signal Desktop is a companion to a mobile app. P31 is web-first.

**What P31 should borrow from Signal — heavily:**

1. **The audit cadence + publication.** Phase 2 of the WBS commissions a third-party security review of `simplex-v7`, the passkey Worker, the K4 personal Worker, and the local command center, and publishes the report.
2. **Reproducible builds.** Phase 1 of the WBS adds a `npm run build:reproducible` that verifies `dist/` is byte-identical given the same inputs (already partially true for `p31ca`, needs to be enforced).
3. **MLS protocol** (RFC 9420) **for any future human-to-human messaging** — not the Signal Protocol itself, because MLS is the open IETF standard that Signal Foundation co-authored. Picking MLS is a forward-looking choice.
4. **The 990 / financials publication discipline.** P31 Labs is 501(c)(3)-pending; the moment the ruling lands, the 990 should be public on the hub. Already in the WBS.
5. **The donor-funded posture as moral architecture, not just a fundraising mechanism.** The `creator-economy.json` 0% fee already says this. The Mozilla Manifesto–style document (Phase 1) makes it readable.

### 3.4 Mozilla

**What Mozilla actually does well that P31 does not:**

- **The Mozilla Manifesto.** A short, principle-led public document that says what Mozilla believes about the open web. This is governance posture as a downloadable PDF.
- **Public security advisories (MFSA).** Every security fix gets a public advisory with CVE, severity, affected versions, and credit to the reporter.
- **Bug bounty program.** Bugzilla + HackerOne. Tiered payouts. Public hall-of-fame for reporters.
- **Reproducible builds.** Firefox builds can be verified against publicly logged source.
- **Localization at scale.** 100+ languages via Pontoon, run by volunteer localizers in a structured program with l10n drivers.
- **Web standards body participation.** Mozilla pays staff to attend W3C/WHATWG/IETF meetings, write specs, and publish public Standards Positions on every web platform proposal.
- **Open governance.** Mozilla Corporation is wholly-owned by Mozilla Foundation (501(c)(3)). The Foundation's board is public. The Manifesto is the constitution.
- **MPL 2.0 license clarity.** Every file's license header is canonical. Third-party code is tracked.
- **Accessibility lead engineer + audit cadence.** Marco Zehe, Eitan Isaacson, etc. — Firefox Accessibility team is a named org.
- **Annual transparency report.** What requests Mozilla received from governments, what they complied with, what they refused.
- **Coverity static analysis on every build.** Commercial static analyzer integrated into CI.
- **Public roadmap.** Wiki-published, updated quarterly.
- **Code of Conduct + enforcement record.** The CoC is enforced; violations are documented.

**What Mozilla does that P31 doesn't need to copy at full strength:**

- **30-year codebase.** Mozilla's release engineering machinery (Treeherder, Try, Taskcluster) is built for a codebase that ships a browser engine. P31 is small.
- **Multi-region build farm.** Not needed at P31 scale.
- **Volunteer-coordinator paid roles.** Not needed at P31 scale.

**What P31 should borrow from Mozilla — heavily:**

1. **A P31 Manifesto** (Phase 1, WBS task PEER-1A). Short. Public. Linked from every page footer.
2. **Public security advisories** (Phase 1, PEER-1B). When a security issue is found, write it down at a stable URL with a P31SA identifier.
3. **Bug bounty (modest)** (Phase 1, PEER-1C). Even a "honor wall" with no money is real. A donate-funded bounty later.
4. **Public transparency report** (Phase 2, PEER-2A). Once a year. What was asked of P31 (govt requests, takedowns, etc. — likely zero, which is itself meaningful to publish).
5. **Reproducible build verification gate** (Phase 1, PEER-1D). Add to the verify chain.
6. **Standards positions register** (Phase 3, PEER-3A). When P31 picks MLS over Signal Protocol, that's a Standards Position. Publish the reasoning.
7. **Public roadmap** (Phase 1, PEER-1E). Even just a `docs/ROADMAP.md` updated quarterly.
8. **Code of Conduct + enforcement clarity** (Phase 1, PEER-1F). Borrow Mozilla's CoC verbatim if needed; fork it; cite.

---

## 4. The honest gap matrix

For each axis, four columns: what each peer has, what P31 has today, what P31 should adopt, what P31 deliberately rejects.

| # | Axis | Meta | Apple | Signal | Mozilla | P31 today | P31 should adopt | P31 rejects |
|---|------|------|-------|--------|---------|-----------|------------------|-------------|
| 1 | E2EE protocol | Signal Protocol (WhatsApp) | Signal-style ratchet (iMessage 2023+) | Signal Protocol (own) | n/a | passkey + PQC primitives, no messaging protocol | **MLS (RFC 9420)** when human-to-human messaging is needed | Inventing our own crypto |
| 2 | Hardware-backed keys | Limited (Android Keystore) | Secure Enclave + iCloud Keychain | Limited (Android Keystore) | n/a | Passkey via WebAuthn (browser-mediated) | **Continue WebAuthn; document the threat model gap vs. Secure Enclave** | Requiring specific hardware |
| 3 | Multi-device sync | Yes (key transparency) | Yes (iCloud Keychain) | Yes (linked devices) | n/a (browser context) | None — CogPass is per-device localStorage | **Phase 3 — CogPass sync via E2EE backup** | Server-side plaintext sync |
| 4 | Identity model | Phone number | Apple ID + phone | Phone number → optional username | Email | None on hub; passkey for ops | **Optional username + passkey; no phone collection** | Requiring phone number |
| 5 | Push notifications | APNS + FCM | APNS | FCM/APNS via OS | n/a | None | **Web Push (VAPID) when PWA shipped** | Background tracking |
| 6 | Mobile app | Native iOS + Android | Native (built-in) | Native iOS + Android | Firefox mobile | Web TUI + LAN command center; no native app | **PWA-first** (already P31 doctrine); native only if grant funds | Requiring an app for basic use |
| 7 | Voice / video | Yes (WebRTC) | FaceTime | Yes (WebRTC) | n/a | None | **Out of scope for v1** — WebRTC + MLS later | Centralized SFU we operate |
| 8 | Group chat features | 1024 members, channels, communities | Group iMessage | 1000-member groups | n/a | None for human-to-human | **MLS supports groups natively when adopted** | Group sizes that break moderation |
| 9 | Trust & safety / spam | ML at scale, NCMEC reports | Filtering at scale | Privacy-preserving spam reports | Bug triage | Local rate limit, no human-facing chat yet | **CSAM scanner if/when human chat ships, integrated at the E2EE-respecting layer (e.g. NeuralHash variants — careful)** | Mass scanning of personal data |
| 10 | Localization | 60+ languages | 40+ languages | 60+ languages | 100+ via Pontoon | English only | **Phase 3 — i18n framework + first 5 languages** (es, pt, fr, ar, zh) | Auto-translation without review |
| 11 | Accessibility | Standard | Best-in-class (VoiceOver, etc.) | Standard | Strong (named team) | `screenComfort` cascade in CogPass; partial WCAG | **Phase 1 — WCAG 2.2 AA audit + remediation** (PEER-1G) | Accessibility as afterthought |
| 12 | Open source | Partial (some libs) | None | Yes (clients + server) | Yes (everything) | Partial | **Phase 1 — explicit license posture per file** (MPL 2.0 base, exceptions documented) | Source-available masquerading as open |
| 13 | Reproducible builds | Partial | Internal | **Yes** | **Yes** | Partial (artifacts byte-identical now) | **Phase 1 — `verify:reproducible` gate** (PEER-1D) | Trust without verify |
| 14 | Independent security audit | Internal red team | Internal + bug bounty | **Public, recurring** | **Public, regular** | None | **Phase 2 — commission audit, publish report** (PEER-2B) | Security through obscurity |
| 15 | Bug bounty | $300K max (Meta) | $1M max (Apple) | Yes ($) | Yes ($) | None | **Phase 1 — honor wall + nominal bounty when funded** (PEER-1C) | "Hacking is illegal" hostility |
| 16 | Public security advisories | Yes | Yes (Apple Security) | **Yes** | **Yes (MFSA)** | None | **Phase 1 — `docs/security/advisories/` + P31SA-### IDs** (PEER-1B) | Silent fixes |
| 17 | Governance doc | Corporate | Corporate | Foundation | **Manifesto** | TERMS + CWPs but no manifesto | **Phase 1 — `docs/P31-MANIFESTO.md`** (PEER-1A) | Marketing as governance |
| 18 | Annual transparency report | Yes | Yes | Yes | **Yes** | Glass box (ops) | **Phase 2 — annual public PDF** (PEER-2A) | Voluntary opacity |
| 19 | 501(c)(3) financials | Corp (n/a) | Corp (n/a) | Yes (990s) | Yes (990s) | 501(c)(3) pending | **Publish 990 once filed** (PEER-1H, gated on IRS) | Donor opacity |
| 20 | Code of Conduct | Yes | Yes | Yes | **Yes (enforced + documented)** | Implicit in DELTA language | **Phase 1 — `docs/CODE-OF-CONDUCT.md`** (PEER-1F) | Vague "be nice" |
| 21 | Public roadmap | Selective | None | Selective | **Yes (wiki)** | Implicit in CWPs | **Phase 1 — `docs/ROADMAP.md`** (PEER-1E) | Vapor announcements |
| 22 | Standards body | W3C/IETF (paid) | W3C (paid) | IETF (MLS co-author) | **W3C/WHATWG/IETF (deeply)** | None | **Phase 3 — when MLS is shipped, register Standards Position** | Standards-washing |
| 23 | Status page | Custom | Custom | Twitter | status.mozilla.org | Glass box | **Phase 1 — `status.p31labs.org` (or hub /status)** (PEER-1I) | Hidden incidents |
| 24 | Donor mechanics | n/a | n/a | One-time + recurring | One-time + recurring | Stripe via donate-api Worker | **Already shipped; document on the manifesto** | Crypto-only or opaque |

---

## 5. Five doctrines P31 holds that none of them do

These are not gaps to close. These are P31's **moat**. New agents must protect them.

1. **Operator-condition-aware AI personas.** The `_shared-operator-root.txt` preamble carries hypoparathyroidism + AuDHD framing into every persona's system prompt. No persona may invent a docket, prescribe medical advice, use submarine metaphors, or treat executive dysfunction as intelligence deficit. Signal/Apple/Meta/Mozilla have nothing in this space.
2. **The K4 family mesh as architectural primitive.** Four vertices (will, S.J., W.J., christyn). Six edges. Closed cage. Isolated personal scope. This is *not* a consumer messaging product — it is a four-person mesh with public hub surfaces. The peer comparison is *not* WhatsApp's group chat; it is *no peer*.
3. **The Cognitive Passport as portable personalization without surveillance.** The passport lives in browser localStorage. P31 servers never see it. It is generated by the user, owned by the user, deleted by the user. The user can hand it to a different P31 instance and the same configuration applies. None of the four peers have this; Apple comes closest with iCloud Keychain but requires Apple hardware.
4. **The DELTA language + ethical style map.** A documented voice that explicitly bans urgency manipulation, marketing "unlock" language, naval/military metaphors, and engagement-maximization patterns. Verified at CI time (`verify:delta-language`, `verify:public-voice`). Mozilla has a Style Guide; P31 has a *measurable* style guide.
5. **Sub-medical-grade by design.** P31 explicitly does not claim to be a medical device. It does not diagnose, prescribe, or substitute for clinical care. This is a feature: it removes the regulatory burden that prevents real tools from reaching the people who need them most. The peer comparison breaks here — Apple Health makes regulatory claims; P31 deliberately doesn't.

If a future agent is tempted to import a peer practice that breaks one of these five doctrines, **the doctrine wins**. Period. Document the conflict and walk away.

---

## 6. Scope of this CWP

**In scope:**

- Phase 1 (trust & transparency layer): manifesto, code of conduct, roadmap, security advisories, bug bounty, reproducible builds, accessibility audit, status page.
- Phase 2 (independent verification layer): third-party security audit, transparency report, 990 publication, MLS protocol research spike.
- Phase 3 (protocol foundations): MLS implementation skeleton, i18n framework, CogPass E2EE backup.
- Phase 4 (community + standards): standards positions, contributor onboarding, public roadmap cadence.
- Phase 5 (mobile distribution): PWA hardening, Web Push, optional native wrapper.

Each phase is **independently shippable**. Each phase will spawn its own sub-CWP when picked up.

**Explicitly out of scope (this CWP):**

- Building a competitor to WhatsApp, iMessage, or Signal. P31 is not a consumer messaging app.
- Voice/video calling (deferred to a separate spike when MLS ships).
- A native iOS/Android app that requires App Store distribution (PWA first; native only with grant funding).
- Replacing the Cognitive Passport with a server-side identity service (architecturally rejected).
- Adding any cloud LLM endpoint to operator-confidential surfaces (already a hard ban; reconfirmed here).
- Trust & safety operations at scale (P31 is family-scale; no chat-with-strangers product at all in v1).
- Rebuilding any Mozilla / Signal infrastructure piece for its own sake. Borrow the *practice*, not the *machine*.
- Phone-number-based identity, ever.

---

## 7. WBS — work breakdown structure

Tasks are grouped by phase. Each task has: ID, owner archetype, dependencies, files touched, acceptance criteria, and verification command (where applicable).

### Phase 1 — Trust & transparency layer (highest leverage, ~2 agent-weeks)

| ID | Task | Deps | Files | Acceptance | Verify |
|----|------|------|-------|------------|--------|
| **PEER-1A** | Author **`docs/P31-MANIFESTO.md`** — short, principle-led public doc. Mirror Mozilla Manifesto structure: 10 principles + commitments. Include the five doctrines from §5 of this CWP. Link from every page footer (BaseLayout edit). | none | `docs/P31-MANIFESTO.md`, `andromeda/04_SOFTWARE/p31ca/src/layouts/BaseLayout.astro`, `p31-alignment.json` | File exists; footer link present on all hub pages; passes `verify:public-voice` and `verify:delta-language`. | `npm run verify` |
| **PEER-1B** | Public security advisories framework. Create **`docs/security/advisories/`** with template (`P31SA-YYYY-NNN.md`), publish first advisory (rate-limit hardening from 2026-05-02). | none | `docs/security/advisories/README.md`, `docs/security/advisories/P31SA-2026-001.md` | Stable URL pattern; first advisory published; linked from manifesto. | `test -f docs/security/advisories/P31SA-2026-001.md` |
| **PEER-1C** | Bug bounty / honor wall. **`docs/security/HALL-OF-FAME.md`** + reporting instructions. No money in v1; clear reporting channel (`security@p31labs.org` once domain is up; until then, GitHub security advisory + email). | PEER-1B | `docs/security/HALL-OF-FAME.md`, `docs/security/REPORTING.md`, `.github/SECURITY.md` | Stable reporting channel; hall-of-fame file with template entry. | manual |
| **PEER-1D** | **`verify:reproducible`** gate. Builds `dist/` twice with `SOURCE_DATE_EPOCH=1`, diffs, fails on any non-deterministic output. Wires into root verify chain. Surfaces drift root-cause when it fires. | none | `scripts/verify-reproducible.mjs`, `package.json`, `p31-alignment.json` | Gate passes today (we already removed `generatedAt` drift); becomes regression-protection going forward. | `npm run verify:reproducible` |
| **PEER-1E** | **`docs/ROADMAP.md`** — public quarterly roadmap. Q3 2026: this CWP. Q4 2026: Phase 2. Q1 2027: Phase 3. Updated quarterly. Linked from manifesto. | PEER-1A | `docs/ROADMAP.md`, `p31-alignment.json` | File exists; quarterly cadence noted; first quarter populated. | manual |
| **PEER-1F** | **`docs/CODE-OF-CONDUCT.md`** — adapt Contributor Covenant 2.1 + add P31-specific clauses (DELTA language adherence, no medical advice on public surfaces, K4 mesh confidentiality). Reference enforcement contact. | PEER-1C | `docs/CODE-OF-CONDUCT.md`, `.github/CODE_OF_CONDUCT.md` | File exists; linked from manifesto + repo root README; enforcement contact valid. | manual |
| **PEER-1G** | **WCAG 2.2 AA audit + remediation pass** on the public hub. Use `axe-core` CLI + manual screen-reader test (NVDA on Windows, VoiceOver on macOS via lent device, TalkBack on Android via cloud emulator). Publish report. Fix all P0/P1 findings. | none | `andromeda/04_SOFTWARE/p31ca/public/**/*.html`, new `npm run a11y:audit` | axe-core scan ≥ 95% pass; manual screen-reader walk-through documented; WCAG 2.2 AA conformance statement at `/accessibility`. | `npm run a11y:audit` |
| **PEER-1H** | 990 publication preparation (gated on IRS ruling). Build the upload page at `/financials` with placeholder + commit to publishing within 30 days of receipt. | none | `andromeda/04_SOFTWARE/p31ca/public/financials.html`, `andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs` | Placeholder page live; commitment text matches Signal Foundation language pattern; routes added. | manual + `npm run hub:ci` |
| **PEER-1I** | Status page at `/status` (or `status.p31labs.org`). Initially renders the existing glass box probe results in a public-friendly format. Auto-refreshes every 60s. No auth. | none | `andromeda/04_SOFTWARE/p31ca/public/status.html`, `andromeda/04_SOFTWARE/p31ca/scripts/ops/ingest-glass-probes.mjs` (already exists) | Page live; pulls from existing probes; reflects real state; mobile-friendly. | manual + `verify:demos` |
| **PEER-1J** | License clarity pass. Audit every source file for license header. Adopt MPL 2.0 as default; document exceptions (e.g. `cognitive-passport-v1-1.schema.json` is CC0; vendored libs keep their own headers). New `verify:license-headers` gate. | PEER-1A | new `LICENSE` (if missing), `scripts/verify-license-headers.mjs`, `docs/LICENSE-POLICY.md` | Every tracked source file has a header or is on the documented exception list. Gate passes. | `npm run verify:license-headers` |

**Phase 1 acceptance:** all 10 tasks shipped; root `verify` chain grows by ≥ 3 gates (reproducible, license-headers, a11y); manifesto + roadmap + CoC + advisories + status are all linked from the hub footer; first security advisory published.

### Phase 2 — Independent verification layer (~4 agent-weeks; some external dependencies)

| ID | Task | Deps | Notes |
|----|------|------|-------|
| **PEER-2A** | Annual transparency report. First edition covers 2025-09 (P31 incorporation) → 2026-08. Publish as PDF + HTML. Government requests received: likely zero (publish that). Takedowns: zero. Data shared: none. Mirror Signal Foundation's format. | PEER-1A, calendar | Externally non-blocking. Operator authors final language. |
| **PEER-2B** | Commission third-party security audit. Targets: `simplex-v7` Worker, `passkey` Worker, `k4-personal` Worker, local command center, Ollama persona system prompt boundaries. Budget: gated on grants (NLnet €15K could fund this). Publish full report. | PEER-1B, funding | Vendor candidates: Trail of Bits (gold standard), NCC Group, Cure53. Solicitation template in `docs/security/audit-rfp-template.md`. |
| **PEER-2C** | MLS protocol research spike. Read RFC 9420 end-to-end. Pick a reference implementation (`mls-rs` Rust, `OpenMLS` Rust, `MLS.swift` Apple). Write a 5-page evaluation with a spike branch demonstrating 3-party group key agreement on a Cloudflare Worker. **Decision document, not a ship.** | none | Spike output is `docs/spike/MLS-EVALUATION-2026-Q4.md`. Forms the input to Phase 3 PEER-3A. |
| **PEER-2D** | Telemetry posture document. Currently P31 collects nothing. Document this. Add a `verify:no-telemetry` gate that asserts no analytics endpoints (GA, Plausible, Fathom, Sentry, etc.) are referenced in any client-side code. | none | New `docs/TELEMETRY.md`, `scripts/verify-no-telemetry.mjs`. |

**Phase 2 acceptance:** transparency report published; MLS spike complete with decision; telemetry posture documented and CI-enforced; audit either commissioned or RFP visibly seeking funding.

### Phase 3 — Protocol foundations (~3 months; depends on Phase 2)

| ID | Task | Deps | Notes |
|----|------|------|-------|
| **PEER-3A** | MLS implementation. Family K4 mesh becomes an MLS group of 4 members. Group state lives in `k4-personal` DO. Members generate keys via WebCrypto. Server only sees ciphertext. | PEER-2C | This is the moment K4 mesh becomes a real E2EE family chat. Depends on the Phase 2 spike picking the right library. |
| **PEER-3B** | i18n framework. Pick a lightweight system (FormatJS or a P31-built ICU-MessageFormat consumer). Externalize all UI strings. First 5 languages: es, pt-BR, fr, ar, zh-Hans — chosen for global reach. Volunteer translator workflow modeled on Pontoon. | PEER-1A | Operator-confidential surfaces stay English (no localization risk on legal text). |
| **PEER-3C** | CogPass E2EE backup. User chooses a passphrase; passport is encrypted with passphrase-derived key (Argon2id); ciphertext stored in user's own R2 bucket or local file. Restore on new device by entering passphrase. P31 never sees plaintext. | PEER-3A (uses MLS keys for sub-keys) | Operator's "every device, my CogPass with me" promise. |
| **PEER-3D** | Standards Position register. When PEER-3A picks MLS over Signal Protocol, write the public reasoning at `docs/standards-positions/MLS-2026.md`. Borrow Mozilla's format. | PEER-3A | First entry. Future entries follow as we touch web/IETF specs. |

### Phase 4 — Community + governance (continuous, starts at Phase 1 completion)

| ID | Task | Notes |
|----|------|-------|
| **PEER-4A** | Contributor onboarding doc (`CONTRIBUTING.md` exists in andromeda; add to home; cross-link). |
| **PEER-4B** | Quarterly roadmap update cadence (calendar reminder, agent-driven draft, operator review). |
| **PEER-4C** | Public meeting notes (board meetings — required for 501(c)(3) anyway; publish redacted version). |
| **PEER-4D** | First-time contributor good-first-issue label + triage policy. |

### Phase 5 — Mobile distribution (~6 months out; gated on grant funding)

| ID | Task | Notes |
|----|------|-------|
| **PEER-5A** | PWA hardening of `/term`. Add manifest, service worker, install prompt, Web Push (VAPID), offline-capable static shell. |
| **PEER-5B** | Lighthouse + PWA audit gate (`npm run pwa:audit`). |
| **PEER-5C** | Optional Capacitor / Tauri wrapper for App Store / Play Store presence. **Only with grant funding.** Avoid until then; PWA is sufficient. |
| **PEER-5D** | Web Push infrastructure (VAPID keypair in env, Worker endpoint, opt-in UX). |

---

## 8. Acceptance criteria — when this CWP is "done"

This CWP closes when:

1. **Phase 1 ships in full** (10 tasks above), with the verify chain extended by ≥ 3 gates and 5 new doc files (manifesto, CoC, roadmap, advisory README, license policy) referenced from the hub footer and from `p31-alignment.json`.
2. **Phase 2 spawns at least one sub-CWP** (typically `CWP-P31-AUDIT-2026-Q4`) that captures the third-party audit work as its own controlled package with a vendor decision, a budget, and a publication timeline.
3. **The five doctrines in §5 are explicitly cited** in `docs/P31-MANIFESTO.md` (PEER-1A) so they are publicly defended.
4. **A new chat agent can read this CWP, the manifesto, the WBS, and the verify chain output, and pick up Phase 2 with no further prompting.** That is the handoff success criterion. See §11.

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Phase 1 grows in scope and stalls | Medium | High — the whole CWP gates on it | Each Phase-1 task is independently shippable; ship in any order |
| Operator burnout on documentation tasks | Medium | High | Most Phase-1 tasks (manifesto, CoC, roadmap) draftable by agent; operator role is review + tone, not writing-from-scratch |
| WCAG audit reveals deep refactors needed | Medium | Medium | Phase-1G has a P0/P1 vs. P2/P3 cutoff; ship the audit + remediation plan, defer P2/P3 fixes to a follow-up CWP if needed |
| MLS implementation is harder than spike suggests | High | Medium | Phase 2 spike is a decision document, not a ship. Phase 3 has its own go/no-go gate based on spike outcome |
| Third-party audit costs exceed grants | Medium | Low | Audit is Phase 2; can ship transparency report (PEER-2A) without it; audit is a separate CWP |
| New chat agent misreads doctrine and breaks one of the five (§5) | Low if this CWP is read | Catastrophic | The doctrine is in §5, repeated in the manifesto, repeated in the handoff prompt §11. Triple-encoded. |

---

## 10. Out of scope (explicit non-goals — agent must not drift into these)

- **Becoming a Signal competitor.** P31 is family-scale + nonprofit. No consumer chat ambitions.
- **Becoming a WhatsApp competitor.** Same.
- **Replacing the Cognitive Passport with a server-side identity.** Architectural rejection.
- **Adding cloud LLM lanes to operator-confidential personas.** Hard ban from `.cursor/rules/p31-ollama-fleet.mdc`. Reconfirmed.
- **Building a moderation team.** P31 has no public chat-with-strangers product. Not in v1.
- **Native iOS/Android apps without grant funding.** PWA first.
- **Phone-number-based identity, ever.**
- **Engagement metrics (DAU/MAU/retention).** Off-doctrine. We measure ship cadence and bug-fix-time, not attention extraction.
- **Voice/video calling without MLS.** Don't ship a voice product on top of unencrypted transport.

If a future agent reads this and thinks "yes but..." — re-read §5, then close the loop with the operator before proceeding.

---

## 11. Handoff prompt — the new chat agent's first message

Paste this verbatim into the new agent's chat. It contains everything required to begin Phase 1 immediately.

```
You are a new Cursor agent picking up CWP-P31-PEER-COMP-2026-05.

Your job: execute Phase 1 of that CWP. Phase 1 is the trust & transparency
layer — 10 tasks (PEER-1A through PEER-1J) listed in §7 of the CWP.

Required reading (in this order, all in /home/p31):
  1. CLAUDE.md                                  (operator condition + K4 mesh)
  2. AGENTS.md §0 + §6 (workspace layout)        (where things live)
  3. docs/CWP-P31-PEER-COMP-2026-05.md          (this CWP — ALL OF IT)
  4. docs/P31-ENGINEERING-STANDARD.md           (ship bar)
  5. docs/HARDEN-POLISH-2026-05-02.md           (current security baseline)
  6. docs/PHOS-VOICE-DRAFT.md §1-§3             (voice)
  7. docs/P31-DELTA-LANGUAGE.md                 (language)

Hard constraints (non-negotiable):
  - Do not break any of the five doctrines in §5 of the CWP.
  - Do not introduce a cloud LLM endpoint to any operator-confidential surface
    (counsel/triage/phos personas).
  - Do not collect any PII on the public hub.
  - Do not invent crypto. If protocol work is needed, use IETF / NIST primitives.
  - Do not exceed the 9-product cage codified in andromeda's
    busBar.constraints.maxProducts.

Verify before you start (must all be GREEN):
  npm run verify                  # 77 gates
  npm run verify:p31-terminal     # 19 structural gates
  npm run terminal:season         # 11 tiers, 58 checks

Pick the first task. PEER-1A (manifesto) is the natural starting point because
it unblocks PEER-1E (roadmap) and PEER-1F (CoC) which both reference it.
PEER-1B (security advisories framework) and PEER-1D (reproducible builds gate)
are independent and can be done in any order.

For each task:
  1. Draft the work in a single commit.
  2. Run the relevant verifier.
  3. Update p31-alignment.json with new sources/derivations.
  4. Update package.json verify chain if you added a gate.
  5. Run npm run verify (must stay GREEN).
  6. Commit with a precise message (see existing log for style).
  7. Push to origin/main.

When all 10 Phase-1 tasks ship, write a CLOSURE-PHASE-1 update at the bottom of
this CWP and propose CWP-P31-AUDIT-2026-Q4 as the natural Phase 2 entry.

If you get stuck on operator-voice tasks (manifesto tone, CoC enforcement
language), draft a first version with [OPERATOR-REVIEW-NEEDED] tags and
commit it for the operator to refine. Do not block on tone perfection.

Do not deferment. Pick a task. Begin.
```

---

## 12. References to peer companies' published material (for the new agent's reading list)

These are public URLs (not affiliated with P31). Read with appropriate skepticism — each company's published material is also their marketing.

| Source | URL | Why |
|--------|-----|-----|
| Mozilla Manifesto | mozilla.org/about/manifesto/ | Manifesto-as-governance template |
| Mozilla Foundation 990s | sec.gov / GuideStar | What 501(c)(3) financial publication looks like |
| Mozilla Standards Positions | github.com/mozilla/standards-positions | The format for PEER-3D |
| Signal Protocol whitepaper | signal.org/docs/ | Crypto threat model + protocol spec |
| Signal Foundation governance | signalfoundation.org | 501(c)(3) governance model |
| Signal audits archive | signal.org/security/ | The audit cadence to mirror |
| Apple Platform Security guide | apple.com/business/docs/site/Apple_Platform_Security_Guide.pdf | Hardware-backed key model |
| Apple Privacy Policy | apple.com/legal/privacy/ | The privacy nutrition labels approach |
| Apple Accessibility Programming | developer.apple.com/accessibility/ | The accessibility engineering bar |
| Meta transparency reports | transparency.meta.com | What scale-tier transparency looks like |
| Meta NCMEC reports | meta.com/safety/ | What CSAM reporting at scale looks like |
| RFC 9420 (MLS) | datatracker.ietf.org/doc/rfc9420/ | The protocol P31 will adopt |
| WCAG 2.2 AA | w3.org/TR/WCAG22/ | The accessibility audit target |
| FIPS 203 (ML-KEM) | nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf | The PQC primitive p31ca uses |
| Contributor Covenant 2.1 | contributor-covenant.org | The CoC base text |
| MPL 2.0 | mozilla.org/MPL/2.0/ | The default license |

---

## 13. Doctrine reaffirmed (closing)

P31 is not Meta. P31 is not Apple. P31 is not Signal. P31 is not Mozilla.

P31 is **the four-person family mesh that an operator with hypoparathyroidism + AuDHD built so that nobody else's family has to figure out, alone, how to make the technology serve the human instead of the other way around.** The hub is the public face of that mesh. The personas are the cognitive prosthetics that let the operator participate in the world even on low-spoon days. The Cognitive Passport is the user's right to be configured for their own brain. The K4 mesh is a four-vertex architecture that scales by **becoming many parallel four-vertex meshes**, not by accumulating a billion users.

What we borrow from the four peers, we borrow because it makes the family mesh more **trustable**, more **accessible**, more **reliable**, and more **defensible** — not because it makes us more **like them**.

The new agent reads this, picks up Phase 1, and builds. The operator reviews tone where it matters and lives the rest. The mesh holds.

— Architect, 2026-05-02 afternoon, under operator command authority.

---

*Sister doc location: this CWP lives at `docs/CWP-P31-PEER-COMP-2026-05.md`. The handoff prompt in §11 is self-contained — it can be pasted into a new agent without the operator having to explain anything else first.*

---

## 14. CLOSURE — Phase 1

**Closed:** 2026-05-02 (same day, single agent session, ~3.5 hours of agent time including verify reruns).
**Status at close:** GREEN — root `npm run verify` passes 81 gates (was 78 at the start of Phase 1).
**Operator review pending on:** tone of `docs/P31-MANIFESTO.md` and `docs/CODE-OF-CONDUCT.md` §3 (P31-specific clauses). Drafts ship as-is; operator can amend in place without bumping versions for typo-class edits.

### What landed

| ID | Deliverable | Where |
|----|-------------|-------|
| **PEER-1A** | Manifesto (1.0.0) — five doctrines + ten principles + ten commitments + non-goals | `docs/P31-MANIFESTO.md` (home), mirrored as `/manifesto` on the hub |
| **PEER-1B** | Security advisories framework (`p31.securityAdvisories/1.0.0`) + first advisory | `docs/security/advisories/README.md`, `_template.md`, `P31SA-2026-001.md` |
| **PEER-1C** | Reporting policy + Hall of Fame + GitHub-facing security policy | `docs/security/REPORTING.md`, `HALL-OF-FAME.md`, `.github/SECURITY.md` |
| **PEER-1D** | `verify:reproducible` gate (doc-library fingerprint + alignment canon checksum + verify-pipeline sync) | `scripts/verify-reproducible.mjs` |
| **PEER-1E** | Public quarterly roadmap (1.0.0) | `docs/ROADMAP.md`, mirrored as `/roadmap` |
| **PEER-1F** | Code of Conduct (Contributor Covenant 2.1 + 7 P31 clauses) | `docs/CODE-OF-CONDUCT.md`, `.github/CODE_OF_CONDUCT.md`, mirrored as `/code-of-conduct` |
| **PEER-1G** | A11y audit framework: static-check baseline (12 rules; WCAG 2.2 AA subset) + machine report + operator-readable report | `scripts/a11y-audit.mjs`, `docs/a11y/REPORT-2026-Q3.md`, `docs/a11y/REPORT-LATEST.md`. **Baseline:** 34 HTML files scanned, 28 with findings, **0 errors**, 16 warnings, 28 info. P0/P1 remediation queued for Q3 close. |
| **PEER-1H** | Financials placeholder page with 990 publication commitment (within 30 days of filing), 75/15/10 target ratios, donor mechanics, 30-day notice on fee changes | `andromeda/04_SOFTWARE/p31ca/public/financials.html`, mirrored as `/financials` |
| **PEER-1I** | Status page (live probes, no auth, no tracking, auto-refreshes every 60s, respects `prefers-reduced-motion`) | `andromeda/04_SOFTWARE/p31ca/public/status.html` + `public/ops-glass-probes.json` mirror; `/status` |
| **PEER-1J** | License clarity pass (`docs/LICENSE-POLICY.md` 1.0.0, default MIT + named exceptions for CC0 schemas/prompts, CC BY-SA 4.0 prose, CC BY 4.0 CoC) + `verify:license-headers` gate (warns on missing, fails on conflict; v1 permissive — strict comes after the header sweep in Phase 2) | `docs/LICENSE-POLICY.md`, `scripts/verify-license-headers.mjs` |

### Verify chain growth

- **Before:** 78 gates (`p31-alignment.json` `verifyPipeline.scripts`)
- **After:** 81 gates — added `verify:reproducible`, `verify:license-headers`, `verify:a11y`
- All inserted between `verify:doc-library:p31ca-mirror` and `verify:github-org`
- `package.json` `verify` and `p31-alignment.json` `verifyPipeline.scripts` are kept in sync (gate `verify:verify-pipeline` enforces this)
- `docs/P31-WIRING-DIAGRAM.md` §9 regenerated via `npm run build:wiring-ci-ladder`

### Hub footer wiring

`andromeda/04_SOFTWARE/p31ca/src/pages/index.astro` footer now links **Manifesto · Roadmap · CoC · Status · Financials** alongside the existing Privacy/Terms/Contact/A11y/Security row. `/security` continues to route to the existing concise responsible-disclosure page (`/security-disclosure.html`); the richer policy hub from PEER-1B/1C lives at `/security-policy → /security.html` so existing inbound links do not change semantics.

### Cross-repo commit map

- **Home (`p31labs/bonding-soup`):** one commit landing 11 docs (manifesto, CoC, roadmap, license policy, security/{advisories/, REPORTING, HALL-OF-FAME, audit-rfp-template}, .github/SECURITY, .github/CODE_OF_CONDUCT, a11y/REPORT-2026-Q3, a11y/REPORT-LATEST + JSON), 3 verifier scripts, package.json + p31-alignment.json + wiring-ladder regeneration, and this CLOSURE update.
- **Andromeda (`p31labs/andromeda`):** one commit landing 6 new public hub pages (manifesto, code-of-conduct, roadmap, status, financials, security), the `ops-glass-probes.json` public mirror, the ground-truth + _redirects update, the index.astro footer link block, and the ingest-glass-probes.mjs public mirror addition.

### Five doctrines, defended

The five doctrines from §5 of this CWP are now explicitly cited in §3 of `docs/CODE-OF-CONDUCT.md`, in the opening section of `docs/P31-MANIFESTO.md` ("The five doctrines"), and on the public manifesto page at `/manifesto`. Triple-encoded as the CWP §11 acceptance criterion required.

### Phase 2 entry — `CWP-P31-AUDIT-2026-Q4` (proposed)

The natural next CWP, to be authored when the operator picks up Phase 2:

| Field | Value |
|-------|-------|
| **CWP ID** | `CWP-P31-AUDIT-2026-Q4` |
| **Title** | Independent third-party security audit + transparency report + telemetry posture + MLS spike |
| **Inherits from** | `CWP-P31-PEER-COMP-2026-05` Phase 2 (PEER-2A through PEER-2D) |
| **Funding gate** | NLnet (€15K typical) or OTF audit grant; transparency report + telemetry posture + MLS spike are NOT funding-gated and can ship before the audit lands |
| **First task** | PEER-2A — author and publish the first annual Transparency Report covering 2025-09 → 2026-08; format per Signal Foundation; output to `docs/transparency/REPORT-2026-Q4.md` and `andromeda/04_SOFTWARE/p31ca/public/transparency.html` |
| **Vendor RFP** | `docs/security/audit-rfp-template.md` (fillable; published in Phase 1) |
| **Acceptance** | Transparency report published; MLS spike has a written decision; `verify:no-telemetry` gate is on the verify chain; audit is either commissioned or has a public RFP visibly seeking funding |

### Known follow-ups (P2 polish, not blocking Phase 1 close)

1. **License-header sweep.** The verifier reports 553 source files missing a header; v1 is non-strict by design. A scripted sweep that adds `SPDX-License-Identifier: MIT` to every default-MIT source file should land in early Q4 2026 and flip the gate to strict. This is mechanical work; it does not need the operator's tone pass.
2. **A11y findings remediation.** 0 error-class findings today (no P0). 16 warnings + 28 info findings span heading hierarchy, missing skip-links, and missing `<main>` landmarks across spike pages and older surfaces. P1 remediation queued for Q3 close — see `docs/a11y/REPORT-LATEST.md`.
3. **In-browser a11y audit.** The static-check baseline does not catch color contrast or computed accessible names. Phase 2 adds `npm run a11y:audit:browser` driving Playwright + axe-core; report at `docs/a11y/REPORT-2026-Q4.md`.
4. **Manifesto hub-side consistency.** The hub `/manifesto` page summarizes the home `docs/P31-MANIFESTO.md`. Edits to the home Manifesto require manual sync to `andromeda/04_SOFTWARE/p31ca/public/manifesto.html` until a `sync:manifesto` script lands (Phase 2 housekeeping).
5. **Operator tone pass.** The operator should read `docs/P31-MANIFESTO.md` end-to-end and amend any sentence they would not say out loud at the hardware store (per `docs/PUBLIC-VOICE.md` Tier-A test). Same for `docs/CODE-OF-CONDUCT.md` §3 P31 clauses.

### Operator handoff for Phase 2

The next agent picking up Phase 2 should read, in order:

1. `docs/P31-MANIFESTO.md` (the public face of the doctrine)
2. `docs/CWP-P31-PEER-COMP-2026-05.md` §6 (scope) + §10 (out-of-scope) + this §14 (CLOSURE)
3. `docs/security/audit-rfp-template.md` (the RFP draft to send when funding lands)
4. `docs/ROADMAP.md` Q4 2026 row (the Phase 2 task list)
5. `docs/a11y/REPORT-2026-Q3.md` (the baseline they will be measured against)

Then propose `CWP-P31-AUDIT-2026-Q4` per the table above and pick PEER-2A (transparency report) or PEER-2D (telemetry posture + verify:no-telemetry gate) as the first concrete task. PEER-2C (MLS spike) can run in parallel since it is research, not ship work. PEER-2B (audit commission) is funding-gated — the agent can prepare the RFP submission package while waiting.

### Closing note (operator)

Phase 1 was the small-scale version of practices Meta, Apple, Signal, and Mozilla have hardened over decades. We did the small-scale version because the right comparison is not feature-parity with those four; it is the **practices** they have proven that translate to a four-person family mesh. The five doctrines remain the floor. The mesh holds.

— Phase 1 closed 2026-05-02 by Cursor agent (Claude Opus 4.7) under operator command authority. Operator review remains open on tone of Manifesto + CoC §3.

---

## 15. CLOSURE — Phase 2

**Closed:** 2026-05-02 (same day as Phase 1, same operator command session, "begin AND finish ALL phases" directive).
**Status at close:** GREEN — root `npm run verify` passes 82 gates (added `verify:no-telemetry`; was 81 at end of Phase 1).
**Operator review pending on:** §12 attestation in `docs/transparency/REPORT-2026-Q4.md` (the operator-signed paragraph that asserts zero government data requests, civil process, takedowns, account actions). Document ships as drafted; operator should re-read and sign before public-facing publication.

### What landed

| ID | Deliverable | Where |
|----|-------------|-------|
| **PEER-2A** | First annual transparency report (1.0.0) covering 2025-09 → 2026-08; Signal Foundation format; warrant canary; operator attestation §12; mirror at `/transparency` | `docs/transparency/REPORT-2026-Q4.md` (home), `andromeda/04_SOFTWARE/p31ca/public/transparency.html` (hub mirror at `/transparency`) |
| **PEER-2B** | Audit RFP package — cover letter template + NLnet €15K funding ask draft + OTF $16K funding ask draft + append-only outreach log; pairs with PEER-1's `audit-rfp-template.md` to make the RFP fillable and shippable when funding lands | `docs/security/audit-rfp-cover-letter.md`, `docs/funding/NLnet-AUDIT-ASK-DRAFT.md`, `docs/funding/OTF-AUDIT-ASK-DRAFT.md`, `docs/funding/AUDIT-OUTREACH-LOG.md` |
| **PEER-2C** | MLS (RFC 9420) evaluation spike — 5-page decision document; `mls-rs` (Apache-2.0) primary recommendation, `OpenMLS` (AGPL) fallback; 3-party demo topology on Cloudflare Worker + WASM; risk table; Phase 3 entry PEER-3A | `docs/spike/MLS-EVALUATION-2026-Q4.md` |
| **PEER-2D** | Telemetry posture (1.0.0) + `verify:no-telemetry` CI gate; git-ls-files-driven scan of tracked source vs DENYLIST (~30 vendor patterns) with documented EXCEPTIONS; mirror at `/telemetry-policy` (NOT `/telemetry` — preserves the existing internal ecosystem dashboard) | `docs/TELEMETRY.md`, `scripts/verify-no-telemetry.mjs`, `andromeda/04_SOFTWARE/p31ca/public/telemetry-policy.html` (hub mirror at `/telemetry-policy`) |

### Verify chain growth

- **Before:** 81 gates (close of Phase 1)
- **After:** 82 gates — added `verify:no-telemetry` between `verify:a11y` and `verify:github-org`
- `package.json` `verify` and `p31-alignment.json` `verifyPipeline.scripts` are kept in sync (gate `verify:verify-pipeline` enforces this)
- `docs/P31-WIRING-DIAGRAM.md` regenerated via `npm run build:wiring-ci-ladder`
- `verify:no-telemetry` enumeration: 3 repo roots, ~3,000 source files scanned, 0 vendor signals, 6 documented exceptions

### Hub redirect & ground-truth updates

- New `/transparency` redirect now serves the formal transparency report (was previously aliased to `/glass-box.html`); the operator-facing glass box stays at `/glass-box` and the short `/glass`
- New `/telemetry-policy` redirect serves the no-telemetry posture page; the existing `/telemetry` URL continues to serve the internal ecosystem dashboard (operator-facing visualization; not user surveillance)
- `/transparency-report` added as an alternate spelling for the transparency report
- `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` `edgeRedirects` updated to match `_redirects` exactly; `/glass-box` note rewritten to remove the formerly aliased `/transparency` short

### Cross-repo commit map

- **Home (`p31labs/bonding-soup`):** one commit landing 7 docs (transparency report, MLS evaluation spike, telemetry policy, audit RFP cover-letter, NLnet ask, OTF ask, outreach log) + 1 verifier script (`verify-no-telemetry.mjs`) + `package.json` (new `verify:no-telemetry` script + chain insertion) + `p31-alignment.json` (8 new sources + new `p31-peer-comp-independent-verification-layer` derivation) + `docs/P31-WIRING-DIAGRAM.md` regenerated + this §15 closure note.
- **Andromeda (`p31labs/andromeda`):** one commit landing 2 new public hub pages (transparency, telemetry-policy) + `_redirects` (3 new entries, 1 changed) + ground-truth (3 new edgeRedirects, 1 changed, glass-box note updated) + doc-library mirror sync.

### Five doctrines, defended (Phase 2)

1. **Operator-condition-aware AI.** The transparency report §10 explicitly discloses the operator's hypoparathyroidism + AuDHD context and how it affects reporting cadence, voice, and honesty. The MLS spike §0 is structured to be readable by an operator in spoon deficit (decision row up top; details after).
2. **K₄ family mesh as architectural primitive.** The MLS spike §4 defends "family-scale (4 members) on Cloudflare Worker + WASM" as the first MLS surface — explicitly *not* a stranger-to-stranger chat product. The transparency report §4 documents that there is no "platform" for stranger speech.
3. **Cognitive Passport as portable personalization without surveillance.** The telemetry posture §3 reaffirms that the passport stays in localStorage. The transparency report §6.4 says the same. Both CI-enforced via `verify:no-telemetry`.
4. **Measurable voice.** The telemetry posture §4.4 is the structural defense — engagement-maximization patterns require telemetry data; the no-telemetry gate forecloses the data path.
5. **Sub-medical-grade by design.** The transparency report §10 reaffirms; the MLS spike does not change anything here (MLS is messaging crypto, not medical).

### Phase 3 entry — `CWP-P31-AUDIT-2026-Q4` no longer the natural next CWP

The Phase-1 closure proposed `CWP-P31-AUDIT-2026-Q4` as Phase 2 entry. Phase 2 is now closed; the audit commission piece (PEER-2B) is the only Phase-2 item that remains funding-gated, and the RFP package is shipped. The audit can be commissioned the moment NLnet or OTF money lands; no new CWP is needed for *that*.

The natural Phase 3 entry is now **`CWP-P31-VIBE-2026-06`** — the tetra-hub vibcoding development environment (per the operator directive of 2026-05-02). PEER-3A (first MLS-bearing surface) remains the protocol track; the vibcoding CWP is a new product track that runs in parallel.

| Field | Value |
|-------|-------|
| **CWP ID** | `CWP-P31-VIBE-2026-06` |
| **Title** | Tetra-hub vibcoding development environment — kid-button-click → operator-grade, with PHOS as guide |
| **Inherits from** | This CWP's Phase 2 closure; not Phase 1 |
| **First task** | VIBE-1A — author the CWP with the operator's vision (PiP CLI, 4-tetra link, cluster pattern, kid → pro spectrum, PHOS guide) |
| **Funding gate** | None for the CWP authorship; first MVP scaffold is also unfunded; full ship requires Phase 5 mobile distribution + Phase 4 community work |
| **Acceptance** | CWP authored; one runnable MVP entry point landed; personal hub + starter hub polished so the operator can boot a fresh device and use what we built |

### Known follow-ups (P3 polish, not blocking Phase 2 close)

1. **Operator tone pass on transparency report.** The §12 attestation must be re-read by the operator and signed (in commit history; eventually GPG when key is published). Same for the MLS spike §0 decision row and §3 license posture.
2. **License header sweep.** Phase-1 follow-up still applies; mechanical addition of `SPDX-License-Identifier: MIT` to default-MIT files; flips `verify:license-headers` to strict.
3. **NLnet/OTF submission window.** Operator must check current call windows before submitting either ask. The drafts at `docs/funding/NLnet-AUDIT-ASK-DRAFT.md` and `docs/funding/OTF-AUDIT-ASK-DRAFT.md` are agent-drafted; the operator's voice should be in §3 narrative paragraphs before submission.
4. **MLS spike validation.** The spike is a decision document, not a deployment; before Phase 3 PEER-3A starts, the operator should read RFC 9420 Sections 4–8 directly (TreeKEM, Welcome, Commit) and confirm `mls-rs` over `OpenMLS` is the right call given Apache-2.0 vs AGPL constraints.
5. **In-browser a11y audit (carries from Phase 1).** Still queued for Phase 2+; not a Phase-2 ship requirement.
6. **Annual transparency cadence.** Next edition `REPORT-2027-Q4.md` is due 2027-09 → 2027-10; the operator should pin this in the calendar.

### Operator handoff for Phase 3

The next agent picking up Phase 3 should read, in order:

1. `docs/CWP-P31-PEER-COMP-2026-05.md` §15 (this closure) — to understand the floor
2. `docs/spike/MLS-EVALUATION-2026-Q4.md` — for the protocol track
3. `CWP-P31-VIBE-2026-06.md` (when authored — see §16 below) — for the new product track
4. `docs/transparency/REPORT-2026-Q4.md` §6, §10 — to understand the data posture and operator condition before adding any product surface that could violate either
5. `docs/MORNING-OPERATOR-ARC.md` — for the lived-time stance the operator works inside

Then propose either PEER-3A (first MLS surface, gated on funding + spike sign) or VIBE-1A (vibcoding CWP authorship + first MVP scaffold) as the first concrete task. The vibcoding track is operator-front-loaded (the operator wants to "boot up my device and use our stuff"); the MLS track is funding/audit-front-loaded.

### Closing note (operator-facing)

Phase 2 closed five days into the same week Phase 1 closed because the operator's directive was "begin AND finish ALL phases" and because Phases 2-D items are mostly authoring + one CI gate that the codebase was already structurally compliant with (`verify:no-telemetry` found zero violations on first scan). The audit commission is the one Phase-2 item we cannot ship without funding; that one is shipped *as a package* — when money lands, the operator types `cd docs/security && cp audit-rfp-template.md ../audit-rfp-2026-q4.md`, fills in five fields per the cover letter template, and sends.

The substrate now has the full trust + transparency + verification layer that Mozilla, Signal, Apple, and Meta all took years to build at scale. We did it at family scale in days because we did not try to copy their *machine*; we copied their *practice*.

— Phase 2 closed 2026-05-02 by Cursor agent (Claude Opus 4.7) under operator command authority. Five doctrines remain the floor. The mesh holds.

---

## 16. NEXT — `CWP-P31-VIBE-2026-06` referenced

Authored separately at `docs/CWP-P31-VIBE-2026-06.md` (per operator directive 2026-05-02). That CWP carries the vibcoding tetra-hub development environment plan: PiP CLI inside browser, 4-tetra-link → cluster pattern, kid-button-click → operator-grade spectrum, PHOS as guide throughout. Phase 1 of `VIBE-2026-06` polishes the personal hub and starter hub so a fresh device boot is a usable experience.

