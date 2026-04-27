# P31 alignment system — ephemeralization

**Goal:** One **source** per concern, many **derived** surfaces; when a source moves, you **know** which commands **heal** downstream and which **verifiers** prove it. **Ephemeralization** (Fuller): do more with less — less duplicated truth, less manual sync, fewer silent drifts.

## Machine registry

| File | Role |
|------|------|
| **`p31-alignment.json`** | Schema `p31.alignment/1.0.0` — `sources` (canonical paths), `derivations` (edges: from → to, `apply`, `verify`), `verifyPipeline` (ordered `npm run` list — **keep in sync** with root `package.json` **`verify`**) |
| **`scripts/verify-alignment.mjs`** | Fast check: JSON valid, required `sources` exist. Flags: `--verify` runs the full `verifyPipeline` (same as chained `npm run verify` when run from a full checkout) |
| **`docs/P31-HUB-CARD-ECOSYSTEM.md`** | Normative p31ca hub: registry **id** set = **`hub-app-ids.mjs`** **HUB_ALL_CARD_ORDER**; one card, one about, one `appUrl` |
| **`andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs`** | Product copy and URLs (required when Andromeda checkout present; optional source in `p31-alignment.json`) |
| **`andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs`** | Home grid + prototype id order (same optional presence as registry) |
| **`p31-live-fleet.json`** | Live sites + mesh/payment lines; `meshAndPayments` must track **`p31-constants.json`** (see `verify:ecosystem`); `sources` includes `p31-integrations.json` when shipped |
| **`docs/P31-INTEGRATIONS-BRIDGE.md`** | Smart home / wearables / operator OSS bridge — pairs with **`p31-constants.json` → `integrations`** |
| **`andromeda/04_SOFTWARE/p31ca/security/worker-allowlist.json`** | `p31.workerAllowlist/1.0.0` — every deployed Worker’s `name` in `wrangler.toml` (optional if no Andromeda) |

**Hub card ↔ about ↔ app (p31ca):** **`docs/P31-HUB-CARD-ECOSYSTEM.md`**, **`andromeda/04_SOFTWARE/p31ca/scripts/hub/registry.mjs`**, **`andromeda/04_SOFTWARE/p31ca/scripts/hub/hub-app-ids.mjs`** — registered in **`p31-alignment.json`** and enforced by p31ca **`scripts/hub/verify.mjs`**.

**Document generators (comments / emitted metadata reference alignment):** `generate-about-pages.mjs` (HTML comment on every `*-about.html`), `hub/build-landing-data.mjs` (`meta` on `hub-landing.json`), `apply-constants.mjs` + `lib/p31-constants-fragment.mjs` (ground-truth `mission` + `p31-constants-generated.ts` header), `apply-p31-style` (root + p31ca), `sync-tailwind-cdn-pages.mjs`, `enrich-mvp-about-pages.mjs`, `passport-p31ca-transform` + `sync-passport`, `sync-soup-to-bonding`, `p31-style-generate.mjs`, `hub/verify.mjs`, `ops/ingest-glass-probes.mjs`, `inventory-cf.mjs`, and `verify-constants.mjs` file headers. Re-run `apply:constants` and p31ca `build-landing` / `generate-about-pages` when mission or hub meta changes.

**Commands:**

- `npm run verify:alignment` — registry + required paths (runs first in `npm run verify`)
- `npm run verify:alignment -- --verify` — run `verifyPipeline.scripts` from `p31-alignment.json` (skips a duplicate `verify:alignment` if listed)

**Keep in sync:** `verifyPipeline` in `p31-alignment.json` must match root `package.json` **`verify`** (prelude = `verify:alignment`, then the same `npm run` chain through `build`).

## Same but different (appearances)

- **`p31-universal-canon.json`** encodes **hub** and **org** from one palette — different `data-p31-appearance`, same tokens. Not two design systems; two skins.
- **Cognitive Passport** (author) vs **p31ca mirror** (deploy): *same* content through the *transform* — not two hand-edited files.

## Heal vs proof (high-traffic edges)

| Source | Sink | Heal | Proof |
|--------|------|------|--------|
| `p31-constants.json` | `p31.ground-truth.json` (numbering) | `npm run apply:constants` | `npm run verify:constants` |
| Design canon | `p31-style.css` (passport + p31ca public) | `npm run apply:p31-style` | `npm run verify:p31-style` |
| `cognitive-passport/index.html` | `p31ca/public/passport-generator.html` | `npm run sync:passport` | `npm run verify:passport` |
| `soup.html` + assets | `bonding/public/soup/` | `npm run sync:soup-bonding` | Bonding build + deploy discipline |
| Hub `registry.mjs` + `hub-app-ids.mjs` | `hub-landing.json` | p31ca `hub:build` / postinstall | p31ca `prebuild` hub verify (`scripts/hub/verify.mjs`) |
| `p31-constants.json` (`mesh` / `payment` URLs) | `p31-live-fleet.json` | Edit live-fleet to mirror operator-locked URLs | `npm run verify:ecosystem` |
| `docs/doc-index.manifest.json` + allowlisted `.md` | `docs/doc-library/index.json` | `npm run build:doc-index` | `npm run verify:doc-index` (runs after `build:doc-index` in root `verify`); headless e2e `npm run test:doc-library:e2e` in `p31:all` unless `--skip-e2e` |
| `p31ca/security/worker-allowlist.json` | In-repo `wrangler.toml` set + `build/security-inventory.json` | Add allowlist row when adding a Worker; align `p31-constants` / live-fleet if new mesh URL | p31ca `npm run security:workers` (in `security:check`) |

## Cloudflare Workers (alignment)

- **Allowlist of record:** **`andromeda/04_SOFTWARE/p31ca/security/worker-allowlist.json`**. The inventory script walks **`andromeda/04_SOFTWARE/**`** for `wrangler.toml` and flags names not in the allowlist (P1) — see **`andromeda/04_SOFTWARE/p31ca/scripts/security/verify-worker-inventory.mjs`**.
- **Mesh / client URLs** — **`p31-constants.json`** (`mesh.*WorkerUrl`, passkey, etc.); **proof:** `apply:constants` + `verify:constants`; **bundle:** **`p31-live-fleet.json`** must stay consistent — **`verify:ecosystem`**.
- **Edge + release discipline:** p31ca **`andromeda/04_SOFTWARE/p31ca/docs/EDGE-SECURITY.md`**, **`.../docs/SECURITY-RUNBOOK.md`**; ship bar for Workers includes **`security:check`** (audit + workers + CORS) on release / CI paths per **`AGENTS.md`**.

**Normative ship bar** remains **`docs/P31-ENGINEERING-STANDARD.md`** and root **`npm run verify`**.

## Agent / human workflow

1. Edit a **source** in `p31-alignment.json` → `sources` if you add a new canonical file.
2. Add or update a **derivation** when a new one-way dependency appears (document `apply` + `verify` even if verify is “run p31ca build”).
3. If you add a new step to **`npm run verify`**, update **`p31-alignment.json`** → `verifyPipeline.scripts` in the same PR so the registry stays the map of record.

## Ethics & style (non-normative to JSON)

- **`docs/ETHICAL-STYLE-MAP.md`** — how tokens and motion should *behave*; alignment enforces *consistency* of artefacts, not taste. Both matter.

**Version:** 1.0.0 (2026) — extend `p31.alignment` with new fields only in a new schema minor if scripts must branch.
