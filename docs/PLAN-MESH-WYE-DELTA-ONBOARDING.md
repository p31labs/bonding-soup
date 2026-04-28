# Plan — Mesh Wye/Delta onboarding (quiet sanctuary framing)

Operational companion to **`andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html`** and **`public/p31-welcome-packages.json`**. Canonical **copy fields** (`explicitNegationLines`, `paceSubtitle`, `wyeDeltaRibbonLines`, `phaseJobLines`) live in **`p31-welcome-packages.json`**; the page hydrates defaults if those keys are absent.

## Ethical stance

Align with **`docs/ETHICAL-STYLE-MAP.md`**: autonomy, transparency in limits, proportional friction for irreversible steps, dignity-first language (no urgency theater), access-compatible escape hatches (`prefers-reduced-motion` skips long holds).

## Tier glossary

| Tier | Meaning |
|------|--------|
| **Ribbon** | Fixed Wye→Delta topology strip (`--wye-delta-t`): public story cue, links to **`/delta.html`**. Not a countdown timer. |
| **Phase macro** | The big line per step (welcome cards, Void lines, pact title, etc.). |
| **Phase job** | One cognitive aim for steps 1–4 (helps orient without cramming lore). |

## Explicit negation (Tier A wording)

Surface **what mesh lock is not** before trust asks:

- No **seed phrases** — not a mnemonic wallet.
- **Not** cryptocurrency / “Web3 onboarding” choreography.
- **Device-first** lock — no custodial “password on our servers” story for WebAuthn; policy text stays factual.
- **Glass-box** — redirects, creator-economy, and ship discipline are documented and verifiable (`verify` bar, `public/_redirects` contract in **`ground-truth/p31.ground-truth.json`**).

## Risk gate (Tier B — pact / device lock)

Before **Secure**:

- User sees **explicit negations** plus **backup path** (“skip / later”).
- **Hold-to-confirm** default (~3 s) with **`prefers-reduced-motion`** → single activation (documented in-flow).
- **Skip** stays visible (no walled garden).

## File map

| Surface | Role |
|---------|------|
| `planetary-onboard.html` | Phases 0–5, ribbon, hold UX |
| `p31-welcome-packages.json` | Schema `p31.welcomePackages/1.0.0` + onboarding canon blocks |
| `mesh-start.html` | Post-shift home; reinforces isolation + transparency |
| `delta.html` | Long-form Wye→Delta essay |
