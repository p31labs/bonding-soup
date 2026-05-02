# Incident Response Runbook

**When to use:** any P0–P3 incident.
**Owner:** Incident Commander (operator unless incapacitated; then Vice-Chair).
**Pre-requisite reading:** `risk.json` → `incidentResponse`, `riskRegister`.

---

## Severity classes

| Class | Examples | Response SLA |
|---|---|---|
| **P0** | Data breach, payment fraud, operator medical emergency, active legal threat | Immediate |
| **P1** | Service outage, security vuln with active exploit, missed regulatory deadline | 24h |
| **P2** | Non-active vuln, contractual breach, formal donor complaint | 72h |
| **P3** | Minor bug, doc inaccuracy, low-impact dispute | 2 weeks |

---

## P0 — Immediate response

### Data breach (donor PII compromise)

**Within 1 hour:**
1. Contain — revoke compromised credentials, rotate keys, isolate affected systems
2. Document — start incident log: who/what/when/scope
3. Preserve evidence — do not delete logs

**Within 24 hours:**
4. Assess scope — exact records affected, what data fields
5. Notify board chair + legal counsel
6. Notify cyber insurance (if policy in force)

**Within 72 hours (GDPR Article 33):**
7. Notify EU DPA if any EU data subjects affected
8. Notify state AG of any affected state's residents (each state has different rules)
9. Notify affected individuals (email + public notice on `/privacy/incidents/`)

**Post-incident:**
10. Root cause analysis (no-blame, written, public-facing redacted version)
11. Mitigation plan (with deadline)
12. Update `risk.json` with new mitigation
13. Board review at next meeting

### Payment fraud (Stripe charge dispute / pattern)

**Within 1 hour:**
1. Pause new donations on suspect endpoint
2. Review Stripe Radar logs
3. Document fraudulent transactions

**Within 24 hours:**
4. Issue refunds for confirmed fraud
5. Cooperate with Stripe investigation
6. Notify board treasurer

**Post-incident:**
7. Update Stripe Radar rules
8. Review fraud detection thresholds
9. Update `donor-policy.json` if policy change needed

### Operator medical emergency

**Trigger:** operator hypoparathyroidism crisis, hospitalization > 72h, or any condition preventing operator function.

**Within 1 hour (if known to family/board):**
1. Family notifies Vice-Chair (when seated) or Treasurer + Secretary jointly
2. Activate `governance.json` `successionPlanning.operatorMedicalContingency`
3. No public announcement until operator or family directs

**Days 1–7:**
4. Operations continue under Vice-Chair's authority
5. No policy changes; no funds movement > $1000
6. External commitments paused; deadlines flagged for extension

**Day 7+:**
7. Board meeting to assess: continued continuity vs. extended pause
8. Public statement if revenue/grants depend on visible activity
9. Continued operations for up to 90 days under continuity authority

**Day 90+:**
10. Full board meeting to assess: continue, transfer to allied org, or wind down
11. Bylaws govern dissolution clause if needed

### Active legal threat (lawsuit, AG inquiry, etc.)

**Within 1 hour:**
1. Stop responsive communication beyond acknowledgment
2. Preserve all records (legal hold)
3. Notify counsel-of-record

**Within 24 hours:**
4. Counsel reviews complaint/inquiry
5. Board chair notified (executive session if board meets soon)
6. D&O insurance notified (within policy notice period — usually immediate)

**Public posture:**
- Decline comment until counsel advises otherwise
- Do not delete or modify records (spoliation risk)
- Brief board only; board members do not comment publicly

---

## P1 — 24-hour response

### Service outage (Cloudflare, Stripe, etc.)

```bash
# 1. Confirm scope
# 2. Status page update (if affecting donors)
# 3. Workaround if available
# 4. Communicate with provider
# 5. Wait for resolution
# 6. Post-mortem if > 4h impact
```

### Security vulnerability (active exploit)

1. Assess: is exploit currently active, or theoretical?
2. If active: P0 escalation
3. If theoretical: patch + disclose per `risk.json` `securityDisclosure` SLA

### Missed regulatory deadline

```bash
# 1. File ASAP (most agencies accept late filing with penalty)
# 2. Document why missed
# 3. Update compliance.json with new submission date
# 4. Pay any late fee
# 5. Update filing calendar to prevent recurrence (e.g., earlier reminder)
```

---

## Communication discipline

### What we say publicly during an incident

- Acknowledge the incident exists
- State what is and is not affected
- State what we're doing
- State when we'll update next
- **Never:** speculate, blame, or minimize

### What we say internally

- Full detail, no euphemism
- Honest about what we don't know
- Document everything for post-mortem

### What we say to regulators

- Exactly what's required by statute, no more, no less
- Through counsel when complexity warrants
- Honest, complete, timely

---

## Post-incident discipline (every P0 and P1)

Within 7 days of resolution:

1. **Written post-mortem** (no-blame format):
   - Timeline (UTC)
   - Root cause
   - Why our defenses didn't catch it
   - What we did to contain
   - What we'll change

2. **Risk register update** (`risk.json`):
   - Add risk if novel, increase likelihood if existing
   - Update mitigation status

3. **Public-facing redacted summary:**
   - Posted to `/privacy/incidents/` for data incidents
   - Posted to `/security-disclosure/` for security incidents
   - Linked from next quarterly board minutes

4. **Insurance follow-up:**
   - File claim if covered
   - Update coverage if gap revealed

---

## Tabletop exercises

The board should run a tabletop exercise annually for at least one P0 scenario. Choose from `risk.json` `riskRegister` — different one each year.

```bash
# Exercise template:
# scripts/nonprofit/templates/tabletop-exercise.md
# 90-minute board session; outside facilitator preferred
```

---

## Cross-references

- Risk register: `risk.json` `riskRegister`
- Insurance policies: `risk.json` `insurance`
- Security disclosure: `risk.json` `securityDisclosure`
- Privacy/breach notification: `legal.json` `privacy.breachNotificationProtocol`
- Operator medical context: `cognitive-passport/` (operator's own passport informs response calibration)
