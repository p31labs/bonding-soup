# C.A.R.S. — Ethical Attention Companion

**Tier:** B (working). Agent drafted; operator signs or rewrites.
**Status:** ships landed 2026-04-30, all behind `npm run verify:cars-wire` + the focused soup gates.
**Sibling docs:** `docs/CONCEPT-COGNITIVE-ESCROW.md` (Tier A pattern); `docs/ETHICAL-STYLE-MAP.md` (UI ethics canon); `docs/affective-chemistry-spec.md` (math); `docs/soup-world-design.md` (world).

---

## The thesis, in one sentence

*The room can borrow attention without extracting it, if the geometry holds the state and the chroma is earned.*

That's the inversion. Big-Tech apps borrow attention by demanding it (timelines, infinite scroll, variable-ratio rewards, presence anxiety, streaks). C.A.R.S. borrows attention by **structuring it geometrically** so the operator's brain doesn't have to. Memory returns intact. Reward is earned and bounded. Nothing scrolls forever.

## Twelve refusals (this is what shipped)

Each row is a thing C.A.R.S. now does that no Big-Tech feed does. Each row is a refusal of an extractive pattern.

| # | Surface | Anti-extractive principle | Code anchor |
|---|---|---|---|
| 1 | 4-4-6 breath clock (`tickBreath`) | Names the rhythm it asks for | `src/soup.ts` · `--soup-breath` |
| 2 | Posner Stability Index (PSI) | One score, not a leaderboard | `src/soup.ts#getPosnerStabilityIndex` |
| 3 | Faded molecule lifecycle (30 + 7 day) | Bounded decay; memory stays tappable | `src/soup.ts#computeMoleculeFadeAlpha` |
| 4 | Calm Zone landing (`<details>` + breath strip) | Honest progressive disclosure | `soup.html` · `.soup-calm-strip` |
| 5 | Arrhenius gate + Le Chatelier bias | Real chemistry; physics-true reactions | `src/reactions.ts#applyThermodynamics` |
| 6 | Spatial chat ping palette (5 emojis, 10s TTL) | Bounded social signal; no DM, no presence | `src/soup.ts#sendPing` |
| 7 | Cognitive Escrow welcome strip | Memory return, not engagement bait | `src/soup.ts#getEscrowResidue` |
| 8 | Posner coherence ramp (warming / coherent) | Earned chroma, not time-on-page | `src/soup.ts#tickCoherence` |
| 9 | Saved-structure recognition + Save action | "I remember this one" | `src/soup.ts#getSavedMoleculeMeta` · `#saveLiveMolecule` |
| 10 | Heritage lineage in Exhibit A | Bounded family tree (max 6 hops shown) | `src/soup.ts#getMoleculeHeritage` |
| 11 | First-visit hint (auto-dismisses on click) | Invites curiosity; doesn't demand it | `soup.html` · `.soup-firstvisit-hint` |
| 12 | Memory panel calmness pass (no ⭐ stars) | Tag, don't score | `src/memory-panel.ts` |

## How each refuses an extractive pattern

**1. Breath clock.** Big-Tech autoplay forces a rhythm without naming it. C.A.R.S. *names* the 4-4-6 rhythm in the calm strip and on the `<html data-soup-breath>` attribute, so any agent or accessibility tool can read it. Inhale 4s, hold 4s, exhale 6s. Audio gain swings ±15%, sub-audible. Off under `prefers-reduced-motion`.

**2. PSI.** A single dimensionless index — `0.6 · tetrahedralFraction + 0.4 · min(1, savedPosners)`. There is no "Today's PSI vs. Yesterday's". No streak. No leaderboard. The geometry of saved structures *is* the score.

**3. Faded molecule lifecycle.** Decay is **bounded** (1.0 → 0.3 over 7 days after a 30-day half-life), then settles. The molecule never disappears; it pulses a 1Hz coral outline as memory geometry, tappable for Exhibit A. This is the opposite of "we deleted your old posts to push fresh content" and the opposite of "infinite scroll back to 2014."

**4. Calm Zone landing.** Default first paint: a single calm strip (4-4-6) and an empty bowl. The dev runbook lives in a `<details>` element with a 44px touch summary — open by default for `?parents=1` / `?dev=1`, collapsed for fresh visitors. No popup, no walkthrough.

**5. Arrhenius + Le Chatelier.** Reaction probabilities now obey `k ∝ exp(-Eₐ/T)` with per-zone temperatures (Calm 0.7, Deep 0.6, Lab 1.2). Le Chatelier: synthesis up-rates when Fuel-archetype floods (the system traps volatile states into stable structure), decomposition gets a small nudge when fuel runs dry. The math holds. `verify:cars-wire` passes; `tsc` passes.

**6. Pings, not DMs.** Five emojis: 💧 (acknowledge), ✨ (notice), 🫶 (care), 🌱 (growing), 🪞 (I see you). 10-second lifetime. No threading. No read receipts. No "who's typing." A peer-to-peer ping arrives, animates, expires. The mock server only forwards to other clients in the room (sender self-echo lives only on the local canvas).

**7. Cognitive Escrow welcome.** *"Welcome back — your bowl held last visit 4d ago · 2 Posners · 7 syntheses · 3-gen heritage."* Single line. Single dismiss. `sessionStorage` flag. No auto-refresh, no link to a feed. The room shows what it kept for the operator — geometry the operator left behind — and steps back.

**8. Coherence ramp.** Three states only: `""` (ordinary) → `"warming"` (PSI ≥ 0.25 + ≥1 saved Posner) → `"coherent"` (PSI ≥ 0.5 + ≥2 saved Posners). The `coherent` state lights a gold + teal box-shadow on the canvas shell that pulses with the breath. Auto-disabled under Gray Rock and `prefers-reduced-motion`. The reward is *real* — it requires actual saved geometry — and bounded.

**9. Saved-structure recognition.** Tap a molecule in Exhibit A. If you saved it before, it says: *"Posner · CarbonOxygenAlpha (3d ago, lab)"*. Memory returns intact. If you haven't saved it and it has bonds, you get one calm action: "Save this structure" — *"Keeps the geometry across sessions. No upload."* No streak. No "you've saved 7 in a row."

**10. Heritage lineage.** Bounded at 6 entries. *"↳ HydrogenAlpha → via synthesis · 12m ago — A molecule of significance."* The family tree is the connection — literal causal links between saved geometry. There's no "see more". The geometry tells the rest.

**11. First-visit hint.** Single italic muted line: *"· tap any molecule for its story — born, geometry, lineage, save."* Shows after 800ms (calm strip gets first attention). Auto-dismisses on first canvas click. `sessionStorage` prevents redisplay.

**12. Memory panel calmness pass.** Removed the ⭐ significance stars (engagement metric). Replaced hardcoded purple with `--p31-cyan`. Significance is no longer surfaced as a 5-star rating; canonical archive tags ("Posner", "Highlight") replace it. Privacy footer added: *"Stored locally in your browser. Never uploaded."*

## What this is not

This is not a "wellbeing app". It is not a meditation timer. It is not a brain-training game. The chemistry is real chemistry. The breath is *one* affordance, not the product. The room is a place where an operator can put an emotion shaped like a molecule and find it again, structurally, when they come back.

## Privacy + ethics ground truth

- **No analytics.** No third-party fonts, no third-party scripts, no telemetry, no engagement events emitted on dismiss / save / ping. Verified by `verify:public-voice` + `verify:cars-wire`.
- **Local-first.** All saves go to `localStorage` (and optionally to the WCD-33 archive Worker for community highlights, opt-in). The escrow welcome reads only the local archive.
- **No surveillance.** No persistence of which molecules you tapped. No "recommendation". No "you might also like".
- **Gray Rock honored.** Every chroma signal in this list (ramp, breath glow, escrow tint, ping highlight) flattens to neutral when `html.soup-app--gray-rock` is set.
- **Reduced-motion honored.** Every animation has a `prefers-reduced-motion: reduce` branch.

## Verification anchors (CI gates this is built on)

These ran green between every ship in this session:

- `npx tsc` — type integrity
- `npm run soup:prep:check` — `dist/` + static asset shape
- `npm run verify:cars-wire` — WS contract drift guard
- `npm run verify:p31-style` — design tokens + passport mirror
- `npm run verify:public-voice` — identity-first + no-marketing watcher
- `npm run verify:style-alignment` — *-about.html canon
- `npm run verify:egg-hunt` — Larmor lock + off-path operators
- `npm run verify:delta-language` — DELTA glossary terms

## Operator handles (URL-driven probes)

- `?fadeProbe=N` — backdate every live molecule's `creationTime` by N days. Test the fade lifecycle without waiting calendar weeks.
- `?dev=1` — show telemetry stats (PSI · Breath · Thermo · Coherence · log).
- `?debug` — same as `?dev=1`.
- `?parents=1` — auto-open the family-setup `<details>` block.
- `?room=living-room&name=W` — multiplayer (mock server `node spikes/mock-ws-server/server.js`).

## What's not yet shipped (parking lot)

- **Mobile audit on actual device** (iPhone 13 + Chromebook touch). The CSS is mobile-prepared; the empirical pass needs hands-on time.
- **WS heritage broadcast** (when peer A saves a Posner, peer B's escrow welcome warms next time). Touches the `cars-wire` contract; coordinated 4-touch change, deferred.
- **Memory panel keyboard navigation** (Tab through saved items, arrow-key zone select). Calm pass landed; a11y pass next.
- **Cross-session molecule identity** (composition signature so heritage works across reloads even when ids regenerate).
- **`docs/CONCEPT-COGNITIVE-ESCROW.md`** Tier A operator paragraphs (currently stub TODO blocks).

## Pattern map

| Pattern | Existing canon | This doc cites |
|---|---|---|
| Geometric memory | `docs/CONCEPT-COGNITIVE-ESCROW.md` | §7 escrow welcome |
| Calm UI | `docs/ETHICAL-STYLE-MAP.md` | §1, §3, §4, §6 |
| Public voice | `docs/PUBLIC-VOICE.md` | (this whole doc; Tier B) |
| Math | `docs/affective-chemistry-spec.md` | §5 thermodynamics |
| World shape | `docs/soup-world-design.md` | §3 zones, §6.4 fade |
| Mesh stability | `docs/SIC-POVM-K4-ARCHITECTURE.md` | §10 lineage |

---

*Authoring contract: Tier B working voice. Agent drafted; operator may sign or rewrite. Anchored to code that compiled and verified on 2026-04-30. Drift between this doc and the code is a verify failure — see `src/soup.ts` and `src/reactions.ts` for ground truth.*
