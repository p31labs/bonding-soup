# P31 Labs — Grant Calendar & Application Guide 2026

**Entity:** P31 Labs, Inc. · EIN 42-1888158 · Georgia nonprofit  
**501(c)(3) status:** Filed 2026-04-30 (pending IRS determination — language below reflects this)  
**Last updated:** 2026-04-30  

---

## Immediate priority: send the FERS email today

**File:** `docs/501c3-filing/emails/01-fers-disability-followup.md`  
**To:** Eric Violette, OCHR Norfolk  
**Why now:** Separation ~2025-09-30. Filing deadline under 5 CFR §844.201 is ~2026-09-30. Agency processing (SF-3112D + SF-3112E) takes 90+ days. Effective margin expires ~2026-07-01 if email not sent. **154 days remain. Send today.**

```bash
# draft is ready — copy and send from will@p31ca.org
cat docs/501c3-filing/emails/01-fers-disability-followup.md
```

---

## Grant pipeline at a glance

| Grant | Amount | Opens | Deadline | Status |
|-------|--------|-------|----------|--------|
| Awesome Foundation | $1,000 | Active | April 2026 deliberation | **Pending decision** |
| ASAN Teighlor McGee | $6,250 | May 15, 2026 | July 31, 2026 | Apply May 15 |
| Stimpunks Foundation | $3,000 | June 1, 2026 | TBD (rolling) | Apply June 1 |
| NLnet NGI Zero Commons | €5K–€50K | Rolling | **June 1, 2026** | Draft exists — needs rewrite |

Total reachable this window: **~$10,250 + €5K–€50K**

---

## 1. Awesome Foundation — $1,000

**Status:** Application submitted; April 2026 chapter deliberating.

**Action:** Wait for decision. If rejected, address reviewer feedback and reapply to a different chapter (chapters are independent; Boston chapter liked accessible-tech projects in 2025).

**If accepted:** Funds are unrestricted. Priority use:
1. Home Assistant host (~$55, Pi 4 Starter Kit) → enables SENTINEL physical layer
2. Bangle.js 2 wearable (~$63) → live HRV/spoon feed
3. Kids tablets for S.J. + W.J. (~$100 each) → mesh device identity, CogPass kids gate

**If rejected before May 15:** Reapply to NYC or Chicago chapter using updated ASAN framing (see Section 2 talking points — the disability-tech angle is stronger now that P31 Labs is a 501(c)(3) filer).

---

## 2. ASAN Teighlor McGee Disability Justice Mini-Grant — $6,250

**Opens:** May 15, 2026  
**Deadline:** July 31, 2026  
**Org:** Autistic Self Advocacy Network (ASAN)  
**Focus:** Disability justice, led by/for autistic and disabled people  
**Amount:** $6,250 (single award, competitive)

### Why P31 Labs is a strong fit

- Operator is AuDHD (late diagnosis 2025) — autistic-led organization, not just disability-adjacent
- Hypoparathyroidism + AuDHD creates a real, documented spoon-management need
- BONDING / Cognitive Passport tools are built *for* the operator's lived experience, not for a hypothetical user
- Family cage wire provides communication access for neurodivergent family members
- Open source, edge-native (no surveillance capitalism data model), accessible by design
- Mission statement ("Build, Create, Connect") is inherently anti-isolation / anti-institutionalization

### Key talking points

1. **Autistic-led:** Operator is late-diagnosed AuDHD. The tools exist because he needed them.
2. **Assistive by default:** Cognitive Passport is a structured self-advocacy tool. The spoon tracker is not wellness-ware — it's energy management for a person with a chronic calcium disorder + executive dysfunction.
3. **Anti-surveillance:** No behavioral data leaves the mesh. Cloudflare Workers + Durable Objects, not a third-party SaaS that monetizes disability data.
4. **Family justice angle:** Case 2025CV936, Camden County. S.J. + W.J. are in the mesh. Communication tools for separated neurodivergent families are not served by existing market.
5. **Income:** FERS disability retirement pending ($0 income until determination). P31 Labs is currently operating at $0 cost. Grant funds hardware + IP protection that operator cannot self-fund.

### Draft budget ($6,250)

| Line item | Amount | Notes |
|-----------|--------|-------|
| Provisional patent × 2 (HERALD + Node One) | $130 | Micro-entity rate, $65 each |
| Copyright registration (group unpublished) | $65 | Collective works option |
| WIPO PROOF timestamps (5×) | $110 | Evidence-chain anchoring |
| DOBE certification (Disability:IN) | $350 | Supplier diversity access |
| Home Assistant host (Pi 4 Starter) | $55 | SENTINEL physical layer |
| Bangle.js 2 wearable | $65 | HRV/spoon data feed |
| Kids tablets × 2 (S.J., W.J.) | $200 | Mesh device identity |
| Domain backup (p31.dev) | $12 | Redundancy |
| 3D print filament / prototyping materials | $25 | Node One enclosure |
| Operator stipend (20 hrs @ $25/hr) | $500 | Time-value of grant writeup + IP filings |
| Emergency buffer / unforeseen | $4,738 | Larger items if permitted (server, travel) |
| **Total** | **$6,250** | |

> Note: If ASAN allows stipends, the operator stipend is the most important line — the organization's only cost currently is operator time.

### Application checklist

- [ ] Read ASAN Teighlor McGee 2026 guidelines when they post May 15
- [ ] Confirm: does it require 501(c)(3) determination letter or will "pending" suffice?
- [ ] Write 500-word narrative: autistic-led, what BONDING does, why mesh architecture protects disabled users
- [ ] Attach: IRS CP575E (EIN letter), 1023-EZ filing confirmation (Pay.gov 281TLBGO)
- [ ] Attach: Articles of Incorporation (GA SOS Control #26082141)
- [ ] Submit by July 31, 2026

---

## 3. Stimpunks Foundation — $3,000

**Opens:** June 1, 2026  
**Amount:** $3,000  
**Focus:** Neurodivergent-led projects; accessible tech; IP protection; hardware  
**Website:** stimpunks.org

### Why P31 Labs is a strong fit

Stimpunks explicitly funds IP filings and hardware BOMs for neurodivergent builders. The `docs/FUNDING-GATED-ACTION-ITEMS.md` checklist maps almost exactly to Stimpunks' stated priorities.

### Targeted line items ($3,000)

| Line item | Amount |
|-----------|--------|
| Provisional patent × 2 (if not covered by ASAN) | $130 |
| Node One BOM — ESP32-S3 + DRV2605L + LoRa SX1262 + NXP SE050 | ~$80–$120 |
| Home Assistant host (if not covered by Awesome) | $55 |
| Kids tablets (if not covered by Awesome) | $200 |
| Remaining IP + certification costs | ~$500 |
| Operator development stipend | ~$1,000 |
| Hardware prototyping + enclosure | ~$200 |
| **Buffer / specifics TBD on open date** | remaining |

> Note: Stimpunks may require an IRS determination letter. If still pending June 1, ask if they accept "pending" status + CP575E. If not, apply and explain timeline; ask to hold the application until determination arrives.

### Application checklist

- [ ] June 1: read 2026 guidelines on stimpunks.org
- [ ] Confirm 501(c)(3) determination requirement
- [ ] Prepare: 300–500 word narrative (neurodivergent-led, IP/hardware pipeline)
- [ ] Prepare: itemized budget
- [ ] Apply rolling — do not wait for deadline if portal opens June 1

---

## 4. NLnet NGI Zero Commons Fund — €5,000–€50,000

**Deadline:** June 1, 2026 (hard cutoff)  
**Focus:** Open internet infrastructure; commons-based tech; privacy; decentralization  
**Amount:** €5K–€50K (grants vary; typical first-timer ~€10K–€20K)

### Why P31 Labs is a strong fit

NLnet funds *infrastructure*, not apps. k4-agent-hub is a Cloudflare Workers-native, open-source, decentralized family mesh protocol — exactly the kind of commons infrastructure NLnet supports. The federation dispatch layer + anchor-pact wire protocol could be presented as an open-protocol contribution to decentralized family communication.

### Critical rewrite needed

A draft exists but needs the **operator's voice** — NLnet reviewers can tell when an application was written by an AI assistant without a human's authentic motivation behind it. The narrative must:

1. Say why *you* built this (AuDHD + hypoparathyroidism + separated family — real stakes)
2. Describe the commons contribution (open Ed25519 dock protocol, open K₄ topology, open family mesh spec — not just a product)
3. Specify what the grant funds (time to write the open spec document, test vectors, reference implementation hardening)
4. Not oversell — NLnet reviews technically. The federation dispatch code must be real and visible.

### Rewrite checklist (do this week — deadline June 1)

- [ ] Read existing draft (if saved in `docs/grants/nlnet-draft.md` — if not, write from scratch)
- [ ] Operator: write 3 paragraphs in your own voice: what you built, why, and what the grant enables
- [ ] Technical summary: describe k4-agent-hub open protocol surface (anchor-pact, federation dispatch, K₄ topology spec)
- [ ] Budget: hours × rate for protocol spec documentation + reference implementation + test vectors
- [ ] Confirm: NLnet requires an EU-reachable entity or co-applicant? (P31 Labs is US; check if acceptable or if partner needed)
- [ ] Submit via nlnet.nl before June 1 (hard deadline — no late submissions)

---

## 5. After IRS determination (ETA: ~Q4 2026)

When the 501(c)(3) determination letter arrives:

- [ ] Update all "pending" language in terms.html, privacy.html, and all grant materials
- [ ] Register on Candid / GuideStar (free nonprofit transparency profile — required by many grantmakers)
- [ ] Begin issuing tax-deductible donation receipts (update Stripe receipt language)
- [ ] Register with Georgia C-100 if cumulative donations exceed exemption threshold
- [ ] Re-apply to any grants that required a determination letter
- [ ] Consider: Ford Foundation, Mozilla Foundation, Open Technology Fund (larger, post-determination)

---

## 6. Immediate action queue

```
TODAY:
  1. Send FERS email (Eric Violette, OCHR Norfolk) — docs/501c3-filing/emails/01-fers-disability-followup.md
  2. Send email 02 (HCB fiscal sponsorship withdrawal) — docs/501c3-filing/emails/02-hcb-fiscal-sponsorship-withdrawal.md
  3. Send email 03 (grant April 2026 followup) — docs/501c3-filing/emails/03-grant-april-2026-followup.md
  4. Send email 04 (Georgia Tools for Life) — docs/501c3-filing/emails/04-georgia-tools-for-life-followup.md

THIS WEEK:
  5. Check Georgia C-100 small-org exemption threshold at sos.georgia.gov
  6. SAM.gov full registration (UEI NQKVWH6AKB58 assigned — full reg not complete)
  7. Start NLnet draft / operator voice rewrite (deadline June 1 = 32 days)

THIS WEEKEND (board meeting):
  8. Hold Board Meeting #001 — docs/board/BOARD-MEETING-001-AGENDA.md
  9. Flip launch gates after meeting (legal-counsel-review + successor-operator-named)

MAY 15:
  10. ASAN Teighlor McGee portal opens — check guidelines, start application

JUNE 1:
  11. Stimpunks opens — apply immediately
  12. NLnet NGI Zero Commons hard deadline — submit or miss it

JULY 31:
  13. ASAN deadline
```

---

*For funded action items unlocked by each grant, see `docs/FUNDING-GATED-ACTION-ITEMS.md`.*
