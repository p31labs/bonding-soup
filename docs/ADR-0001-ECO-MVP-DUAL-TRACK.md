# ADR-0001 — ECO vs hub COCKPIT index (dual track)

**Status:** accepted (interim). **Date:** 2026-04-26.

## Context

`scripts/hub/diff-index-sources.mjs` reports **`mvpData` id set ≠ COCKPIT** hub index until the ECO CWP merges a single product registry.

## Decision

**Dual track** is allowed: **COCKPIT** drives shipped hub landing data; **`mvpData`** may list additional lab / roadmap ids. CI remains **non-strict** (`diff-index-sources` OK with warning). **`--strict-mvp`** is reserved for a future merge milestone.

## Consequences

- Grant-facing copy must align with **COCKPIT + registry**, not mvpData alone.
- Removing this ADR requires clearing the diff (merge or split manifests with two machine-readable lists).

## Links

- `PLAN-11-10-FULL-ECOSYSTEM.md` Phase 9  
- `AGENTS.md` — diff-index-sources note  
