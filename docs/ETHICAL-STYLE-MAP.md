# Ethical style map (P31) — for agents

**Map version:** 1.0.0 — agent-facing prose (not a JSON schema). Extend when you add new ethical categories (e.g. payments); keep **numeric / hex token values** in **`andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json`**, not in this file.

---

## 1. Scope

P31 **ethical psych** (calm, clarity, belonging, no dark patterns) applies everywhere we ship UI, but **authoritative visual values** live in the **universal canon**:

- **Tokens:** `andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json` → **`npm run apply:p31-style`** → generated **`cognitive-passport/p31-style.css`** (CSS variables consumed by passport, static pages, and demos).
- **Token reference (generated tables):** `andromeda/04_SOFTWARE/design-tokens/DESIGN-TOKENS-REFERENCE.md` — all `--p31-*` names and values; refresh with **`npm run generate:design-token-docs`** or any **`apply:p31-style`**.
- **Hub / Tailwind:** p31ca mirrors the same palette into `public/p31-style.css`, `p31-tailwind-extend.js`, etc. — see **`AGENTS.md`** and **`docs/P31-ENGINEERING-STANDARD.md`** for verify bars.
- **Mobile browser mesh first:** The default mesh client is **the phone web app** (TLS + add-to-home if the operator wants); Workers + `k4-personal` + static hub, not a gatekept native shell. The canon’s **`mobileMeshFirst`** block drives touch targets (`--p31-touch-min`) and **`body.p31-mesh-m-first`** safe-area padding in generated `p31-style.css` — use **`viewport-fit=cover`** on new static shells. Autonomy: never force an app-store install to reach family mesh; proportion: one honest “Add to Home Screen” nudge, not a lockout.

**Worked example (BONDING Soup):** repo-root **`soup.html`** + **`soup-quantum.css`** — welcome copy, pillar dots, ethical psych comment blocks, and the **`data-soup-*`** hooks (see **section 7** in this file). Styles depend on **`cognitive-passport/p31-style.css`**. Sync to bonding: **`npm run sync:soup-bonding`**. **Alignment of sources / verify pipeline:** **`p31-alignment.json`**, **`docs/P31-ALIGNMENT-SYSTEM.md`**.

---

## 2. Principles (non-negotiable)

| Principle | Do | Don’t |
|-----------|----|--------|
| **Autonomy** | Obvious affordances; explain what happened and why | Fake scarcity, hidden defaults, mislabeled controls |
| **Transparency** | Name systems honestly (sim, co-presence, family room) | “Mystery” mechanics, obscured state |
| **Dignity** | Copy treats adults and kids as whole people; no shame/FOMO as the main lever | Stranger leaderboards, streak-as-identity, guilt trips |
| **Proportion** | One short celebratory moment, then it stops | Endless pulse, confetti on every click, sound spam |
| **Access** | Respect **`prefers-reduced-motion`**; information not only in motion | Parallax that hides text; flash patterns that trigger migraine |

---

## 3. Semantic color map (hub / dark)

Use **token variables** (`--p31-*`), not ad hoc hex, except a single documented gradient stop.

| Role | Canon tokens (typical) | Psychological job | Use on |
|------|-------------------------|---------------------|--------|
| **Calm** | `--p31-teal`, `--p31-cyan` | Trust, legibility, “system is stable” | Primary borders, key labels, accents, focus rings |
| **Warmth** | `--p31-coral` | Aliveness without alarm | Secondary CTAs, gentle emphasis, not life-safety red |
| **Together** | `--p31-phosphorus` (alias *emerald* in some Tailwind bridges) | Belonging, shared state | Co-presence, “we,” growth |
| **Care** | `--p31-butter` | Soft attention | Secondary highlights, non-critical badges |
| **Wonder (sparingly)** | `--p31-lavender` | Curiosity, depth — **not** slot-machine sparkle | One hero strip, lab zone, or single focal card — not every tile |

**Rule:** If two adjacent regions both scream (coral + heavy glow + motion), you’ve over-indexed. **One focal emotional beat per view.**

---

## 4. Motion and time

- **Ambient:** slow (5s+), low amplitude; optional; **off** under **`prefers-reduced-motion`**.
- **Feedback:** under **2s** for affordances; **~1.2s** for a bounded “moment” (e.g. stat highlight); toasts **≤ 3s** unless dismissible.
- **Never** tie core understanding to motion alone — pair with text, **`aria-live`** where appropriate, and color/label.

---

## 5. Copy voice

- **Prefer:** “together,” “clear,” “same bowl / same room,” “your people,” “guardian / kid / family” when modes exist.
- **Anti-FOMO:** avoid “don’t miss,” “only today,” “epic,” “prove you’re a real fan,” “beat everyone.”
- **Kids / household:** use initials **S.J.**, **W.J.** in public UI for children; not full names (see **`CLAUDE.md`** / **`.cursorrules`**).

---

## 6. Rewards and feedback (ethical)

**Allowed (bounded, honest):**

- One-shot feedback when **state meaningfully changes** (e.g. reaction count, room live) with a **short** toast or class-based highlight.
- Copy that **names the design** when helpful (e.g. “Feedback, not a loot box”).
- **`title`** / **`aria-label`** on stats so screen readers share the same intent.

**Forbidden:**

- Variable-ratio “drops,” currency that obscures value, **infinite** scroll with **no** exit landmark.
- **Nag loops:** repeated modal every visit unless silencable or risk is real (e.g. unsaved work).

---

## 7. Soup `data-soup-*` contract

Set on **`document.documentElement`** (`<html>`) by `soup.html` — **do not** invent alternate attribute names or parallel “mesh” counts in CSS without the same JS source of truth.

| Attribute | Values | Meaning |
|-----------|--------|---------|
| **`data-soup-live`** | `0` \| `1` | WebSocket (or mock) **connected** |
| **`data-soup-family`** | `0` \| `1` | Family / room mode |
| **`data-soup-peers`** | non-negative integer string or `""` | Roster size when available |

Style with attribute selectors in **`soup-quantum.css`**; extend in **that** file or JS, not by inventing new `data-soup-*` keys in unrelated products without updating this map.

---

## 8. Pre-ship checklist and related docs

**Checklist**

- [ ] Colors map to roles in **section 3**; text still reads on **`--p31-void`** / **`--p31-surface`**.
- [ ] New motion is **damped** or **off** under **`prefers-reduced-motion`**.
- [ ] No new pattern makes **shame, envy, or compulsion** the main emotion.
- [ ] Any “reward” is **informational**, **decays or dismisses**, and is **not** the only success signal.
- [ ] **`npm run verify`** (and **`verify:p31-style`** if tokens/CSS changed) still passes.

**Related docs**

- **`docs/P31-DESIGN-DOCTRINE.md`** — layout templates, Gray Rock → Alive rules, and how tokens become surfaces (pair with this map for motion ethics)
- **`docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md`** — create / connect, ephemeralization, and ethical monetization (contracts + verify hooks)
- **`docs/P31-ALIGNMENT-SYSTEM.md`**, **`p31-alignment.json`** — canonical sources vs derived artefacts; **`npm run verify:alignment`**
- **`docs/P31-ENGINEERING-STANDARD.md`** — verify / release bar
- **`docs/ECOSYSTEM-PRODUCTION-11.md`** — fleet / glass ladder alignment
- **`docs/AGENTIC-VIBE-INFRASTRUCTURE.md`** — agentic workflow + verify culture
- **`docs/PLAN-KIDS-VIBE-CODING.md`** — local-first, youth-adjacent work
- **`docs/SIC-POVM-K4-ARCHITECTURE.md`**, **`docs/EGG-HUNT.md`**, **`docs/SOULSAFE-TETRA-SPEC.md`** — mesh / product context
- BONDING Soup implementation: **`soup-quantum.css`** (ethical / co-presence comment blocks)
