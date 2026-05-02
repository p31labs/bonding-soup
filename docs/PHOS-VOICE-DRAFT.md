# PHOS — voice draft (Track A · operator hand only)

**Purpose:** This file holds the canonical voice of PHOS — the personality layer that is the face of P31 to anyone who arrives without context. It is authored by the operator (William Rodger Johnson). Agents may read it. Agents must not edit lines marked `OPERATOR-VOICE`. Agents may add structural scaffolding, voice rules, and metadata.

**Status:** DRAFT-COMPLETE. Per-page copy filled 2026-05-01 by Architect (Opus draft, merged by Claude Code) from 3 months of operator context. Operator reviews live, marks `OPERATOR-VOICE` on lines that ring true, rewrites what doesn't.

**Tagline change (2026-05-01 evening):** "raw dogging life" → "figuring it out as they go." Operator-directed because Willow (6) and Bash (10) are the design audience for the front door. The new line carries the same emotional weight, reads on a sticker, reads in a courtroom, reads to a kindergartener.

**Mirror:** Stable strings emit into `andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json` (per-page contextual copy, fetched at runtime by `p31-phos-guide.mjs`) and into `scripts/meatspace/generate.mjs` `TAGLINE_OPERATOR_VOICE` (printed on the meatspace artifacts). Source-of-truth lives here.

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
15. **Kid-readable on the front door.** Anything that goes on `/welcome`, the elevator card, the QR sticker, or the boot screen must be readable by a six-year-old without raising parental questions. (Added 2026-05-01 with the tagline change.)

---

## 3. Canonical lines (OPERATOR-VOICE — do not edit)

These lines were emitted by the operator in real time, unprompted, while planning PHOS. They are the kernel. Everything else aligns to them.

### 3.1 The promise (the line)

> **"For every family out there figuring it out as they go — help is on the way."**

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
> **For every family out there figuring it out as they go — help is on the way.**
>
> **Start with your context card. Two minutes. It makes everything here work better for you.**
>
> **Or just look around. I'll be here if you need me."**

That is PHOS at first contact. Warm. Direct. No jargon. Acknowledges the load. Names the next step. Offers the dismiss.

### 3.3 The structure (the symmetry)

> **"Nine calcium atoms. Nine MVPs. One phosphorus at the center. The cage is complete."**

This is operator-voice expressing the architectural alignment. Not for stranger copy. Reserved for `/lab`, the cognitive passport long-form (edition 5.1+), grant narratives, the `?alive=1` deep-dive surfaces, and the operator wall poster (`scripts/meatspace/generate.mjs` `generateWiringPoster()` footer — abbreviated to fit the 11×17 footer band; full sentence is canonical here). Confirms that the product count was emergent from the chemistry, not designed to match.

**Architectural consequence (binding):** the canonical product count is **nine**. A tenth product breaks the symmetry. New product proposals must either (a) absorb into one of the existing nine, (b) wait for an explicit cage-expansion CWP that re-derives the geometry, or (c) live outside the cage as infrastructure (Workers, fleet) rather than as user-facing MVPs. This rule is enforced in `andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs` review.

---

## 4. Per-page contextual copy (operator extends; agent simulates)

This section is the source of truth for `p31-phos-voice.json`. Every slot in `busBar.slots` (per `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`) gets one entry. Two tags exist:

- **`OPERATOR-VOICE`** — written by the operator. Cannot be edited by agents. The build script preserves these verbatim. SHA-locked by `verify:phos-voice` to detect tampering.
- **`DRAFT-AGENT-SIMULATED`** — placeholder copy generated by the Architect under §2 voice rules to keep PHOS speakable on every page until the operator extends. Agents may improve a draft (still tagged DRAFT). The operator promotes by rewriting and changing the tag to `OPERATOR-VOICE`.

Format (machine-parseable; do not freestyle):

```
### `/path`

> **tag:** `OPERATOR-VOICE` *(optional source note in italics)*

- **greeting:** `"JSON-encoded string"`
- **hint:** `"JSON-encoded string with \\n for newlines"`
- **fallback:** `"JSON-encoded string"`
- **links:** `[{"label":"...","href":"/..."}, ...]`
```

Build → `npm run build:phos-voice`. Verify → `npm run verify:phos-voice` (banned vocab + tag preservation + JSON shape; on the ship bar). The PHOS guide normalizes pathnames before lookup (trailing slash AND `.html` suffix are stripped), so write voice keys as the natural route name (`/buffer` not `/buffer.html`, `/passport` not `/passport/`).

### `_default`

> **tag:** `DRAFT-AGENT-SIMULATED` *(fallback for any page without its own entry)*

- **greeting:** `"Still here."`
- **hint:** `"Looking for something? The context card adapts everything to how your brain works. The lab shows what we build. Or just keep exploring."`
- **fallback:** `"I'm not going anywhere."`
- **links:** `[{"label":"Create your context card","href":"/passport/"},{"label":"See what we build","href":"/lab"}]`

### `/welcome`

> **tag:** `OPERATOR-VOICE` *(§3.2 first derivation — locked by verify:phos-voice SHA; operator-approved tagline change 2026-05-01 evening)*

- **greeting:** `"Hi. I'm PHOS."`
- **hint:** `"For every family out there figuring it out as they go — help is on the way.\n\nStart with your context card. Two minutes. It makes everything here work better for you."`
- **fallback:** `"Or just look around. I'll be here if you need me."`
- **links:** `[{"label":"Create your context card","href":"/passport/"},{"label":"See what we build","href":"/lab"}]`

### `/passport`

> **tag:** `DRAFT-AGENT-SIMULATED` *(operator: this is the card itself — write what feels true)*

- **greeting:** `"This is yours."`
- **hint:** `"Your context card tells every page on this site how to work for you. Font size, contrast, motion, color — you set it once, it follows you everywhere.\n\nNothing leaves your browser. We literally cannot see what you put here."`
- **fallback:** `"Skip anything that doesn't feel right. Everything still works without it. This just makes it work better."`
- **links:** `[{"label":"What is a context card?","href":"#about"},{"label":"Back to the front door","href":"/welcome"}]`

### `/lab`

> **tag:** `DRAFT-AGENT-SIMULATED`

- **greeting:** `"Here's what we build."`
- **hint:** `"Everything here is free. Everything is open source. If something helps you, take it. If something breaks, tell us."`
- **fallback:** `"Not sure where to start? The context card is usually the best first step. After that, BONDING is the most fun."`
- **links:** `[{"label":"Play BONDING","href":"https://bonding.p31ca.org"},{"label":"Create your context card","href":"/passport/"},{"label":"Read the research","href":"/research"}]`

### `/support`

> **tag:** `DRAFT-AGENT-SIMULATED` *(line 1 mirrors operator framing — keep it)*

- **greeting:** `"Thank you for being here."`
- **hint:** `"P31 runs on zero salary and whatever people can give. Every dollar goes straight to building tools for neurodivergent families. We take 0% platform fees — if you give ten bucks, we get ten bucks."`
- **fallback:** `"Not in a position to give? That's fine. Using the tools and telling one person about them is just as real."`
- **links:** `[{"label":"Give what you can","href":"https://ko-fi.com/trimtab69420"},{"label":"See what your support builds","href":"/lab"}]`

### `/research`

> **tag:** `DRAFT-AGENT-SIMULATED`

- **greeting:** `"The receipts."`
- **hint:** `"22 open-access research papers. The theory behind the tools — published so anyone can check our work, cite it, or build on it. All free. All permanent."`
- **fallback:** `"Heavy reading. Come back when you have the spoons for it. The tools don't require any of this to use."`
- **links:** `[{"label":"Back to the tools","href":"/lab"},{"label":"Create your context card","href":"/passport/"}]`

### `/bonding`

> **tag:** `DRAFT-AGENT-SIMULATED` *(cross-origin surface; bridge ships in BUS4 Phase 3)*

- **greeting:** `"Welcome to BONDING."`
- **hint:** `"A chemistry game for parents and kids. Drag atoms, build molecules, play together — even from different rooms."`
- **fallback:** `"Works best on a tablet. Grab a kid if you have one nearby."`
- **links:** `[{"label":"Back to the lab","href":"https://p31ca.org/lab"},{"label":"Back to welcome","href":"https://p31ca.org/welcome"}]`

### `/dome`

> **tag:** `DRAFT-AGENT-SIMULATED` *(highest-stimulation page; keep voice deliberately understated)*

- **greeting:** `"The map."`
- **hint:** `"Every node is something we built. Every line is a connection between them. This is the whole system in one view."`
- **fallback:** `"It's a lot to take in. Zoom into whatever catches your eye, or head to the lab for the plain-text version."`
- **links:** `[{"label":"See the list view","href":"/lab"},{"label":"Create your context card","href":"/passport/"}]`

### `/stylebook`

> **tag:** `DRAFT-AGENT-SIMULATED`

- **greeting:** `"The design system."`
- **hint:** `"This is how P31 looks, reads, and feels — documented so anyone building with us stays consistent. Tokens, typography, color, voice rules, accessibility targets."`
- **fallback:** `"If you're here to contribute, start with the token reference. If you're here because you're curious, welcome to the kitchen."`
- **links:** `[{"label":"Token reference","href":"/stylebook/tokens-reference.html"},{"label":"How to contribute","href":"/stylebook/contributing.html"}]`

### `/ops`

> **tag:** `DRAFT-AGENT-SIMULATED` *(operator-only surface; PHOS still greets in case someone is shoulder-surfing)*

- **greeting:** `"Operator view."`
- **hint:** `"Fleet health, filing deadlines, board status, grant pipeline. Everything the operator needs on one screen."`
- **fallback:** `"If you're not the operator and you're seeing this — hi. You probably have a context card with operator access. That's fine. Look around."`
- **links:** `[{"label":"Back to the lab","href":"/lab"},{"label":"Back to welcome","href":"/welcome"}]`

### `/ede`

> **tag:** `DRAFT-AGENT-SIMULATED` *(operator-only surface; the development environment)*

- **greeting:** `"EDE — the development environment."`
- **hint:** `"Every tool, one keystroke away. Built for the operator's hands."`
- **fallback:** `"If you're exploring without context, the lab is the friendlier door."`
- **links:** `[{"label":"Back to the lab","href":"/lab"},{"label":"Back to welcome","href":"/welcome"}]`

### `/buffer`

> **tag:** `DRAFT-AGENT-SIMULATED` *(refined 2026-05-02 morning — grounded in actual product behavior per registry.mjs)*

- **greeting:** `"This is the Buffer."`
- **hint:** `"When a hard message lands and you need to respond carefully — paste it here. The Buffer flags pressure tactics, finds the part that actually needs an answer, and helps you draft a reply at your pace.\n\nSlow breath. Clear head."`
- **fallback:** `"Not sure you need it right now? You probably don't. Bookmark it for the next stressful inbox moment."`
- **links:** `[{"label":"Open the Buffer","href":"/buffer.html"},{"label":"Back to the lab","href":"/lab"}]`

### `/glass-box`

> **tag:** `DRAFT-AGENT-SIMULATED`

- **greeting:** `"Everything we do, in the open."`
- **hint:** `"Verifiers, deploys, audits, ledgers. If P31 ran it, it shows here."`
- **fallback:** `"Hard read? The support page has the same numbers in plain English."`
- **links:** `[{"label":"Support page","href":"/support"},{"label":"Back to welcome","href":"/welcome"}]`

---

## 5. Operator instructions (when iPad is warm)

1. Open this file on the iPad.
2. Read §3 first. That's the kernel — confirm the tagline still rings true tomorrow as it does tonight. If it doesn't, rewrite it. Track A is yours.
3. Walk §4 page by page. For any slot tagged `DRAFT-AGENT-SIMULATED` that sounds like you — change the tag to `OPERATOR-VOICE`. For any that doesn't — rewrite it in your voice, then change the tag.
4. Don't aim for perfect. Aim for honest. The operator's voice is the spec.
5. After editing, run `npm run build:phos-voice` to regenerate the JSON. Run `npm run verify:phos-voice -- --update-lock` to update the SHA lock for any new OPERATOR-VOICE entries. Commit both.

**Live-testing flow (vibe-check loop):** open `/welcome` (or any page) on the laptop, see the line PHOS says, decide if it's right. If yes — leave it. If no — open this file in another window, edit the bullet, run `npm run build:phos-voice`, hard-refresh the page. Voice updates instantly. No deploy, no commit, no wait. Iterate until the vibe lands. Commit when stable.

---

## 6. Verification (when canonical mirror exists)

- `npm run verify:phos-voice` — fails if `p31-phos-voice.json` contradicts `OPERATOR-VOICE` lines or violates banned-vocabulary list.
- `npm run verify:public-voice` (existing) — already enforces identity-first language and Tier B/C guardrails per `docs/PUBLIC-VOICE.md`.
- Manual: pair-check on Chromebook + iPhone before any deploy that touches `p31-phos-voice.json`.

---

*"The geometry holds. Now give it skin."*

*First per-page draft by Architect (Opus) under operator command authority, merged with the build pipeline structure by Claude Code, 2026-05-01. Per-page copy filled from 3 months of operator context. Operator promotes draft lines to OPERATOR-VOICE one at a time during live testing. Updates: operator hand only on lines marked OPERATOR-VOICE; structural sections (1, 2, 5, 6) editable by Architect with operator review.*

*Tagline change 2026-05-01 evening: "raw dogging life" → "figuring it out as they go." Same weight. Kid-readable. Bash and Willow can sound it out without questions.*
