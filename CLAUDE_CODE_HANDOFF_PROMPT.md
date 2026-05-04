# Handoff Prompt: P31 Bug Bounty & Quantum Egg Hunt System

## For: Claude Code Review and Implementation
## From: Previous Session (Operator: W.J.)
## Date: 2026-05-04
## Priority: P1 (Post-501(c)(3) Determination)

---

## Executive Brief

Implement a **professional-grade security disclosure program** that matches or exceeds industry standards (Google, Mozilla, Stripe) while leveraging P31's unique K₄ architecture and glass-box transparency infrastructure.

**Reference Document:** `docs/BUG-BOUNTY-EGG-HUNT-PLAN.md` (read this first)

---

## Context You Must Know

### 1. P31 Organizational State
- **Status:** 501(c)(3) determined active (May 4, 2026)
- **EIN:** 42-1888158
- **Domain:** p31ca.org (Google Workspace configured)
- **Operator:** AuDHD with hypoparathyroidism — requires direct, structured communication
- **Mission:** Build, Create, Connect — decentralized family mesh

### 2. Existing Infrastructure (Do Not Break)
- **Glass Box:** `p31ca.org/glass-box` — real-time transparency system
- **Egg Hunt:** Already running with `docs/egg-hunt-manifest.json` and CI verification
- **Larmor Frequency:** 121.465 MHz (31P nuclear line) — locked in `p31-constants.json`
- **K₄ Mesh:** Four-vertex topology (will/sj/wj/christyn) — use for severity classification
- **Design System:** `p31-universal-canon.json` — Atkinson Hyperlegible font, teal (#25897d), cyan

### 3. Critical Constraints
- **Legal:** 501(c)(3) public charity — all expenses must be "program services"
- **Security:** Never expose operator's medical data (spoon budget, calcium levels)
- **Children:** S.J. (9) and W.J. (6) mesh identities — absolutely out of scope
- **Budget:** Suggest $10K/year cap for bounties

---

## Implementation Requirements

### Phase 1: Foundation (Must Complete)

#### 1.1 Security Portal Page
**File:** `phosphorus31.org/website/security/index.html`

**Must Include:**
- Hero section with P31 branding and SIC-POVM formula in footer
- Bug bounty tier table (Critical $2,500 → Low $100)
- K₄ severity matrix explanation (4 vertices: physical/network/compliance/UX)
- Contact: `security@p31ca.org` with mailto link
- PGP key download (create new key or placeholder)
- Safe harbor statement (no legal action for good-faith research)
- Link to existing `/glass-box` for transparency
- Footer with EIN 42-1888158 and "Determination May 2026"

**Design Requirements:**
- Use Atkinson Hyperlegible font (already in styles.css)
- Dark void (#0f1115) or light paper (#faf9f6) per p31-universal-canon
- Skip-link for accessibility
- Responsive (mobile-first)

#### 1.2 PGP Key Setup
**File:** `phosphorus31.org/website/security/pgp-key.txt`

**Options:**
- A) Generate real PGP key for `security@p31ca.org` (preferred)
- B) Placeholder with instructions for requesting key

**If generating:**
- Key ID should be memorable (e.g., first 8 chars of P31 Labs hash)
- Expire in 2 years (2028)
- Post to key servers (keys.openpgp.org)

#### 1.3 Google Workspace Mailbox
**Action Required:**
- Create `security@p31ca.org` in Google Admin Console
n- Set up auto-responder acknowledging receipt within 1 hour
- Forward to operator primary email with [SECURITY] prefix
- Document in `p31-constants.json` → `contact.securityEmail`

**Auto-Responder Template:**
```
Subject: [P31 Security] Report Received — BUG-2026-XXX

Thank you for contacting P31 Labs Security.

Report ID: BUG-2026-XXX (auto-generated)
Severity: [PENDING TRIAGE]
Response SLA: See https://p31ca.org/security#response-times

We commit to:
- Initial response within 24 hours
- Severity confirmation within 48 hours
- Fix tracking in glass-box (public)
- Safe harbor for good-faith research

Next steps:
1. Automated triage by p31-triage persona
2. Manual review by security team
3. You'll receive severity classification and timeline

For critical issues (active exploitation), reply URGENT.

— P31 Security Team
Π₁(d) = (1/d)|ψᵢ⟩⟨ψᵢ|
```

#### 1.4 Plain-Text Policy
**File:** `phosphorus31.org/website/security/policy.txt`

**Purpose:** For researchers using `curl`/`wget` in terminal

**Content Structure:**
- Program overview (5 lines max)
- In-scope domains (bullet list)
- Out-of-scope (ABSOLUTELY NOT: children, medical data, physical safety)
- Submission: `security@p31ca.org`
- PGP fingerprint
- Safe harbor statement
- Larmor frequency Easter egg (hidden at bottom as signature)

### Phase 2: Recognition System (Should Complete)

#### 2.1 Hall of Fame
**File:** `phosphorus31.org/website/security/hall-of-fame.html`

**Structure:**
- Table: Reporter | Finding | Severity | Date | Reward (if public)
- Option for anonymous entries ("Security Researcher")
- K₄ vertex badges for each researcher (earned by finding in each category)
- Link to full glass-box for detailed fix tracking

**Sample Entries (for design):**
```
| trimtab.signal | BUG-001: Missing CSP header | MEDIUM | 2026-05-04 | $500 |
| researcher-42  | BUG-002: XSS on donate | HIGH | 2026-05-03 | $1,000 |
```

#### 2.2 Egg Hunt Registry
**File:** `phosphorus31.org/website/security/egg-hunt.html`

**Purpose:** Document existing eggs without spoiling all surprises

**Structure:**
- "The Registry" — list of known/documented eggs (from `docs/egg-hunt-manifest.json`)
- "The Hints" — cryptic clues for undocumented eggs
- "Submit Discovery" — form/email for claiming egg rewards
- Reward tiers: Proton ($50), Neutron ($200), Phosphorus ($500)

**Hint Examples:**
- "The phosphorus atom resonates at a specific frequency in magnetic fields."
- "The orchestrator sees all but is seen by few."
- "Debug mode reveals the inner workings of bonding."

### Phase 3: Integration (Nice to Have)

#### 3.1 Constants Update
**File:** `p31-constants.json`

**Add:**
```json
"security": {
  "programLaunched": "2026-05-04",
  "budgetAnnual": 10000,
  "currency": "USD",
  "email": "security@p31ca.org",
  "pgpFingerprint": "XXXX XXXX...",
  "responseTime": {
    "critical": "24h",
    "high": "48h",
    "medium": "7d",
    "low": "14d"
  },
  "scope": {
    "inScope": ["phosphorus31.org", "p31ca.org", "*.trimtab-signal.workers.dev"],
    "outOfScope": ["operator-medical", "children-mesh", "third-party"]
  }
}
```

**After editing:** Run `npm run apply:constants && npm run verify:constants`

#### 3.2 New Verify Steps
**File:** `scripts/verify-bug-bounty.mjs` (create)

**Checks:**
- Security portal renders without errors
- PGP key file exists and is valid ASCII-armored
- `security@p31ca.org` is documented in constants
- Hall of fame page exists
- All security pages have legal footer (EIN 42-1888158)
- Glass-box links are valid

**Add to package.json:**
```json
"verify:bug-bounty": "node scripts/verify-bug-bounty.mjs",
"verify:security": "npm run verify:bug-bounty && npm run verify:egg-hunt"
```

#### 3.3 Schema Definition
**File:** `contracts/p31.bugBounty.schema.json` (create)

**Schema:** `p31.bugBounty/1.0.0`

**Fields:**
- id (BUG-YYYY-NNN format)
- submittedAt (ISO8601)
- reporter (handle or "anonymous")
- severity (K₄ matrix: physical, network, compliance, ux, composite, tier)
- scope (domain/endpoint)
- status (received/triaged/fixed/disclosed)
- fixedAt (ISO8601, nullable)
- reward (amount, currency, method, txId nullable)
- glassBoxRef (URL)
- cve (nullable)
- disclosure (coordinated/full/responsible)

---

## Technical Specifications

### HTML/CSS Requirements
```html
<!-- All security pages must have: -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0f1115">
  <title>Security · P31 Labs</title>
  <!-- Atkinson Hyperlegible font -->
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;500;600;700&display=swap" 
        rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;500;600;700&display=swap" 
                  rel="stylesheet"></noscript>
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <!-- Content -->
  <footer class="footer-legal">
    P31 Labs, Inc. · Georgia 501(c)(3) · EIN 42-1888158 · Determination May 2026
  </footer>
</body>
</html>
```

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (full layout)

### Accessibility Requirements
- WCAG 2.1 AA minimum
- Skip-link on all pages
- ARIA labels on interactive elements
- Keyboard navigation for all tables
- Color contrast ≥ 4.5:1 for text

---

## Testing & Verification

### Manual Testing Checklist
- [ ] security@p31ca.org mailbox receives test email
- [ ] Auto-responder triggers correctly
- [ ] All pages load without console errors
- [ ] Responsive on iPhone SE (375px), iPad (768px), Desktop (1440px)
- [ ] Skip-link works with keyboard navigation
- [ ] All internal links valid (no 404s)
- [ ] PGP key downloads as .txt file
- [ ] Footer displays EIN correctly on all pages

### Automated Testing
```bash
# Run verification
npm run verify:bug-bounty

# Run full suite
npm run verify

# Run site tests (should still pass 207/207)
node tests/site/run-tests.mjs
```

---

## Deliverables Checklist

### Phase 1 (Required)
- [ ] `phosphorus31.org/website/security/index.html` (main portal)
- [ ] `phosphorus31.org/website/security/pgp-key.txt` (PGP public key)
- [ ] `phosphorus31.org/website/security/policy.txt` (plain text)
- [ ] `security@p31ca.org` mailbox configured in Google Workspace
- [ ] Auto-responder enabled

### Phase 2 (Strongly Recommended)
- [ ] `phosphorus31.org/website/security/hall-of-fame.html`
- [ ] `phosphorus31.org/website/security/egg-hunt.html`

### Phase 3 (Integration)
- [ ] `p31-constants.json` updated with security section
- [ ] `scripts/verify-bug-bounty.mjs` created
- [ ] `contracts/p31.bugBounty.schema.json` created
- [ ] `npm run verify:bug-bounty` passes

---

## Common Pitfalls to Avoid

1. **Don't hardcode secrets** — Even PGP key fingerprint goes in constants.json
2. **Don't promise SLAs we can't meet** — AuDHD operator has spoon budget limits
3. **Don't expose children** — S.J. and W.J. mesh identities are ABSOLUTELY out of scope
4. **Don't use dark patterns** — No "engagement" tricks. Direct communication only.
5. **Don't break glass-box** — All security fixes must appear in real-time transparency
6. **Don't skip accessibility** — Skip links, ARIA labels, keyboard nav are mandatory
7. **Don't forget legal footer** — EIN 42-1888158 on EVERY page

---

## Questions for Operator (Answer Before Implementation)

1. **Budget confirmation:** Is $10K/year acceptable, or different cap?
2. **Node Zero hardware:** Include in scope? (I recommend "not yet")
3. **Anonymous payments:** How to handle? (Crypto? Gift cards?)
4. **CVE assignment:** Do we want CVEs for publicity? (Or keep quiet?)
5. **Coordination:** Defcon/Black Hat announcement timeline?
6. **Counsel review:** Should legal review policy.txt before launch?

---

## Success Metrics

**Phase 1 Complete When:**
- Security portal loads at `phosphorus31.org/security/`
- Test email to security@p31ca.org receives auto-response within 1 hour
- PGP key valid and downloadable
- 207 site tests still passing

**Phase 2 Complete When:**
- Hall of fame shows sample entries (even if just us)
- Egg hunt registry lists 3+ documented eggs

**Phase 3 Complete When:**
- `npm run verify:bug-bounty` passes
- Schema validates with `p31.bugBounty/1.0.0`
- Constants.json updated and applied

---

## Emergency Escalation

**If you find a critical vulnerability during implementation:**
1. STOP immediately
2. Document with screenshot/git diff
3. Email operator directly: `will@p31ca.org` with [URGENT] prefix
4. Do NOT commit the vulnerability
5. Wait for operator response before continuing

---

## Philosophy Reminders

**From .cursorrules:**
- "Direct. Action over explanation. No submarine metaphors."
- "Never ask open-ended questions when you can execute."
- "If operator is in 'Spoon deficit', output terminal commands and code blocks only."

**From AGENTS.md:**
- "Start with P31-ROOT-MAP.md when picking directory to edit"
- "Run verify after any change"
- "Use live service bindings when available"

**From EGG-HUNT.md:**
- "Eggs are load-bearing play—curiosity on-ramps that cost no decision"
- "They prove there is still person left after risk, law, and medicine are served"

---

## Reference Files (Read These)

1. `docs/BUG-BOUNTY-EGG-HUNT-PLAN.md` — Full design document
2. `docs/EGG-HUNT.md` — Existing egg hunt protocol
3. `p31-constants.json` — Organizational constants
4. `phosphorus31.org/website/styles.css` — Design system
5. `phosphorus31.org/website/index.html` — Reference footer structure
6. `docs/SIC-POVM-K4-ARCHITECTURE.md` — Severity matrix philosophy

---

## Final Deliverable Format

When complete, provide:
1. List of created/modified files
2. Commit hash (if committed)
3. Verification output (`npm run verify:bug-bounty`)
4. Test results (`node tests/site/run-tests.mjs`)
5. Any questions or blockers encountered
6. Estimated time to complete Phase 2/3

---

**Ready to implement?** Start with Phase 1.1 (Security Portal Page) and work through the checklist.

**Questions?** Ask direct, specific questions. Avoid "what do you think about..." — instead "Should X be Y or Z?"

**Good luck. Make it professional. Make them jealous.**

— Previous Session, 2026-05-04
