# Runbook: Passkeys red (p31-passkey Worker)

**When to use:** **`p31ca-passkey-register-begin`** glass fails, hub pages error on **`fetch('/api/passkey/...')`**, or crypto / passkey surface checks fail in p31ca security.

**Canonical implementation:** **`andromeda/04_SOFTWARE/p31ca/workers/passkey/README.md`** (endpoints, KV, D1, **`RP_ID`**, zone route **`p31ca.org/api/passkey/*`**). Constants: **`p31-constants.json`** **`mesh.passkeyApiBasePath`** → ingested via **`npm run apply:constants`**.

---

## 1. Glass + live POST

Probe **`p31ca-passkey-register-begin`** in **`p31-ecosystem.json`** posts to **`https://p31ca.org{{mesh.passkeyApiBasePath}}/register-begin`** and expects JSON **`challenge`**.

| Step | Command | Pass |
|------|---------|------|
| A | `npm run verify:ecosystem` | Exit 0 — template **`{{mesh.passkeyApiBasePath}}`** resolves |
| B | `npm run ecosystem:glass` | Row **p31ca-passkey-register-begin** UP |
| C | `P31_GLASS_STRICT=1 npm run ecosystem:glass` | Exit 0 |

---

## 2. Cryptography / source gate (p31ca)

From **`andromeda/04_SOFTWARE/p31ca`**:

| Step | Command | Pass |
|------|---------|------|
| D | `npm run security:crypto` | Exit 0 — quantum-core tests (if present) + passkey Worker source checks (**`scripts/security/verify-crypto-surface.mjs`**) |

**Broader security bar:** `npm run security:check` or `npm run security:check:full` per **`docs/SECURITY-RUNBOOK.md`** (p31ca).

---

## 3. Full stack context (home root)

| Step | Command | Pass |
|------|---------|------|
| E | `npm run release:public` | Exit 0 — includes root **`verify`**, strict mesh, **`hub:ci`**, **`security:check`** when Andromeda is present |

---

## 4. Deploy / routes

| Step | Command / doc | Notes |
|------|----------------|--------|
| F | `npm run ecosystem:plan` | Locate **`p31-passkey-worker`** in **`p31-ecosystem.json`** **`deployables`** |
| G | **`workers/passkey/wrangler.toml`** + **`workers/passkey/README.md`** | Zone route must match production **`p31ca.org`** API path |

Edge / Access interactions: **`andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`** (from home: see AGENTS pointer).
