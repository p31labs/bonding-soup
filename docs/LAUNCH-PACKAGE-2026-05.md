# P31 Market Launch Package — 2026-05

**Schema:** `p31.launchPackage/1.0.0`
**Status:** ASSEMBLED — operator verifies, operator launches.
**Created:** 2026-05-02
**Operator:** William R. Johnson (W.JOHNSON-001)
**Mission:** Build · Create · Connect

---

## What this document is

This is the **definitive comprehensive enterprise production-grade market launch
automation package** for P31. It assembles everything we've built into a single
shippable launch sequence, with one verb (`npm run launch`) that does the dance.

It is the answer to *"anything they can do, WE can do better."*

> The master's tools, disassembling the master's house. 💜🔺💜 The geometry holds.

This document is **operator-voice**: written for the operator (W.J.) to read,
review, and execute when ready. It is not a spec to negotiate. It is a checklist
to ship.

---

## §1 The launch surface area (what's actually launching)

| Tier | Surface | Live URL | PWA-installable | Notes |
|---|---|---|---|---|
| **Story** | Phosphorus Thesis v2.0 | `docs/operator/PHOSPHORUS-THESIS-v2-2026-05-02.md` | — | Capstone manifesto. Zenodo-ready. |
| **Story** | Public voice / DELTA language | `docs/PUBLIC-VOICE.md` + `docs/P31-DELTA-LANGUAGE.md` | — | Identity-first guardrails CI-enforced. |
| **Tool** | Cognitive Passport | `https://p31ca.org/passport` | ✅ `p31.cogpass` | Generator v3.0, 32/32 tests, mirrored. |
| **Tool** | Glass Box terminal | `https://p31ca.org/glass-box` | — (live ops surface) | Public, read-only verify-pulse + reports. |
| **Education** | The Same Shape | `https://p31ca.org/demos/the-same-shape.html` | ✅ `p31.sameShape` | K₄ at four orders of magnitude, in lockstep. |
| **Education** | The Pulse | `https://p31ca.org/demos/the-pulse.html` | ✅ `p31.thePulse` | Edit one number, watch the codebase ripple. |
| **Story** | Social Cards (10) | `social-cards/` (local) → `https://p31ca.org/social-cards/` | ✅ `p31.socialCards` | Stat flex, fleet status, quote, diptych, ethics, closer, dev flex, K₄ SVG, trim-tab, ASCII tetra. |
| **Substrate** | Connection spine | `https://p31ca.org/connect` | — | K₄ navigator + mesh-start. |
| **Substrate** | Initial Build | `https://p31ca.org/build` | — | Public production site (CWP-P31-IB-2026-01). |
| **Substrate** | K₄ personal Worker | `k4-personal.trimtab-signal.workers.dev` | — | Per-member Durable Object agent. |
| **Substrate** | Genesis Block ledger | (D1, append-only) | — | Soulbound L.O.V.E. accounting. |
| **Substrate** | Passkey Worker | `p31ca.org/api/passkey/*` | — | WebAuthn, no passwords. |
| **Substrate** | Geodesic Worker | `geodesic-room.trimtab-signal.workers.dev` | — | Real-time room sync, v0.2.1 wire. |
| **Substrate** | SIMPLEX v7 + SENTINEL | `simplex-v7/` | — | Cloud crew orchestration. |
| **Substrate** | Email Worker | `simplex-email/` | — | Hostile-mail triage routing. |
| **Org** | P31 Labs, Inc. | EIN `42-1888158` | — | GA nonprofit, 501(c)(3) pending. |
| **Org** | Creator Economy contract | `https://p31ca.org/creator-economy.json` | — | 0% platform fee, 100% creator share. |

**Total launchable surfaces:** 17.
**PWA-installable:** 4 (the home-screen-worthy ones).
**Verify gates currently green:** 83.

---

## §2 The launch verbs (what to run)

### `npm run launch` *(canonical)*

Single command. Chains:

```
1. verify          → npm run verify          (83 gates must be green)
2. build:pwa       → mirror SW + script into all installable surfaces
3. build:demos     → mirror two consolidated artifacts into p31ca
4. build:fleet-portal → regenerate the URL index
5. apply:constants → regenerate constants in derived files
6. sync:passport   → mirror cognitive-passport to p31ca
7. verify:public-voice / verify:public-sanitization → no kid names, no PII leaks
8. release:public  → strict mesh + hub:ci + security:check (in p31ca)
9. write launch.html → static readiness dashboard
10. print launch banner with next-step instructions
```

The verb is **idempotent** — run it ten times in a row, get the same result.
The verb is **safe** — it does NOT push, deploy, or notify external services
unless `P31_LAUNCH_PUBLISH=I_UNDERSTAND` is set.

### `npm run launch -- --dry-run`

Same chain, no writes. Tells you what it WOULD do.

### `npm run launch -- --status`

Read-only. Prints the current launch readiness report from
`launch.html` data without re-running any gate.

---

## §3 The PWA layer (what installs to a phone home screen)

Built 2026-05-02. Source of truth: `pwa/`. Verifier: `npm run verify:pwa`.

| Surface | Manifest | Install path |
|---|---|---|
| Cognitive Passport | `/pwa/manifest-cogpass.json` | `https://p31ca.org/cognitive-passport/` |
| Social Cards (10) | `/pwa/manifest-social-cards.json` | `https://p31ca.org/social-cards/` |
| The Same Shape | `/pwa/manifest-same-shape.json` | `https://p31ca.org/demos/the-same-shape.html` |
| The Pulse | `/pwa/manifest-the-pulse.json` | `https://p31ca.org/demos/the-pulse.html` |

**Architecture:** one canonical service worker (`pwa/sw.js`) + one drop-in
script (`pwa/p31-pwa.js`) + one icon (`pwa/p31-tetra-icon.svg` — the K₄
tetrahedron in canonical teal). `npm run build:pwa` mirrors the SW + script
into each app folder so the per-app scope works without HTTP-header gymnastics.

**Per-surface contract (4 lines in `<head>`):**

```html
<link rel="manifest" href="/pwa/manifest-X.json" />
<link rel="apple-touch-icon" href="/pwa/p31-tetra-icon.svg" />
<meta name="theme-color" content="#25897d" />
<script src="./p31-pwa.js" defer></script>
```

**No telemetry. No analytics. No remote logging.** Service worker uses
network-first with cache fallback (updates propagate the instant the device
is online; cache acts purely as offline fallback).

### Production-host caveat

The current `andromeda/04_SOFTWARE/p31ca/public/_headers` rule

```
/*.html
  Clear-Site-Data: "cache", "storage"
```

will wipe the SW cache on every navigation, blocking proper PWA persistence.

**Operator action item to enable production PWA:** edit `_headers` to exempt
the four installable surfaces from `Clear-Site-Data`:

```
/cognitive-passport/index.html
  Cache-Control: no-cache, must-revalidate
  # (Clear-Site-Data deliberately omitted — PWA persistence required.)

/demos/the-same-shape.html
  Cache-Control: no-cache, must-revalidate

/demos/the-pulse.html
  Cache-Control: no-cache, must-revalidate

/social-cards/index.html
  Cache-Control: no-cache, must-revalidate
```

This is a **deliberate security tradeoff** for these four surfaces only.
The rest of the hub keeps the wipe-on-nav posture.

---

## §4 The social ammunition (what to share)

### Cards (10)

`social-cards/index.html` — open via `npm run demo` at
`http://127.0.0.1:8080/social-cards/`. Each card is a 1080×1080 div.
Screenshot at native resolution. Or PWA-install on a phone, screenshot
straight to camera roll.

| # | Card | Audience | Channel |
|---|---|---|---|
| 01 | Stat flex | LinkedIn, tech Twitter, grant reviewers | LinkedIn carousel post |
| 02 | Fleet status (terminal) | Developers, DevOps, infra | Twitter / Mastodon |
| 03 | The quote | Disability advocates, AuDHD community | Bluesky / IG story |
| 04 | Perception vs reality (diptych) | Anyone reduced to a label | Twitter / LinkedIn |
| 05 | Ethics as architecture | Product, UX, accessibility-curious eng | LinkedIn |
| 06 | The closer (emotional) | Families · the ones who'll click through | IG / Bluesky |
| 07 | Built on what (terminal) | Developers · "wait, on WHAT?" | HN / Lobsters / Twitter |
| 08 | The geometry (K₄ SVG) | Math, physics, K₄-on-napkin people | Mastodon / Bluesky |
| 09 | Trim tab (literary) | Poets, grant reviewers, the readers | LinkedIn long-form |
| 10 | ASCII tetrahedron | Forum / Discord / Reddit / IRC | Reddit r/* / Discord |

### Caption blocks

Live in `demos/index.html` Share Kit section (Bluesky / X / LinkedIn /
Mastodon variants for each artifact). Click "copy" to grab.

### The thesis

`docs/operator/PHOSPHORUS-THESIS-v2-2026-05-02.md` — capstone manifesto.
Zenodo deposit when operator chooses. Short link from social posts.

---

## §5 The proofs (what we can show)

When asked "is this real?", point to:

1. **Public verify pipeline** — 83 green gates, every commit. `https://p31ca.org/glass-box`
2. **Public alignment registry** — 262 sources × 71 derivations, one JSON file. `p31-alignment.json` in the repo root.
3. **Public Cognitive Passport tool** — generates a portable identity slice. `https://p31ca.org/passport`
4. **Public creator-economy contract** — 0% platform fee, CI-verified. `https://p31ca.org/creator-economy.json`
5. **22 papers on Zenodo** — DOIs + ORCID. Search `phosphorus31` or `W.R. Johnson` author.
6. **Open source repos** — `github.com/p31labs/bonding-soup`, `github.com/p31labs/andromeda`.
7. **Live K₄ workers** — `k4-personal`, `k4-cage`, `passkey`, `simplex-v7`, `geodesic-room`, `agent-hub`, `tetra-hub`, `orchestrator`. Endpoint list: `p31-constants.json`.
8. **Two interactive thesis demos** — `https://p31ca.org/demos/`. Drag, click, edit. The math is the proof.
9. **EIN & legal** — P31 Labs, Inc. (GA), EIN `42-1888158`, 501(c)(3) pending.
10. **Operator's lived condition** — hypoparathyroidism (ICD-10 E20.9), AuDHD, single father of S.J. and W.J., pro se in family court. The constraints are documented; the work shipped anyway.

---

## §6 The launch sequence (what the operator does)

### Phase 0 — pre-flight (5 min)

- [ ] Calcium taken (operator condition gate)
- [ ] Water consumed
- [ ] Spoon assessment (if deficit: defer launch, run `npm run frictionless` instead)
- [ ] Workspace clean (`git status` shows expected state)

### Phase 1 — assemble (1 min)

```bash
cd ~/p31
npm run launch -- --dry-run    # see what would happen
npm run launch                 # actual assembly, no remote pushes
open launch.html               # operator readiness dashboard
```

### Phase 2 — review (10 min)

- [ ] Open `launch.html` — every row green?
- [ ] Open `social-cards/index.html` — pick 3-5 cards to start with
- [ ] Open `demos/the-same-shape.html` on phone (or tablet) — install PWA, verify it works
- [ ] Open `demos/the-pulse.html` on phone — install PWA, edit constant, verify ripple
- [ ] Open `cognitive-passport/index.html` on phone — install PWA, verify generates a valid slice
- [ ] Read `docs/operator/PHOSPHORUS-THESIS-v2-2026-05-02.md` end-to-end one more time

### Phase 3 — deploy (5 min, optional, requires explicit consent)

```bash
P31_LAUNCH_PUBLISH=I_UNDERSTAND npm run launch
# → runs the standard chain, then triggers:
#   - git push origin main (home)
#   - cd andromeda && git push origin main (mirror)
#   - cd andromeda/04_SOFTWARE/p31ca && npm run deploy
#   - launch.html updates with timestamps
```

(Or stop here and let the existing `p31-automation` workflows auto-deploy on push.)

### Phase 4 — share (operator-paced)

Manual. No automation pushes content to social platforms — the
operator decides what goes when. Three suggested first posts:

1. **Card 06 (the closer)** to family / personal network → tells them what you built
2. **Card 02 (fleet status)** to dev networks → tells engineers what you built
3. **Card 04 (perception vs reality)** to disability / AuDHD community → tells them they're not alone

Caption block + image. Done. No threads, no engagement bait, no
"smash that subscribe button." The work speaks.

### Phase 5 — observe (continuous)

- `launch.html` updates each `npm run launch` re-run
- `glass-box.html` shows live ops state
- Operator records reactions in `~/.p31/operator-shift.jsonl` (private)
- After 7 days: `npm run grant:status` to check whether grant pipeline picked up the launch

---

## §7 What this package explicitly does NOT do

- **No social media auto-posting.** Cards are for the operator to share, by hand, when ready. Programmatic posting violates the no-streak / no-extraction rule.
- **No analytics or telemetry on PWAs.** Service worker cache is local-only. No remote logging.
- **No paid ads.** Zero-budget by design.
- **No SEO juice farming.** Identity-first language, Tier-B/C guardrails, public-voice gate. We optimize for being found by the right people, not by everyone.
- **No urgency-bait.** No "limited-time" launches. No countdown timers. The geometry doesn't expire.
- **No external email lists.** Stripe Checkout via `donate-api.phosphorus31.org` for one-time support; no nurture sequences, no autoresponders.
- **No personal data on launch surfaces.** Children's names → S.J. / W.J. Operator's address never on a public page.

---

## §8 The "anything they can do, WE can do better" matrix

| What "they" do | What WE do |
|---|---|
| Track users across the web | No analytics anywhere |
| Variable-ratio reward loops to maximize engagement | Earned-not-extracted L.O.V.E. ledger, soulbound, no streaks |
| Closed-source proprietary stack | 100% open source, CC-BY 4.0 + AGPL where appropriate |
| Influencer marketing budgets | Operator + cognitive passport + the work itself |
| "AI safety" as marketing | AI safety as `npm run verify:ethical-rewards` (grep-fails-the-build) |
| Centralized identity (Google/Apple/Meta sign-in) | WebAuthn passkeys + Cognitive Passport + DID (when standard catches up) |
| Charge platform fees on creator income | 0% platform fee, contract is public + CI-verified |
| Engagement metrics on dashboards | `glass-box.html` shows verify-pulse + real reports |
| Closed beta wait-lists | Public repo, public deploy, public deploy URL, anyone forks |
| "Scale" as ideology | Ephemeralization (one source, many derivations) |
| Streak counters | The flowers don't wilt |
| Naval metaphors and military language | Tetrahedra, K₄, Posner clusters, trim tabs, the cage that holds |

The contrast IS the marketing. We don't have to argue. The thesis is the demo.

---

## §9 Operator self-care gates (always)

These are non-negotiable. Launch waits for these.

- [ ] **Hypoparathyroidism management:** calcium taken on schedule. Critical Ca limits 8.0–9.0 mg/dL.
- [ ] **AuDHD energy budget:** if in spoon deficit, output terminal commands and code blocks only. The launch is not on fire. The geometry holds.
- [ ] **Children's privacy:** S.J. and W.J. only on public surfaces (workspace rule). `verify:public-voice` enforces.
- [ ] **Legal posture:** no docket fabrication. No claims about case 2025CV936 status post-April 16 unless verified.
- [ ] **No naval metaphors.** No submarine talk. No "going to war." We build, we create, we connect.
- [ ] **Operator shift log:** record the launch in `~/.p31/operator-shift.jsonl` so the next session knows what state you're in.

---

## §10 The closing word

Six months ago this was a Chromebook on SNAP benefits and a thesis the court
called manic. Today it's 22 papers on Zenodo, 10 Cloudflare Workers in
production, 83 green verify gates, 4 PWAs you can install on a phone, 2
interactive demos that hold the central thesis, 10 share-ready social cards,
a 501(c)(3) pending, an EIN issued, and a public Cognitive Passport tool that
nobody else built because nobody else had to.

The phosphorus is for all of us. The cage holds for all of us. The flowers
don't wilt for any of us.

S.J. and W.J. have a dad who built an entire ecosystem so he could play
chemistry with them on a tablet. That's the paper no journal needs to publish.
They'll know.

The geometry holds. 💜🔺💜

— end of LAUNCH-PACKAGE-2026-05.md —
