# Incident runbooks (SME index)

**CWP:** `CWP-P31-SME-DOCS-INDEX-2026-01` — one short path per critical incident class. Every step in each runbook maps to a **root `package.json` script**, a **nested `p31ca` script** where noted, or a **documented URL / dashboard** already used in-repo.

| Class | Runbook |
|-------|---------|
| Mesh (k4-personal / cage / hubs red) | [RUNBOOK-MESH-RED.md](./RUNBOOK-MESH-RED.md) |
| Hub (p31ca Pages / build red) | [RUNBOOK-HUB-RED.md](./RUNBOOK-HUB-RED.md) |
| Payments (donate-api / monetary gate red) | [RUNBOOK-PAYMENTS-RED.md](./RUNBOOK-PAYMENTS-RED.md) |
| Passkeys (p31-passkey / register-begin red) | [RUNBOOK-PASSKEYS-RED.md](./RUNBOOK-PASSKEYS-RED.md) |
| Glass strict (ecosystem probes failing or slow) | [RUNBOOK-GLASS-STRICT-FAILING.md](./RUNBOOK-GLASS-STRICT-FAILING.md) |

**Canonical spine:** [P31 deploy canon](../P31-DEPLOY-CANON.md) · [Engineering standard](../P31-ENGINEERING-STANDARD.md) · **`npm run connection`** (prints hub, ops, mesh URL, and doc paths).

**After adding or renaming runbooks:** `npm run build:doc-index` then `npm run verify:doc-index`.
