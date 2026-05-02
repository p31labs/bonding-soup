# scripts/meatspace — print-ready P31 artifacts

Track D of **CWP-PHOS-2026-01** (the face). Generates PDFs the operator can hand to humans when speech serialization fails or context is short.

> *"For every family out there figuring it out as they go — help is on the way."* — see `docs/PHOS-VOICE-DRAFT.md` (operator-approved tagline change 2026-05-01 evening; previous "raw dogging life" framing was retired so the line is kid-readable on the elevator card and QR sticker)

## Quick start

```bash
npm install                  # first time only — pulls pdf-lib + qrcode
npm run meatspace:print      # generates all available artifacts
```

Output lands in `dist/meatspace/` (gitignored — these are build artifacts).

## Per-artifact generation

```bash
node scripts/meatspace/generate.mjs --only=business-card
node scripts/meatspace/generate.mjs --only=elevator-card
node scripts/meatspace/generate.mjs --only=one-pager
node scripts/meatspace/generate.mjs --only=qr-stickers
node scripts/meatspace/generate.mjs --only=wiring-poster
node scripts/meatspace/generate.mjs --qr-target=https://p31ca.org/welcome
```

Equivalent npm aliases:

```bash
npm run meatspace:print:business-card
npm run meatspace:print:elevator-card
npm run meatspace:print:one-pager
npm run meatspace:print:qr-stickers
npm run meatspace:print:wiring-poster
```

| ID               | Status | Spec                                                                       |
|------------------|--------|----------------------------------------------------------------------------|
| `business-card`  | v1     | 3.5″×2″ with 0.125″ bleed, 2-page PDF                                      |
| `elevator-card`  | v1     | 5″×3″ with 0.125″ bleed, 2-page (front: pitch / back: tagline + large QR)  |
| `one-pager`      | v1     | US Letter, 1-page, 3-tile body + big QR + compact legal block              |
| `qr-stickers`    | v1     | 12-up sheet on US Letter, 2.5″ square stickers, dark face, cut ticks       |
| `wiring-poster`  | v1     | **11″×17″ tabloid landscape**, 4-quadrant operator wall reference (D-7)    |
| `pro-handout`    | TODO   | 5.5″×8.5″ professional handout (D-6)                                       |

### wiring-poster (D-7 — operator wall reference)

Single-sheet schematic of the entire P31 mesh. Use when you need to show someone what the system actually is — or pin it where you can see it during work sessions to keep the topology in cache.

The poster mirrors `docs/P31-WIRING-DIAGRAM.md` (the canonical source with full Mermaid diagrams + ASCII fallbacks). The PDF is the at-a-glance overview; the markdown is the deep reference.

Quadrants:

1. **Public Portals** — STRANGER / USER / OPERATOR role lanes with their accessible routes; BUS4 cross-origin bridge callout
2. **Edge Fleet** — 30 unique Workers in 7 categories (mesh / agents / bridges / identity / payments / operator tools / misc-legacy) + the 10ms / 1000-subrequest constraints
3. **Bus Bar + PHOS Pipeline** — `BaseLayout` 5-script load order with PHOS suppression handshake; PHOS voice draft → JSON → fetch → render flow
4. **Sources + Swarms + Gates** — `apply:constants` 10-sink derivation; 10 local Ollama personas + 11 simplex-v7 cloud crew + the CI verifier ladder

Print on **11″×17″ (tabloid) cardstock**. Most office supply stores will print + laminate this for under $5.

## Print rules

- **Print at 100%** (no "fit to page" — the bleed marks need to be at exactly 0.125″, sticker corners need to land on the cut ticks).
- **Cardstock recommended** for business cards (110-lb cover or heavier).
- **Long-edge flip** for landscape duplex on most home printers.
- **Test first:** print one card / one sticker sheet. Scan the QR with your phone. If it works, print the batch.

### elevator-card print options

The 5″×3″ card has three production paths:

1. **5×3 commercial index card stock** — single PDF page per card, print front/back duplex.
2. **US Letter cardstock, 4-up layout** — print four cards per sheet (manual layout step), trim to 5×3 with a paper cutter. Two sheets = 8 cards.
3. **Pre-cut 5×3 perforated sheets** — verify your stock matches the bleed dimensions before volume printing.

Use cases: leave on a coffee shop table, pin to a community board, slide under a door, drop into a take-one box at a library, hand to a person at the FERS hearing, mail with the appeal envelope. Larger than a business card → reads at arm's length → no follow-up question required.

### one-pager print options

The one-pager is a single-side US Letter handout. No bleed required (margins are 0.5″ inside the page edge). Three production paths:

1. **Plain US Letter cardstock, single-side** — most common; prints on any home printer at zero special setup.
2. **Plain US Letter paper, single-side** — cheapest; suitable for take-one boxes and bulletin boards where weight isn't critical.
3. **US Letter color cardstock** — black ink prints fine on butter (`#cda852`)-tinted or paper-cream stock; the dark void background of the design will read as inverted (cream on cream-with-text). For this case, use `--qr-target` to swap to a custom URL if you're running a campaign-specific batch.

Use cases: mail with the FERS appeal envelope, hand to a therapist or case worker at an intake meeting, pin to a community center bulletin board, slide into a clinic waiting room rack, drop in a take-one box at a library, attach to a grant application as supplementary material, hand to a journalist or grant officer at a meeting. The three-tile structure reads at desk distance; the big QR scans from across a room.

### qr-stickers print options

The 12-up sheet works on three common substrates:

1. **Plain cardstock + scissors / paper cutter** (cheapest, no sticker stock).
   Cut along the gridlines — corner ticks in the page margins are alignment guides. Hand out as hand-cut "calling cards."
2. **Full-sheet adhesive label paper** (Avery 5165 or generic). Print, cut by hand, peel-and-stick. Gives you ~12 stickers per sheet at zero per-unit cost beyond the paper.
3. **Pre-cut 2.5″ square sticker sheets** (less common; verify your stock matches the 12-up 3×4 layout before printing in volume).

Stickers go on: laptop lids, water bottles, notebooks, library bulletin boards, the back of business cards, the inside of FERS appeal envelopes (with the operator's permission). They are the "post-it" of the meatspace bridge.

## Token alignment

Colors come from `andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json` via `lib/canon.mjs`. **Do not hardcode hex values in the generator.** When the canon updates, re-run the generator and reprint.

## Font upgrade path (v1 → v2)

v1 ships with Helvetica fallback. The canonical typeface per `docs/P31-DESIGN-DOCTRINE.md` §1.4 is Atkinson Hyperlegible. To upgrade:

1. Download the OFL-licensed font:
   - `AtkinsonHyperlegible-Regular.ttf`
   - `AtkinsonHyperlegible-Bold.ttf`
   - Source: <https://www.brailleinstitute.org/freefont/>
2. Place in `scripts/meatspace/fonts/`
3. Install fontkit: `npm install --save-dev @pdf-lib/fontkit`
4. Re-run `npm run meatspace:print`

The generator picks them up automatically and re-emits the artifacts. The print pipeline never breaks; only the typography improves.

## QR target policy

Default QR target is `https://p31ca.org` — the hub root, live and stable. When the WCD-PHOS-03 `/welcome` page ships, change the default in `generate.mjs` (one line) and reprint.

**Never point the QR to:**
- A short-lived deploy preview URL
- A page behind authentication
- A URL the operator does not personally control

## Operator print test

When you receive new cards, do this once:

1. Hand one card to a stranger (kid, neighbor, barista).
2. Ask them to scan the QR with their phone.
3. Watch their face when the page loads.
4. If they look at the page for more than 3 seconds: ship the next batch.
5. If they look confused: revise `/welcome` copy with PHOS, regenerate, retest.

## Where this fits

| Lane | Track | This is |
|------|-------|---------|
| Track D | D-1, D-2, **D-3** | Generator scaffold + business card + QR sticker sheet |
| Track E | E-3 (later) | PHOS face on Node Zero will use the same K₄ mark drawn here |
| Track F | continuous | Add to `p31-alignment.json` after each new artifact |

## Doctrine — why stickers are themselves Gray Rock

Each sticker is a Layer 1 (Gray Rock) artifact: dark face, minimal chroma, no animation, no demand. The QR is the activation point — scanning it takes the human into Layer 2 (Alive) on the website. The meatspace bridge mirrors the website's interaction model exactly. See `andromeda/04_SOFTWARE/p31ca/docs/DESIGN-SPEC.md` §7.1 and `docs/PHOS-VOICE-DRAFT.md` §3.1.

## Reproducing a print run from cold start

```bash
git clone … && cd p31-home
npm install
npm run meatspace:print
ls -la dist/meatspace/
# → p31-business-card.pdf
# → p31-qr-stickers-12up.pdf
```

That's the whole pipeline. Plan-the-work, work-the-plan.

🔺
