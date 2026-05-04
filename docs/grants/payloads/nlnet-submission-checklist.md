# NLnet NGI Zero Commons Fund — Submission Checklist
## P31 Labs, Inc. · k4 open family mesh protocol

**Deadline:** June 1, 2026 (27 days)  
**Amount Requested:** €15,000  
**Submission URL:** https://nlnet.nl/  
**Status:** ✅ Ready to submit

---

## Pre-submission Verification

### ✅ Entity Eligibility (Now Confirmed)
- [x] US 501(c)(3) public charity status — **DETERMINED May 4, 2026**
- [x] EIN 42-1888158 — verified with IRS
- [x] IRS determination letter scanned and ready to upload
- [x] Public charity status: 170(b)(1)(A)(vi)

### ✅ EU Eligibility Confirmation
- [ ] Email nlnet@nlnet.nl confirming US nonprofit eligibility
- [ ] Reference prior NLnet grants to non-EU entities (if any)
- [ ] Clarify if EU co-applicant required
- **Draft email:** `docs/grants/GRANT-CALENDAR-2026-v2.md` § Pre-drafted Email

---

## Application Components

### 1. Project Information
| Field | Value |
|-------|-------|
| **Project name** | k4 — open family mesh protocol for decentralized communication |
| **Requested amount** | €15,000 |
| **Project duration** | 6 months |
| **Code repository** | https://github.com/p31labs/andromeda |

### 2. Abstract (≤ 600 characters)
```
k4 is an open protocol for sovereign, decentralized family communication 
built on a complete-graph (K₄) topology. Four edge nodes — FORGE, COUNSEL, 
SCHOLAR, SCRIBE — form a tetrahedron. All communication is signed with 
Ed25519. No central server owns the mesh. The protocol includes a signed 
dock protocol, federation dispatch layer for P2P hub routing, and 
guardian-gated minor vertex activation. This grant funds the open 
specification so others can implement compatible hubs without depending 
on our infrastructure.
```
**Character count:** 598 ✅

### 3. Problem Statement
**Source:** `docs/grants/nlnet-ngi-zero-commons-application.md` § Describe what the problem is

Key points:
- Separated parent with AuDHD + hypoparathyroidism
- Surveillance-capitalism family apps harvest children's behavioral data
- No open-protocol alternative exists
- k4 is production-running code; specification doesn't exist yet
- Goal: RFC-style spec + test vectors so others can implement

### 4. Beneficiaries
**Source:** `docs/grants/nlnet-ngi-zero-commons-application.md` § Describe who will benefit

1. Separated families (tens of millions globally)
2. Neurodivergent families (AuDHD/autism communication needs)
3. Developers building decentralized communication tools

### 5. Technical Description
**Source:** `docs/grants/nlnet-ngi-zero-commons-application.md` § Describe the project

Protocol surface:
- `POST /v1/dock` — Ed25519 signed envelope
- `POST /v1/{hub}/call` — signed skill invocation
- `GET /v1/topology` — K₄ adjacency map
- `POST /v1/federation/peer` — signed peer registration
- `POST /v1/federation/dispatch` — P2P signed dispatch
- `POST /v1/family/dock` — guardian-signed minor vertex activation
- `WS /v1/{hub}/stream` — hibernatable WebSocket

Signing format (canonical pipe-delimited):
```
dock:       publicKey|ts|nonce|path
call:       publicKey|ts|nonce|hub|skillId
anchor-pact: publicKey|ts|nonce|pactId|payload
peer-dispatch: instanceId|ts|nonce|targetHub|skillId|payload
family-dock: operatorPublicKey|ts|nonce|vertexId|guardianToken
```

### 6. Budget Breakdown
| Deliverable | Hours | Rate | Amount |
|-------------|-------|------|--------|
| Protocol spec document | 80h | €75/h | €6,000 |
| Test vector suite | 40h | €75/h | €3,000 |
| Reference implementation cleanup | 40h | €75/h | €3,000 |
| Federation protocol hardening | 20h | €75/h | €1,500 |
| Review, editing, publication | 20h | €75/h | €1,500 |
| **Total** | **200h** | | **€15,000** |

### 7. Competing Approaches
**Source:** `docs/grants/nlnet-ngi-zero-commons-application.md` § Describe any competing approaches

Differentiation:
- Signal/Matrix/XMPP: point-to-point; no family mesh concept
- Proprietary family apps (TalkingParents, OurFamilyWizard): surveillance products
- ActivityPub/Fediverse: not designed for private family mesh

k4 is unique in: (a) K₄ topology invariant, (b) guardian-gated minor vertices, (c) structured skill dispatch, (d) federation peer dispatch

---

## Supporting Documents (Ready to Upload)

| Document | Location | Status |
|----------|----------|--------|
| IRS 501(c)(3) Determination Letter | Google Workspace / Grants / IRS-501c3-Determination-2026-05-04.pdf | ✅ Ready |
| IRS CP-575E (EIN) | Google Workspace / Grants / IRS-CP575E-42-1888158.pdf | ✅ Ready |
| GA SOS Certificate | Google Workspace / Grants / GA-SOS-Certificate-26082141.pdf | ✅ Ready |
| SAM.gov UEI | Google Workspace / Grants / SAM-UEI-NQKVWH6AKB58.pdf | ✅ Ready |
| Board Resolution (Grant Authority) | Google Workspace / Board / | 📝 Pending signature |

---

## Live Verification Links

NLnet reviewers can verify the running implementation:

| Endpoint | URL | What it shows |
|----------|-----|---------------|
| Manifest | https://k4-agent-hub.trimtab-signal.workers.dev/v1/manifest | Service info |
| Topology | https://k4-agent-hub.trimtab-signal.workers.dev/v1/topology | Live K₄ graph |
| Federation | https://k4-agent-hub.trimtab-signal.workers.dev/v1/federation | Peer registry |
| Public surface | https://p31ca.org/agents | Human-readable hub |

---

## Submission Steps

1. [ ] Confirm EU eligibility via email to nlnet@nlnet.nl
2. [ ] Create NLnet account at https://nlnet.nl/
3. [ ] Navigate to NGI Zero Commons Fund application
4. [ ] Copy abstract (598 chars) into project summary
5. [ ] Upload supporting documents (IRS determination, EIN, GA SOS)
6. [ ] Enter budget breakdown (€15,000 total)
7. [ ] Provide live endpoint URLs for verification
8. [ ] Submit before June 1, 2026

---

## Post-Submission

- [ ] Save confirmation email/receipt
- [ ] Add to `docs/grants/grant-pipeline-v2.json` as "submitted_awaiting_decision"
- [ ] Set calendar reminder for 30-day follow-up
- [ ] Update `p31-constants.json` if any funder-specific fields required

---

**Canonical source:** `docs/grants/nlnet-ngi-zero-commons-application.md`  
**Submission checklist:** `docs/grants/payloads/nlnet-submission-checklist.md`  
**Last updated:** 2026-05-04
