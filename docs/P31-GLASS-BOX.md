# P31 Glass Box — public live transparency terminal

**Schema:** `p31.glassBox/0.1.0` · **Page:** `glass-box.html` (root) · **Live:** [`https://p31ca.org/glass-box`](https://p31ca.org/glass-box) (short routes `/glass`, `/transparency`).

## Why

The point of "vibe with AI" infrastructure is to **show the work**. The Glass Box is a public, read-only terminal that streams what would otherwise be invisible: tests, simulations, and reports happening behind the scenes. No login, no analytics, no operator secrets — only what we'd publish anyway, made watchable.

It is **not** the operator UI. That lives at `/ops` (`CWP-P31-UI-2026-01`) and is locked. The Glass Box is the gallery window; the operator console is the workshop.

## What you see

Three panels:

1. **Terminal (left)** — synthetic CLI playback of:
   - `verify:alignment`, `verify:contract-registry`, `verify:reports-index`, `verify:launch-readiness-config`, `npm run verify` (full)
   - `launch:audit` (10-lane readiness score)
   - `reports:simulate` — `steady-week`, `incident-day`, `urgent-storm`
   - `ecosystem:glass` (probe rollup)
   Output is **synthetic**, line-for-line modeled on real CLI output, marked `[SYN]`. No server-side run; no risk; no data leakage.
2. **Live reports feed (right top)** — real, public, committed: polls `reports/index.json` every 60s. When the operator commits a fresh index, it shows up here.
3. **Generate snapshot (right bottom)** — one-click client-side summary of the session (recent runs, feed counts, timestamps). Downloadable as `.json` or `.md`. Pure local; pure public-safe.

## Honest banners

The header carries two badges:

- `LIVE: reports feed` — real data, refreshed from the public index.
- `SYNTHETIC: test playback` — replayed simulations. Not running on a server.

The terminal stamps every replay with `[SYN]` so you can never confuse a faithful playback with a live run.

## Auto-pilot

Click **auto-pilot** and the terminal cycles through a calm rotation of all the surfaces with realistic delays. Visitors who don't click anything still see motion — same way a science museum has a slow-moving exhibit no one has to operate.

## Speed and pause

`0.5× / 1× / 2× / 4×` slider · `pause` · `stop` · `clear`. Keyboard: `c` clear · `p` pause · `x` stop · `r` generate report · `?` help.

## Generate report

Click **generate report** and the page builds a snapshot envelope (`p31.glassBoxSnapshot/0.1.0`). It includes:

- Page URL and timestamp.
- The reports feed source, count, and most recent rows.
- This session's playback history (last 20 runs, durations).
- A note explaining the synthetic-vs-live distinction so the file is self-explanatory if anyone forwards it.

Two downloads: machine `.json` and human `.md`. Both safe to share — there's nothing in them the public couldn't already see.

## Files

| Path | Role |
|---|---|
| `glass-box.html` | The page. Single file, vanilla JS, no build, no deps. |
| `glass-box-widget.html` | Iframe-friendly compact widget (verify-pulse + latest reports). |
| `docs/verify-pulse.json` | `p31.verifyPulse/0.1.0` — committed heartbeat of the last 20 successful root verify runs (operator opts in). |
| `docs/reports/promoted/index.json` | `p31.reportsPromoted/0.1.0` — generated index of reports the operator chose to publish via `npm run reports:promote`. |
| `scripts/build-glass-box.mjs` | Mirrors page + widget + `reports/index.json` + `verify-pulse.json` + `promoted/index.json` into `p31ca/public/`. |
| `scripts/verify-glass-box.mjs` | No-secret + structure gate for both page and widget (in root `npm run verify`). |
| `scripts/record-verify-pulse.mjs` | Append a pulse entry. Run via `npm run pulse` or `npm run verify:pulse`. |
| `scripts/p31-verify-with-pulse.mjs` | `verify` + auto-record on success. |
| `scripts/build-reports-promoted-index.mjs` | Scan `docs/reports/promoted/` and write `index.json`. |
| `scripts/verify-verify-pulse.mjs` / `scripts/verify-reports-promoted-index.mjs` | Schema gates (in root `npm run verify`). |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | `routes.glassBox` + edge redirects `/glass-box`, `/glass`, `/transparency`. |
| `andromeda/04_SOFTWARE/p31ca/public/{glass-box.html, glass-box-widget.html, verify-pulse.json, reports/{index.json, promoted/index.json}}` | Mirrored copies (do not edit; rebuild via `npm run build:glass-box`). |

## Commands

```bash
npm run demo                                  # serves at http://127.0.0.1:8080/glass-box.html
npm run build:glass-box                       # mirror page + widget + indexes to p31ca/public/
npm run verify:glass-box                      # no-secret + structure gate
npm run pulse -- --ms <ms> --steps <n>        # append one verify-pulse entry
npm run verify:pulse                          # `npm run verify` + auto-record pulse on success
npm run build:reports-promoted                # scan docs/reports/promoted/ → index.json
npm run verify:verify-pulse                   # schema gate for verify-pulse.json
npm run verify:reports-promoted               # schema gate for promoted index + .md existence
```

## Embed widget

Drop the widget into any p31 page in two lines:

```html
<iframe src="/glass-box-widget.html"
        width="540" height="360" frameborder="0"
        loading="lazy"
        style="border:0; max-width:100%; border-radius:8px"
        title="P31 Glass Box — live heartbeat + reports"></iframe>
```

The widget shows the **last verify pulse** badge and the **latest 8 public reports**, polling every 60s. Footer link opens the full terminal at `/glass-box.html`. Same no-secret guards as the main page.

## Forbidden tokens (verify gate)

The verifier rejects the page if any of these appear in `glass-box.html`:

- BEGIN PRIVATE KEY blocks · AWS / Google / Stripe / Slack / GitHub PAT-shaped tokens
- `CLOUDFLARE_API_TOKEN`
- Operator-local archive paths (`.p31/operator-shift`, `.p31/launch-log`)

It also fails if the hub mirror has drifted from the source.

## Hosting

- Static. Cloudflare Pages on `p31ca.org`. No server.
- The reports index is fetched relative; works on the demo server (`/reports/index.json`) and on production (`https://p31ca.org/reports/index.json`).
- The page itself sets `cache: "no-store"` for the index so the feed stays fresh.

## Design notes (anti-FOMO)

- No streak counters, no leaderboards.
- No fake spinners that imply work is happening when it isn't.
- Pause is a first-class control.
- Synthetic ≠ deceptive: every replayed line carries the `[SYN]` tag.
- Footer is honest: "no tracking · no analytics · no secrets".

## Extending

To add a new replayable script:

1. Add an entry to the `SCRIPTS` object in `glass-box.html` with `id`, `label`, and an array of `{t, line, delay?}` lines.
2. Add a button in the relevant `<div class="group">` with `data-script="<id>"`.
3. Optionally add the id to `AUTO_PILOT` so it joins the rotation.
4. `npm run build:glass-box` to mirror, `npm run verify:glass-box` to confirm no regressions.

## Where it lives in the ecosystem

The Glass Box is one of four public visual surfaces:

- **`/visuals`** (`demos/index.html`) — the gallery: K₄ family mesh (Three.js), alignment graph (force-directed sources × derivations), Larmor pulse (one constant beating across many surfaces), and the Glass Box itself.
- **`/glass-box`** (this page) — the public terminal.
- **`/glass-box-widget.html`** — embeddable iframe widget (PULSE badge + recent reports).
- **`docs/P31-DEEP-DIVE.md`** — the prose tour of what makes those visuals possible (counts, files, ship-bar gates).

Linked from every entry-parity surface (`soup.html`, `p31-personal-howto.html`, `p31-device-setup.html`, `cognitive-passport/index.html` footer, `fleet-portal.html`, hub home `index.astro`, `connect.html` header, `delta.html` CTA row). Mirrored to `andromeda/04_SOFTWARE/p31ca/public/` by `npm run build:glass-box` (the page) and `npm run build:demos` (the gallery).
