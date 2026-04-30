# P31 PARKING LOT

> Things that are **not yet** part of canon, with a one-line reason. Future agents read this before re-litigating.

The parking lot exists so ideas don't have to be re-argued every time they resurface. Each entry has: **what** (the idea), **why parked** (one line), **revisit when** (the unlock condition), and optionally **source** (where it came from in the archive).

When promoting a parked item to canon: remove the row, add the canon row to `p31-alignment.json` (or appropriate registry), and link the resulting doc.

---

## Currently parked

### Theory / framework parking

| Item | Why parked | Revisit when | Source |
|---|---|---|---|
| Sierpinski-fractal cognitive architecture | Competes with K₄ rather than extending it; introduces hierarchy where the topology demands flat closure | Operator presents a use case where K₄ closure is insufficient AND the fractal extension preserves no-central-authority | `docs/_archive/brain-dumps/` |
| Quantum-mind-interface (cognitive coherence as crypto auth) | Ungrounded as engineering pattern — "SIC-POVM entropy threshold gates SSH cert issuance" is metaphor, not a deployable primitive | Operator can specify a concrete biosignal-to-token transform with measurable thresholds AND a P31 paper anchors it | `docs/_archive/brain-dumps/` |
| QHE-based cognition substrate | Decade-out science; speculative substrate for which P31 has no instrumentation today | A Zenodo paper anchors the claim AND a benchtop demo is feasible on operator hardware | `docs/_archive/brain-dumps/` |
| DCT-watermark style token / steganographic provenance | Post-Zenodo concern; current Style Token JWT in `simplex-v7` is sufficient until creative output ships at volume | After the first 100 P31-published creative artefacts have an ingest pipeline that wants tamper-evidence | `docs/_archive/brain-dumps/` |
| Cigna-copilot integration as P31 product | Keep the **pattern** (operator-bounded centaur workflow inside hostile institutional UX) but drop the brand example — it's too narrow to scope as a canon product | An institutional partner explicitly co-signs and a non-anecdotal use case appears | `docs/_archive/brain-dumps/` |

### Mobile / terminal parking

| Item | Why parked | Revisit when | Source |
|---|---|---|---|
| `p31ctl` mobile CLI (zone snippets, readiness commands, `sov` family) | The CLI does not exist; the document specifies snippet packages for software that hasn't been built. Real mobile stack today is: Mosh + tmux + Tailscale, accessed via Termius or Blink. | A `p31ctl` shell binary ships in `andromeda/04_SOFTWARE/` AND has a stable command surface | `docs/_archive/mobile/2026-04-30-termius-blink-architecture.md` |
| Termius REST API host auto-registration | No P31 provisioning system today; nothing to auto-register | A Worker or Binder service ships that needs Termius hosts as a derived sink | `docs/_archive/mobile/2026-04-30-termius-blink-architecture.md` |
| Readiness-gated SSH certificates | Same as quantum-mind-interface above — coherence-gated auth is metaphor | Operator specifies measurable thresholds + a paper anchor | `docs/_archive/mobile/2026-04-30-termius-blink-architecture.md` |
| iOS Shortcuts → `xcall` Blink → posture-check pipeline | Health monitoring system doesn't exist; no `p31ctl health posture` to call | A health primitive ships AND has a stable schema | `docs/_archive/mobile/2026-04-30-termius-blink-architecture.md` |

### Architectural spikes (deferred but tracked)

| Item | Why parked | Revisit when | Source |
|---|---|---|---|
| p31ca.org 7-route consolidation (full AppShell) | Blocked on Track 2.5 spike (see `docs/SPIKE-APPSHELL-PERSISTENCE.md`) — cannot commit to consolidation strategy until persistent-canvas behaviour is proven on real hardware | AppShell spike returns green | `docs/SPIKE-APPSHELL-PERSISTENCE.md` |

---

## How this file is maintained

- **Add** a row when an idea surfaces, gets a triage, and is intentionally deferred (don't archive without parking).
- **Don't delete** rows when ideas get rejected outright — write a short `Why parked` saying "rejected: <one line>" so the rejection is durable.
- **Promote** by deleting the row + adding the canon row to `p31-alignment.json` + linking the new doc in the commit.
- **Never mention this file as a destination in a public-voice surface.** It is operator/agent infrastructure, not story.
