# Enterprise launch prep — P31 Labs / p31ca

**Last updated:** 2026-04-26  
**Purpose:** Bridge **operator reality** (Cloudflare, GitHub, Zenodo, Stripe) with narrative launch docs under `andromeda/docs/` (Genesis / Phosphorus31 SOPs). Execute in order where possible; skip rows that do not apply to your cut of the stack.

---

**Normative ship bar:** **`docs/P31-ENGINEERING-STANDARD.md`**.

## A. Truth and gates (local)

| Step | Command / action | Notes |
|------|------------------|--------|
| 1 | `npm run verify` (P31 home root) | Passport, constants, p31-style, p31ca contracts, egg-hunt, `tsc`. |
| 2 | `npm run release:public` | **One-shot public prep:** root **`verify`** → strict mesh + k4-personal → **`p31ca` `hub:ci`** (regenerates about pages + full build) → **`security:check`**. Optional: **`npm run release:public -- --content`** (runs **`hub:about:enrich`**). **`--no-security`** skips the security suite. |
| 2b | `npm run release:check` or `npm run p31:ci` | Adds p31ca build when tree present (no `hub:about:generate`). For CI parity without about regen: **`npm run release:all`** (strict mesh + p31ca **`verify`** + **`security:check`**). |
| 3 | `npm run validate:full` | Optional: live mesh audits + extended shell checks (needs network). |
| 4 | `npm run fleet:probe` / `fleet:probe:strict` (from `p31ca/`) | Worker fleet health. |

---

## B. Secrets and rotation (post-batch)

| Secret | Where | Action |
|--------|--------|--------|
| **Zenodo** | [Application tokens](https://zenodo.org/account/settings/applications/) | **Rotate** after any token exposure; never commit. Batch uploader: `andromeda/docs/files/zenodo_upload.py` + optional `.env` (gitignored). |
| **`ZENODO_TOKEN` / `ZENODO_API_TOKEN`** | GitHub Actions, Forge Worker | Set to **new** token after rotation; align name with workflow (`ZENODO_TOKEN` vs `ZENODO_API_TOKEN` per target). |
| **`CLOUDFLARE_API_TOKEN`**, **`CLOUDFLARE_ACCOUNT_ID`** | GitHub, local wrangler | Required for Pages deploy workflows; least-privilege token. |
| Stripe / Discord / social | `donate-api`, Forge, ecosystem bots | See `andromeda/04_SOFTWARE/cloudflare-worker/bouncer/src/secrets-index.json` and package READMEs. |

---

## C. Andromeda CI and merge path

Per **`andromeda/04_SOFTWARE/integration-handoff/SHIFT-TURNOVER-2026-04-26.md`**:

1. Confirm **`p31ca-hub`** (or equivalent) is green on the integration branch tip.
2. Merge integration PR when green (operator discretion).
3. **Commit high-value untracked** items called out in that handoff: passkey worker source, new workflows (`donate-api`, `p31-google-bridge`), security stack if CI depends on it.
4. **Regenerated hub HTML** — prefer CI regeneration; avoid committing noise from local `hub:about:generate` unless copy/generator changed.

---

## D. Research and constants

| Item | Location |
|------|----------|
| Published DOIs **V–XX** (+ existing **IV**, **defensive**) | `p31-constants.json` → `research.papers` |
| Batch result IDs | `andromeda/docs/files/zenodo_results.json` |
| Optional: Zenodo **related identifiers** (`cites` → Paper XII) for XI / XIII / XIX / XVIII / XX | Edit metadata in Zenodo UI if deposits were created before XII DOI was live. |

After any `p31-constants.json` edit: **`npm run apply:constants`** && **`npm run verify:constants`**.

---

## E. Deploy surfaces

| Surface | Check |
|---------|--------|
| **p31ca.org** | `p31ca` **`hub:ci`** / Pages deploy per `p31ca/DEPLOY.md`; ground-truth + redirects. |
| **phosphorus31.org** | Parallel repo; SUPER-CENTAUR bridge per CWP / `mesh-bridge.ts` handoff. |
| **BONDING** | `bonding.p31ca.org`; test baseline 424 / 32 in `p31-constants.json`. |

---

## F. Narrative / ARG launch docs (optional)

`andromeda/docs/DAY_0_GENESIS_LAUNCH_PROTOCOL.md` and **`PHOSPHORUS31_LAUNCH_SOP.md`** describe Discord oracle, Redis, IPNS — **validate** each dependency still matches production before treating checklists as blocking. Prefer **this file (A–E)** for **enterprise** (legal entity + hub + edge + research) launch.

---

*Geometry is destiny — ship with verify green.*
