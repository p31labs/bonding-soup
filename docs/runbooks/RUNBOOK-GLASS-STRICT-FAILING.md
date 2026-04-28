# Runbook: Glass strict failing (ecosystem probes)

**When to use:** **`P31_GLASS_STRICT=1 npm run ecosystem:glass`** exits non-zero, **`p31:all`** / scorecard work flagged glass, or you need the JSON audit of which **`p31-ecosystem.json`** probes are down or slow.

**Implementation:** **`scripts/ecosystem-glass.mjs`** — reads **`p31-ecosystem.json`** + **`p31-constants.json`**, expands **`{{mesh.*}}`**, **`{{payment.*}}`**, **`{{bonding.*}}`**, fetches each probe, writes **`/tmp/p31_glass_report.json`** (override with **`P31_GLASS_REPORT`**).

---

## 1. Run the probe table

| Step | Command | Pass |
|------|---------|------|
| A | `npm run ecosystem:glass` | Exit 0 (default: informational even if rows are down) |
| B | `P31_GLASS_STRICT=1 npm run ecosystem:glass` | Exit 0 — **fails** if any probe is **down** (not **auth** / **warn**) |
| C | `P31_GLASS_BUDGET_STRICT=1 npm run ecosystem:glass` | Exit 0 — **fails** if any row exceeds latency budget (see **`p31-facts.json`** / **`P31_GLASS_BUDGET_MS`**) |

**Timeouts:** **`P31_GLASS_TIMEOUT_MS`** (default **12000** in script header).

**Machine-readable:** `node scripts/ecosystem-glass.mjs --json` or read the report file above.

---

## 2. Fix the manifest, not the script

| Step | Command | Pass |
|------|---------|------|
| D | `npm run verify:ecosystem` | Exit 0 — every **`glassProbes[].url`** template key exists in **`p31-constants.json`** (or bonding/payment namespaces as enforced) |
| E | `npm run verify:constants` | Exit 0 — constants JSON valid and aligned with fleet templates |

If a probe should be optional when a URL is empty, use **`skipIfEmpty`** on that probe (skipped rows appear in report **`skipped[]`**).

---

## 3. Map failures to incident runbooks

| Glass `group` / `id` pattern | Next doc |
|------------------------------|----------|
| **`k4-personal-*`**, cage, hubs | [RUNBOOK-MESH-RED.md](./RUNBOOK-MESH-RED.md) |
| **`p31ca-hub-*`**, Pages shortcuts | [RUNBOOK-HUB-RED.md](./RUNBOOK-HUB-RED.md) |
| **`donate-api-*`** | [RUNBOOK-PAYMENTS-RED.md](./RUNBOOK-PAYMENTS-RED.md) |
| **`p31ca-passkey-*`** | [RUNBOOK-PASSKEYS-RED.md](./RUNBOOK-PASSKEYS-RED.md) |

---

## 4. Operator surfaces

| Step | Command / URL | Notes |
|------|---------------|--------|
| F | `npm run connection` | Prints **`https://p31ca.org/`**, **`/ops/`**, mesh URL, deploy canon path |
| G | `npm run command-center` | Local **`http://127.0.0.1:3131`** — whitelisted **`ecosystem:glass`** action (see **`scripts/command-center/actions.registry.mjs`**) |
| H | `npm run build:fleet-portal` | Regenerates **`fleet-portal.html`** glass section from **`p31-ecosystem.json`** |
