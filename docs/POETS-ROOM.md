# Poets Room

**HTML:** [`poets-room.html`](../poets-room.html) — open with `npm run demo` → `http://127.0.0.1:8080/poets-room.html`.

**Hub (p31ca):** [`public/poets.html`](../andromeda/04_SOFTWARE/p31ca/public/poets.html) — canonical `https://p31ca.org/poets` · quotes mirror [`public/poets-room-quotes.json`](../andromeda/04_SOFTWARE/p31ca/public/poets-room-quotes.json) (same shape as home [`poets-room-quotes.json`](../poets-room-quotes.json)).

## What it is

A **non-operational** surface: no crew APIs, no mesh, no D1, no accommodation logging, no analytics. First paint is void (`#05080c`); after two seconds the day’s quote fades in (deterministic index from `day_of_year % quotes.length`). Scroll reveals a **shelf** (quiet objects, one external link to Paper IV on Zenodo) and a **private** `localStorage` writing area — not uploaded, not read by agents.

**Verify:** `npm run verify:poets-room` — relative links in `poets-room.html` plus **structural** validity of `poets-room-quotes.json` only (not literary QA).

**Alignment:** `p31-alignment.json` sources `poets-room-lobby` → `poets-room.html`; hub registry id `poets`.

*Search hooks:* contemplative, gray rock, void, quote, private writing, no telemetry, Fuller, Larmor.
