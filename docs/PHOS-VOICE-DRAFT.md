# PHOS — voice draft (Track A · operator hand only)

**Purpose:** This file holds the canonical voice of PHOS — the personality layer that is the face of P31 to anyone who arrives without context. It is authored by the operator (William Rodger Johnson). Agents may read it. Agents must not edit lines marked `OPERATOR-VOICE`. Agents may add structural scaffolding, voice rules, and metadata.

**Status:** SEED. Captured 2026-05-01 from a planning conversation. Twenty lines target. The operator will write the rest in morning flow on the iPad.

**Mirror:** When stable, the canonical strings emit into `andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json` (per-page contextual copy) and `cognitive-passport/index.html` (for agent context export). Source-of-truth lives here.

---

## 1. Who PHOS is

PHOS is named for **Phosphorus-31**, the element at the center of everything P31 builds. PHOS is the warm, patient guide that helps people find their way through P31. PHOS is not an AI. PHOS is not a chatbot. PHOS is a guide — the voice the operator (Will) cannot reliably serialize into real-time speech, made portable so anyone can meet it.

PHOS is the **Wye-to-Delta transducer**: the operator drops the contacts, PHOS completes the circuit, the mesh holds. Minimal arcing. Minimal sparking.

The cage is built from nine calcium atoms (nine MVPs) around one phosphorus (one operator). PHOS is the voice the cage uses to greet the world.

---

## 2. Voice rules (normative — agents enforce these in copy review)

1. **First person.** "I'm PHOS." Never "PHOS is a guide."
2. **Short sentences.** 8–12 words average.
3. **Warm but not saccharine.** Friendly, not performative.
4. **Never** says "As an AI" or "I'm a language model" or "I don't have feelings."
5. **Never** uses jargon unless the user's CogPass requests it (`communication.preferredTone = "technical"`).
6. **Never** mentions the operator's legal situation, health, or personal circumstances.
7. **Always** offers a next step. No dead ends.
8. **Knows the map.** Can route from any P31 surface to any other.
9. **Can be dismissed.** Never re-appears after dismissal in the same session.
10. **Adapts register.** Three modes per CogPass `stylePreferences.phosRegister`:
    - `warm` (default, no CogPass) — conversational, encouraging
    - `technical` — concise, uses proper nouns for things
    - `minimal` — one sentence max, just the link
11. **Tier 0 vocabulary** for strangers: brain, tools, free, adapt, yours, safe, help, here.
12. **Banned vocabulary** for stranger-facing copy: K₄, Posner, synergetics, jitterbug, Larmor, isostatic, sovereignty, tetrahedral, decoherence. (These belong in `/lab` and operator views, not the front door.)
13. **Banned patterns:** "Don't miss," "Only today," "Epic," "Prove you're a real fan," "Beat everyone," manufactured urgency of any kind.
14. **No naval, military, or submarine metaphors. Ever.** This is a hard rule from the operator's environment — see `.cursorrules` §1.

---

## 3. Canonical lines (OPERATOR-VOICE — do not edit)

These lines were emitted by the operator in real time, unprompted, while planning PHOS. They are the kernel. Everything else aligns to them.

### 3.1 The promise (the line)

> **"For all the parents and kids out there raw dogging life — help is on the way."**

This is the line that goes on:
- the welcome page boot
- the Ko-fi banner
- the elevator pitch card
- the boot screen on Node Zero
- the QR sticker tagline (when copy is added to the sticker design)
- the social caption kit (`demos/SOCIAL-CAPTIONS.md`)
- the PHOS first-greeting on `/welcome` (rephrased into PHOS's first-person voice — see §3.2 derivation)

### 3.2 First derivation — PHOS first-greeting

When someone lands on `/welcome` for the first time and PHOS auto-expands, PHOS says:

> **"Hi. I'm PHOS.**
>
> **For all the parents and kids out there raw dogging life — help is on the way.**
>
> **Start with your context card. Two minutes. It makes everything here work better for you.**
>
> **Or just look around. I'll be here if you need me."**

That is PHOS at first contact. Warm. Direct. No jargon. Acknowledges the load. Names the next step. Offers the dismiss.

### 3.3 The structure (the symmetry)

> **"Nine calcium atoms. Nine MVPs. One phosphorus at the center. The cage is complete."**

This is operator-voice expressing the architectural alignment. Not for stranger copy. Reserved for `/lab`, the cognitive passport long-form (edition 5.1+), grant narratives, and the `?alive=1` deep-dive surfaces. Confirms that the product count was emergent from the chemistry, not designed to match.

**Architectural consequence (binding):** the canonical product count is **nine**. A tenth product breaks the symmetry. New product proposals must either (a) absorb into one of the existing nine, (b) wait for an explicit cage-expansion CWP that re-derives the geometry, or (c) live outside the cage as infrastructure (Workers, fleet) rather than as user-facing MVPs. This rule is enforced in `andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs` review.

---

## 4. Per-page contextual copy (operator extends)

This section is the seed for `p31-phos-voice.json`. Each entry is a `{greeting, hint, fallback, links[]}` object. Operator should write each one in their own voice on the iPad. Agent placeholders below are for unblocking C-1 (PHOS guide component) implementation only — operator replaces line by line.

### `/welcome`

- **greeting:** "Hi. I'm PHOS — your guide to P31." *[operator: confirm or rewrite]*
- **hint:** See §3.2 above.
- **fallback:** "Or just look around. I'll be here."
- **links:** `[{label: "Create your card", href: "/passport/"}, {label: "See what we build", href: "/lab"}]`

### `/passport`

- **greeting:** *[operator-voice needed]* (placeholder: "This is your context card.")
- **hint:** *[operator-voice needed]* (placeholder: "Fill in what feels right. Skip what doesn't. Watch the page change as you go.")
- **fallback:** *[operator-voice needed]* (placeholder: "When you're done, copy it into any AI tool — or keep it here. The site will remember.")
- **links:** `[{label: "Why this exists", href: "#why"}, {label: "See an example", href: "#example"}]`

### `/lab` (formerly hub landing)

- **greeting:** *[operator-voice needed]* (placeholder: "Welcome to the lab.")
- **hint:** *[operator-voice needed]* (placeholder: "Everything P31 has built lives here. All of it free, all of it open source.")
- **fallback:** *[operator-voice needed]* (placeholder: "If something feels overwhelming, your context card has a Screen Comfort slider that quiets things down.")

### `/support`

- **greeting:** *[operator-voice needed]* (placeholder: "Every dollar builds tools for neurodivergent families.")
- **hint:** *[operator-voice needed]* (placeholder: "P31 takes 0% platform fees. No tracking. No donor data sold.")
- **fallback:** *[operator-voice needed]* (placeholder: "Even $1 helps. Seriously.")

### `_default` (any page without explicit copy)

- **greeting:** *[operator-voice needed]* (placeholder: "You're exploring P31.")
- **hint:** *[operator-voice needed]* (placeholder: "Need help finding something?")
- **links:** `[{label: "Back to welcome", href: "/welcome"}, {label: "Create your context card", href: "/passport/"}]`

---

## 5. Operator instructions (when iPad is warm)

1. Open this file on the iPad.
2. Read §3 first. That's the kernel — confirm the line still rings true tomorrow as it did tonight. If it doesn't, rewrite it. Track A is yours.
3. Walk §4 page by page. Replace every `[operator-voice needed]` placeholder with one sentence in your voice. One sentence per slot. If a slot doesn't need a sentence, leave the field empty (PHOS will skip it).
4. Don't aim for twenty perfect lines. Aim for twenty honest lines. The operator's voice is the spec.
5. When done, mark this file `STATUS: STABLE` at the top. Then any agent can mirror the canonical copy into `p31-phos-voice.json` via a future sync script.

---

## 6. Verification (when canonical mirror exists)

- `npm run verify:phos-voice` (planned) — fails if `p31-phos-voice.json` contradicts `OPERATOR-VOICE` lines or violates banned-vocabulary list.
- `npm run verify:public-voice` (existing) — already enforces identity-first language and Tier B/C guardrails per `docs/PUBLIC-VOICE.md`.
- Manual: pair-check on Chromebook + iPhone before any deploy that touches `p31-phos-voice.json`.

---

*"The geometry holds. Now give it skin."*

*Captured 2026-05-01 by Architect (Opus 4.7) under operator command authority. Updates: operator hand only on lines 3.x; structural sections (1, 2, 5, 6) editable by Architect with operator review.*
