# `_archive/` — paper trail, not canon

Files here are **out of public surface** but **in git**, intentionally. The archive exists so the provenance chain stays unbroken: raw material → triage → salvaged concepts → destination in canon.

## Rules

1. `_archive/**` is **excluded** from the public doc library (`build:doc-index` ignores it; public-voice verifiers ignore it).
2. Every archived document should have a short triage note alongside it (or a row in `docs/PARKING-LOT.md`) that says what was salvaged and what was rejected.
3. Don't edit archived documents in place — they are snapshots. If a concept here gets promoted, it gets a **new** file in canon and a `PARKING-LOT.md` row gets removed.
4. The archive is reading-only-by-default. Anything actionable should already have been extracted into `docs/`, `p31-alignment.json`, or a CWP.

## Negative-example value

Future agents (or future operator) may read these documents and notice the **signal-to-noise ratio**: the brain-dump archive shows a 2,941-line document reduced to three sentences. That ratio is operationally important — it tells you what good triage looks like.

## Layout

- `brain-dumps/` — large speculative AI-elaborated documents that captured operator insights buried under scaffold. Triage records sit alongside the raw dumps.
- `mobile/` — mobile-runtime specifications for software that doesn't exist yet (e.g. `p31ctl` CLI). Architectural truths extracted into `docs/P31-OPERATOR-SETUP-GUIDE.md` § Mobile.

If a future agent asks "where did concept X originate" and X isn't in canon, look here.
