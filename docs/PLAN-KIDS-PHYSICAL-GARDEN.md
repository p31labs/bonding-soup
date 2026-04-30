# Plan — Kids physical garden (Camden County, zone 8b/9a)

**Audience:** Operator (parent) building the household garden.
**Goal:** A garden that is **absolutely perfect for the kids** — not Pinterest-perfect, kid-perfect. Sized to them, tasteable by them, owned by them, sensory-zoned for AuDHD-friendly opt-in. Every claim in this doc traces to a row in the canonical manifest.

**Companion plans:** `docs/PLAN-KIDS-VIBE-CODING.md` (digital sovereignty), `andromeda/04_SOFTWARE/p31ca/docs/SECURITY-RUNBOOK.md` (digital safety). This doc is the physical-world peer.

**Canonical sources of truth:**

| Artifact | Path | Schema |
|---|---|---|
| Plant + structure manifest | `andromeda/04_SOFTWARE/p31ca/ground-truth/garden-zone-8b.json` | `p31.gardenZone/1.0.0` |
| Public mirror (deploys to p31ca.org) | `andromeda/04_SOFTWARE/p31ca/public/garden-zone-8b.json` | same |
| Verifier | `andromeda/04_SOFTWARE/p31ca/scripts/verify-garden-zone-8b.mjs` | — |
| Garden Log UI (kid-side bridge) | `andromeda/04_SOFTWARE/p31ca/public/quantum-family.html` § Garden Log | `p31.phos.gardenState/1.0.0` |
| Phos digital companion | `simplex-v7/src/skills/phos-handler.ts` | same |

If a plant or structure isn't in the manifest, it isn't in the plan. Edit `ground-truth/garden-zone-8b.json`, mirror to `public/`, run **`npm run verify:garden-zone-8b`** (in `p31ca/`), commit. Same discipline as `creator-economy.json`.

---

## Design axioms (every kid-perfect garden has these)

1. **Enclosure** — children need a *room* they can enter, not just walk past. (sunflower fortress, bean teepee, willow tunnel)
2. **Tasteable by month** — staggered edibles so something is always returning a small reward. Zone 8b is generous; use it.
3. **Kid-sized tools** — a *do* garden, not a *watch* garden. Digging zone, child-scale shovel + trowel + watering can + gloves.
4. **Sit-and-look** — a bench, stump, or flat stone. Bumblebee-watching takes time.
5. **Sensory zoning** — each sense gets its own zone (smell / touch / taste / sound / sight). Each zone is *one* clear sensation. Predictable = safe (AuDHD).
6. **Ownership square** — each kid gets a marked plot they fully own. Inside the square: their decisions. Outside: family-shared. Sovereignty practice.
7. **Yes zone** — one bed where kids can pick anything anytime, no permission. Cut-and-come-again flowers + soft herbs. Teaches that other zones have rules without making rules feel like rejection.
8. **Calendar ritual** — plant one new thing together every solstice and equinox. Garden becomes the year.

These axioms are enforced by the verifier — the manifest will fail CI if any of `enclosure`, `tasteable-by-month`, `ownership-square`, `yes-zone` drops out.

---

## Tier A — **This season** (April–June 2026)

Same tier-letter convention as `PLAN-KIDS-VIBE-CODING.md`: A = today / right now / before drift.

**Structures (build these first, in order):**

1. **Sunflower fortress** — `sunflower-fortress` in manifest. 6-foot circle of Mammoth Russian sunflowers, one 2-foot doorway, Kentucky Wonder pole beans climbing the stalks (Three Sisters style). Direct-seed mid-April. Green cathedral by August.
2. **S.J.'s square** + **W.J.'s square** — `sj-square` / `wj-square`. 4×4 ft each, marked with stones or hand-painted signs in their own handwriting. Inside the square they decide. Day-one rule — the rest of the garden has rules; the squares don't.
3. **Yes zone** — `yes-zone`. One bed of zinnias, cosmos, snapdragons, nasturtiums, cherry tomatoes, mint. They can pick anything in this zone, anytime, no permission required.
4. **Digging zone** — `digging-zone`. Open bed or sand pit, kid-sized tools nearby. No plants required. Especially valuable on dysregulated days.
5. **Sensory barefoot path** — `sensory-barefoot-path`. Six tile-sized squares: smooth river stones, warm pea gravel, creeping thyme, cedar wood rounds, moss patch, sand. Each square = one clear sensation.

**Plants (Tier A — plant or transplant this season):**

| Plant | Manifest id | What it does |
|---|---|---|
| Rabbiteye blueberry (Climax + Premier or Tifblue) | `rabbiteye-blueberry` | Jam every July |
| Swamp milkweed | `swamp-milkweed` | Monarch host, fall migration spectacle |
| Butterfly milkweed | `butterfly-milkweed` | Dry-edge nectar partner to swamp milkweed |
| Mammoth Russian sunflower | `mammoth-russian-sunflower` | Sunflower fortress walls |
| Kentucky Wonder pole bean | `kentucky-wonder-pole-bean` | Climbs the sunflower stalks |
| Creeping thyme | `creeping-thyme` | One barefoot-path tile |
| Mint (contained) | `mint` | Yes-zone tasting |
| Nasturtium | `nasturtium` | Yes-zone — edible peppery flowers |
| Cherry tomato (Sungold) | `cherry-tomato` | Yes-zone summer reward |
| Zinnia | `zinnia` | Yes-zone cut-and-come-again |
| Cosmos | `cosmos` | Yes-zone tall layer, self-seeds |
| Snapdragon | `snapdragon` | Cool-season yes-zone, snap-the-dragon-mouth play |
| Strawberry (everbearing) | `strawberry` | Ground-level harvest, two crops in zone 8b |
| Purple coneflower | `purple-coneflower` | Pollinator flyway, goldfinch winter food |
| Pink muhly grass | `ornamental-grass-muhly` | Wind-library whisper layer |

**Critical rule:** **only native milkweed.** Tropical milkweed (*Asclepias curassavica*) is forbidden in this manifest — it disrupts monarch migration timing in southern zones. The verifier blocks it.

---

## Tier B — **This year** (Summer/Fall 2026 → Spring 2027)

**Structures:**

- **Moonlight bed** — `moonlight-bed`. Rectangular bed (~4×8 ft) with central trellis arch. Moonflower vine (opens at sunset, fragrant), white nicotiana, lamb's ear (silver-soft, irresistible to pet), yaupon holly screen on the sunny side. The after-dinner walk destination.
- **Pollinator flyway** — `pollinator-flyway`. Long border on the south side. Adds bee balm to the milkweed + coneflower core. Watch caterpillar → chrysalis → butterfly Sep–Nov.
- **Wind library** — `wind-library`. Three sound sources at three heights: copper chime (deep, 8 ft), bamboo chime (hollow, 5 ft), pink muhly mass (whisper, 2-3 ft).
- **Grandmother bench** — `grandmother-bench`. Bench or large flat stone, shaded, with a view of the whole garden. Side-by-side co-regulation anchor.

**Plants (Tier B — plant fall or next spring):**

| Plant | Manifest id | What it does |
|---|---|---|
| Brown Turkey fig | `brown-turkey-fig` | One tree feeds the family Aug–Sep |
| Satsuma orange | `satsuma` | Cold-hardy citrus, kid-height fruit by year 3 |
| Sweetshrub (Carolina allspice) | `sweetshrub` | Fruit-punch smell anchor for the smell zone |
| Fringe tree | `fringe-tree` | Spring "snow"; named-tree candidate (slow grow, hugged-trunk-friendly) |
| Eastern redbud | `redbud` | First color of spring; edible flowers |
| Moonflower vine | `moonflower-vine` | Sunset opening — the after-dinner show |
| White nicotiana | `white-nicotiana` | Moonlight-bed fragrance |
| Lamb's ear | `lambs-ear` | Touch-zone silver-soft anchor |
| Bee balm | `bee-balm` | Pollinator flyway nectar + Earl Grey smell |

**Each kid's named tree** — operator-led. Plant one tree per child, sized so they can still hug the trunk. They name it. Candidates: fringe tree, redbud, satsuma. Plant fall 2026 dormant or spring 2027.

---

## Tier C — **Later** (2027+)

- **Stone-circle outdoor classroom** — `stone-circle`. 5-7 flat seating stones, optional fire-pit center. Cumberland Island National Seashore (Bortle 3 dark sky, ~20 min away) is the night-sky destination. Telescope station for storms-of-stars.
- **Yaupon holly hedge** — `yaupon-holly`. Indestructible structural backbone for the moonlight bed and pollinator flyway. Operator-only tea source from leaves; berries are mildly toxic and must be sited away from kid grazing zones.
- **Compost peek-a-boo** — clear-sided composter so kids see the system working. (Not yet in the manifest — adding requires a manifest edit + verify pass.)

---

## Seasonal calendar — the four-times-a-year ritual

Plant *one new thing together* every solstice and equinox. Four times a year. The garden becomes the calendar.

| Date | Equinox / solstice | Plant candidates |
|---|---|---|
| Mar 20 | Spring equinox | snapdragon, strawberry, cherry tomato, nasturtium, redbud transplant |
| Jun 21 | Summer solstice | zinnia, cosmos, sunflower (mid-summer succession), pole bean |
| Sep 22 | Fall equinox | fringe tree transplant, satsuma transplant, swamp milkweed (last call), moonflower seed-saving for next year |
| Dec 21 | Winter solstice | rabbiteye blueberry (bare-root), brown turkey fig (dormant transplant), yaupon holly, *named-tree planting ceremony* |

(Source: `garden-zone-8b.json` → `seasonalPlantingCalendar.events`. Edit there, not here.)

---

## The Phos bridge — physical garden → digital companion

The codebase already ships a children's digital companion called Phos:

- **Worker route:** `POST /api/phos/respond` (`simplex-v7/src/skills/phos-handler.ts`)
- **Production target:** `https://api.phosphorus31.org` (DNS attach pending — see `simplex-v7/DEPLOY.md` §6)
- **Persona:** "a soft tetrahedron in the garden soil" — non-evaluative, no praise, no probing, no surveillance, no engagement bait, remembrance-protocol aware (`simplex-v7/src/skills/phos-prompt.ts`, `phos-safety.ts`)
- **Auth:** HMAC-signed body (`PHOS_HMAC_SECRET`) and/or `PHOS_CHILD_IDS` allowlist. The kid tablet never holds the secret.

The physical garden feeds Phos through the **Garden Log** page in `p31ca.org/quantum-family.html`:

1. Kid taps chips for what they saw / picked / felt — chips load from `/garden-zone-8b.json`.
2. Kid taps an action chip (building / watching / planting / tasting / sitting / digging).
3. Kid taps a sensory chip (cloud-soft / thyme-warm / sand-warm / moss-cool / stone-cool / wind-steady).
4. Optional: kid types a short message ("What does carbon like to do?").
5. Page generates a JSON payload matching `p31.phos.gardenState/1.0.0`.
6. Kid taps **Copy for grown-up**.
7. Operator pastes payload into either:
   - `garden-phos-probe.html` (operator-only HMAC probe, repo root), or
   - `npm run phos:probe` (signs with `PHOS_HMAC_SECRET` and POSTs)
8. Phos responds with companion text appropriate to what was observed. ≤4 short sentences (≤12 simple words if `pre_reader: true`).

**Why the operator step exists:** the static page must not hold the HMAC secret. Two-step keeps the auth boundary clean. If you want one-tap, build a Worker proxy in front of `api.phosphorus31.org` that holds the secret server-side and authenticates by `PHOS_CHILD_IDS` + same-origin from `p31ca.org`. (Not yet shipped; out of scope for this plan.)

---

## Immediate checklist (printable)

- [ ] Pick the sunflower-fortress location (full sun, ~6 ft circle clearance).
- [ ] Mark S.J.'s square and W.J.'s square — 4×4 ft each, marker stones at corners, hand-lettered sign.
- [ ] Mark the yes-zone bed location — must be visible from kitchen window so picking happens.
- [ ] Order Tier A plants from a Coastal Plain native nursery (e.g. Coastal Wildscapes, Mail-Order Natives in Lee, FL) for milkweeds + coneflower; rabbiteye blueberries from a local nursery for cultivar diversity.
- [ ] Buy kid-sized tools: shovel, trowel, watering can, gloves, garden gloves in S.J.'s preferred color and W.J.'s preferred color.
- [ ] Plant the spring-equinox cohort together (snapdragon, strawberry, cherry tomato, nasturtium).
- [ ] Direct-seed sunflower fortress mid-April; pole beans two weeks after sunflower germinates.
- [ ] Plant milkweed pair (incarnata + tuberosa) — never curassavica.
- [ ] Open `https://p31ca.org/quantum-family.html` → 🌱 Garden Log on a tablet. Show the kids.
- [ ] First week of August: walk through the sunflower fortress doorway with them. The garden is real.

---

## Appendix — relationship to the rest of the P31 mesh

- **Family Tetrahedron** (`quantum-family.html` → 🔺 Family) renders the K₄ cage canon (will / S.J. / W.J. / christyn). The garden is the K₄ in physical space — four corners (sunflower fortress, S.J.'s square, W.J.'s square, yes-zone) wired by paths.
- **Sound Garden** (also in `quantum-family.html` → 🎵 Sounds) tunes to 863 Hz Larmor + 432 Hz base. The wind library is the same idea, outdoor, in air.
- **Calcium Power** (`quantum-family.html` → 🦴 Calcium) — the operator's hypoparathyroidism doctrine. Posner-molecule visual; the garden is the same chemistry on a slower timescale (rabbiteye blueberry leaves accumulate calcium and phosphorus from sandy Coastal Plain soil).
- **Mission Control** (`mission-control.html`) — Genesis token economy. Garden chores can be a mission category (water the squares = N tokens). Operator decision; not in this plan by default.

The garden is the slowest-running peer in the mesh. Everything else iterates in seconds. The garden iterates in seasons. That difference is the point.
