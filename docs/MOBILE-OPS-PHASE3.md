# Mobile ops — Phase 3 (Command mode: glass, shift, deploy)

**CWP:** `CWP-P31-MOBILE-OPS-2026-01`  
**Goal:** One place to **operate** the fleet: local whitelisted actions, edge glass, shift, and a repeatable deploy path from the Chromebook.

## 1. Scripts (home repo `package.json`)

| Script | Role |
|--------|------|
| `npm run morning` | Pull (best-effort) + `p31:converge` + LAN command center. |
| `npm run p31:converge` | Pre-flight before deploy (ECO, optional passkey, education, node-zero, constants). |
| `npm run ecosystem:glass` | All probes in `p31-ecosystem.json` — report in terminal + `/tmp/p31_glass_report.json`. |
| `operator:shift-status` / `shift-in` / `shift-out` | Local operator focus log (`~/.p31/operator-shift.jsonl`). |
| `npm run p31:all` / `npm run verify` | Full bar when you are cutting a big release. |

**Automated gate:** from repo root:

```bash
npm run mobile-ops:phase3
```

Options: `--skip-glass` (offline / fast), `--skip-shift` (no edge fetch).  
This checks required scripts, `p31ca` **predeploy** + **deploy** (when the tree is present), runs `ecosystem:glass` (unless skipped), and **GET** the public `operator-shift` URL from `p31-ecosystem.json` (default: `https://command-center.trimtab-signal.workers.dev/api/operator/shift`).

## 2. Deploy (p31ca, production edge)

| Step | Command |
|------|--------|
| 1 (home) | `npm run p31:converge` and/or `npm run verify` as needed |
| 2 (p31ca) | `cd andromeda/04_SOFTWARE/p31ca` → `npm run deploy` |

`deploy` is defined with **`predeploy` = `npm run verify`** (passport, prebuild chain, `astro build`, postbuild checks), then `wrangler pages deploy dist` (see that package’s `package.json` for exact flags).

**Secrets:** `wrangler login` / `CLOUDFLARE_API_TOKEN` per `p31ca/DEPLOY.md` / `AGENTS.md`.

## 3. Where to look in the UI

- **Local command center** (`http://<LAN-IP>:3131`): whitelisted **ecosystem:glass** and **operator:shift-*** actions; callout text links to this doc, **/ops**, and **edge shift JSON**.
- **Production glass:** [https://p31ca.org/ops/](https://p31ca.org/ops/) (ingested probes + shift line on hub).

## 4. iPhone (optional)

The local console does not render live glass in the browser (you run the action and read output, or use **/ops** in Safari). No second device is required for deploy or **glass**; iPhone is additive.

**Version:** 1.0.0 — 2026-04-28
