# P31 Labs, Inc. — Initial Board Meeting
## Meeting #001

**Date:** [this weekend — fill in]  
**Time:** [fill in]  
**Location / method:** [in-person / phone / video — fill in]  
**Called by:** William R. Johnson, Incorporator  

**Directors present:**
- [ ] William R. Johnson
- [ ] Joseph Tyler Cisco
- [ ] Brenda O'Dell

**Quorum:** 2 of 3 directors = quorum met

---

## Agenda

1. Call to order and quorum confirmation
2. Waiver of notice
3. Election of officers
4. Ratification of prior actions
5. Legal review sign-off (market launch gate)
6. Successor operator designation
7. Operational authorizations
8. Open discussion
9. Adjournment

---

## 1. Call to order

Meeting called to order at ___:___ [AM/PM] by William R. Johnson.

Quorum confirmed: ___ of 3 directors present.

---

## 2. Waiver of notice

**Resolution:** The directors waive any required notice of this meeting and consent to the transaction of business at this meeting.

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

---

## 3. Election of officers

Georgia nonprofit law requires at minimum a president and a secretary (may be combined in one person if one director if so provided in bylaws; if not, separate individuals required). Treasurer is strongly recommended for grant/IRS purposes.

**Proposed officers:**

| Office | Nominee | Notes |
|--------|---------|-------|
| President | William R. Johnson | Day-to-day operator; EIN holder |
| Secretary | Brenda O'Dell | Board member; ADA support designee |
| Treasurer | William R. Johnson | OR designate separate if bylaws require |

**Resolution:** The following persons are elected as officers of P31 Labs, Inc. to serve until their successors are elected or until earlier resignation or removal:

- **President:** ___________________________
- **Secretary:** ___________________________
- **Treasurer:** ___________________________

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

---

## 4. Ratification of prior actions

The following actions were taken by the incorporator or operator before the initial board meeting and are now ratified by the board:

**Resolution:** The board ratifies all actions taken by the incorporator and operator on behalf of P31 Labs, Inc. since incorporation, including without limitation:

| Action | Date | Reference |
|--------|------|-----------|
| Articles of Incorporation filed (Georgia SOS, Control #26082141) | 2026-04-03 | GA SOS record |
| EIN obtained from IRS (42-1888158) | 2026-04-13 | IRS CP575E |
| Form 1023-EZ filed with IRS (Pay.gov tracking ID 281TLBGO) | 2026-04-30 | docs/501c3-filing/FILING-CONFIRMATION.md |
| SAM.gov Unique Entity ID obtained (NQKVWH6AKB58) | 2026-04-30 | SAM.gov record |
| Stripe payment account opened and Payment Link activated | 2026-03-31 | Stripe dashboard |
| Ko-fi donation page opened (ko-fi.com/trimtab69420) | Prior to 2026-04-30 | Ko-fi record |

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

---

## 5. Legal review sign-off (market launch gate)

The board reviews the legal compliance documents prepared for public launch:

- `andromeda/04_SOFTWARE/p31ca/public/terms.html` (https://p31ca.org/terms)
- `andromeda/04_SOFTWARE/p31ca/public/privacy.html` (https://p31ca.org/privacy)
- `andromeda/04_SOFTWARE/p31ca/public/security-disclosure.html` (https://p31ca.org/security)
- `andromeda/04_SOFTWARE/p31ca/public/accessibility.html` (https://p31ca.org/accessibility)
- `docs/LEGAL-COUNSEL-REVIEW.md` — review checklist with 60+ line items

**Open items flagged for board awareness:**
1. Georgia Charitable Solicitations Act (C-100, $35): check small-org exemption before promoting donate link broadly.
2. Board has not convened before today — this meeting creates the authorization record.
3. Session TTLs (24h operator, 8h family dock) verified against Worker code.
4. 501(c)(3) determination pending; donation language correctly states "not deductible."

**Resolution:** The board approves the legal/compliance documents as published on p31ca.org effective 2026-05-01, acknowledges the open items above, and authorizes the operator to:
- Flip the `legal-counsel-review` launch gate
- Promote p31ca.org publicly
- Solicit donations via the Stripe Payment Link and Ko-fi **subject to confirming C-100 status before any paid marketing campaign**

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

**After the vote:** `npm run launch:check -- legal-counsel-review met --note "Board approved at Meeting #001, [date]"`

---

## 6. Successor operator designation

**Resolution:** The board acknowledges the succession plan documented in:
- `docs/runbooks/RUNBOOK-SUCCESSOR-OPERATOR.md` (in-repo process)
- `docs/runbooks/SUCCESSOR-OPERATOR-PACKAGE.template.md` (fill off-repo)

The operator (William R. Johnson) designates as primary successor:

**Primary successor:** ___________________________  
**Relationship:** ___________________________  
**Contact:** ___________________________  
**Storage of completed package:** ___________________________

The board acknowledges this designation and the off-repo completed package.

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

**After the vote:** `npm run launch:check -- successor-operator-named met --note "Designated [name], package stored [location], confirmed at Board Meeting #001, [date]"`

---

## 7. Operational authorizations

**7a. Banking authority**

**Resolution:** The board authorizes the President to open a business bank account in the name of P31 Labs, Inc. and to execute banking documents on behalf of the organization. (Note: Mercury application previously submitted — ratified here retroactively if approved.)

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

**7b. Grant applications**

**Resolution:** The board authorizes the President to submit grant applications on behalf of P31 Labs, Inc., including but not limited to:
- Awesome Foundation (active, April 2026 deliberation, $1,000)
- Stimpunks Foundation (opens June 1, 2026, $3,000)
- NLnet NGI Zero Commons Fund (deadline June 1, 2026, €5K–€50K)
- ASAN Teighlor McGee Disability Justice Mini-Grant (opens May 15, deadline July 31, $6,250)

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

**7c. Technology deployments**

**Resolution:** The board authorizes the deployment of P31 Labs, Inc. software infrastructure including Cloudflare Workers, Durable Objects, and related edge services, as documented in `p31-live-fleet.json` and the production readiness registry.

_Moved:_ _____________  _Seconded:_ _____________  _Vote:_ ___/___

---

## 8. Open discussion

[Record any items raised]

---

## 9. Adjournment

Meeting adjourned at ___:___ [AM/PM].

---

## Signatures

The undersigned directors confirm that this is an accurate record of actions taken at the initial board meeting of P31 Labs, Inc.

**Director:** ___________________________  Date: _______________  
William R. Johnson

**Director:** ___________________________  Date: _______________  
Joseph Tyler Cisco (Tyler)

**Director:** ___________________________  Date: _______________  
Brenda O'Dell

---

*Keep one signed copy with organizational records. These minutes constitute the authorization record for all actions taken at this meeting.*
