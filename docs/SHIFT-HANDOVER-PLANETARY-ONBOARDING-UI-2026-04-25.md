# Shift Handover — Planetary Onboarding UI/UX

**Date:** 2026-04-25  
**From:** Operator / prior session research  
**To:** Claude Code — UI/UX implementation lane  
**Repo root:** `/home/p31` (home repo) → primary work target: `andromeda/04_SOFTWARE/p31ca/`

---

## 0. Quick orientation (read this first)

| Item | Status |
|------|--------|
| Source spec | `Planetary Onboarding Infrastructure Plan.txt` + `Neuro-Inclusive Mesh Dashboard Design.txt` (both in repo root) |
| Target file (create new) | `andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html` |
| Existing design system | `public/bonding.html` — copy its `<head>` exactly (fonts, tailwind CDN, color tokens, theme config) |
| CI gate | `npm run verify` from repo root before any PR |
| Banned jargon (user-facing) | `blockchain`, `validator`, `node`, `smart contract`, `seed phrase`, `wallet`, `crypto`, `WebAuthn` (replace with plain equivalents) |
| Children | **S.J.** and **W.J.** only — never full names |

---

## 1. Mission (one paragraph)

Ship a five-phase onboarding surface that feels like a **quiet sanctuary → somatic ritual → spatial exploration → agency dial → gentle pact**. The experience must not read as a Web3 product. Invisible crypto (passkey enrollment) is framed as "securing the lock." Neuro-inclusion is non-negotiable: one primary action per screen, no modal interruptions mid-flow, progressive disclosure, respect for `prefers-reduced-motion`. Align to the Cognitive Load Dial pattern from the neuro-inclusive design spec.

---

## 2. Existing design system (copy exactly from bonding.html)

```html
<!-- Paste verbatim into <head> of planetary-onboard.html -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0f1115">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Atkinson Hyperlegible"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        colors: {
          void:       '#0f1115',
          surface:    '#161920',
          coral:      '#cc6247',
          teal:       '#25897d',
          cyan:       '#4db8a8',
          cloud:      '#d8d6d0',
          butter:     '#cda852',
          lavender:   '#8b7cc9',
          phosphorus: '#3ba372',
          paper:      '#f4f4f5',
          ink:        '#1e293b',
        }
      }
    }
  }
</script>
```

**Additional CSS variables** (add in a `<style>` block — these drive the Dial):

```css
:root {
  /* Dial-driven tokens — JS writes these on slider change */
  --dial-font-step: 1rem;          /* base: 1rem; low: 1.125rem; high: 0.9rem */
  --dial-chrome-opacity: 1;        /* low: 0.4; high: 1 */
  --dial-particle-opacity: 1;      /* low: 0; high: 1 */
  --dial-label-opacity: 1;         /* low: 0.3; high: 1 */
  --dial-border-radius: 1rem;      /* low: 1.5rem; high: 0.5rem */

  /* Animation timing — override to 0s when prefers-reduced-motion */
  --anim-pulse-duration: 10s;      /* 0.1 Hz = 10s period */
  --anim-fade-duration: 400ms;
  --anim-sphere-settle: 600ms;
}

@media (prefers-reduced-motion: reduce) {
  --anim-pulse-duration: 0s;
  --anim-fade-duration: 0s;
  --anim-sphere-settle: 0s;
}
```

---

## 3. Non-negotiables

1. **Passkey-first copy** — "secure the lock" / "place your finger" / biometric framing only. No SMS path in v1 UI.
2. **No visual CAPTCHA** — Turnstile is invisible; don't design for a puzzle.
3. **One primary action per phase** — never two CTAs competing at the same weight.
4. **Reduced-motion respected** — Phase 2 pulse degrades to opacity breathe (scale stays at 1). All transforms gated on `prefers-reduced-motion`.
5. **Children OPSEC** — S.J. / W.J. initials only. No full names in copy.
6. **Dial is real** — the Cognitive Load Dial must actually change at least: font size, secondary label visibility, decorative particle opacity. Not cosmetic.
7. **WCAG AA contrast** on all text — especially Void (very dark) backgrounds.
8. **Back affordance is low-cost** — small corner `←` or `Step back`, not a nested menu, never a modal confirmation.
9. **No jargon leakage** — run a text search for banned words before marking done.

---

## 4. Five-phase implementation spec

Target file: **`andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html`**

Each phase is a `<section id="phase-N">` with `display:none` except the active one. JS manages transitions via `showPhase(n)`.

### Phase 1 — The Void

**UX intent:** Safety. Near-zero arousal. User arrives here.

```
Layout:    Full-bleed #0f1115 (void token). Nothing else visible on load.
After 1.2s: Fade in a single 14px line of cloud-colored text, centered.
CTA:       Tap / click anywhere OR keyboard Enter/Space to proceed.
Sound:     None. No autoplay.
A11y:      <main> with role="main"; the text has role="status" aria-live="polite".
```

**Copy (exact):**

```
"Take a breath. This is a safe space."
[small, centered, after 1.2s delay]

"Tap anywhere when you're ready."
[appears after 2.5s, same style, slightly dimmer]
```

**HTML skeleton:**

```html
<section id="phase-1" class="phase active fixed inset-0 bg-void flex flex-col items-center justify-center">
  <p id="p1-line1" class="text-cloud/0 text-sm tracking-widest transition-all duration-700" aria-live="polite">
    Take a breath. This is a safe space.
  </p>
  <p id="p1-line2" class="text-cloud/0 text-xs tracking-widest mt-4 transition-all duration-700">
    Tap anywhere when you're ready.
  </p>
</section>
```

JS: After 1200ms set `text-cloud/0` → `text-cloud/80` on line1; after 2500ms same on line2.  
On any click/keydown (Enter, Space) → `showPhase(2)`.

---

### Phase 2 — The Anchor

**UX intent:** Somatic regulation. User taps in sync with pulse to physically settle before tech concepts.

```
Layout:    Void bg. Single ³¹P nucleus SVG (or CSS circle) center-screen.
           Pulse: scale 1.0 → 1.08 → 1.0 over 10s (0.1 Hz). Easing: ease-in-out.
           Reduced-motion: opacity 1.0 → 0.7 → 1.0 instead of scale.
Interaction: Tap the nucleus. Count 3 synchronized taps → auto-advance.
             Tap detection window: ±2s around the pulse peak (scale max).
             "Close enough" is fine — this is somatic, not a test.
Progress:  Small "3 taps remaining" counter top-right, aria-live="polite".
CTA:       Auto-advance after 3 taps OR "Skip to next →" link bottom-right
           (visible always — never trap a user in a phase).
```

**Copy (exact):**

```
"Feel the pulse. Tap in sync."          [above nucleus, 14px cloud]
"3 taps remaining"                       [top-right counter]
"Skip →"                                 [bottom-right, 12px cloud/50]
```

**SVG nucleus** (inline, ~80px diameter):

```html
<div id="p2-nucleus" role="button" tabindex="0"
  aria-label="Tap in sync with the pulse"
  class="w-20 h-20 rounded-full bg-coral/20 border-2 border-coral/60
         flex items-center justify-center cursor-pointer
         select-none focus:outline-none focus:ring-2 focus:ring-coral">
  <span class="text-coral font-mono text-xs">³¹P</span>
</div>
```

CSS pulse animation (add to `<style>`):

```css
@keyframes nucleus-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.8; }
  50%       { transform: scale(1.08); opacity: 1;   }
}
@media (prefers-reduced-motion: no-preference) {
  #p2-nucleus { animation: nucleus-pulse var(--anim-pulse-duration) ease-in-out infinite; }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes nucleus-pulse-safe {
    0%, 100% { opacity: 0.8; }
    50%       { opacity: 1;   }
  }
  #p2-nucleus { animation: nucleus-pulse-safe var(--anim-pulse-duration) ease-in-out infinite; }
}
```

Haptic (if supported): `navigator.vibrate && navigator.vibrate(40)` on each valid tap.

---

### Phase 3 — The Rooms

**UX intent:** Spatial memory. User drags four spheres into a tetrahedral arrangement to own the layout. No text walls.

```
Layout:    Void bg. Four glass spheres scattered loosely in the viewport.
           Each sphere: ~88px, glassmorphism (bg-surface/60, backdrop-blur, border-teal/30).
           Labels: short (1-2 words) inside each sphere, hidden if --dial-label-opacity < 0.5.
Interaction: Drag to reposition (mouse + touch via pointer events).
             After user moves any sphere: show "Looks good →" CTA at bottom.
             If user doesn't move any sphere after 5s: gentle nudge "Try moving one."
A11y:       Each sphere has role="button" + aria-grabbed; keyboard arrow keys move
            selected sphere 8px per press.
```

**Sphere labels (K₄ sectors):**

| Sphere | Label | Color accent |
|--------|-------|--------------|
| A | Structure | teal |
| B | Connection | coral |
| C | Rhythm | lavender |
| D | Creation | phosphorus |

**HTML skeleton (one sphere — repeat ×4):**

```html
<div id="sphere-a" role="button" tabindex="0"
  aria-label="Structure sphere — drag to position"
  aria-grabbed="false"
  data-sphere="A"
  class="sphere absolute w-22 h-22 rounded-full
         bg-surface/60 backdrop-blur-md
         border border-teal/30
         flex flex-col items-center justify-center
         cursor-grab active:cursor-grabbing
         select-none touch-none
         transition-transform duration-[var(--anim-sphere-settle)]">
  <span class="text-teal text-lg">⬡</span>
  <span class="text-cloud text-xs mt-1 sphere-label"
        style="opacity: var(--dial-label-opacity)">Structure</span>
</div>
```

JS notes:
- Initial positions: scattered via `style.left/top` at random-ish offsets within safe zone (10-80% each axis).
- Drag: `pointerdown` → `pointermove` → `pointerup`; call `setPointerCapture`.
- "Looks good →" button: `opacity-0` initially; after first `pointerup` on any sphere → fade in.

---

### Phase 4 — The Dial

**UX intent:** Agency. User learns to control their own sensory density. This is the only phase that teaches a persistent UI concept.

```
Layout:    Void bg. Large circular dial (SVG arc or range input styled as arc).
           Below dial: live preview showing three things changing in real time.
Range:     0 (calm / minimal) to 10 (full / dense). Default: 5.
Preview area (updates live as dial moves):
  - Font size: 0.9rem → 1.125rem
  - Secondary labels: fade in/out
  - Decorative particle dots: appear/vanish
Instruction: One line above the dial.
CTA:       "Set my level →" at bottom — always visible.
```

**Copy (exact):**

```
"This dial is yours. Turn it to match how you feel right now."    [above dial]
"Calm"           [left of dial, 11px cloud/60]
"Full detail"    [right of dial, 11px cloud/60]
"Set my level →" [bottom CTA, button]
```

**Range input (styled as arc via CSS):**

```html
<label for="dial" class="sr-only">Cognitive load preference, 0 to 10</label>
<input id="dial" type="range" min="0" max="10" value="5"
  class="w-64 accent-teal cursor-pointer"
  aria-describedby="dial-desc">
<p id="dial-desc" class="text-cloud/50 text-xs text-center mt-2">
  Adjust anytime from settings after setup.
</p>
```

JS — on `input` event:

```js
function applyDial(v) {  // v = 0-10
  const t = v / 10;
  const root = document.documentElement;
  root.style.setProperty('--dial-font-step',       `${0.9 + t * 0.225}rem`);
  root.style.setProperty('--dial-chrome-opacity',  `${0.4 + t * 0.6}`);
  root.style.setProperty('--dial-particle-opacity',`${t}`);
  root.style.setProperty('--dial-label-opacity',   `${0.3 + t * 0.7}`);
}
```

Persist to `localStorage.setItem('p31.dialPreference', value)` on "Set my level →".

---

### Phase 5 — The Pact

**UX intent:** Consent + enrollment. Short plain-language bullets. Primary CTA triggers passkey creation. No crypto jargon.

```
Layout:    Void bg. Glassmorphism card (bg-surface/80, border-teal/20, rounded-2xl).
           Card content: title + 3 bullet points + primary CTA + secondary "not now" link.
           Card max-width: 480px, centered.
Passkey:   Primary CTA opens browser biometric dialog via WebAuthn navigator.credentials.create().
           If WebAuthn not supported: show "Your browser doesn't support this yet.
           Try on your phone or a modern browser." — no SMS fallback.
Success:   Dismiss card, show full-bleed calm confirmation: "You're in. Welcome."
           Auto-redirect after 3s to hub lattice (default) or operator-configured deep link.
```

**Copy (exact):**

```
"One last step — secure the lock."                     [card title, coral]

• Your identity lives on your device, not our servers.
• Your fingerprint, face, or PIN is all you need — nothing to remember.
• You can always update this in settings.

[primary button]  "Secure my lock →"
[text link below] "I'll do this later"

--- success state ---
"You're in. Welcome to the mesh."                      [centered, phosphorus]
"Taking you home…"                                      [12px, cloud/60, below]
```

**WebAuthn (feature-detect first):**

```js
async function enrollPasskey() {
  if (!window.PublicKeyCredential) {
    showPasskeyUnsupported();
    return;
  }
  try {
    // Replace challenge/rpId/userId with real Worker values when backend lands
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'P31 Labs', id: location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'mesh-member',
          displayName: 'Mesh Member',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7  },  // ES256
          { type: 'public-key', alg: -257 },  // RS256 fallback
        ],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        timeout: 60000,
      }
    });
    showSuccess(cred);
  } catch (err) {
    if (err.name === 'NotAllowedError') showCancelled();
    else showPasskeyError(err.message);
  }
}
```

> **v1 scope note:** The above uses a random challenge stub — no real Worker endpoint yet. That's fine for the UI slice. The comment documents the hook for the backend follow-on.

---

## 5. Archetype entry points (routing table)

These are *not* separate apps — they're query-param skins on the same five phases:

| Archetype | URL param | Phase 2 variant | Phase 3 default layout |
|-----------|-----------|-----------------|------------------------|
| Default | (none) | coral pulse | scattered |
| Child | `?a=child` | haptic-heavy, no text | preset diamond |
| Elder | `?a=elder` | voice prompt (TTS), larger targets | preset square |
| Caregiver | `?a=care` | standard | preset row |

v1 only needs to detect `?a=child` and `?a=elder`; others fall through to default. Larger tap targets for `elder`: add `scale-125` to interactive elements.

---

## 6. Cultural metaphor skin (i18n stub — v1 EN only)

Define a `SKINS` object in JS. Ship only `en` for v1 but structure it so adding `sa` (Sub-Saharan), `oceanic`, etc. is a one-liner:

```js
const SKINS = {
  en: {
    phase2Prompt: 'Feel the pulse. Tap in sync.',
    phase3Intro:  'Arrange your space.',
    pactTitle:    'One last step — secure the lock.',
  },
  // sa: { phase2Prompt: 'Touch the root. Feel it breathe.', … },
};

const skin = SKINS[navigator.language?.slice(0,2)] ?? SKINS.en;
```

---

## 7. Accessibility spec

| Element | Required ARIA / behavior |
|---------|--------------------------|
| Phase 1 text | `aria-live="polite"` — screen reader gets it without re-reading whole page |
| Phase 2 nucleus | `role="button"` `tabindex="0"` `aria-label="Tap in sync with the pulse"` — Enter/Space fires tap |
| Phase 2 counter | `aria-live="polite"` — reads "2 taps remaining" etc. automatically |
| Phase 3 spheres | `role="button"` `aria-grabbed="false/true"` — arrow keys move 8px; announce position on drop |
| Phase 4 dial | `<label>` correctly associated; `aria-describedby` for hint |
| Phase 5 card | `role="dialog"` `aria-labelledby` on title — focus trap during passkey prompt |
| Back link | Always visible; keyboard reachable; `aria-label="Go back to [phase name]"` |
| Skip link | `#main-content` skip nav at very top of `<body>` |

---

## 8. Copy lint (banned-word check)

Before marking any phase done, `grep -i` the HTML for:

```
blockchain validator node smart.contract seed.phrase wallet crypto
WebAuthn passkey FIDO DID decentralized web3
```

Any hit in user-visible text → rewrite. Technical terms are fine in comments and JS variable names.

---

## 9. Animation spec summary

| Element | Property | Duration | Easing | Reduced-motion fallback |
|---------|----------|----------|--------|------------------------|
| Phase text fade-in | opacity | 700ms | ease-out | instant (0ms) |
| ³¹P nucleus pulse | scale | 10s loop | ease-in-out | opacity breathe |
| Phase transition | opacity + translateY(8px) | 400ms | ease-out | instant |
| Sphere drag settle | transform | 600ms | cubic-bezier(.34,1.56,.64,1) | 0ms |
| Dial live update | CSS vars | 0ms (instant) | — | same |
| Phase 5 success | opacity | 800ms | ease-in | instant |

---

## 10. File structure (what to create / touch)

```
andromeda/04_SOFTWARE/p31ca/public/
├── planetary-onboard.html          ← CREATE (main deliverable)
└── (no new directories needed v1)
```

If / when hub registry is updated (optional v1):
```
andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs   ← ADD entry when polished
```

---

## 11. Scoped first PR (what's in / out)

**In (v1 vertical slice):**
- `planetary-onboard.html` with all five phases functional
- Phases 1–4 fully interactive
- Phase 5: WebAuthn feature-detect + stub challenge (no real Worker)
- Dial actually mutates CSS vars (three visible effects minimum)
- `?a=child` and `?a=elder` query-param skins (font size + target size)
- EN skin only; SKINS object stubbed for future locales
- Keyboard nav through all phases
- ARIA on all interactive elements
- `prefers-reduced-motion` respected

**Out (follow-on):**
- Cloudflare Worker for real passkey challenge/verify
- D1 schema for credential storage
- 10-locale SKINS
- Turnstile integration (backend-only anyway)
- LoRa / NFC firmware
- Voice IVR layer
- Hub registry entry (add after operator reviews the polished page)

---

## 12. Open questions (answer before shipping)

1. **Post-onboard deep link** — BONDING, Spaceship, CogPass, or hub lattice? Default = hub (`https://p31ca.org`)?
2. **Worker endpoint** — when will `api.p31ca.org/passkey/register` be ready for Phase 5 stub swap?
3. **Canonical URL** — `/planetary-onboard` (static file), `/welcome`, or Astro route under `src/pages/`?
4. **Operator analytics** — PostHog instance URL to log phase-completion events (opt-in only)?
5. **Phase 2 audio** — 6 Hz theta binaural beats opt-in or completely out of v1?

---

## 13. Verification before PR

```bash
# From P31 home root
npm run verify

# If p31ca tree is present (it is):
cd andromeda/04_SOFTWARE/p31ca && npm run verify

# Manual checklist:
# [ ] Open in Chrome — full five-phase flow completes
# [ ] Open with prefers-reduced-motion enabled — no scale animations, opacity breathe only
# [ ] Tab through entire flow — no focus trap outside Phase 5 dialog
# [ ] grep -i "blockchain\|seed phrase\|WebAuthn\|crypto\|wallet" planetary-onboard.html
#     → zero user-visible hits
# [ ] Lighthouse a11y score ≥ 90
# [ ] No console errors on Phase 5 passkey cancel (NotAllowedError is expected, not unhandled)
```

---

## 14. References (read order)

1. `Planetary Onboarding Infrastructure Plan.txt` — §5.1 (five phases), §5.3 (BONDING), §9 (archetypes), §7 (localization matrix)
2. `Neuro-Inclusive Mesh Dashboard Design.txt` — Cognitive Load Dial, qFactor, spoons, Calm Tech, void-safe palette, GLSL glow (adapt for onboarding, not full ops dashboard)
3. `andromeda/04_SOFTWARE/p31ca/public/bonding.html` — design system reference (copy `<head>`)
4. `docs/MVP-DELIVERABLES-INVENTORY.md` — what's LIVE; don't block this on it
5. `AGENTS.md` / `CLAUDE.md` — initials rule, spoons, repo boundaries

---

*End handover. Start with `planetary-onboard.html`. Run `npm run verify` before PR. Ask operator the §12 open questions if they block implementation.*
