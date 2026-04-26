# Plan — Kids / teens “vibe coding” now (private + secure)

**Audience:** Operator (parent) provisioning at home.  
**Goal:** Let S.J. and W.J. start experimenting with code **today**, with **privacy** (their work not public by default) and **security** (no accidental exfil, no anonymous cloud training of their code by default).

**Principle:** *Local creation first, P31 mesh for support second.* The hub already points youth flows at **EDE** (`/ede.html`) and a **personal agent** (`k4-personal`, mesh-start) — this plan connects those into a household system you can turn on without waiting for a full “product.”

**Operator / monorepo context (not kid-specific):** `docs/AGENTIC-VIBE-INFRASTRUCTURE.md` — vibe + agentic stack tied to `verify`, rules, and CI.

---

## What’s already in-repo (use it)

| Piece | Role for “vibe coding” |
|--------|-------------------------|
| **`p31-welcome-packages.json` → `kid`** | Calm copy, **kid/teen** package, shorter mesh-start chips, tetra dock includes **`/ede.html`** (“Make”) |
| **`planetary-onboard.html`** | `?a=child` → **child-mode** (skips passkey pact; guardian can lock later) |
| **`mesh-start.html`** | After onboard, talks to **`k4-personal`** `/agent/:id/chat` — **isolated DO** per subject, not the public family cage |
| **`k4-personal`** | Personal scope, CORS allowlist for p31ca / localhost — **right trust boundary** for “ask my agent,” not the open internet |
| **`ede.html`** | Hub “mini code play” / EDE entry — **immediate** hands-on without signing up for a third-party IDE |

---

## Tier A — **Today (fastest path, strongest privacy)**

**Where code lives:** On a **device you control** (laptop or Chromebook in **kid OS profile**).

1. **Install a real editor locally** (pick one):
   - **Cursor** or **VS Code** on a **dedicated user account** or profile: `~/code` (or `~/p31-vibe`) is **theirs**; turn **off** cloud settings / telemetry you don’t want until you’ve read the vendor’s family settings.
2. **No required cloud:** They open the editor and a folder. First “vibe” = local HTML/JS/python hello — runs in browser or terminal, **nothing uploaded**.
3. **When they need help:**  
   - Prefer **you** or **sibling** for the first week (pair programming).  
   - If using **AI**: use the **local editor’s** AI with **rules** (no pasting family secrets, no school account passwords) — that’s policy, not repo code.
4. **P31 personal agent (optional same day):**  
   - After **planetary onboard** (kid package) → **mesh-start** with a **stable `subject_id`** (see `docs/MESH-MAP-PERSONAL-START-PAGES.md`) so **`k4-personal`** becomes “their” assistant.  
   - **Do not** treat random public “AI chat” pages as private — the **intended** private channel in this stack is **`k4-personal`**, not unauthenticated third parties.

**Security notes (Tier A):**  
- **Router / DNS:** Use family DNS filtering (e.g. OpenDNS / NextDNS / adblock) to reduce drive-by.  
- **Git:** `git init` in their folder; **no `git push`** until you add a **private** remote (GitHub private org repo or Gitea on LAN).  
- **Secrets:** `.env` never committed; add `.gitignore` on day one.

---

## Tier B — **P31-integrated “vibe stack” (this week)**

**Tie the hub to the home workflow** without making their code public.

1. **Bookmark triad for each kid (guardian-curated):**
   - **Onboard / home:** `https://p31ca.org/planetary-onboard.html?welcome=kid&a=child` (adjust host for preview)  
   - **Make / EDE:** `https://p31ca.org/ede.html`  
   - **Mesh start (agent):** `https://p31ca.org/mesh-start.html` (after `subject_id` is set)
2. **k4-personal:** Ensure worker URL in `p31-constants.json` → `apply:constants` → matches prod; only **GET mesh** is anonymous; **chat** is per-DO — keep **`AGENT_HUB_SECRET`** and similar **off** any page you give minors unless you’ve added **your own** auth in front of **p31-agent-hub** (see `dev-workbench.html` copy: public chat 401s if secret set).
3. **Agent hub (p31-agent-hub):** If you enable the **“vibe with AI for code”** path through Workers, deploy **`RELEASE_CHANNEL=internal`** + **secret** and call only from **your** machine or a **local proxy** — not a static public kid page.
4. **Cage (family):** **Do not** bridge personal agent → **k4-cage** until you explicitly want shared visibility — per `MESH-MAP-PERSONAL-START-PAGES.md`.

---

## Tier C — **Hardening (next 2–4 weeks)**

| Item | Why |
|------|-----|
| **Passkey / identity** | Guardian completes Phase 5 when ready; kids stay on **skip** until policy says otherwise — already supported in **child-mode**. |
| **Retention** | Define how long `k4-personal` **SQLite** keeps **chat** for minors (operator policy + possible TTL job — product work). |
| **COPPA / regional minors’ rules** | If you ship beyond household, you need **legal** review — this doc is **not** legal advice. |
| **Code export** | Private Git remote + optional self-hosted Gitea/Forgejo for family. |

---

## “Immediately” checklist (printable)

- [ ] Device + **kid profile** (or dedicated machine).  
- [ ] **Cursor/VS Code** + folder `~/p31-vibe` + `.gitignore` + `git init`.  
- [ ] **House rules:** no secrets in chat; no installing random extensions without you.  
- [ ] **Bookmarks:** onboard (kid) + `ede.html` + `mesh-start` (after one supervised onboard).  
- [ ] **k4-personal** URL verified (`npm run verify:mesh` / `apply:constants` if you change URLs).  
- [ ] **Optional:** private GitHub repo for backup when they’re ready to push.

---

## Success =

They can open an editor, write a file, run it, and ask **their** personal agent for help on **your** terms — without their code being **public** or **training** a random cloud by default. The **ultimate** space grows from **this** foundation + your household policy.

*Aligned with: `P31-ROOT-MAP.md`, `docs/MESH-MAP-PERSONAL-START-PAGES.md`, `p31-constants.json` mesh URLs.*
