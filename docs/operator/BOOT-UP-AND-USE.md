# Boot up and use — the operator loop

**Status:** runbook (action-first, no preamble)
**Updated:** 2026-05-02
**Audience:** Operator, on a Chromebook / iPhone / laptop, with `bonding-soup` cloned and `npm install` done.
**Schema:** `p31.operatorRunbook/1.0.0`
**Mesh canon:** `docs/MORNING-OPERATOR-ARC.md` is the lived-time arc; this file is the **mechanical loop** under it.

The operator's stated goal: *"i want to boot up my device and use our stuff."* This page is that loop in the smallest number of moves. One source, linked from `vibe.html`, `soup.html`, `cognitive-passport/index.html`, `p31-personal-howto.html`, and the `view` slug `boot-up` inside the PiP CLI itself.

---

## The loop (six moves, ~30 seconds after first time)

1. Open a terminal at the repo root.
2. `npm run command-center` (binds `127.0.0.1:3131`; bookmark-friendly).
3. Open `http://127.0.0.1:3131/vibe` in your browser.
4. Pick a mode: **chat** (PHOS personas), **cmd** (whitelisted scripts), **view** (eight operator docs inline).
5. Run anything. After a `cmd` finishes, click *Ask PHOS for the next move* beneath the output to flow into chat with full context prefilled.
6. `Ctrl+C` in the terminal to stop. The browser tab can stay open; it shows `ERR_CONNECTION_REFUSED` until you restart.

---

## What each mode is for

| Mode | When | What |
|---|---|---|
| **chat** | "I need a thinking partner" | Pick a persona (`p31-phos`, `p31-mechanic`, `p31-counsel`, `p31-scribe`, `p31-narrator`, `p31-quick`, `p31-triage`, `p31-oracle`, `p31-debrief`, `p31-firmware`); type; send. Operator-confidential personas (`counsel` / `triage` / `phos`) only run locally and are flagged in the UI. |
| **cmd** | "I need an action to actually run" | Click a card. Each card runs an `ACTIONS`-whitelisted script via `execFile` (no shell). Today: `home-doctor`, `home-verify`, `home-fleet-probe`, `home-fleet-free-host`, `home-deploy-p31ca`, `home-release-public`, `home-build-phos-voice`, `home-verify-phos-voice`, `home-p31-ci`, `home-fun`. Add more by editing `scripts/command-center/actions.registry.mjs`; the gate `verify:vibe-pip-whitelist` keeps `COMMANDS` in sync. |
| **view** | "PHOS just said *look at AGENTS.md §6*" | Pick a slug from the dropdown: `manifesto`, `vibe-cwp`, `peer-cwp`, `morning-arc`, `agents`, `delta-language`, `public-voice`, `engineering-standard`, `boot-up`. The doc renders as raw markdown in a `<pre>` — same as `cat` would show. |

---

## Boot from cold (first device, first session)

Once per device:

```bash
git clone https://github.com/p31labs/bonding-soup ~/p31
cd ~/p31
npm install                  # one minute
npm run setup                # full install + apply:constants + verify
npm run p31:link             # makes `p31` CLI available; idempotent
```

Then the loop above. `npm run doctor` confirms health before the first `npm run command-center` if anything feels off.

---

## When the loop breaks (top three failure modes, fix in one line)

| Symptom | Fix |
|---|---|
| `Error: listen EADDRINUSE :::3131` | Port already taken. `P31_CMD_CENTER_PORT=0 npm run command-center` (auto-pick port; banner prints the chosen one). |
| Persona dropdown shows `(not built)` next to every entry | Local Ollama not materialized. `npm run fleet:probe` shows status; `bash scripts/p31-fleet-ten/setup.sh` builds them (needs Ollama installed). |
| `cmd` button click shows `400 bad action` in the response | Substrate ↔ registry drift. Run `npm run verify:vibe-pip-whitelist` — it will name the drift. Fix by adding the missing `home-*` entry in `scripts/command-center/actions.registry.mjs` or renaming the substrate `key`. |

---

## When you cannot stay (operator condition aware)

If the operator is in a calcium dip (hypoparathyroidism — limits 8.0 – 9.0 mg/dL), or in a spoon deficit, the loop reduces to:

1. `npm run command-center`
2. `http://127.0.0.1:3131/desk` — read-only operator desk; SIMPLEX poll, no whitelist, no buttons.
3. Walk away. Nothing runs without you.

The desk is the same Node process at the same port; no second service. Per the ephemeralization gate (CWP-P31-VIBE-2026-06 §4.5).

---

## Reference

- **Substrate**: `command-center-terminal.html` (one HTML file, served at `:3131/term`, `:3131/terminal`, `:3131/vibe`).
- **Server**: `scripts/p31-local-command-center.mjs` (`/api/run`, `/api/personas`, `/api/persona-chat`, `/api/view-doc`, `/api/health`, `/api/mesh-pulse`).
- **Whitelist**: `scripts/command-center/actions.registry.mjs` (`ACTIONS`).
- **Doc allowlist**: `DOC_SLUG_ALLOWLIST` constant inside `scripts/p31-local-command-center.mjs` near `/api/view-doc`.
- **CWPs**: `docs/CWP-P31-VIBE-2026-06.md` (this loop's controlling document; §16 / §17 / §18 / §19 record what shipped and when).
- **Manifesto**: `docs/P31-MANIFESTO.md` (the floor; `/manifesto` route on `p31ca.org`).
- **Public mirror**: `https://p31ca.org/vibe` describes the loop for visitors and links to it; the launch buttons there assume `127.0.0.1:3131` is up on the operator's own device.

---

## What this page is not

- A marketing page. (See `andromeda/04_SOFTWARE/p31ca/public/vibe.html` for that.)
- A complete reference. (See `AGENTS.md` for the workspace map and `docs/CWP-P31-VIBE-2026-06.md` §4 for the substrate inventory.)
- A guarantee. The loop is shipped on the operator's local Chromebook and the local Ollama fleet; it is not a hosted service.
