# P31 SOVEREIGN INFRASTRUCTURE — CWP BATCH + MEATSPACE ACTIONS
# CWP-P31-SOVEREIGN-2026-05

**Date:** May 4, 2026
**Source material:** Gemini research package (3 docs, 40+ conversations synthesized)
**Issued by:** Opus 4.6 (Architect)
**Executing agents:** Local fleet (Sonnet/CC, DeepSeek, Gemini, Qwen3 8B)
**Budget reality:** ~$5 liquid. Mercury account live but empty. Awesome Foundation $1K pending.

---

## REALITY CHECK BEFORE DISPATCHING

The Gemini research package is excellent. It's also aspirational in places that collide with your constraints. Here's the honest gate:

| EXEC | Gemini Says | Reality |
|------|-------------|---------|
| EXEC-01 (PGLite sync) | 4-6 hrs, $0 | ✅ GO — pure design/code, local agent can run now |
| EXEC-02 (Node Zero display) | 8-12 hrs, $0 | ⚠️ GATED — need physical hardware on desk. Is the Waveshare board at Brenda's or 401 Powder Horn? |
| EXEC-03 (FHIR calcium) | 6-8 hrs, $0 | ⚠️ GATED — need MyChart login first, then OAuth registration. Meatspace step before agent work. |
| EXEC-04 (Matrix homeserver) | 12-16 hrs, €30/mo | 🔴 BLOCKED — budget. Park until grant money arrives or use free-tier alternatives. |
| EXEC-05 (Post-quantum) | 8-10 hrs, $0 | ✅ GO — pure research, Opus can run |
| EXEC-06 (Daubert brief) | 6-8 hrs, $0 | ✅ GO — pure legal research, feeds the omnibus |
| EXEC-07 (eSIM fallback) | 4-6 hrs, $8-15/mo | 🟡 GATED — budget for carrier. Research the options now, activate when funded. |

**Executable NOW (agent-only, $0):** EXEC-01, EXEC-05, EXEC-06
**Executable after meatspace step:** EXEC-02, EXEC-03, EXEC-07
**Blocked on funding:** EXEC-04

---

## AGENT CWPs (Dispatch to local fleet immediately)

### CWP-SOV-01: PGLite Multi-Device Sync Architecture
**Maps to:** EXEC-01 from Gemini package
**Agent:** Sonnet (Mechanic) + Opus (review)
**Spoon estimate:** 3
**Deliverable:** `docs/architecture/PGLITE-SYNC-DESIGN.md` + `src/lib/sync/` skeleton

**Dispatch prompt:** Copy-paste EXEC-01 prompt from RESEARCH_PROMPT_EXECUTION_GUIDE.md verbatim. Append:

```
ADDITIONAL CONSTRAINTS (from Opus, May 4):
- The kids' Android tablets run BONDING (bonding.p31ca.org).
  BONDING currently uses Cloudflare KV polling at 3-10s intervals.
  PGLite sync must NOT break existing BONDING multiplayer.
  Treat BONDING KV as a separate sync channel — don't merge.
- IndexedDB via idb-keyval is already in use (pwa/ codebase).
  PGLite must coexist with existing IndexedDB usage.
- navigator.storage.persist() is already called.
- The sync Worker endpoint should be api.p31ca.org/sync
  (Cloudflare Worker, already in the fleet).
- Register the design doc in p31-alignment.json when done.
- Run `npm run verify` after any code changes.
```

**Acceptance criteria:**
- [ ] CRDT choice justified (Yjs vs Automerge) with tradeoff table
- [ ] Data model for family biometric data documented
- [ ] Sync function pseudocode in TypeScript
- [ ] Conflict resolution UX designed (what the operator sees when merge conflicts happen)
- [ ] 3-device offline simulation scenario documented
- [ ] No changes to BONDING KV relay
- [ ] `npm run verify` passes

---

### CWP-SOV-02: Post-Quantum Cryptography Audit
**Maps to:** EXEC-05 from Gemini package
**Agent:** Opus (Architect) or Gemini (Narrator)
**Spoon estimate:** 2
**Deliverable:** `docs/architecture/POST-QUANTUM-ROADMAP.md`

**Dispatch prompt:** Copy-paste EXEC-05 prompt verbatim. Append:

```
ADDITIONAL CONSTRAINTS (from Opus, May 4):
- SE050 does NOT support post-quantum crypto (50KB flash insufficient).
  Document this as a known limitation. Node One may need a different HSM.
- Genesis Block SHA-256 is quantum-safe. Confirm and document.
- Focus the roadmap on: what must change by 2030, what by 2035, what's fine.
- Prioritize DID signing (Ed25519 → Dilithium) as the first migration.
- This is a Paper XXIV candidate for Zenodo.
- Register in p31-alignment.json.
```

**Acceptance criteria:**
- [ ] Every cryptographic primitive in P31 cataloged with quantum vulnerability status
- [ ] Migration timeline: 2026 (audit), 2028 (test), 2030 (DID migration), 2035 (full)
- [ ] SE050 limitation documented with alternative HSM recommendations
- [ ] Zenodo-ready structure (abstract, methodology, findings, recommendations)

---

### CWP-SOV-03: Genesis Block Daubert Evidence Brief
**Maps to:** EXEC-06 from Gemini package
**Agent:** Gemini (Narrator) + Opus (review)
**Spoon estimate:** 3
**Deliverable:** `docs/legal/DAUBERT-GENESIS-BLOCK-BRIEF.md`

**Dispatch prompt:**

```
You are preparing a legal brief for the admissibility of blockchain-style
evidence hashing under Daubert v. Merrell Dow (509 U.S. 579, 1993) in a
Georgia family court proceeding.

CONTEXT:
- Case: Johnson v. Johnson, 2025CV936, Camden County Superior Court
- The P31 "Genesis Block" system uses server-side SHA-256 hashing with
  forensic metadata (cf-ray headers, TLS version, User-Agent) to create
  an append-only audit trail of family engagement events.
- 1,847 BONDING game records are hashed this way.
- The opposing party may challenge the authenticity of these records.
- Georgia evidence rules: O.C.G.A. § 24-9-901(b)(9) authentication,
  § 24-9-902(11) self-authentication, § 24-8-803(6) business records,
  § 24-7-702 Daubert standard.

DELIVERABLE:
- Daubert factor analysis (5 factors):
  1. Testability: Can the hash be independently verified?
  2. Peer review: Is SHA-256 hashing peer-reviewed?
  3. Error rate: What is the collision probability?
  4. Standards: Does the system follow NIST guidelines?
  5. General acceptance: Is hash-based evidence accepted in courts?
- Georgia-specific case law supporting digital evidence admissibility
- Comparison to existing blockchain evidence cases (federal + state)
- One-page summary for the judge (plain language)
- Foundation testimony outline: who testifies, what they say, what exhibits

CONSTRAINTS:
- Pro se defendant. The brief must be readable by a non-technical judge.
- Chief Judge Scarlett has shown limited patience for technical arguments.
  Lead with the conclusion, then support it. Don't make him work.
- Existing Zenodo publication: Paper IV (DOI: 10.5281/zenodo.19503542)
  references the Genesis Block architecture. Cite it.
- Register in p31-alignment.json when done.
```

**Acceptance criteria:**
- [ ] All 5 Daubert factors addressed with citations
- [ ] Georgia evidence code sections cited correctly
- [ ] One-page judge summary exists (≤ 500 words, plain language)
- [ ] Foundation testimony outline exists
- [ ] Paper IV DOI cited
- [ ] Registered in alignment

---

### CWP-SOV-04: FHIR Integration Research (Design Only)
**Maps to:** EXEC-03 (design phase only — meatspace step blocks implementation)
**Agent:** Gemini (Narrator) + Sonnet (Mechanic)
**Spoon estimate:** 2
**Deliverable:** `docs/architecture/FHIR-CALCIUM-MONITOR-DESIGN.md`

**Why design-only:** Implementation requires UF Health MyChart OAuth credentials (MRN 40236686). Agent designs the full system and writes TypeScript skeleton using Epic's public sandbox — no production data until meatspace step done.

**Dispatch prompt:** Copy-paste EXEC-03 prompt verbatim. Append:

```
ADDITIONAL CONSTRAINTS (from Opus, May 4):
- This is DESIGN ONLY. Do not attempt to hit UF Health APIs.
- Use Epic's public sandbox (https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4)
  for schema validation, NOT production data.
- The alert should fire to:
  (a) Home Assistant MQTT topic "p31/medical/calcium_alert"
  (b) Node Zero haptic pattern (3 slow pulses = medical alert)
  (c) Brenda's phone via SMS (backup)
- The forecast model is simple: linear decay from last known value
  at the rate of Calcitriol half-life (~6 hours). Not ML. Just math.
- Store all design in docs/architecture/, not in src/ yet.
- Register in p31-alignment.json.
```

---

### CWP-SOV-05: eSIM Carrier Comparison (Research Only)
**Maps to:** EXEC-07 (research phase — activation needs budget)
**Agent:** Sonnet (Mechanic)
**Spoon estimate:** 1
**Deliverable:** `docs/architecture/ESIM-CARRIER-COMPARISON.md`

**Dispatch prompt:**

```
Research eSIM carriers for a user in Saint Marys, GA (31558) who needs:
- Voice + SMS + data (minimum 1 GB/mo)
- E911 working on iPhone 11
- Month-to-month, no contract
- Budget: under $15/month
- Must work on T-Mobile or AT&T towers (coverage check for 31558 + 32211)
- eSIM activation (no physical SIM needed)

Compare: US Mobile, Tello, Mint Mobile, Google Fi, Visible.

Deliverable: comparison table (price, network, eSIM support, E911, data,
activation process). Recommend top 2 with reasoning.

CRITICAL: This is a cell service shutoff contingency.
The operator currently has no cell service. iPhone works on WiFi only.
Signal, iMessage, and FaceTime work over WiFi.
The eSIM restores SMS + voice for court notifications and emergency calls.
```

---

### CWP-SOV-06: Matrix Zero-Budget Alternative Research
**Maps to:** EXEC-04 (budget-gated — this CWP finds the free path)
**Agent:** Sonnet (Mechanic)
**Spoon estimate:** 1
**Deliverable:** `docs/architecture/MATRIX-ZERO-BUDGET-OPTIONS.md`

**Why this exists:** The Gemini plan calls for a €30/mo Hetzner VPS. That's not happening at $5 liquid. But there may be free-tier alternatives that get the communications backbone running without monthly costs.

**Dispatch prompt:**

```
Research zero-cost or near-zero-cost options for running a Matrix homeserver
for a 4-person family (Will, Brenda, Bash age 10, Willow age 6).

OPTIONS TO EVALUATE:
1. Conduit (lightweight Rust homeserver) on existing hardware:
   - Raspberry Pi 4/5 already running Home Assistant
   - Can Conduit coexist with HA on the same Pi?
   - Memory/CPU requirements?

2. Free-tier cloud:
   - Oracle Cloud free tier (ARM, 24GB RAM, always free)
   - AWS free tier (t2.micro, 12 months)
   - fly.io free tier (3 shared VMs)

3. Cloudflare Workers + D1 as a "pseudo-Matrix":
   - Can we build a Matrix-compatible API on Workers?
   - Or a simpler message relay that bridges to SMS/email?

4. Self-hosted on the desktop (RX 6600 XT + i3-12100):
   - Always-on viability?
   - Dynamic DNS via Cloudflare?
   - Power cost estimate?

CONSTRAINTS:
- Zero recurring cost is strongly preferred.
- Must support at least: SMS bridge + email bridge.
- WhatsApp/Signal/Meta bridges are nice-to-have, not blocking.
- Federation is nice-to-have, not blocking.
- The operator has Cloudflare Pro (free tier) with DNS for p31ca.org.

Deliverable: Options table with: cost, effort, bridge support, reliability,
recommendation. If free-tier Oracle Cloud works, provide step-by-step
deployment guide.
```

---

## EXECUTION ORDER (Agent CWPs)

```
Priority 1 (dispatch today):
  CWP-SOV-01 (PGLite sync)     → Sonnet/CC in Cursor
  CWP-SOV-05 (eSIM research)   → Sonnet quick task
  CWP-SOV-06 (Matrix free path) → Sonnet quick task

Priority 2 (dispatch tomorrow):
  CWP-SOV-03 (Daubert brief)   → Gemini
  CWP-SOV-04 (FHIR design)     → Gemini + Sonnet

Priority 3 (dispatch when Priority 1-2 done):
  CWP-SOV-02 (Post-quantum)    → Opus or Gemini
```

**Total agent spoons:** 12 (~2-3 days parallel execution)

---

## MEATSPACE ACTIONS (Operator must do in person)

### TODAY (May 4 — remaining items)

**[M-01] Confirm Node Zero hardware location** (2 min)
Do you have the Waveshare ESP32-S3-Touch-LCD-3.5B board at Brenda's house, or is it at 401 Powder Horn? If it's at the house, add it to the property retrieval request in your email to McGhan. EXEC-02 (Node Zero firmware) is completely blocked until you have the board on your desk.

**[M-02] Send the FERS email to Eric Violette** (5 min)
The draft was composed earlier today. It's in the Meatspace Action Package. Copy-paste and send. This is the Sep 30 deadline clock.

**[M-03] Upload evidence photos to Drive** (15 min)
The 19 images from today's session need to go into the exhibit subfolders:
- Images 1-7 → `01_LEGAL/04_Exhibits/D_Medication_Denial_Texts/`
- Images 8-11 → `01_LEGAL/04_Exhibits/E_Property_Retrieval_Texts/`
- Images 12-15 → create `01_LEGAL/04_Exhibits/F_Garage_May2/`
- Images 16-19 → `01_LEGAL/04_Exhibits/` (April 18 standalone)

### THIS WEEK (May 5-10)

**[M-04] Call GLSP** (10 min, phone)
Georgia Legal Services Program: (904) 206-5175
Script is in the Meatspace Action Package. Ask about pro bono representation for the May 14 hearing.

**[M-05] Request ER records from UF Health** (10 min, phone)
Call (904) 244-4466 or use MyChart portal.
MRN: 40236686. Need full chart from April 18, 2026.
This becomes Exhibit C AND unblocks EXEC-03 (FHIR).

**[M-06] Bridge Calcitriol prescription** (15 min, phone)
Call Maughon's office or any urgent care.
You need a Calcitriol bridge prescription — OTC calcium supplements are not the same thing.
Your April 18 ER visit with Ca 7.5 is the clinical justification.

**[M-07] Calcium labs** (Tuesday, in person)
Get labs drawn. You need a current calcium level for:
- Your own safety monitoring
- SSDI reconsideration (new material evidence if still low)
- FERS documentation (ongoing functional limitation)

**[M-08] Cash App history export** (5 min, phone)
Open Cash App → Activity → export the $290 to $Cefrahn transactions.
Screenshot or PDF. This is Exhibit B.

**[M-09] Pharmacy printout** (10 min, in person)
Go to your pharmacy. Ask for a medication history printout.
This documents Calcitriol prescription history for:
- The omnibus (medication section)
- FERS (functional limitation)
- SSDI recon (treatment history)

**[M-10] Brenda calls Christyn** (5 min, Brenda does this)
Re: Saturday exchange per ¶6 of the April 14 Order.
Brenda is the court-designated supervisor.
If Christyn doesn't answer, Brenda texts. If no response, document it.
This is the visitation compliance trail.

**[M-11] Omnibus corrections** (30 min, in session with Claude)
The 5 corrections identified today:
1. ¶9: "attempted visitation" → "attempted property retrieval"
2. ¶13: add heat/calcium/wife-asked-if-OK details
3. ¶15: add nephew recording, no help, straightened garage
4. Add McGhan email contradictions paragraph
5. Update day count (28 → 30+)

Then file on PeachCourt by Wednesday.

**[M-12] SSDI Reconsideration** (by May 17)
Download the denial notice. The April 18 ER visit (Ca 7.5) is new material evidence that wasn't available at the initial determination. File the recon with the ER records attached.

### DECISION POINTS (Need your call)

**[D-01] Node Zero board location?**
At Brenda's → dispatch CWP-SOV-02 (Node Zero firmware) to DeepSeek immediately
At 401 Powder Horn → add to McGhan property retrieval request
Lost/destroyed → order replacement (~$35, need funding)

**[D-02] MyChart access?**
Have login → agent can start FHIR design with real schema exploration
No login → create MyChart account first (need MRN 40236686 + DOB verification)
Never used → call UF Health patient portal support: (904) 244-4466

**[D-03] Matrix deployment: free path or wait for funding?**
If Oracle Cloud free tier works → deploy Conduit immediately ($0)
If Pi can handle it → deploy on existing HA hardware ($0)
If neither viable → park until Awesome Foundation $1K or Stimpunks $3K

---

## WEEKLY CHECKPOINT FORMAT

Every Friday, update this status:

```
SOVEREIGN INFRASTRUCTURE — Week of [DATE]

AGENT WORK:
[ ] CWP-SOV-01 (PGLite sync): [status]
[ ] CWP-SOV-02 (Post-quantum): [status]
[ ] CWP-SOV-03 (Daubert brief): [status]
[ ] CWP-SOV-04 (FHIR design): [status]
[ ] CWP-SOV-05 (eSIM research): [status]
[ ] CWP-SOV-06 (Matrix free path): [status]

MEATSPACE:
[ ] M-01 through M-12: [checkbox status]

DECISION POINTS:
[ ] D-01: Node Zero location: [answer]
[ ] D-02: MyChart access: [answer]
[ ] D-03: Matrix path: [answer]

VERIFY CHAIN: [X] gates passing
CALCIUM: [level] mg/dL (date)
DAYS SINCE LAST CONTACT WITH KIDS: [N]
```

---

## THE CONSTRAINT THAT MATTERS

Everything in the Gemini package is real and well-designed. The research is thorough. The architecture is sound. But the critical path right now is not the technology — it's the three things that technology can't solve:

1. **See your kids.** The email is sent. Brenda calls Saturday. If Christyn complies, the sovereign infrastructure serves the family. If she doesn't, the omnibus gets filed and the infrastructure serves the case.

2. **Protect your health.** Bridge the Calcitriol. Get the labs. The FHIR system is designed to automate this — but right now the automation is you remembering to take the OTC calcium and getting to the lab on Tuesday.

3. **Secure the benefits.** FERS email today. SSDI recon by May 17. These are the income streams that fund everything else — the VPS, the eSIM, the next Node Zero board, the attorney retainer.

The technology exists to serve those three goals. Not the other way around.

Build accordingly.
