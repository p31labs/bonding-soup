# P31 canonical numbering system

**Status:** normative for this workspace.  
**Last updated:** 2026-04-25

**Problem solved:** multiple independent “version” numbers (CogPass filename, H1 edition, JSON schema, ground-truth, WCD, papers, review-bundle prose) were drifting. This document defines **namespaces**—each number series has **one** authority and **one** bump rule. **Never** infer cross-namespace equality (e.g. Passport “v5” ≠ `p31.ground-truth` `1.0.0`).

### Single updatable file (automation)

**`p31-constants.json`** (P31 home root) holds operator-locked **values** (EIN, BONDING test baseline, Larmor Hz, schema ids, key DOIs, worker fleet count snapshot, contact URLs).  
**`npm run apply:constants`** copies derived fields into `p31.ground-truth.json`, patches `cognitive-passport/index.html`, and generates **`src/p31-constants-generated.ts`**.  
**`npm run verify:constants`** fails if `ground-truth` drifts. Root **`npm run verify`** runs it after passport sync check, then **`verify:p31ca-contracts`**; **`npm run p31:ci`** runs **`npm run verify`** (full chain) before the p31ca Astro build.

**This file (CANONICAL-NUMBERING.md)** still defines *meaning*; **`p31-constants.json`** holds *data*.

---

## 1. Principles

1. **One writer per namespace** — only the listed **authority** may change the rules for that namespace.
2. **Machine > prose for deploy** — `p31.ground-truth.json` and `public/_redirects` beat marketing copy.
3. **Prose > stale chat** — if a model review doc disagrees with this file or with `ground-truth`, **this file + ground-truth win**.
4. **Immutability after publish** — Zenodo DOIs, WCD history, and append-only audit events are **never** renumbered retroactively; add a **new** ID/version for corrections.

---

## 2. Namespace table

| ID | What it numbers | Format | Authority | Where it lives | Bump rule |
|----|------------------|--------|-----------|----------------|------------|
| **GT** | Machine contract for p31ca.org | `p31.ground-truth/MAJOR.MINOR.PATCH` + same in `"version"` | Maintainer + `verify:ground-truth` | `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | **Semver:** PATCH for typo/clarify; MINOR for new optional keys or routes; MAJOR for breaking redirect/registry contracts |
| **CP-LONG** | Long-form operator narrative (CogPass) | **Semver** `MAJOR.MINOR` (e.g. `5.1`) | Operator / maintainer | `P31 COGNITIVE PASSPORT — v5.md` — **H1** line: `P31 COGNITIVE PASSPORT — vX.Y` | MINOR for sections/addenda; MAJOR for structural re-organization or re-baseline; **filename** may keep historical major (e.g. `v5.md`) until a **filename migration** is explicitly scheduled (see §5) |
| **CP-JSON** | Machine slice JSON from generator | `p31.cognitivePassport/MAJOR.MINOR.PATCH` | Maintainer + `passport:verify` | `cognitive-passport/index.html` export; `p31ca` mirror | **Semver** on **schema** only; export must declare schema string inside JSON |
| **GEN** | Static passport generator page | `Generator (vN)` / meta | Maintainer | `cognitive-passport/index.html` `<title>` and meta | Integer or semver **for the HTML tool only** — independent of **CP-LONG** |
| **WCD** | Work Control Documents | `WCD-NN` or `WCD-NN-…` (suffix if split) | Master Ops Manual process | MOM + repo WCD files | **Monotonic** integers per product area; **never reuse** a number for a different intent |
| **CWP** | Controlled Work Packages | `CWP-P31-<NAME>-<YYYY>-<SEQ>` (example) | CWP author + closure PR | e.g. `CONTROLLED-WORK-PACKAGE-*.md` | New ID per new scope; revision bumps **Version** field **inside** the CWP file |
| **PAPER** | Research outputs | `Paper-roman` or `Paper-Arabic` + **DOI** | Operator + Zenodo | Zenodo, `docs/`, CogPass | **DOI** is the immutable key; in-repo labels (I, II, III, IV, XII) are **convenience** only |
| **BOND-TEST** | BONDING test baseline | `tests/suites` (two integers) | WCD + CI that enforces it | BONDING package + operator lock | **Only** change with explicit WCD; canonical **413 tests / 30 suites** (as of 2026-04-25 operator lock) — do not “drift” from chat |
| **REV** | Gemini/Opus review doc set | `REVIEW-BUNDLE-YYYY-MM-DD` **or** “Last updated” in header | Maintainer | `docs/GEMINI-OPUS-REVIEW-BUNDLE.md`, `README-REVIEW-DOCS.md` | Date stamp on any material factual change; optional tag `REVIEW-BUNDLE-2026-04-25` in changelog |
| **EPCP-REL** | EPCP implementation reports | Report title + file date | Deploy owner | `cloudflare-worker/command-center/EPCP_*.md` | Document revision in filename or front matter when replacing narrative |

---

## 3. Current authoritative values (2026-04-25)

| Namespace | Value | Notes |
|-----------|--------|--------|
| **GT** | `p31.ground-truth/1.0.0`, `"version": "1.0.0"` | Bump only with contract change + `verify:ground-truth` green |
| **CP-LONG** | **5.1** (H1 in `P31 COGNITIVE PASSPORT — v5.md`) | Replaces any ad-hoc “v4.0 renumber” in old review text — that was **non-canonical** |
| **CP-JSON** | `p31.cognitivePassport/1.0.0` | Bumps only if JSON **shape** changes |
| **BOND-TEST** | **413** tests, **30** suites | Marketing or secondary docs that cite other counts are **wrong** until a WCD changes the lock |

`canonicalNumbering` in `p31.ground-truth.json` mirrors this table for **machine** consumers.

---

## 4. Cross-reference rules (for agents and reviewers)

- Saying **“Passport v5”** means **CP-LONG** (file + H1), not **CP-JSON** schema.
- Saying **“ground truth 1.0.0”** means **GT** only.
- **WCD-33** and **CWP-P31-ECO-2026-01** are different namespaces—do not merge ID schemes.
- **Paper IV** is keyed by **DOI** `10.5281/zenodo.19503542`, not by “version”.

---

## 5. Filename vs edition (CogPass)

- The on-disk name **`P31 COGNITIVE PASSPORT — v5.md`** uses a **filename major** (5) for historical continuity.
- The **authoritative edition** is the **H1** inside the file (**5.1** as of 2026-04-25).
- **Optional later:** rename file to `P31 COGNITIVE PASSPORT — v5.1.md` or `...-edition-5.1.md` in a single migration PR that updates every reference (`ground-truth` mission string, `CLAUDE.md`, links). Until then, **H1 wins** for “what edition is this?”

---

## 6. New namespaces

Before inventing a new public numbering series (e.g. “Sprint-7”):

1. Add a row to §2 of **this file**.
2. If it affects p31ca deploy, add fields under `canonicalNumbering` in `p31.ground-truth.json` and extend `verify-ground-truth.mjs` **only** if a machine check is required.

---

*End of canonical numbering spec.*
