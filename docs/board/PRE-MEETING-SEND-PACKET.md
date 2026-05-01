# PRE-MEETING SEND PACKET
## P31 Labs, Inc. — Board Meeting #001
## Distribute to all directors before the weekend

**Meeting:** Board of Directors Meeting #001  
**When:** This weekend (May 3–4, 2026 — confirm exact date/time with directors)  
**Who must attend:** William R. Johnson · Joseph Tyler Cisco · Brenda O'Dell  
**Quorum:** 2 of 3. All 3 strongly preferred for Meeting #001.  
**Method:** In person, phone, or video — all are valid per Bylaws Art. IV Sec. 6

---

## What to send to Joseph Tyler Cisco and Brenda O'Dell

Send these files (or share as PDF or direct links) at least 24 hours before the meeting:

| Document | Why they need it before the meeting |
|---------|-----------------------------------|
| `phosphorus31.org/docs/P31_Labs_Bylaws_Final.md` | They're voting to adopt it — they should read it first |
| `phosphorus31.org/docs/nonprofit-conflict-of-interest-policy-final.md` | Required to read before signing COI disclosure |
| `docs/board/BOARD-MEETING-001-AGENDA.md` | So they know what's happening |
| `docs/board/DIRECTOR-CONSENT-TO-SERVE.md` | Can pre-sign and bring to meeting |
| `docs/board/CONFLICT-OF-INTEREST-DISCLOSURE-FORM.md` | Can pre-complete and bring to meeting |
| `docs/board/WAIVER-OF-NOTICE-MEETING-001.md` | Sign and return before meeting (or at meeting) |

**Suggested message to directors:**

> Subject: P31 Labs Board Meeting #001 — this weekend, [date] at [time]
>
> Will, Joe, Brenda —
>
> Our first board meeting is this [Saturday/Sunday], [date] at [time], by [method].
> I'm attaching the agenda, bylaws, conflict of interest policy, and the forms you'll need to sign.
>
> If you can, review the bylaws and COI policy before the call — the meeting will move faster.
> You can also pre-sign the Director Consent to Serve and COI Disclosure Form and bring them.
>
> The waiver of notice is attached — please sign and return before or at the meeting.
> This is a 45–60 minute call. Most items are routine ratifications.
>
> [Time zone / call-in info]
>
> — Will

---

## What to have ready at the meeting (operator checklist)

**Before the call starts:**

- [ ] Confirm all three directors have received the documents
- [ ] Have `docs/board/BOARD-MEETING-001-MINUTES.md` open to type into during the meeting
- [ ] Have `docs/board/WAIVER-OF-NOTICE-MEETING-001.md` ready — collect signatures from all three
- [ ] Have three copies of `DIRECTOR-CONSENT-TO-SERVE.md` — one per director
- [ ] Have three copies of `CONFLICT-OF-INTEREST-DISCLOSURE-FORM.md`
- [ ] Have `docs/board/BYLAWS-ADOPTION-CERTIFICATE.md` ready for Secretary to sign after
- [ ] Decide staggered term assignments before the meeting (fill in names on the term table)

**Staggered terms — decide before the meeting:**

The bylaws require initial directors to serve 1-year, 2-year, and 3-year terms.
Suggested assignment (operator may change):

| Director | Term | Rationale |
|---------|------|-----------|
| William R. Johnson | 3 years (to May 2029) | Primary operator; longest continuity |
| Joseph Tyler Cisco | 2 years (to May 2028) | |
| Brenda O'Dell | 1 year (to May 2027) | Renews May 2027 for full 3-year term |

**Officer assignments — confirm before the meeting:**

Per bylaws, President and Secretary cannot be the same person.

| Office | Proposed | Notes |
|--------|---------|-------|
| President | William R. Johnson | CEO; day-to-day operator |
| Secretary | Brenda O'Dell | Keeps minutes; custodian of corporate records |
| Treasurer | William R. Johnson | May combine with President |

---

## Meeting run order (45–60 minutes)

| Time | Item | Action |
|------|------|--------|
| 0:00 | Call to order, quorum | Confirm attendees |
| 0:02 | Waivers of notice | Collect/confirm signed |
| 0:05 | Adopt bylaws | Read title, vote |
| 0:08 | Staggered terms | Vote |
| 0:10 | Elect officers | Vote |
| 0:12 | Adopt COI policy | Vote; each director discloses or confirms no conflict |
| 0:20 | Ratify prior actions | Read list, single vote |
| 0:25 | Legal review authorization | Vote; operator flips gate after meeting |
| 0:30 | Successor operator designation | Name successor; operator completes package |
| 0:35 | Bank account auth | Vote |
| 0:38 | Adopt whistleblower + retention policies | Vote |
| 0:40 | Set next annual meeting | Agree on date |
| 0:42 | Open discussion | |
| 0:50 | Adjournment | Secretary records time |

---

## After the meeting — same day or within 48 hours

- [ ] Secretary (Brenda) drafts and circulates minutes for review
- [ ] All directors sign Consent to Serve (if not done at meeting)
- [ ] All directors complete COI Disclosure Forms
- [ ] Secretary signs Bylaws Adoption Certificate; President countersigns
- [ ] President fills in and signs C-100 Exemption Memo; Secretary countersigns
- [ ] President updates bylaws "Adopted:" date field in the file
- [ ] President runs gate flip commands:

```bash
npm run launch:check -- legal-counsel-review met \
  --note "Board Meeting #001, [date], all 3 directors, legal docs approved"

npm run launch:check -- successor-operator-named met \
  --note "Successor [name] designated at Board Meeting #001 [date]; package stored [method]"

npm run launch:gate
```

At that point: **100/100 on all critical launch gates.**

---

## One thing to decide before the call

**Who is the successor operator?**

The board will vote to acknowledge the succession plan. The operator names the primary successor at the meeting. This person needs to know they're being designated — a quick heads-up call before the meeting is appropriate.

Options (operator's choice — not a board decision):
- A trusted technical person who knows the Cloudflare/GitHub ecosystem
- A family member with authority to act (cannot be a minor)
- Brenda O'Dell (already a board member; can act as interim and convene board)

---

*This packet was generated 2026-05-01. Print or share digitally. File with corporate records after meeting.*
