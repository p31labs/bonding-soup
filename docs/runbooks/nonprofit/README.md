# P31 Nonprofit Runbooks

Operator-friendly procedures for running P31 Labs, Inc. Each assumes spoon-deficit conditions: terminal-readable, copy-paste commands, no hidden state.

## Index

| Runbook | When |
|---|---|
| [Master operations index](../../P31-NONPROFIT-OPERATIONS.md) | Start here — overview of all canonical contracts |
| [board-meeting.md](board-meeting.md) | Quarterly + annual + special meetings |
| [donor-receipt.md](donor-receipt.md) | Issue receipts (auto, manual, annual, replacement) |
| [grant-application.md](grant-application.md) | New funder pursued through award + closeout |
| [incident-response.md](incident-response.md) | P0–P3 incident triage + response |
| [filing-calendar.md](filing-calendar.md) | Monthly review + filing checklists |
| [onboarding.md](onboarding.md) | Board / staff / contractor / volunteer joining |

## Automation

```bash
npm run nonprofit:status      # one-screen ops dashboard
npm run nonprofit:calendar    # upcoming filing deadlines
npm run nonprofit:receipt     # generate tax-deductible receipt
npm run nonprofit:report      # assemble annual impact report
npm run verify:nonprofit      # schema + cross-ref check
```

## Canonical contracts

All under `andromeda/04_SOFTWARE/p31ca/ground-truth/nonprofit/`:

- `governance.json` · `compliance.json` · `financials.json`
- `donor-policy.json` · `programs.json` · `grants.json`
- `legal.json` · `risk.json` · `people.json`

Edit the JSON; the runbooks and public surfaces follow.
