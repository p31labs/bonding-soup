# DELIVERABLE — Subscription Stack (AI)

## Purpose

Keep the **most economical + powerful** AI subscription setup as **one canonical source** in the repo, with a verifier.

This is intentionally **not** a billing scraper. It is a **contract** for:

- What we pay for (and why)
- What is redundant and should be cancelled
- What triggers a more complex routing layer (only when justified)

## Canonical source

- `p31-subscriptions.json` — `p31.subscriptions/1.0.0`

## Verifier

- `npm run verify:subscriptions`

This verifies:

- The **trio is present**: `claude-pro` + `cursor-pro` + `google-workspace`
- Core AI infra totals match the declared expected range
- API budget block exists (agent crew costs stay explicit)
- Cancellation targets are tracked (redundancy stays visible)

## What the stack encodes (today)

- **Claude Pro**: Architect lane (Opus for deep QA/risk review)
- **Cursor Pro**: Mechanic lane (Composer 2 for shipping WCDs)
- **Google Workspace**: Narrator lane (Gemini for grants/research/doc ingestion)
- **Anthropic API budget**: pay-per-token for SIMPLEX v7 agent crew (small, intentional)

## What to do when this deliverable changes

- Update `p31-subscriptions.json`
- Run `npm run verify:subscriptions`
- Run `npm run verify:alignment` (fast guard) or full `npm run verify`

