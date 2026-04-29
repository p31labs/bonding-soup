# P31 Document Foundry

**Status:** v1 **complete** (local spine); **v1.1** R2 + **`push`**; **v1.2** **Queue** + **`job create` / `job get`**; **v1.3** **`GET /v1/jobs`** (R2 list) + **`job list`**, and **per-edge-isolate** mutation rate limit (**`FOUNDRY_RL_PER_MINUTE`**, disable with **`0`**). **D1** / **global** rate limits remain **v2+**.

## Purpose

One **document intelligence spine**: **ingest → canonical record (hash-addressed) → optional local store → composable pipelines → optional JSONL events** for automation (grants, legal bundles, research registry, mesh/social signals).

**Not in v1:** public anonymous upload, OCR farm, automatic PII stripping, multi-tenant auth. Those are **v2+** (Worker + R2 + queue + policy engine).

## Components (shipped)

| Piece | Path | Role |
|--------|------|------|
| **Python package** | `packages/p31-foundry/` | CLI **`p31-foundry`**: `doctor`, `ingest`, `manifest`, `run`, **`push`**, **`job`** (`create`, `get`, **`list`**). |
| **Pipelines** | `src/p31_foundry/pipelines/` | `bundle-inventory`, `text-concat`, `grant-scaffold`. |
| **Edge worker** | `packages/p31-foundry/worker/` | **v1.3:** R2 + queue + **`GET /v1/jobs`** list; optional bearer; **`FOUNDRY_RL_PER_MINUTE`** on POST/PUT; CLI **`push`** + **`job`**. |
| **Office (legal PDFs)** | `packages/p31-office/` | Discovery exhibit assembly — **consumer** of Foundry manifests, not duplicate ingest. |
| **Zenodo scan** | `p31labs/scripts/zenodo_scan_local.py` | Invoked via **`p31-office zenodo scan`**; Foundry can reference manifests produced here in v2. |

## v1 complete (definition of done)

1. **Ingest** PDF (text extract via `pypdf`), UTF-8 text-like files, optional DOCX (`pip install 'p31-foundry[docx]'`).
2. **Stable `DocumentRecord`** JSON (id = sha256 of bytes, paths, mime, page count, preview, errors).
3. **Local store** under **`.p31-foundry/`** or **`P31_FOUNDRY_ROOT`** with `artifacts/<sha256>/record.json` + `source.bin`.
4. **Three pipelines** wired and documented:
   - **`bundle-inventory`** — directory manifest for downstream tools / humans.
   - **`text-concat`** — context pack for LLM/RAG prep (manual review always).
   - **`grant-scaffold`** — JSON checklist skeleton for grant packaging.
5. **Events** — optional **`events.jsonl`** append (`--emit-events`) for “social engine / ops” subscribers (small facts, not raw PII dumps).
6. **Worker** — **v1.3:** R2 + queue + job list + best-effort mutation RL; **v2:** real extract, D1, global RL.

## CLI quick reference

```bash
npm run office:install    # installs p31-office + p31-foundry into Discovery/.venv
npm run foundry -- doctor
npm run foundry -- ingest ./README.md
npm run foundry -- manifest ./Discovery --glob '*.pdf' -o /tmp/m.json
npm run foundry -- run text-concat -- ./README.md ./AGENTS.md -o /tmp/bundle.txt
npm run foundry -- run grant-scaffold -- --out ./out/grant_pack_skeleton.json
npm run foundry -- push --url https://<worker>.workers.dev --file ./path/to/file.bin --bearer '<secret>'
npm run foundry -- job create --url https://<worker>.workers.dev --json '{"type":"demo"}' --bearer '<secret>'
npm run foundry -- job get --url https://<worker>.workers.dev --id job_<uuid> --bearer '<secret>'
npm run foundry -- job list --url https://<worker>.workers.dev --limit 20 --bearer '<secret>'
npm run foundry:worker:install   # once: worker devDependencies
npm run foundry:worker:dev       # local Worker
npm run foundry:worker:check     # wrangler dry-run (needs worker install)
```

### v1.1 (Worker + push)

- Deploy with **`wrangler`**; create R2 bucket **`p31-foundry-artifacts`** (or edit `bucket_name` in `packages/p31-foundry/worker/wrangler.toml`).
- Set **`FOUNDRY_AUTH_SECRET`** in production (`wrangler secret put`) or leave unset **only** for trusted local dev.
- **`p31-foundry push --url … --file …`** uses PUT to `…/v1/artifacts/by-sha/<sha256>/source`; R2 key is **`artifacts/<sha256>/source.bin`** (same layout as the local store).

### v1.2 (Queue + job CLI)

- Create queue once: **`wrangler queues create p31-foundry-jobs`** (name must match `wrangler.toml`).
- **`POST /v1/jobs`** writes **`jobs/<id>.json`** with **`status: queued`**, sends **`{ job_id }`** to the queue; the consumer updates the same object to **`processing`** then **`completed`** with a stub **`result`** (idempotent if already **`completed`**).
- **`p31-foundry job create`** / **`job get`** call those routes (optional **`--bearer`**).

### v1.3 (Job list + mutation rate limit)

- **`GET /v1/jobs?limit=&cursor=`** — R2 **`list`** under prefix **`jobs/`** (keys matching **`jobs/job_<uuid>.json`**), sorted by **`uploaded`** descending; use **`cursor`** when **`truncated`** is true.
- **`FOUNDRY_RL_PER_MINUTE`** (wrangler **`[vars]`** or override in **`.dev.vars`**) caps **POST `/v1/jobs`** and **PUT artifact** per **`CF-Connecting-IP`** per minute **within each isolate** (not a global cap). Set **`0`** or **`off`** to disable.
- **`p31-foundry job list`** wraps the list route.

## Integration map (next phases — not all built)

| Direction | How Foundry should connect |
|-----------|------------------------------|
| **Grant pipeline** | `grant-scaffold` + manifest from `bundle-inventory` on `docs/` + budgets dir; human edits checklist; CI step validates paths exist (`npm run verify`-style) in v2. |
| **Legal / discovery** | Use **`p31-office discovery assemble`**; Foundry manifest lists raw PDFs + hashes before merge. |
| **Workers** | **Done (partial):** upload → R2; jobs + queue stub; job list; per-isolate mutation RL. **Next:** extract → `DocumentRecord` in **D1**; **global** RL + hardened auth. |
| **Social / mesh** | Only **derived events** (`ingest`, `bundle_inventory`) with **no** raw document text in JSONL; C.A.R.S. consumes counts/checksums if/when you wire a bridge. |

## Threat model (read before “public facing”)

- **Never** expose unredacted legal/financial PDFs on a public URL.
- **Foundry v1 is local-first** by design; moving to “public” requires **tenant isolation**, **virus scan**, and **retention policy**.

## Versioning

- **Foundry spec:** this document + package **`p31-foundry`** (current **1.3.0**).
- Bump **`pyproject.toml`** and **`__version__`** on schema or CLI breaking changes.

---

*Owner: P31 home repo. Map entry: `P31-ROOT-MAP.md` §5a.*
