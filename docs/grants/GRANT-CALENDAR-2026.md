# P31 Labs — Grant Pipeline
## Entity: P31 Labs, Inc. · EIN 42-1888158 · Georgia nonprofit · 501(c)(3) pending

---

## Pipeline at a glance

| Grant | Amount | Status |
|-------|--------|--------|
| Awesome Foundation | $1,000 | Deliberating — decision imminent |
| ASAN Teighlor McGee | $6,250 | Portal opens May 15 — apply immediately |
| Stimpunks Foundation | $3,000 | Opens June 1 — apply immediately on open |
| NLnet NGI Zero Commons | €15,000 | **Draft ready** (`nlnet-ngi-zero-commons-application.md`) — submit before June 1 |
| Georgia Tools for Life | Partnership | Follow-up sent — await reply from Hunter McFeron |

**Total reachable: ~$10,250 + €15,000**

---

## Operator actions (no code required)

**Send now (before anything else):**
```
docs/501c3-filing/emails/01-fers-disability-followup.md  → Eric Violette, OCHR Norfolk
docs/501c3-filing/emails/02-hcb-fiscal-sponsorship-withdrawal.md  → HCB
docs/501c3-filing/emails/03-grant-april-2026-followup.md  → Awesome Foundation
docs/501c3-filing/emails/04-georgia-tools-for-life-followup.md    → Hunter McFeron
```

**NLnet — one thing needed before submitting:**
The draft at `docs/grants/nlnet-ngi-zero-commons-application.md` is structurally complete. The "Motivation" section is written from the operator's perspective but I wrote it — read it and change anything that doesn't sound like you. NLnet reviewers can tell. Especially the paragraph starting "I built this because I needed it." If that's not your voice, rewrite it.

**ASAN (opens May 15):**
Read `docs/grants/GRANT-CALENDAR-2026-asan.md` when the portal goes live. The talking points are in this doc. The 500-word narrative needs to come from you — the AuDHD + hypoparathyroidism angle only works if it's your words.

**Board meeting (this weekend):**
`docs/board/BOARD-MEETING-001-AGENDA.md` — run through it. After signatures:
```bash
npm run launch:check -- legal-counsel-review met --note "Board #001, [date]"
npm run launch:check -- successor-operator-named met --note "Package stored [method], [date]"
npm run launch:gate   # should reach 100/100
```

---

## 1. Awesome Foundation — $1,000

**Status:** April 2026 deliberation in progress.

**If accepted:** Unrestricted. Priority:
1. Home Assistant host (~$55) → SENTINEL physical layer
2. Bangle.js 2 wearable (~$63) → HRV/spoon feed
3. Kids tablets × 2 ($100 each) → mesh device identity

**If rejected:** Reapply to a different chapter (chapters are fully independent). Use the ASAN framing — the disability-tech angle is stronger now with incorporated nonprofit status.

---

## 2. NLnet NGI Zero Commons — €15,000

**Hard deadline: June 1.** No extensions.

**Draft:** `docs/grants/nlnet-ngi-zero-commons-application.md` — complete and ready except for operator voice review.

**What the draft funds:** Writing the open k4 protocol specification (wire format, signing vectors, federation handshake, guardian-token gate) so other developers can implement compatible hubs. The code is live at `k4-agent-hub.trimtab-signal.workers.dev`. The spec is what transforms it from running code into commons infrastructure.

**Eligibility note:** P31 Labs is a US entity. NGI Zero Commons has funded non-EU applicants before when the work produces commons benefit. Confirm at nlnet.nl/contact before submitting.

**Submit at:** nlnet.nl (look for "NGI Zero Commons" on the grants page)

---

## 3. ASAN Teighlor McGee Disability Justice Mini-Grant — $6,250

**Opens May 15.** Submit immediately.

**Why this fits:** Autistic-led org (operator is AuDHD late-diagnosed). Hypoparathyroidism + AuDHD creates a real, documented spoon-management constraint — not a theoretical one. The tools exist because the operator needed them. No surveillance-capitalism data model.

**Key talking points:**
- Autistic-led — not adjacent, led
- BONDING lets separated parents play chemistry with their kids without giving Meta or Google behavioral data on those children
- Cognitive Passport is a structured self-advocacy tool for interactions with doctors, teachers, courts
- Guardian-gated minor vertex: kids are in the mesh without holding commercial accounts anywhere
- Operator is currently at $0 income (FERS pending) — grant funds IP filings + hardware that can't be self-funded

**Budget ($6,250):**

| Line | Amount |
|------|--------|
| Provisional patent × 2 (HERALD + Node One, $65 each) | $130 |
| Copyright registration (group unpublished works) | $65 |
| WIPO PROOF timestamps × 5 | $110 |
| DOBE certification (Disability:IN) | $350 |
| Home Assistant host (Pi 4 Starter) | $55 |
| Bangle.js 2 wearable (HRV/spoon feed) | $65 |
| Kids tablets × 2 (S.J., W.J.) | $200 |
| Domain backup (p31.dev) | $12 |
| 3D print filament / prototyping | $25 |
| Operator stipend (20 hrs × $25) | $500 |
| Buffer | $4,738 |
| **Total** | **$6,250** |

**Before submitting:**
- [ ] Read 2026 guidelines on asan.org when portal opens
- [ ] Confirm: "pending" 501(c)(3) acceptable, or determination letter required?
- [ ] Write 500-word narrative in your voice (talking points above are the skeleton)
- [ ] Attach: IRS CP575E, Pay.gov confirmation 281TLBGO, GA SOS filing

---

## 4. Stimpunks Foundation — $3,000

**Opens June 1.** Apply same day.

Stimpunks explicitly funds IP filings and hardware BOMs for neurodivergent builders. `docs/FUNDING-GATED-ACTION-ITEMS.md` maps directly to their priorities: Node One BOM (ESP32-S3 + DRV2605L + LoRa SX1262 + NXP SE050), provisional patents, DOBE cert.

**Note:** If 501(c)(3) determination is still pending when June 1 arrives, ask Stimpunks if they accept a pending-status application with CP575E proof. Many do.

---

## 5. Post-IRS-determination pipeline

When the determination letter arrives:

- Update "pending" language: `terms.html` L133-136, `privacy.html`, all grant materials
- Register on Candid / GuideStar (free; required by most mid-size grantmakers)
- Begin issuing tax-deductible receipts (update Stripe payment link description)
- Register Georgia C-100 if donations exceed exemption threshold (check sos.georgia.gov)
- Pursue larger grants: Ford Foundation, Mozilla Foundation, Open Technology Fund

---

## Completed / confirmed

- [x] Georgia SOS registration (Control #26082141, active)
- [x] EIN obtained (42-1888158, IRS CP575E)
- [x] 501(c)(3) filed (Form 1023-EZ, Pay.gov 281TLBGO)
- [x] SAM.gov full registration complete (UEI NQKVWH6AKB58)
- [x] Stripe Payment Link live
- [x] Ko-fi live
- [x] k4-agent-hub deployed (live endpoint; NLnet can verify at /v1/manifest)
- [x] NLnet draft written (`nlnet-ngi-zero-commons-application.md`)

---

*Hardware BOM and IP filing checklist: `docs/FUNDING-GATED-ACTION-ITEMS.md`*
