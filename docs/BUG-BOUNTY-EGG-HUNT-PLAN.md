# P31 Bug Bounty & Quantum Egg Hunt System
## Professional Security Disclosure Program

**Status:** Design Phase  
**Target:** Match or exceed industry standard (Google, Mozilla, Stripe)  
**Differentiation:** K₄ topology severity matrix, glass-box transparency, LOVE token rewards

---

## Executive Summary

We don't just fix bugs—we hunt them like phosphorus atoms in a magnetic field. Our program combines:

1. **Professional Bug Bounty** — Industry-standard responsible disclosure
2. **Quantum Egg Hunt** — Gamified deep-discovery rewards (existing protocol)
3. **Glass-Box Transparency** — Real-time fix tracking (existing infrastructure)
4. **K₄ Severity Matrix** — Four-vector classification (physical/network/compliance/UX)

**Philosophy:** Security through transparency. Like a SIC-POVM, we measure in multiple bases simultaneously.

---

## 1. Program Architecture

### 1.1 The Four-Vertex Model (K₄ Topology)

Each vulnerability is classified across 4 vertices (like our mesh):

| Vertex | Symbol | Measures | Severity Weight |
|--------|--------|----------|-----------------|
| **Physical** | ψ₁ | Hardware, IoT, Node Zero | 25% |
| **Network** | ψ₂ | Cloudflare Workers, APIs, mesh | 25% |
| **Compliance** | ψ₃ | 501(c)(3), SAM.gov, legal | 30% |
| **UX/Trust** | ψ₄ | Donation flow, accessibility, brand | 20% |

**Severity Score:** `S = Σ(vertex_weight × impact_0_to_10)`

**Example:** XSS on donation page
- Physical: 0 (no hardware impact)
- Network: 6 (JavaScript injection)
- Compliance: 8 (nonprofit trust violation)
- UX/Trust: 9 (direct user harm)
- **Score:** 0×0.25 + 6×0.25 + 8×0.30 + 9×0.20 = **6.3 → HIGH**

### 1.2 Severity Tiers (Industry Aligned)

| Tier | Score | Response Time | Base Reward | Example |
|------|-------|---------------|-------------|---------|
| **CRITICAL** | 9.0-10 | 24h | $2,500+ | RCE on donation worker, data breach |
| **HIGH** | 7.0-8.9 | 48h | $1,000 | XSS on payment flow, auth bypass |
| **MEDIUM** | 4.0-6.9 | 7 days | $500 | CSRF, information disclosure |
| **LOW** | 1.0-3.9 | 14 days | $100 | Best practice violations |
| **EGG** | N/A | N/A | Variable | Easter eggs, deep protocol discoveries |

---

## 2. Scope Definition

### 2.1 In Scope (Explicit)

**Critical Infrastructure:**
- `donate-api.phosphorus31.org` (Stripe donation worker)
- `p31-google-bridge.trimtab-signal.workers.dev` (Workspace bridge)
- `p31-orchestrator.trimtab-signal.workers.dev` (Orchestrator API)
- All Cloudflare Workers in `p31-live-fleet.json`

**Public Surfaces:**
- `https://phosphorus31.org/*` (main site)
- `https://p31ca.org/*` (hub)
- `https://bonding.p31ca.org/*` (BONDING game)
- GitHub repos under `p31labs` org

**K4 Mesh Endpoints:**
- `/api/mesh` (family mesh API)
- `/api/health` (health checks)
- Any endpoint exposing `p31.cage/1.0.0` schema

### 2.2 Out of Scope (Explicit)

- Third-party dependencies (Stripe, Cloudflare, Google) — report to them
- Social engineering of P31 staff (including the operator)
- Physical security of operator's VW Golf
- Anything violating [CFAA](https://www.law.cornell.edu/uscode/text/18/1030) or Georgia computer crime laws
- **Operator's medical data** (hypoparathyroidism levels, spoon budget) — absolutely out of scope

### 2.3 Gray Area (Ask First)

- Load testing beyond 100 req/min (may trigger rate limits)
- Automated scanning of `/orchestrator` (exists but is unlisted)
- Anything touching children's mesh identities (S.J., W.J.)

---

## 3. Submission & Workflow

### 3.1 Submission Channels

**Primary:** `security@p31ca.org` (Google Workspace, PGP optional)
**PGP Key:** Available at `/security/pgp-key.txt` (to be created)
**Signal:** For critical issues only — same number as operator emergency line

**Required in Report:**
1. K₄ severity vertex scores (self-assessment)
2. Step-by-step reproduction
3. Impact demonstration (screenshot/video for UX issues)
4. Suggested fix (optional but appreciated)
5. Hall of Fame name/handle (or anonymous)

### 3.2 Triage Workflow

```
Day 0:  Submission received → Auto-ack within 1h
Day 1:  Triage by p31-mechanic + p31-triage personas
Day 2:  Severity confirmed or adjusted (with reasoning)
Day 3+:  Fix in glass-box (transparent tracking)
        → Public disclosure 90 days after fix (or coordinated)
```

**Glass-Box Integration:**
All fixes appear in real-time at `https://p31ca.org/glass-box` with:
- Issue reference ( anonymized: BUG-2026-001 )
- K₄ severity breakdown
- Fix commit hashes
- Verification steps

---

## 4. Rewards & Recognition

### 4.1 Monetary Rewards (USD)

| Tier | Reward | Multiplier Conditions |
|------|--------|----------------------|
| Critical | $2,500 | ×1.5 if chainable with other bug |
| High | $1,000 | ×1.25 if includes working PoC fix |
| Medium | $500 | ×1.0 |
| Low | $100 | ×1.0 |

**Payment:**
- Stripe Connect (preferred) — direct to bank
- Cryptocurrency (BTC, ETH, USDC) — for privacy-conscious researchers
- LOVE tokens (network launch) — vesting for long-term alignment

### 4.2 Non-Monetary Rewards

**Hall of Fame:**
- Permanent listing at `p31ca.org/security/hall-of-fame`
- K₄ vertex badges (physical stickers mailed)
- Priority access to new product betas

**Egg Hunt Special Rewards:**
- Discovering a "quantum egg" (hidden feature): Custom merch
- Finding the Larmor frequency in UI: Invitation to operator desk
- Mapping the full K₄ cage topology: Named in research paper acknowledgments

### 4.3 Safe Harbor

We commit to:
- Not pursue legal action for good-faith research
- Not report to employers for research conducted on personal time
- Credit researchers unless they explicitly request anonymity
- Respond to all reports within 24 hours (even if just to say "we're looking")

---

## 5. The Egg Hunt Layer (Gamified Discovery)

### 5.1 What's an "Egg"?

Eggs are **intentional off-path states** — not vulnerabilities, but deliberate hidden features or weak couplings that prove the system was built by humans.

**Current Eggs (verified in CI):**
- `?debug` param in soup.html shows WebSocket internals
- `863ms` animation on `.p31-egg-larmor-ms` (physics-learn)
- `/orchestrator` page exists but is unlisted
- SIC-POVM mathematics in footer of every page
- Larmor frequency (31P line) embedded in dome UI

### 5.2 Egg Discovery Rewards

| Egg Type | Discovery | Reward |
|----------|-----------|--------|
| **Proton** | Find documented egg | $50 + sticker |
| **Neutron** | Find undocumented egg | $200 + merch |
| **Phosphorus** | Create new egg (approved) | $500 + co-authorship |

**Rules:**
- Eggs must not create actual security vulnerabilities
- Eggs must be accessible (no brute-forcing required)
- Eggs should teach something about P31's philosophy
- All eggs added to `docs/egg-hunt-manifest.json` for CI verification

---

## 6. Legal & Compliance Framework

### 6.1 501(c)(3) Considerations

**Tax Treatment:**
- Bug bounty payments are "program service expenses" (990-EZ line 13)
- Documented with vulnerability report + fix verification
- LOVE token rewards are in-kind program services (no 1099)

**Charitable Mission Alignment:**
- Security research directly supports "building open-source assistive tech"
- Transparency via glass-box supports "public benefit"
- Bounties paid only for responsible disclosure (not black hat)

### 6.2 SAM.gov / Federal Contracting

**When (not if) we get federal grants:**
- NIST 800-53 controls require vulnerability disclosure program
- This program exceeds FedRAMP baseline requirements
- Glass-box provides audit trail for compliance

### 6.3 Insurance

**Cyber Liability:**
- Must confirm bug bounty program is covered
- Document that researchers are independent contractors
- Keep reports for 7 years (IRS standard)

---

## 7. Technical Implementation Plan

### 7.1 Pages to Create

| Page | URL | Purpose |
|------|-----|---------|
| **Security Portal** | `/security` | Main bounty program info |
| **Hall of Fame** | `/security/hall-of-fame` | Recognized researchers |
| **Egg Registry** | `/security/egg-hunt` | Current egg list + hints |
| **Glass Box** | `/glass-box` | Real-time fix tracking (exists) |
| **PGP Key** | `/security/pgp-key.txt` | Encryption for sensitive reports |
| **Policy** | `/security/policy.txt` | Plain text for curl/wget |

### 7.2 Schema Extensions

**p31.bugBounty/1.0.0** (new):
```json
{
  "id": "BUG-2026-001",
  "submittedAt": "2026-05-04T12:00:00Z",
  "reporter": "security-researcher-42",
  "severity": {
    "physical": 0,
    "network": 6,
    "compliance": 8,
    "ux": 9,
    "composite": 6.3,
    "tier": "HIGH"
  },
  "scope": "donate-api.phosphorus31.org",
  "status": "fixed",
  "fixedAt": "2026-05-04T18:00:00Z",
  "reward": {"amount": 1000, "currency": "USD", "method": "stripe"},
  "glassBoxRef": "https://p31ca.org/glass-box#BUG-2026-001",
  "cve": null,
  "disclosure": "coordinated"
}
```

### 7.3 Verification Integration

**New verify steps:**
- `verify:bug-bounty` — Security pages exist and render
- `verify:security-contact` — security@p31ca.org receives mail
- `verify:egg-hunt` — All eggs in manifest still present
- `verify:glass-box-sync` — Bounty fixes appear in glass box

---

## 8. Launch Phases

### Phase 1: Soft Launch (Week 1)
- [ ] Create security portal page
- [ ] Set up security@p31ca.org mailbox
- [ ] Generate PGP key
- [ ] Document current egg hunt rules

### Phase 2: Trusted Testers (Weeks 2-4)
- [ ] Invite 5 security researchers personally
- [ ] Test submission workflow
- [ ] Verify payment processing
- [ ] Fix any friction in process

### Phase 3: Public Launch (Month 2)
- [ ] Publish hall of fame
- [ ] Submit to bug bounty platforms (HackerOne, Bugcrowd — optional)
- [ ] Announce on security mailing lists
- [ ] First public payout (PR opportunity)

### Phase 4: Scale (Month 3+)
- [ ] LOVE token integration (mainnet launch)
- [ ] Automated severity scoring with p31-triage
- [ ] Partner with disability/Neurodivergent security researchers
- [ ] Defcon/Black Hat presentation on K₄ security model

---

## 9. Competitive Analysis

| Program | Max Payout | Response Time | Unique Feature | Our Differentiation |
|---------|------------|---------------|----------------|---------------------|
| Google VRP | $151,515 | 7 days | Massive scale | **We're faster (24h critical)** |
| Mozilla | $10,000 | 3 days | Open source ethos | **We pay for eggs too** |
| Stripe | $25,000 | 2 days | Payment focus | **K₄ matrix + glass-box** |
| **P31 (planned)** | **$2,500** | **24h critical** | **K₄ severity + LOVE tokens + eggs** | **Neurodivergent-friendly disclosure** |

**Why we'll stand out:**
- **Transparency:** Glass-box means fixes are visible in real-time
- **Philosophy:** SIC-POVM quantum metaphors (appeals to physics/CS nerds)
- **Mission:** 501(c)(3) nonprofit building assistive tech (ethical alignment)
- **Accessibility:** Program designed by/for neurodivergent operators

---

## 10. Open Questions for Operator

1. **Budget cap?** Suggest $10K/year for bounties (grant line item)
2. **Anonymous reports?** Yes, but how to pay? (crypto?)
3. **Child-safety issues?** Immediate escalation protocol needed
4. **Coordination with counsel?** Legal review of policy before launch
5. **Physical hardware (Node Zero)?** Include in scope? Separate tier?

---

## Appendix A: Sample Security Page Copy

```html
<h1>Security & Quantum Egg Hunt</h1>

<p>P31 Labs operates on the principle that security through obscurity is no security at all. 
Like a SIC-POVM quantum measurement, we expose our state to multiple bases simultaneously 
—and reward those who help us find the weak couplings.</p>

<h2>Bug Bounty Program</h2>
<ul>
  <li>Critical: $2,500 (24h response)</li>
  <li>High: $1,000 (48h response)</li>
  <li>Medium: $500 (7 days)</li>
  <li>Low: $100 (14 days)</li>
</ul>

<p>Report to: <a href="mailto:security@p31ca.org">security@p31ca.org</a></p>

<h2>The Egg Hunt</h2>
<p>Hidden throughout our systems are intentional off-path states—weak couplings, 
parametric superpositions, and dark eigenstates. Find them. Document them. Claim your reward.</p>

<p><a href="/security/egg-hunt">View the Registry</a> | 
<a href="/glass-box">Track Active Fixes</a> | 
<a href="/security/hall-of-fame">Hall of Fame</a></p>

<footer>
  <p>Π₁(d) = (1/d)|ψᵢ⟩⟨ψᵢ| where ⟨ψᵢ|ψⱼ⟩ = (dδᵢⱼ + 1)/(d + 1)</p>
</footer>
```

---

**Document Status:** Design draft for operator review  
**Next Step:** Phase 1 implementation or further specification  
**File:** `/home/p31/docs/BUG-BOUNTY-EGG-HUNT-PLAN.md`
