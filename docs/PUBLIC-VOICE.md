# Public voice — P31 (identity-first)

**Document:** `p31.publicVoice/1.0.0` (human canon; not a JSON schema).  
**Pairs:** **`docs/ETHICAL-STYLE-MAP.md`** (tokens, motion, ethical UI). **`npm run verify:public-voice`** runs doc anchors + Tier **B/C** grep guardrails (**`docs/p31-public-voice-guardrails.json`**) — not taste or Tier **A** narrative; that still needs a reader who knows you.

---

## Why this exists

Public-facing media fails when readers sense **incongruence**: the story does not match the thing built. That is not the same as “AI-smell.” People often catch incongruence before they can name it — especially in tight-knit communities — and they leave without explaining why.

This project **uses AI as assistive technology**. Hiding that to sound “more human” usually does the opposite: it makes the public story disagree with the real one. The fix is **not** generic AI marketing. It is **honest disclosure in your own voice**: disability and constraint first, tools second, mission third.

**Meta-rule:** Would you say this sentence out loud, in your own voice, to someone standing in front of you? If no, rewrite or cut.

---

## What we say

- **We use AI as cognitive prosthetic** — not as the hero of the story, but as equipment. The origin story is **human need** (disability, separation, calcium, serialization limits), not “innovation.”
- **We built tools because we needed them** and open-sourced or shared them because others may need them too.
- **The disability is ongoing** — tools help; they do not “overcome” or cure. Uncertainty where it is real (“we’re testing,” “not funded yet”) is credibility, not weakness.

---

## How we say it

- **Plain. Short. Concrete.** Name real tools when it matters (`Claude`, `Cloudflare`, `ESP32`, `Vitest`) — not “AI-powered solutions.” Name real costs when relevant. Name people with the policy you already use for minors (**S.J.**, **W.J.** — see **`.cursorrules`** / **`CLAUDE.md`**).
- **Lead with the limitation**, then the response. Capability-first marketing reads like a brochure; constraint-first reads like a person.
- **One metaphor max per page** — and only if you would use it in conversation.
- **Uncertainty is allowed** — claims you cannot support yet should say so.
- **Where generative AI shapes public-facing content**, say so **in the content**, not only in a footer. Frame it as accommodation + collaboration on structure, not as replacement of judgment. Where there is **no** generative AI in the product (e.g. deterministic game logic), do **not** imply AI — unnecessary disclosure creates suspicion.

**Tests (use every Tier A pass):**

1. **Hardware store** — Read it aloud. If you would not say it in line at the store, rewrite.
2. **Local run-in** — You have ~30 seconds before your ice cream melts. Someone asks what you’re building. What comes out of your mouth is the voice; the site should match that at the same volume.
3. **Pair check** — Someone who knows the mission **and** the local context reads once. If it sounds performative, fix it.

**Presence beats polish:** In many small-town and semi-rural contexts, trust starts with **recognition** — a real face or a real workspace photo beats flawless copy. Imperfect and true beats slick and hollow.

---

## What we never say

**The avoid-list (radioactive — reads as “generated” even if a human typed it):**

`delve` · `landscape` · `unlock` · `leverage` · `empower` · `innovative` · `cutting-edge` · `revolutionary` · `synergy` · `solutions` (as vague noun soup)

**Also avoid:**

- Claiming **more users or reach than you have** — say “one family,” “a beta,” “we’re testing” if that is the truth.
- Claiming **outcomes you have not measured**.
- Framing disability as **fully overcome** or purely inspirational — respect the daily reality.
- **Surveillance framing** for kid-facing spaces — parent trust is safety and restraint, not analytics hype.

---

## Tiers (reminder)

| Tier | Examples | Gate |
|------|------------|------|
| **A — Face** | Org story, fundraising, founder-led About, grant openings | **Human-only final draft**; AI may help outline or structure offline — rewrite until the voice is yours |
| **B — Working** | README narrative, doc library prose | Human voice; strip generic polish |
| **C — Machine** | JSON, redirects, registry metadata, verify scripts | Accurate and minimal |

---

## Workflow (unchanged — still mandatory)

1. Draft offline (speech-shaped first).
2. Read aloud (**hardware store** test).
3. Tier A high-stakes: **sleep** + second pass.
4. **Pair check** before publish.

---

## Copy ship checklist

Use before merge or deploy for **Tier B/C** surfaces (README prose, static HTML, hub lobby, fleet portal generator, learner HTML). **Tier A** still needs a human final draft and pair check — this checklist does not replace that.

1. **Tier** — Mark the surface **A**, **B**, or **C**. If it is face/fundraising/grants, stop until Tier A is drafted in your voice.
2. **Deploy target** — Know whether you are shipping **home static**, **p31ca** (run `hub:ci` / deploy from `andromeda/04_SOFTWARE/p31ca`), or **both**, and run the matching build/sync for that path.
3. **Disclosure** — If generative AI shaped the reader-facing text, say so where voice matters (not only a footer). If the behavior is deterministic, do not imply AI.
4. **Mechanical gate** — Run **`npm run verify:public-voice`** (same as **`npm run p31:voice`** or **`npm run p31 -- voice`**) — required headings in this doc + grep guardrails on watched files — see **`docs/p31-public-voice-guardrails.json`**.
5. **Canon** — **`docs/PUBLIC-VOICE.md`** (voice) + **`docs/ETHICAL-STYLE-MAP.md`** (tokens, motion, ethical UI).
6. **Rolling alignment** — If you touch a new public HTML path, add one line under **Rolling alignment** below so the next pass stays honest.

### Station (merge / deploy)

- **`npm run p31:voice`** — guardrails only (fast).
- **`npm run verify`** — full home ship bar.
- **`npm run p31:ci`** — root verify + p31ca verify/build when **`andromeda/04_SOFTWARE/p31ca`** is present.
- **`npm run deploy:p31ca`** — hub Pages when Cloudflare creds are set (spine: **`docs/P31-STARTUP-PACKAGE.md`**, deploy canon: **`docs/P31-DEPLOY-CANON.md`**).

---

## Tier A writing prompts (operator — morning flow)

These are **not** model prompts. They are **questions to answer in your own voice** — paper, Apple Pencil, or voice memo first; transcription second; ums stripped; face paragraph stays yours. AI may help structure everything **after** the opening. **Tier A pass is the operator’s job** — no system can write it for you.

**phosphorus31.org About (three paragraphs):**  
Write like you’re explaining P31 to someone you just met at Bash’s school. They asked what you do now. You have two minutes.

**Ko-fi bio (four sentences):**  
Write like you’re explaining why you need money to someone who offered to help. They’re a friend, not a foundation. Be specific about what the money buys.

**Next grant application opening (first paragraph):**  
Write like the reviewer will decide whether to keep reading or skip. You have ~30 seconds of their attention. What’s the one thing they need to know?

**Any future About page:**  
Record a voice memo: what is this thing and who is it for? Transcribe it. Clean up the ums. That’s the copy seed.

**When:** Schedule these when Tier A surfaces are queued for rewrite — same block you protect for deep work, not as an afterthought.

---

## Where this wires in the ecosystem

- **Ethical UI / psych / tokens:** **`docs/ETHICAL-STYLE-MAP.md`**
- **DELTA vocabulary / forbidden phrases at scale:** **`docs/P31-DELTA-LANGUAGE.md`**, **`docs/p31-delta-language.json`**, **`npm run verify:delta-language`**
- **Alignment registry (sources only):** **`p31-alignment.json`** → `p31-public-voice-md`
- **Operational AI (agents, fleet, structuring)** stays behind the curtain; **the face** stays operator-shaped.

### Rolling alignment (Tier B/C surfaces adjusted first)

- **`andromeda/04_SOFTWARE/p31ca/src/pages/index.astro`** — hub lobby hero line + room cards: plain-English first, schema jargon secondary; uncertainty on research claims.
- **`cognitive-passport/index.html`** — meta + intro + footer: disclosure; nonprofit / open-source framing without brochure tone; mirror via **`npm run sync:passport`** → p31ca `passport-generator.html`.
- **`soup.html`** — meta description: family-plain for search snippets; **ghost molecules** stays in in-app docs where context is clear.
- **`p31-personal-howto.html`** — operator cheat sheet header: ship bar wording, not “normative.”
- **`scripts/build-fleet-portal.mjs`** → **`fleet-portal.html`**: meta + hero — index is instrumentation truth, not a sales page.
- **`p31-device-setup.html`** — meta + H1: operator setup, not “professional”; ship bar label matches **`p31-personal-howto.html`**.
- **`andromeda/04_SOFTWARE/p31ca/src/pages/index.astro`** — nav `title` on Context Card: passport framing without generic “AI context” hype.
- **`docs/physics-learn/labs.html`** — avoid **unlock** in learner-facing copy where **open** means the same thing.
- **`docs/p31-public-voice-guardrails.json`** — machine list of watched paths + regex rules for **`npm run verify:public-voice`**; extend when you add a rolling surface.

Tier **A** (founder-led org story, Ko-fi body, grant prose): use **Tier A writing prompts** above — human draft first; paste final copy when ready.

---

*Last aligned: ecosystem registry + ETHICAL-STYLE-MAP cross-link.*
