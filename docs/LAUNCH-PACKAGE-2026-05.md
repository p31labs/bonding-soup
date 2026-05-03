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

Single command. 15 steps. Build phase first, verify phase second, snapshot last:

```
build phase
   1. build:pwa             mirror SW + script into all installable surfaces
   2. build:demos           mirror two consolidated artifacts into p31ca
   3. build:social-cards    mirror 10-card kit into p31ca/public/social-cards/
   4. build:launch-page     mirror launch.html into p31ca/public/launch.html
   5. sync:passport         regenerate cognitive-passport p31ca mirror
   6. build:doc-index       rebuild searchable doc library

verify phase  (84-gate ship bar subset relevant to launch readiness)
   7.  verify:alignment            271 sources × 75 derivations
   8.  verify:facts                structural invariants
   9.  verify:passport             p31ca passport mirror byte-match
   10. verify:constants            Larmor / K₄ / ³¹P canon
   11. verify:demos                schema markers + required tokens
   12. verify:pwa                  4 manifests + 4 surfaces + per-app mirrors
   13. verify:public-voice         identity-first guardrails (S.J. / W.J.)
   14. verify:public-sanitization  no PII on public surfaces

snapshot
   15. write .p31-launch-readiness.json (gitignored; consumed by launch.html)
```

The verb is **idempotent** — run it ten times in a row, get the same result.
The verb is **safe** — it does NOT push, deploy, or notify external services
unless `P31_LAUNCH_PUBLISH=I_UNDERSTAND` is set.

The verb is **fast** — ~8.4s warm. No network calls in the standard pipeline.

### `npm run launch -- --dry-run`

Same chain, no writes. Tells you what it WOULD do.

### `npm run launch -- --status`

Read-only. Prints the current launch readiness report from
`launch.html` data without re-running any gate. In `--full` mode the
report adds a deliverables-present table and per-probe service detail.

### `npm run launch -- --full` *(rainbow tier — assemble everything)*

The standard 14-step pipeline assembles the **public-facing surface**
(PWAs, social cards, demos, doc library, launch dashboard). It does
**not** touch other ship-relevant artifacts (fleet portal, contract
registry, smart-EVM manifest, PHOS voice JSON, glass box, shipbox)
and it does **not** probe local services (Ollama daemon, MCP bridge,
command-center, demo server, Tailscale, Cloudflare ecosystem).

`--full` extends the pipeline to do all of it in one verb:

**Standard phase** (14 steps): the same as `npm run launch`.

**Full-build phase** (10 extra non-critical steps):

| step                        | output                                              |
|-----------------------------|-----------------------------------------------------|
| `build:fleet-portal`        | `fleet-portal.html` (mirrored to p31ca)             |
| `build:contract-registry`   | `contracts/p31-contract-registry.json` (62 entries) |
| `build:phos-voice`          | `andromeda/.../public/lib/p31-phos-voice.json`      |
| `build:wiring-ci-ladder`    | regenerates §9 of the verify pipeline doc (84 gates)|
| `build:verify-pipeline`     | regenerates `verifyPipeline.scripts` in alignment   |
| `build:nav-tree`            | `docs/P31-USER-NAV-TREE.md`                         |
| `build:glass-box`           | `glass-box.html` + promoted reports index           |
| `p31:shipbox`               | `p31-shipbox.json` (peer-review handoff snapshot)   |
| `ollama:mcp:verify`         | static check of MCP bridge config (10 personas)     |
| `verify:fleet-ten`          | 10-persona Ollama fleet bundle still consistent     |

**Service-probe phase** (6 non-critical probes):

| probe                  | what it checks                                       |
|------------------------|------------------------------------------------------|
| `probe:ollama`         | `127.0.0.1:11434/api/tags` — daemon up + model count |
| `probe:mcp-bridge`     | `pgrep -f ollama-mcp/server.mjs`                     |
| `probe:command-center` | `127.0.0.1:3131/api/health`                          |
| `probe:demo-server`    | `127.0.0.1:8080/`                                    |
| `probe:tailscale`      | `tailscale status --json` (optional binary)          |
| `probe:ecosystem-glass`| live HTTP probes against `p31-ecosystem.json`        |

**Total: 31 steps** (14 standard + 10 builds + 6 probes + 1 readiness write).

**The rainbow finale.** When every standard step + every full-build
step is green (probes are informational and don't gate it), the
terminal prints a six-color ANSI rainbow celebration with totals
(steps, deliverables, services, elapsed time, commit). The
celebration is suppressed when `NO_COLOR` is set or stdout is not a
TTY (CI gets clean output).

The same celebration condition surfaces on `launch.html` as a
gradient-bordered banner at the top of the page when the readiness
JSON shows `mode === "full"` and `assemblyComplete === true`.

`launch.html` itself gains two new panels in `--full` mode:

- **§06 deliverables present** — every artifact in the inventory with
  size, modified time, and present/missing status.
- **§07 local services (probed)** — per-service up/down with detail
  lines (e.g. "23 models loaded", "pid 1110830", "not running (run:
  npm run command-center)").

**What `--full` still doesn't do** (kept explicit, deliberate):

- It does **not** start any local service. If `command-center` is
  down, the probe reports it down; the operator decides whether to
  start it. `launch` is not a service supervisor.
- It does **not** deploy. Cloudflare Pages / Workers deploy via the
  existing `release:public` / `deploy:p31ca` / `ecosystem:deploy`
  verbs and remain operator-gated.
- It does **not** push to remotes unless `P31_LAUNCH_PUBLISH=I_UNDERSTAND`
  is set in the shell (same as standard mode).

Five entry points all support `--full`:

- `npm run launch -- --full` (or `npm run launch:full`)
- `p31 launch --full`
- *P31: launch — FULL ASSEMBLY (rainbows, ~2-3min)* VS Code task
- `home-launch-full` button on the local command-center
- `npm run launch:status` (after a full run) shows the deliverables
  + per-probe detail in the terminal

### Why five entry points to one pipeline (the accommodation, not redundancy)

The same `npm run launch` pipeline is reachable five different ways:

1. **Terminal** — `npm run launch` / `npm run launch:dry` / `npm run launch:status`
2. **Global CLI on PATH** — `p31 launch [--dry-run|--status]`
3. **Cursor / VS Code task** — Cmd-Shift-P → *Tasks: Run Task* → *P31: launch — full assembly*
4. **Local command-center** — browser at `:3131` → **Launch** section → click `home-launch` (HITL-gated)
5. **Read-only status verb** — `npm run launch:status` (cron-safe, 580ms)

This is **coherence**, not redundancy. Per the monotropism + Shannon
synthesis (`docs/operator/PHOS-TRAINING-DOCTRINE-2026-05-02.md`):
attention allocation is monotropic — wherever the operator's focus
already is, that's where the tool needs to be. Asking a person with
executive dysfunction to context-switch to a specific surface before
they can act is a tax the system should absorb, not impose.

If the operator is in the terminal, `npm run launch` is zero-context-switch.
If in Cursor, Cmd-Shift-P is zero-context-switch. If in the browser
checking fleet status, the command-center button is zero-context-switch.
If on a phone, the CLI on PATH is zero-context-switch. If in
check-not-do mode (low-spoon window), `launch:status` is a read-only
observation that doesn't risk triggering action.

Five doors, one pipeline. The 15 steps run identically regardless of
which door you walked through. The doors are different because the
operator's cognitive state is different at different moments.

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

### Phase 4 — share (operator-paced, sequenced)

Manual. No automation pushes content to social platforms — the
operator decides what goes when. **Sequence matters** (per peer review,
Opus 4.6, 2026-05-02): the work earns the right to tell the fight
story, not the other way around. Lead with what P31 *is*; let what it
*isn't* arrive after the work is established.

**Day 1 — establish what P31 is.** No adversary, no defense, just the work.
1. **Card 06 (the closer)** → family / personal network. *"A father built an entire ecosystem to play chemistry with his kids on a tablet."* The viewer's heart breaks without knowing about the court case.
2. **Card 02 (fleet status terminal)** → dev networks. *"83 gates green on a Chromebook."* The viewer's jaw drops without knowing who the adversary is.

**Week 1 — deepen technical credibility + the "wait, on WHAT?" factor.**
3. **Card 05 (ethics as architecture)** → product / UX / accessibility-curious eng. The verify gate that fails on `streak` or `leaderboard`.
4. **Card 07 (built on what)** → HN / Lobsters / dev Twitter. SNAP benefits, Medicaid, pro se, 22 papers, $50/mo infra. The "wait, on WHAT?" shock.

**Week 2+ — only after the work is established.** Operator's choice.
5. **Card 04 (perception vs reality diptych)** → AuDHD / disability community. *Stays in the kit; doesn't lead.* By the time anyone sees this card, they already know the work is real, so the contrast lands as *"can you believe the gap between how this person was seen and what they actually built?"* instead of *"this person is angry at a court and wants validation."*

**The other 5 cards** (01 stat flex, 03 quote, 08 K₄ SVG, 09 trim tab, 10 ASCII tetra) are platform/audience matched — see §4 for the full table. Operator picks.

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

## §8 The choices we made and why

This section was originally framed as "anything they can do, WE can do
better" — that framing was reactive by construction. Reframed per peer
review (Opus 4.6, 2026-05-02): the left column describes the common
industry pattern in neutral terms; the right column states P31's choice
affirmatively. Each row should make sense even if you cover the left
column. Rows that only carry meaning as negation were cut.

| Common industry pattern | P31's choice |
|---|---|
| Cross-site analytics | No analytics on any P31 surface |
| Variable-ratio reward loops | Earned L.O.V.E. ledger; soulbound; no streaks |
| Proprietary closed source | 100% open source — CC-BY 4.0 / AGPL |
| Influencer marketing budgets | Cognitive Passport + the work itself |
| "AI safety" as marketing copy | AI safety as `npm run verify:ethical-rewards` (grep-fails the build) |
| Centralized SSO (Google / Apple / Meta) | WebAuthn passkeys + Cognitive Passport + DID |
| Platform fees on creator income | 0% platform fee · public + CI-verified contract |
| Engagement-metrics dashboards | `glass-box.html` — verify-pulse + real reports |
| Closed-beta wait-lists | Public repo, public deploy URL, anyone forks |
| "Scale" as ideology | Ephemeralization — one source, many derivations |
| Naval / military framing | Tetrahedra · K₄ · Posner clusters · trim tabs · the cage that holds |

11 rows (one purely-reactive row was cut: "streak counters → the flowers
don't wilt" — the right side carried no meaning without the left).

The data is real. The engineering is earned. The contrast doesn't need
to be adversarial to be obvious. The receipts speak for themselves.

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
