# RUNBOOK: Successor Operator Designation

**Owner:** Operator (W.Johnson-001)  
**Entity:** P31 Labs, Inc. · EIN 42-1888158 · Georgia nonprofit · incorporated 2026-04-03  
**Status:** Satisfies `successor-operator-named` launch gate when off-repo package is completed and stored  
**Last reviewed:** 2026-05-01

---

## Purpose

This runbook defines the structure and process for naming a successor operator and documenting break-glass contacts. The actual filled package — containing real names, phone numbers, and access recovery paths — is stored **off-repo** (encrypted file, sealed envelope, or trusted password manager entry). This runbook is the in-repo reference for what the package must contain and how to activate it.

---

## Off-repo package: required contents

Complete the template at `docs/runbooks/SUCCESSOR-OPERATOR-PACKAGE.template.md`, fill in all fields, and store the result in **one or more** of these locations:

| Storage method | Notes |
|----------------|-------|
| Encrypted file (age, GPG, 1Password) | Decryption key stored separately from the file |
| Sealed envelope in physical safe | Notarized copy optional but recommended for legal weight |
| Trusted counsel's file | Lawyer holds as part of operating agreement or advance directive |
| Board officer (when board convenes) | Joseph Tyler Cisco or Brenda O'Dell as initial directors |

The package must be reachable within **4 hours** of an operator-unavailable event without requiring the operator's assistance.

---

## Roles defined in the package

### Primary Successor Operator
Single named individual who assumes full operational authority over P31 Labs systems and legal obligations if the primary operator (W.Johnson-001) is incapacitated, deceased, or voluntarily steps down.

**Required attributes:**
- Adult (18+), mentally competent, legally reachable
- Has or can obtain access to email and a computer within 24h of activation
- Understands or is willing to learn the mission (build, create, connect; decentralized family mesh)
- Not currently a party adverse to P31 Labs or its operator in any legal proceeding

**Their authorities upon activation:**
- Full Cloudflare account management (via break-glass credential recovery)
- GitHub organization owner rights
- Stripe account operator
- Authority to convene the P31 Labs board and make board-level decisions
- Authority to engage legal counsel on behalf of the entity

### Alternate Successor (optional, recommended)
Named in case the primary successor is also unavailable. Same attributes apply.

### Break-Glass Contacts (minimum 3, no maximum)
People who can be reached immediately in different emergency categories. Not necessarily operators — a break-glass contact may simply know where the sealed envelope is or can reach the successor operator on short notice.

---

## Break-glass tiers

### Tier 1 — Reachable within 2 hours (medical or acute emergency)

These contacts are called first. They may not have technical access; their role is to locate and activate the successor operator and provide immediate human support.

| Field | Content |
|-------|---------|
| Name | [FILL] |
| Relationship | [FILL] |
| Primary phone | [FILL] |
| Backup phone | [FILL] |
| Email | [FILL] |
| What they know | Location of sealed package / key for encrypted file |
| Medical authority | Can accompany to hospital, speak to providers (if applicable) |

Repeat for each Tier 1 contact (minimum 2 recommended).

### Tier 2 — Technical access (within 24 hours)

These contacts know enough about the infrastructure to keep critical systems alive or gracefully halt them. They are not operators; they are on-call advisors.

| Field | Content |
|-------|---------|
| Name | [FILL] |
| Relationship | [FILL] |
| Phone | [FILL] |
| Email | [FILL] |
| Systems they can advise on | e.g., Cloudflare Workers, GitHub Actions, Stripe |
| Access level they currently hold | e.g., read-only, none (recovery only) |

### Tier 3 — Legal and organizational (within 72 hours)

These contacts handle legal and corporate continuity.

| Field | Content |
|-------|---------|
| Name | [FILL] |
| Role | e.g., registered agent, board member, attorney |
| Phone | [FILL] |
| Email | [FILL] |
| Authority | e.g., can call board meeting, file with GA SOS |

---

## Operator medical context (for first responders and successor)

> This section belongs in the off-repo package, not in this runbook. Include the following fields:

- **Diagnosis:** Hypoparathyroidism (ICD-10 E20.9). Requires calcium maintenance; critical range 8.0–9.0 mg/dL. Low calcium = medical emergency. Symptoms: muscle cramps, numbness, seizure risk.
- **Medications:** [list current medications and dosages off-repo]
- **Hospital preference:** [fill]
- **Emergency medication location:** [fill — e.g., calcium carbonate + vitamin D on person at all times]
- **Cognitive note:** AuDHD (late diagnosis 2025). In high-stress situations, written checklists are more effective than verbal instruction. The successor should present options in writing.
- **Custody context (if relevant to decisions about S.J. and W.J.):** [fill — current custody order location, family law attorney contact]

---

## Cloudflare account recovery path

The successor operator must be able to recover Cloudflare account access without the operator's phone or authenticator app. Document the following **off-repo**:

1. Cloudflare account email address
2. Recovery code location (Cloudflare 2FA backup codes — stored where?)
3. Domain registrar login (for any domains registered outside Cloudflare)
4. GitHub organization: `p31labs` — recovery: [fill owner email + 2FA backup location]

Do **not** write actual credentials here. Write the location of the credential store and who holds the decryption key.

---

## Activation procedure

When the successor operator is activated:

```
1. Retrieve the off-repo package (location: [fill in package]).
2. Verify entity status: npm run verify:constants (or read p31-constants.json).
3. Audit critical Workers: wrangler whoami && wrangler list.
4. Check CI status: https://github.com/p31labs/andromeda/actions
5. Check live fleet: npm run verify:ecosystem (or read p31-live-fleet.json).
6. Check for active legal deadlines in the family court matter (Johnson v. Johnson,
   Civil Action No. 2025CV936, Camden County Superior Court, Georgia). Contact the
   attorney or court contact listed in the off-repo package Section 6. Do not ignore
   this — missed court deadlines have immediate consequences.
7. Contact registered agent to notify of operator change (if >30 days unavailable).
8. Convene board within 30 days of activation to ratify succession formally.
```

---

## Flipping the launch gate

Once the off-repo package is completed and stored:

```bash
npm run launch:check -- successor-operator-named met \
  --note "Successor named; package stored [location type, e.g. encrypted+envelope] $(date +%Y-%m-%d)"
```

Then verify:

```bash
npm run launch:gate
```

---

## Review schedule

Review and update this package whenever:
- The named successor's contact information changes
- A board officer changes
- A significant infrastructure change occurs (new Worker fleet, new auth method)
- More than 12 months have elapsed since last review

Next review due: **2027-05-01**
