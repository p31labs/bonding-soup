# P31 — market readiness sanitization sweep

> **Status:** complete · **Run date:** 2026-04-30 · **Operator:** Operator (W.JOHNSON-001)
> **Surfaces scanned:** 127 files across 7 scopes
> **Tier-A leaks at end of run:** 0 (release-clear)

This document is the human-readable mate of `scripts/probe-public-sanitization.mjs`. The probe runs over the public-facing tree (HTML + Astro + share-with-grant Markdown + build chrome) and surfaces strings that should not ship to a public release. This file records what the probe found, what was edited in this sweep, what was deliberately left alone, and the new guardrails that will keep future regressions visible.

---

## Why this exists

Public release means three things are tightening at once:

1. **Voice** — the language people read on `p31ca.org`, the cognitive passport, the C.A.R.S. lobby, and the doc library can no longer drift through AI-generated chrome ("delve into", "tapestry of", "paradigm shift") because the operator's identity-first promise (`docs/PUBLIC-VOICE.md`) is the brand.
2. **Privacy** — operator full names and family-mesh full names belong in personal canon, not in published docs or auto-generated indices.
3. **Hygiene** — no leaked credentials, no lorem placeholder, no `TODO:` markers in shipped HTML, no localhost URLs in production chrome.

`verify:public-voice` already covers ten Tier-A surfaces with a tight regex. That gate stays. This sweep is **wider in scope** (127 files, including `docs/*.md` and Astro pages and build scripts), reports findings by tier, and is wired into the root `verify` as `verify:public-sanitization` so every future change runs the test.

---

## Scope

The probe walks seven scopes. Each scope contributes its files; each file is classified by tier based on its path (file tier × pattern tier — whichever is stronger).

| Scope | Path | Files | Default tier |
|---|---|---|---|
| Home HTML | repo root `*.html` | top-level static pages (soup, fleet-portal, cognitive-passport entrypoints) | A |
| Cognitive Passport | `cognitive-passport/*.html` | passport generator | A |
| p31ca public | `andromeda/04_SOFTWARE/p31ca/public/**/*.html` | hub static pages | A |
| p31ca pages | `andromeda/04_SOFTWARE/p31ca/src/pages/**/*.astro` | Astro routes | A |
| phosphorus31.org | `phosphorus31.org/**/*.html` | org site | A |
| Share-able docs | `docs/**/*.{md,html}` | grant + clinician + design canon | B |
| Build chrome | `scripts/**/*.{mjs,js}` | tooling | C |

Skipped: `node_modules`, `.git`, `dist`, `build`, `.astro`, `.next`, `.venv`, `agent-transcripts`, `.cursor`, `_archive`, `.vscode`, `fonts`, `vendor*`, `.wrangler`, `coverage`, `.cache`, `.turbo`. Paths in `EXEMPT_PATHS` (the avoid-list canon files themselves, the public-voice rulebook, AGENTS.md, GEODESIC-CAMPAIGN.md technical-vocabulary file, etc.) are scanned but excluded from grading because they document the very terms the probe looks for.

---

## What the probe checks

| Category | Patterns | Notes |
|---|---|---|
| `voice` | `delve`, `empower`, `synergy`, `revolutionary`, `cutting-edge`, `unlock` | Mirrors `docs/p31-public-voice-guardrails.json`. Voice on a Tier-A surface is a Tier-A finding (release blocker). |
| `cliche` | `tapestry of`, `paradigm shift`, `game-changer`, `seamless`, `best-in-class`, `leverage`, `unleash`, `harness the`, `world-class`, `state of the art`, `navigate the complexities`, `vibrant ecosystem`, `robust and comprehensive`, `in conclusion`, `it's important to note`, `delve into` | AI-prose detection. Tier follows file tier. |
| `todo` | `TODO:`, `FIXME:`, `XXX:`, `HACK:`, `TKTK`, `lorem ipsum`, `placeholder text` | Stale review markers; should not ship in public HTML. |
| `private` | OpenAI / Anthropic / Google API key shapes, GitHub PAT shape, Slack bot, AWS access key shape, **operator full name leak**, **child full name leak** | Always Tier A regardless of file path — credential or identity leak is a release blocker. |
| `rough` | `href="javascript:void"`, non-dev `localhost` URLs in HTML chrome | Pre-modern markup or stage URLs that escaped from dev. |

A line is skipped if its own text contains "avoid-list", "guardrail", "never say", "do not say", "forbidden", "banned", "never use", or "never ship" — meta-references that would otherwise self-trip.

---

## Run summary (2026-04-30)

| Metric | Before | After |
|---|---|---|
| Files scanned | 127 | 127 |
| Total findings | **20** | **5** |
| Tier A | 1 | **0** |
| Tier B | 19 | 5 |
| Tier C | 0 | 0 |
| `voice` category | 15 | 2 |
| `cliche` category | 4 | 3 |
| `private` category | 1 | 0 |
| Tier-A leaks (release blockers) | **1** | **0** |

Re-run after edits:

```
$ npm run probe:public-sanitization
scanned 127 files across 7 scopes
findings: 5 (Tier A: 0 · Tier B: 5 · Tier C: 0)
```

`verify:public-sanitization --strict` exits non-zero on any Tier-A finding. The root `verify` now runs it after `verify:public-voice`.

---

## Edits applied (this sweep)

### Tier A — operator full-name leak
- **`docs/P31-QUANTUM-BRAIN-FILESYSTEM.md`** H1
  - Before: `# QUANTUM BRAIN: FILESYSTEM OF WILL JOHNSON`
  - After: `# QUANTUM BRAIN: FILESYSTEM OF THE OPERATOR`
  - Reason: P31 canon (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`) refers to the operator as "W.JOHNSON-001" / "Operator" / "Parent" everywhere else. Full-name in a publicly-indexed Markdown H1 was the only outlier and the doc library indexes everything under `docs/`. The rest of the file's narrative (reframed as "the operator's filesystem") is unchanged.

### Tier B — mechanical relabel of a structured-list keyword
- **`docs/FUNDING-GATED-ACTION-ITEMS.md`** — 13 instances of `**Unlocks**:` → `**Enables**:`
  - This is a status-label column in a funding-gated checklist; it lists the capability that becomes available when an item is funded. "Enables" reads naturally in the funding-capability frame, drops the avoid-list term, and is purely a column-header relabel — no narrative prose was touched.
  - One adjacent fix in the same row (`formal registration leverage` → `formal copyright record`) removed the `leverage` cliché where it sat next to the `Unlocks → Enables` change.

No other narrative prose was edited. **Operator copy is the operator's domain**; the probe's job is to surface, not to rewrite.

---

## Residual findings (operator review)

These five Tier-B findings remain by design — all are operator-authored narrative voice in design docs. The probe flags them so the operator can decide; this report does not alter them.

| File:line | Pattern | Snippet | Suggested rewrite |
|---|---|---|---|
| `docs/P31-QUANTUM-BRAIN-FILESYSTEM.md:280` | `paradigm-shift` heading | `## THE PARADIGM SHIFT — STILL HOLDS` | `## THE SHIFT — STILL HOLDS` |
| `docs/SHIFT-HANDOVER-PLANETARY-ONBOARDING-UI-2026-04-25.md:338` | `unlock` (technical) | `Unlocking uses your fingerprint, face, or PIN — nothing you have to remember.` | Allowed — describes biometric device unlock; technical correct usage |
| `docs/soup-world-design.md:127` | `unlock` (game mechanic) | C.A.R.S. Era progression triggered by player achievement-unlock | Allowed — game-mechanic vocabulary; same exception as `docs/GEODESIC-CAMPAIGN.md` |
| `docs/soup-world-design.md:71` | `seamless` (audio engine) | "Zooming out … *seamlessly* blends all localized emitters into a massive ambient wash" | Could become `smoothly` or just remove the adverb |
| `docs/soup-world-design.md:98` | `tapestry of` cliché | "creating a tapestry of interconnected experiences" | Could become `weave of parallel emotional journeys` |

The two `soup-world-design.md` items are the only ones where I'd actually recommend an edit — `tapestry` is the most clearly AI-generated phrasing in the doc, and the operator can decide whether the design-doc prose should adopt the tighter voice.

---

## Quantum Material U adoption (concurrent polish)

While the probe was running, three top-stakes public pages were promoted from "missing" to "adopted" in `probe:quantum-material-u`:

| Page | Adoption |
|---|---|
| `p31-personal-howto.html` | TOC + bottom-link row → `.p31-q-chip` (filter / assist variants) |
| `p31-device-setup.html` | TOC → `.p31-q-chip --filter` |
| `fleet-portal.html` | regenerated from `scripts/build-fleet-portal.mjs` — TOC + bottom-link row → `.p31-q-chip` (every `npm run build:fleet-portal` from now on carries the new vocabulary) |

The `p31ca/public/fleet-portal.html` mirror is auto-synced.

Adoption probe deltas:

| Run | Adopted | Missing | External |
|---|---|---|---|
| Before sweep | 4 | 197 | 89 |
| After sweep | **8** | 190 | 89 |

(`+4` adoptions: `p31-personal-howto.html`, `p31-device-setup.html`, `fleet-portal.html`, and the `p31ca/public/fleet-portal.html` hub mirror.)

The 195 remaining "missing" entries are eligible-but-un-adopted candidates — `p31-style.css` is loaded but no `.p31-q-*` class is in use yet. Promotion is opt-in per page; nothing is broken.

---

## New gate: `verify:public-sanitization`

| Surface | Definition | Behaviour |
|---|---|---|
| `npm run probe:public-sanitization` | Markdown report on stdout (default) | Read-only diagnostic; never modifies files |
| `npm run probe:public-sanitization -- --json` | Machine-readable JSON document | Schema `p31.publicSanitization/1.0.0` |
| `npm run probe:public-sanitization -- --json --write <path>` | JSON written to disk | For pipeline artefacts |
| `npm run verify:public-sanitization` | `--strict` mode | **Exits non-zero on any Tier-A finding** — release blocker |

The verify mode is now part of the root `verify` script, immediately after `verify:public-voice`:

```
… && npm run verify:public-voice && npm run verify:public-sanitization && …
```

Effective-bar: `verify:public-sanitization` is in the "always scheduled on home verify bar" set (no partial-clone skip needed — it scans relative paths and tolerates missing scopes).

Alignment registry: the script and this report are now sources, and a derivation row (`public-sanitization-sweep`) ties them to the `verify:public-sanitization` gate.

---

## How to triage a finding

1. **Tier A finding (release blocker)** — fix before merge. If the finding is a credential, rotate immediately, then remove. If the finding is a name/identity leak, replace with the canonical alias (Operator, S.J., W.J.).
2. **Tier B finding** — operator-decided. Some are technical-vocabulary (`unlock` for biometrics; `unlock` in game-mechanics docs) — leave. Some are narrative prose — the operator decides whether the file's voice tightens.
3. **Tier C finding** — script comment / build chrome. Usually false positive (e.g. "harness" matched in a code-comment "Demo harness"). The probe's narrowed regex (`harness\s+(the|its|your|the\s+power|the\s+full)`) avoids most; remaining hits can be narrowed in `CLICHE_PATTERNS`.

To exempt a file from the probe (canon docs that *document* the avoid-list), add its path to `EXEMPT_PATHS` in `scripts/probe-public-sanitization.mjs`.

---

## Surrounding gates (composite picture)

These all run on the home verify bar and form the public-release gate together:

| Gate | What it asserts |
|---|---|
| `verify:passport` | Cognitive Passport mirror is byte-exact via the canonical transform |
| `verify:cognitive-passport-schema` | Generator HTML's schema constants ≡ `@p31/shared` types |
| `verify:cognitive-passport-profiles` | Audience matrix v1.0.0 types + tests |
| `verify:p31-style` | Generated `p31-style.css` mirrors `p31-universal-canon.json`; passport mirror OK |
| `verify:canon-css` | Frozen surface CSS digest unchanged |
| `verify:quantum-material-u` | 40 Quantum Material U tokens/classes present in passport CSS + Tailwind bridge + showcase + canon block validated |
| `verify:public-voice` | The 10 watched files contain no avoid-list terms; required anchors + ship-bar strips are in place |
| `verify:public-sanitization` | **NEW** — wider 127-file surface, Tier-A leaks block release |
| `verify:economy` | Creator economy contract digest matches; platform fee = 0; creator share = 1.0 |
| `verify:doc-index` | `docs/doc-library/index.json` rebuilt; MiniSearch smoke ≥ N hits |

---

## What "market release" means after this sweep

> No published HTML, Astro, or Markdown file in this codebase contains the operator's full name, a family-member's full name, a credential-shaped string, an AI-cliché run on a Tier-A surface, or a stale review marker. Every Tier-A surface composes the canonical CSS. The Cognitive Passport — the marquee public tool — has a Quantum Material U shell, a structured 6-step form, a real progress meter, social-share metadata, JSON-LD, a print stylesheet, a skip link, and a mobile floating action button. Future regressions trip `verify:public-sanitization` on the first PR.

The codebase is publishable.

---

## File index

- Probe: [`scripts/probe-public-sanitization.mjs`](../scripts/probe-public-sanitization.mjs)
- Voice canon: [`docs/PUBLIC-VOICE.md`](PUBLIC-VOICE.md)
- Voice guardrails JSON: [`docs/p31-public-voice-guardrails.json`](p31-public-voice-guardrails.json)
- Cognitive Passport overhaul: [`cognitive-passport/index.html`](../cognitive-passport/index.html) and [`docs/P31-QUANTUM-MATERIAL-U.md`](P31-QUANTUM-MATERIAL-U.md)
- Quantum adoption probe: [`scripts/probe-quantum-material-u-adoption.mjs`](../scripts/probe-quantum-material-u-adoption.mjs)
- Engineering ship bar: [`docs/P31-ENGINEERING-STANDARD.md`](P31-ENGINEERING-STANDARD.md)
- Alignment registry derivation: `p31-alignment.json` → `derivations[].id == "public-sanitization-sweep"`
