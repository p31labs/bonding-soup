# P31 security suite — implementation plan (for Claude Code / agents)

**Goal:** A **repeatable, ownable** security program across the P31 **home** repo, **Andromeda / p31ca**, **workers**, and (when present) **separate** trees (`phosphorus31.org`, `wcd33-global-archive`), without replacing Cloudflare or GitHub’s platform controls—**complementing** them with **inventory, contract checks, and optional SAST/SCA** in CI.

**Non-goals:** Red team / pentest as a service; replacing SOC2; false confidence from green CI without human triage.

---

## 0. Conventions (lock these first)

| Item | Choice |
|------|--------|
| **Runner** | GitHub Actions on `push` + `pull_request` + `workflow_dispatch`; optional **self-hosted** later. |
| **Policy** | Fail **CI** on **P0** (see tiers); **P1** = warning / SARIF upload; **P2** = report only. |
| **Monorepo roots** | Job matrix: `p31-home` (repo root if applicable), `p31ca` = `andromeda/04_SOFTWARE/p31ca`, `workers` under `p31ca/workers/*` and `k4-cage` etc. as discovered. |
| **Artifacts** | Upload **SARIF** to GitHub Security (Code scanning) where supported. |
| **Secrets** | **Gitleaks** or **trufflehog** in CI; `.gitleaks.toml` to exclude `*.lock`, `dist/`, `andromeda/` if it is a submodule-only mirror—**tune to avoid noise**. |

---

## 1. Phase A — **Contract & inventory** (already partial; **extend**)

These are **fast**, deterministic, and “P31-native.”

1. **Ground truth** — already `verify:ground-truth` (redirects, registry invariants, Three.js pins). **Keep** as **P0** in p31ca `prebuild` / root `verify-p31ca-contracts`.
2. **Synergetic** — `verify:synergetic` (dome / observatory / static surfaces). **P0** in p31ca.
3. **Lattice Oracle** — `verify:lattice-oracle` (magic-crystal, `/oracle`, lattice node). **P0** in p31ca.
4. **Quantum egg hunt** — `verify-egg-hunt` (Larmor, Pauli, anchors). **P0** at root when tree present.
5. **Cognitive passport mirror** — `verify:passport` / p31ca `passport:verify`. **P0** for deploys.
6. **New: Worker inventory script** (Node) — for each `wrangler.toml` under p31ca + known workers:
   - List **routes**, **vars** (names only, not values in logs), **durable object bindings**;
   - Compare to a **optional** `security/worker-allowlist.json` (per-operator).
7. **New: CORS / dangerous header scan** (static) — grep or small script: `Access-Control-Allow-Origin: *` in Workers where credentials expected = **P1** flag for review (not all `*` is wrong).

**Deliverable A:** `scripts/security/verify-contracts.mjs` (orchestrates existing `npm run verify` steps + new inventory JSON output to `build/security-inventory.json`).

---

## 2. Phase B — **Dependency & supply chain (SCA)**

1. **npm audit** — `npm audit --json` in root + `p31ca`; exit code policy: **audit-level** = `high` for P0, `moderate` for P1 (tunable).
2. **lockfile policy** — enforce **one** package manager per package (root **npm** + `package-lock.json`—already the CI path; document **no** ad hoc `pnpm` in Actions without `pnpm-lock`).
3. **License allowlist (optional P2)** — `license-checker` or `nlf` for GPL surprises in `dependencies` (not `devDependencies`) if org cares.

**Deliverable B:** `scripts/security/sca.mjs` wrapping `npm audit` with **suppression file** `security/audit-suppressions.json` (CVE id + expiry + reason) to avoid **perma-red** on accepted risk.

---

## 3. Phase C — **Static analysis (SAST) for TypeScript / JS**

1. **ESLint** with `typescript-eslint` + **security** plugin (`eslint-plugin-security` or `eslint-plugin-no-secrets` for dumb secret literals).
2. **Semgrep** — community ruleset `p/javascript` + `p/typescript` + optional `p/react` for any React pockets; run in CI with **timeout**; upload SARIF.
3. **Triage:** Start with **report-only**; promote rules to error after **noise is low**.

**Deliverable C:** `.github/workflows/security-sast.yml` (or a **composite** job in `p31-ci.yml`) running Semgrep + ESLint on `src/`, `p31ca/src/`, `p31ca/workers/**/src`.

---

## 4. Phase D — **Cloudflare & edge**

1. **Wrangler** — `wrangler whoami` non-interactive in CI only if `CLOUDFLARE_API_TOKEN` is set; otherwise **skip** (document).
2. **CSP (Content-Security-Policy)** — for **static** `public/*.html` that set inline scripts, either:
   - **Document** “Tailwind CDN + inline = no strict CSP without nonce pipeline,” or
   - **Long-term:** move to build-time Tailwind and add CSP headers in `_headers` (Pages) — **P2** program.
3. **Passkey worker** — document **trust boundary** (classical **ECDSA/ RSA** for WebAuthn is **expected**; PQC is for **app-layer** packages like `quantum-core`, not authenticator wire format). Optional **rate-limit** + **auth** on orchestrator as already noted in EGG-HUNT.

**Deliverable D:** `andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md` (operator-facing; p31ca tree) + optional `wrangler` dry-run in CI for **one** canary worker.

---

## 5. Phase E — **Cryptography** (PQC and classical)

*Align with monorepo reality:* If **`@p31/quantum-core`** (or `packages/quantum-core`) exists with `@noble/post-quantum`:

1. **CI test step** — `npm test` in that package; **P0** failure if tests fail.
2. **KAT / size contract** — optional script: assert `ml_kem768` ciphertext length matches FIPS-203 (already in good unit tests if 45/45 as reported).
3. **Do not** claim passkey = ML-DSA; keep **separate** docs.

If **quantum-core** is **not** in the current checkout, gate these steps with **“path exists”** (same pattern as `verify-egg-hunt` / partial clone).

**Deliverable E:** `scripts/security/verify-crypto-surface.mjs` — runs **only if** `packages/quantum-core/package.json` exists; else `echo skip`.

---

## 6. Phase F — **Runtime / mesh (optional, live)**

1. **K4 / mesh** — extend `validate-p31-full.sh` (already has live checks) with **opt-in** `ALLOW_LIVE=1` to avoid flaking in fork PRs.
2. **Uptime** — out of scope for “suite” in-repo; use **Uptime Robot** or CF Health Checks; document URL list in `security/public-endpoints.txt`.

**Deliverable F:** Document **when** to run `validate:full` (operator machine, not every PR).

---

## 7. **Unified entrypoints**

| Command (target) | Purpose |
|------------------|--------|
| `npm run security:check` (root) | Contract + SCA + SAST (fast path, no E2E). |
| `npm run security:check:full` | Adds Semgrep, worker inventory, **optional** live mesh. |
| `npm run security:audit` | SCA + license only. |
| `npm run security:code` | ESLint + Semgrep only. |

Implement by **wiring** `scripts/security/run.mjs` with flags; **no** shell soup in CI—Node for Windows parity.

---

## 8. **CI wiring (recommended)**

1. **`.github/workflows/p31-ci.yml`** — add a **second job** `security` that:
   - `checkout`
   - `cd andromeda/04_SOFTWARE/p31ca` if present else **only** home root
   - run `node ../../scripts/security/run.mjs --ci` from home (or colocate `security/run.mjs` under `.github/…` and symlink—prefer **one** home `scripts/security/`).
2. **Required checks** in GitHub branch protection: `verify` (existing) + `security` (new) when ready.

**Partial clone** (no `andromeda/`): **security** job runs **home-only** SCA + egg-hunt; **skips** p31ca-specific steps (mirror `verify-p31ca-contracts` pattern).

---

## 9. **Order of implementation** (for Claude Code)

1. `scripts/security/run.mjs` + **audit** + **gitleaks** in dry-run, **P1** only.
2. Wire **`npm run security:check`** in **root** `package.json` (and p31ca if needed).
3. Add **ESLint** minimal config to **p31ca** + `workers/passkey` (TypeScript).
4. Add **Semgrep** Action with SARIF upload.
5. **Worker inventory** JSON + `security/worker-allowlist.json` template.
6. **Gitleaks** on schedule **weekly** + on **push to main** (slower OK).
7. **Quantum-core** test gate when package exists.
8. **Document** in **`AGENTS.md`** one line: `security:check` and link to this file.

---

## 10. **Success criteria**

- **< 10 min** total CI for `security` job on a warm cache.
- **Zero** duplicate competing “verify” scripts; **orchestrate** existing npm scripts.
- **One** Markdown **operator runbook** (`docs/SECURITY-RUNBOOK.md` — 1 page: “what to do when audit fails”).

This plan is **intentionally boring**: contracts first, SCA second, SAST third, PQC **only where code exists**, live checks **opt-in**.
