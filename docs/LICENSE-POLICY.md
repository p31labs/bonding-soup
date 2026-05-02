# P31 License Policy

**Version:** 1.0.0  ·  **Effective:** 2026-05-02  ·  **Schema:** human canon (paired with `scripts/verify-license-headers.mjs`).

This file documents what license applies to which file in the P31 home repository (`p31labs/bonding-soup`). The default is **MIT** (the same license as `LICENSE` at the repo root). Exceptions are explicit, named, and listed below.

The verifier `npm run verify:license-headers` checks that every tracked source file either:

1. Carries a recognized license header, **or**
2. Falls under a directory or path-glob exception listed in §3 below, **or**
3. Is in a category exempt from the gate entirely (§4).

The gate is intentionally permissive in v1: it warns on missing headers but only fails on **conflict** (a file claiming a non-default license that is not on the exception list). Strict-mode comes later, after a license-header sweep in Phase 2.

---

## 1. The default

**MIT License.** Copyright (c) 2026 P31 Labs, Inc. The full text lives in `/LICENSE` at the repo root.

This applies to:

- All `.mjs`, `.js`, `.ts`, `.tsx` source under `scripts/`, `packages/`, `simplex-v7/`, `cars-contract/`, `simplex-email/`
- All `.py` source the home repo owns (excluding vendored libraries)
- All `.html`, `.css`, and `.astro` source we author at the home repo level
- All Markdown documentation under `docs/` not otherwise listed below
- All JSON schemas, contract files, and manifest files under the repo root and `docs/`

Header (recommended for source files at top of file or in a leading block comment):

```
SPDX-License-Identifier: MIT
Copyright (c) 2026 P31 Labs, Inc.
```

Markdown files do not require a header.

---

## 2. Why MIT for the home repo

We considered MPL 2.0 (Mozilla Public License 2.0) as the default because that is what the original Phase-1 plan in `docs/CWP-P31-PEER-COMP-2026-05.md` named. Choosing MIT instead is a deliberate decision:

1. The existing `/LICENSE` already reads MIT and that license has been in effect since the repo's first commit. Changing the default to MPL 2.0 retroactively would require relicensing every contribution, which we cannot do without contributor sign-off.
2. The audience for the home repo includes children learning to code and small family meshes adopting individual files. MIT is the simplest license to read and apply. MPL 2.0's file-level copyleft is appropriate for a browser engine; for a personal-mesh substrate it adds friction without clear benefit.
3. The Cognitive Passport schema is **CC0** (see §3 below) precisely so anyone can copy the format without any attribution friction. MIT default + CC0 schema gives us the same "easy to adopt" posture without inventing a hybrid.

If a future Phase reopens the question, the decision will be documented here, the version of this file will bump, and contributors will be asked to consent to the change.

---

## 3. Exceptions (named, file-by-file or directory-by-directory)

The following files or directories ship under licenses other than MIT. The verifier knows about each entry.

### 3.1 CC0 (Public Domain Dedication)

**Files:**

- `cognitive-passport/cognitive-passport-v1-1.schema.json`
- `cognitive-passport/cognitive-passport-v1.schema.json` (when present)
- Any other `*.schema.json` file we author and explicitly want anyone to copy without attribution

**Why CC0:** The Cognitive Passport is meant to be an interoperable format. We want any tool — including ones we have nothing to do with — to be able to read, write, and extend the format without having to credit P31 Labs. CC0 makes that frictionless.

**Header expected (in a top-of-file `$comment` field):**

```json
"$comment": "SPDX-License-Identifier: CC0-1.0 — P31 Labs, Inc. dedicates this schema to the public domain."
```

### 3.2 CC BY 4.0 (Creative Commons Attribution 4.0)

**Files:**

- `docs/CODE-OF-CONDUCT.md` — adapted from Contributor Covenant 2.1 (CC BY 4.0). The P31-specific clauses in §3 of that file are licensed under the same terms as the rest of P31 documentation (see §3.4 below).

**Why CC BY:** Contributor Covenant ships under CC BY 4.0; adaptations must retain the same license. The attribution requirement is satisfied by the §9 attribution block in the CoC file itself.

### 3.3 Vendored third-party code (keep upstream license)

Any file that originated outside P31 Labs and was copied into the repo for offline use must:

1. Live under a directory named `vendor/`, `third_party/`, or `external/`, **or** carry a `*-vendored.*` suffix
2. Retain its original license header verbatim
3. Be listed in `docs/THIRD-PARTY.md` (to be authored in Phase 2 if vendored libraries multiply)

The verifier currently treats any directory named `vendor`, `third_party`, or `external` (case-insensitive, anywhere in the repo tree) as exempt from the header check. The expectation is that those directories' contents are governed by their own headers.

### 3.4 P31 documentation (this file, the Manifesto, etc.)

**Files:** Everything under `docs/` we author and have not otherwise placed under a different license.

**License:** Same as the home repo default (MIT) for code-like artifacts (JSON contracts, schemas), and **CC BY-SA 4.0** for prose documents (the Manifesto, the Roadmap, this file, the design doctrines, etc.).

**Why CC BY-SA for prose:** Prose documentation invites quoting, adaptation, and translation by other family-mesh projects. Share-Alike keeps adaptations open. Attribution gives the operator their seat at the table without legal complexity.

If you adapt any P31 prose document, the attribution string is:

```
Adapted from "P31 [Document Title]" by P31 Labs, Inc., licensed under CC BY-SA 4.0.
Original at https://github.com/p31labs/bonding-soup/blob/main/docs/[FILE].md
```

### 3.5 Ollama persona prompts

**Files:** Everything under `scripts/p31-fleet-ten/prompts/`.

**License:** **CC0** (public domain dedication).

**Why:** The persona system prompts are the public face of the operator's voice doctrine. We want anyone — including a different family mesh, a different operator, or a different cause — to be able to copy them and adapt them without attribution friction. The doctrine survives because it is replicated, not because we own it.

---

## 4. Categories exempt from the gate entirely

The verifier does not check headers in:

- Generated files (anything under a directory named `dist/`, `build/`, `.cache/`, `node_modules/`, or matching a `*.generated.*` suffix)
- Lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `Cargo.lock`)
- Configuration files where headers are syntactically awkward (`.gitignore`, `.gitattributes`, `tsconfig*.json`, `.env*`, `.npmrc`, `.editorconfig`)
- Binary assets (`*.png`, `*.jpg`, `*.webp`, `*.ico`, `*.pdf`, `*.woff*`, `*.ttf`, `*.svg` — though SVGs MAY carry a leading XML comment header voluntarily)
- Test fixtures and sample inputs explicitly marked as such (under `**/fixtures/`, `**/test-data/`, `**/__fixtures__/`)
- Markdown documentation (the prose license is named in §3.4; per-file headers create more noise than signal)
- This file and `LICENSE` themselves

The exempt list is intentionally narrow. Adding to it requires bumping this file's version.

---

## 5. Contributor License Agreement (CLA)

**Today: none.** P31 Labs does not currently require contributors to sign a CLA. By submitting a pull request you are asserting that the contribution is yours to license under the file's stated license (or under MIT if no other license is named).

This may change when P31 Labs grows past a single operator and the question of relicensing future versions becomes structurally easier with a CLA. Any change will be announced 30 days in advance via the public roadmap (`docs/ROADMAP.md`) and discussed in a public issue.

---

## 6. Reporting a license problem

If you believe a file in this repo carries a license header that is incorrect — or if a file you contributed under one license appears in the repo under another — report it via the same channel as a security report:

- Open a private security advisory on `github.com/p31labs/bonding-soup`, **or**
- Email the operator (channel TBD until `security@p31labs.org` is live)

Mis-licensed files are treated as bugs and fixed promptly. A public correction note will be added to this file's edition log.

---

## 7. The verifier

`npm run verify:license-headers` runs `scripts/verify-license-headers.mjs`. It walks the repo tree, classifies each tracked file under the rules above, and reports:

- **Missing header (warning):** A file under default-MIT scope that has no recognizable header. v1 reports these but does not fail the build.
- **Wrong header (error):** A file claims a license that conflicts with the rules in this document. The build fails.
- **Unknown extension (info):** A file type the verifier does not know about. Logged for review.

The verifier is wired into the root `npm run verify` chain via `p31-alignment.json` and `package.json`. See `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-1J.

---

## 8. Edition log

| Version | Date | Note |
|---------|------|------|
| 1.0.0 | 2026-05-02 | Initial publication. Default MIT (matches existing `/LICENSE`); CC0 for schemas + persona prompts; CC BY-SA 4.0 for prose docs; CC BY 4.0 for the CoC adaptation; vendored code keeps upstream headers. Companion to `docs/P31-MANIFESTO.md` (Commitment C5) and `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-1J. |

---

*License Policy version 1.0.0 — 2026-05-02. Authoritative for the home repo only; the Andromeda monorepo and the p31ca hub may carry their own license headers per their own contribution policies.*
