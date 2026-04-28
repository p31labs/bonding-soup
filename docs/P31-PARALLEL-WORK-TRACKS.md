# P31 — parallel work tracks (merge discipline)

**Purpose:** Run multiple initiatives **without** mixing repos, constants, or ship bars. One source per invariant (**`p31-alignment.json`**, **`docs/P31-ALIGNMENT-SYSTEM.md`**).

---

## Tracks (merge independently)

| Track | Where | Ship bar | Typical PR scope |
|-------|--------|-----------|-------------------|
| **C.A.R.S. product** | Home root — **`soup.html`**, **`src/`**, **`soup-quantum.css`** | **`npm run verify`**, **`npm run soup:prep:check`** | Perf, sim, canvas; **not** hub Workers |
| **p31ca hub** | **`andromeda/04_SOFTWARE/p31ca/`** | **`npm run hub:ci`** (when tree present) | Registry, ground-truth, Astro, **Workers** in allowlist |
| **Bonding deploy** | **`npm run sync:soup-bonding`** → bonding vertical | After C.A.R.S. milestone + **`apply:constants`** | Thin sync PRs |
| **Mesh / fleet** | **`p31-constants.json`**, **`verify:mesh`**, **`verify:ecosystem`** | Constants + alignment | Worker URLs, budgets — **no invented mesh numbers in prose** |
| **Operator / device** | **`p31-device-setup.html`**, command center, readiness docs | Docs + local only unless hub HTML | LAN UX, Chromebook runbooks |
| **Security / automation** | **`npm run semgrep:p31ca`**, **`npm run p31:all`**, CI | **`security:check`** in p31ca | Deps, allowlist, Semgrep |

---

## Conflict zones (one concern per PR)

- **`p31-constants.json`** — operator-locked fields; always **`npm run apply:constants`** then **`npm run verify`**.
- **`andromeda/.../ground-truth`** — must match hub behavior; **`npm run verify:ground-truth`** in p31ca.
- **`p31-alignment.json`** — new derivations need a row + **`verify:alignment`**.

---

## Commands (quick)

```bash
npm run verify              # Home full bar
npm run semgrep:p31ca       # p31ca SAST only (needs semgrep on PATH)
npm run hub:ci              # from andromeda/04_SOFTWARE/p31ca when hacking hub
npm run sync:soup-bonding   # After C.A.R.S. surface changes (deploy path)
```

---

## Related

- **`docs/CWP-SOUP-MVP-SEQUENCE-2026-01.md`** — C.A.R.S. sequencing vs when-scale.
- **`docs/ECOSYSTEM-PRODUCTION-11.md`** — full-fleet glass ladder.
- **`AGENTS.md`** — canonical agent bar.

**Version:** 1.0.0 — 2026-04-28
