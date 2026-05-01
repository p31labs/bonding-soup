# P31 reports — committed index

This folder holds the **machine index** of P31 operator reports. Full report bodies live in
`~/.p31/reports/YYYY/MM/DD/<id>.{json,md}` (operator-local; not committed by default).

- **`index.json`** — `p31.reportsIndex/0.1.0`. Metadata only (id, kind, ts, severity, headline). Rebuilt by `npm run reports:index`. CI gate: `npm run verify:reports-index`.
- **`promoted/`** — opt-in markdown copies of specific reports (created via `npm run reports:promote <id>`).

See **`docs/P31-REPORTS.md`** for the full operator guide and schedule.
