# Enterprise launch prep — P31 ecosystem pre-flight

**Role:** Final gate before Launch Ops on the sovereign edge stack (`p31ca.org`, Cloudflare Workers, Stripe, GitHub).  
**Audience:** Operators merging Andromeda, rotating secrets, running D1 migrations, and confirming Pages + Zenodo parity.

Related: **`docs/P31-ENGINEERING-STANDARD.md`**, **`docs/P31-DEPLOY-CANON.md`**, **`andromeda/docs/ENTERPRISE_QUALITY.md`**, hub **`npm run hub:ci`** / **`npm run deploy:p31ca`**.

---

## Rolling status

| Phase | State |
|--------|--------|
| **Secrets** | **Complete** — production rotation applied (Wrangler-scoped tokens, **`wrangler secret`**, Stripe webhook signing secrets). |
| **D1 · Pages deploy · Zenodo** | **Outstanding** — operator completes unchecked rows below per release window. **`hub:ci`** must pass locally/CI **before** every **`dist/`** deploy (see Commands). |
| **Post-deploy smoke** | Run **`npm run launch:smoke:net`** from the **home** repo after **`p31ca`** **`dist/`** is live (requires HTTPS egress). Skip offline: **`P31_LAUNCH_SMOKE_SKIP=1`**. |

### Commands

| Goal | Where | Command |
|------|--------|---------|
| Hub bundle gate (Pages **`dist/`** input) | `andromeda/04_SOFTWARE/p31ca` | **`npm run hub:ci`** |
| Monetary + ecosystem proofs | Home repo root | **`npm run verify:monetary`** (or **`npm run verify`**) |
| Live edge probes post-deploy | Home repo root | **`npm run launch:smoke:net`** |

---

## Secret rotation

- [x] **Wrangler:** Production Workers use **scoped** API tokens via CI / operator secrets — never commit long-lived API tokens alongside source.
- [x] **`M2M_BEARER_TOKEN` / M2M auth:** Production values live in **Cloudflare secrets** / **`wrangler secret`**, not in **`wrangler.toml`** or **`public/`**.
- [x] **Stripe webhooks:** **`STRIPE_WEBHOOK_SECRET`** rotated with Stripe Dashboard + Worker secret; **`stripe-signature`** validation aligned.

---

## D1 migrations (production)

- [ ] **Schema parity:** Canonical SQL for each D1-backed Worker (`schema.sql` or migration scripts in-repo) reviewed for the release.
- [ ] **Apply in prod:** **`wrangler d1 execute`** (or your approved migration runner) against the **production** D1 binding has been run successfully for this release cycle — no destructive test against prod without rollback plan.
- [ ] **Post-migrate verification:** Smoke read paths (health, keyed lookups) documented in the Worker runbook succeed after migration.

**Passkey / edge identity (`p31ca` Worker)** — authoritative D1 in active use (`binding` **`DB`**, database **`p31-passkey-db`**):

- Schema: **`andromeda/04_SOFTWARE/p31ca/workers/passkey/schema.sql`**
- When `schema.sql` changes, apply **remote** prod (after review):

```bash
cd andromeda/04_SOFTWARE/p31ca/workers/passkey
npx wrangler d1 execute p31-passkey-db --remote --file=schema.sql
```

(Local dev: use **`--local`** instead of **`--remote`** — see **`workers/passkey/README.md`**.)

---

## Cloudflare Pages (hub)

- [ ] **`npm run build`** in **`andromeda/04_SOFTWARE/p31ca`** completes; **`npm run hub:ci`** passes ( **`verify:ground-truth`**, **`verify:economy`**, **`postbuild`** dist checks).
- [ ] **`dist/` deployment** matches **edge redirects & route notes** in **`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json`** (**`edgeRedirects`** and documented **`routes`**). After deploy: **`npm run launch:smoke:net`** or manual **`curl -I https://p31ca.org/donate`** **`200`**; spot-check **`MAP`** surfaces (`/donate.html`).

---

## Zenodo archival

- [ ] **v1.0.0 Sovereign Infrastructure** (or tagged release artifact set) archived on Zenodo with a **stable DOI** recorded in release notes / changelog (`https://p31ca.org/changelog` when publishing policy applies).
- [ ] Snapshot includes **deterministic manifests** referenced by ground-truth where applicable — no undisclosed divergence between “paper” artifact and deployed edge.

**Deposit checklist (minimal):**

- Annotated **git** tag + **commit SHA** cited in Zenodo metadata.
- **`ground-truth/creator-economy.json`** (+ mirror **`public/creator-economy.json`**) — **`p31.creatorEconomy/1.0.0`** disclosure block.
- **`ground-truth/p31.ground-truth.json`** snapshot (edge redirects + key **`routes`** rows).
- Brief **`AGENTS.md`** / **`verify`** bar reference so reproducibility is cited (no secrets in archive).

*(Record DOI inline here when minted — e.g.* `10.5281/zenodo.xxxxx`.)*

---

## Monetary endpoints (canonical)

Single source for public-facing financial routing for the MAP hub (**`/donate` → `/donate.html`**):

| Route | Purpose |
|--------|---------|
| `https://buy.stripe.com/5kQ14g827gmpcHFb0W8Ra00` | **Stripe Payment Link** — Operator Grant / customer-chosen amount. Optional **`?client_reference_id=`** when **`localStorage.p31_subject_id`** matches **`/^u_[0-9a-f]{32}$|^guest_[0-9a-f]{20}$/`** — **no Stripe.js**, **vanilla `<a href>`** only on the hub surface. |
| `https://github.com/sponsors/p31labs` | **GitHub Sponsors** — developer-centric sponsorship billing. |

**Optional / programmatic:** **`https://donate-api.phosphorus31.org`** — **`POST /create-checkout`** + webhooks; not required for the primary Payment Link UI on **`donate.html`**.

Document deliberate URL changes in **`ground-truth/p31.ground-truth.json`** (**`mapDonateCheckout`**) and **`docs/P31-DEPLOY-CANON.md`** when routing shifts.

---

## Andromeda merge path (operators)

1. Feature-complete branch in **Andromeda** per **`CONTRIBUTING.md`**; home multi-root discipline per **`docs/P31-PARALLEL-WORK-TRACKS.md`**.
2. Merge into **`main`** with clean **`verify`** + **`hub:ci`** locally when **`p31ca`** paths change.
3. Deploy **`p31ca`** **`dist/`** via CI or **`npm run deploy:p31ca`** with Cloudflare secrets present.

---

## Smoke after deploy

- [ ] **`/donate`** / **`donate.html`** — **Operator Grant** and **Developer Sponsorship** links resolve; **SUBJECT_BINDING** toggles with a mocked valid **`localStorage.p31_subject_id`** in DevTools (or automate: **`npm run launch:smoke:net`**).
- [ ] **`https://donate-api.phosphorus31.org/health`** — **`200`** (**`launch:smoke:net`** includes this probe).
- [ ] **`creator-economy.json`** — reachable and **`verify:economy`** unchanged vs ground truth in CI.

---

**When D1 · Pages · Zenodo · smoke rows are green,** Launch Ops shifts to **steady-state**: mesh monitoring, changelog cadence, and stakeholder comms — not speculative refactors.

