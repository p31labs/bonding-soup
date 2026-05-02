# Board Meeting Runbook

**When to use:** quarterly board meetings, annual meeting, special meetings.
**Owner:** Secretary (Operator until seated).
**Pre-requisite reading:** `governance.json` → `meetings`, `policies`.

---

## 14 days before

```bash
# 1. Confirm quorum
npm run nonprofit:status        # shows current seated members
# quorum = majority of seated (2 of 3, 3 of 5, 4 of 7, etc.)

# 2. Send notice with proposed agenda
# template: scripts/nonprofit/templates/board-meeting-notice.md
# 14-day notice required by bylaws (see governance.json meetings.noticeRequiredDays)
```

**Agenda template** (every meeting):
1. Call to order + roll call
2. Approval of prior meeting minutes
3. Treasurer's report (financial summary, 30 min review of `financials.json`)
4. Executive report (operator state-of-org, programs progress)
5. Old business (carry-overs from prior meeting)
6. New business (this meeting's agenda items)
7. Conflict-of-interest disclosures (any new since last meeting)
8. Executive session if needed (personnel, legal, real estate, donor identity)
9. Adjourn

## 7 days before

- Compile board packet (PDFs of: agenda, prior minutes, treasurer report, programs update, any documents requiring vote)
- Distribute via email
- Calendar invite confirmed for all members

## Day of

- Quorum check at start (record who's present + how — in person, video, phone)
- Minutes-taker designated (Secretary or Secretary's delegate)
- All votes recorded (motion text, who moved, who seconded, vote count, dissenters named if requested)

## After

```bash
# Within 7 days: draft minutes
# scripts/nonprofit/templates/board-minutes.md

# Within 30 days: redacted public summary published
# /governance/minutes/YYYY-MM-DD-summary.md

# Within 60 days: minutes approved at next meeting
# Update governance.json meetings.scheduled with the held meeting
```

## Special meeting protocols

- **48-hour notice** acceptable per GA code (vs. 14-day for regular)
- **Unanimous written consent** can substitute for a meeting if all members sign
- **Emergency meeting** (operator incapacitation, P0 incident, etc.) — Vice-Chair convenes

## Things that should NOT happen at a board meeting

- Voting on items not in advance notice (except trivial procedural matters)
- Decisions made by individual director outside the meeting binding the board
- Founder/operator unilaterally changing meeting outcomes after-the-fact
- Approval of contracts the operator has a personal interest in (recuse + disclose)

## Quorum failure

If quorum can't be reached, meeting becomes informational only. No binding decisions. Reschedule within 30 days. Three consecutive quorum failures triggers `governance.json` recruitment-priority recalibration.
