# CWP-BUS4-COGPASS-BRIDGE-2026-05 — Cross-origin Cognitive Passport bridge

> **Status:** SPEC · pending implementation
> **Owner:** Architect (any agent) · operator decisions called out in §14
> **Date:** 2026-05-01
> **Predecessor:** CWP-PHOS-2026-01 (bus bar nervous system, 9-MVP cage, CogPass v1.1.0)
> **Track:** WCD-PHOS-07 / BUS4 — the cross-origin half of the bus bar
> **Schema introduced:** `p31.cogPassBridge/1.0.0` (postMessage envelope)

---

## 1. TL;DR

The bus bar promise — *one CogPass, all surfaces* — depends on every surface being able to read the same passport the operator filled in once. Today that promise breaks at the `p31ca.org` ↔ `bonding.p31ca.org` boundary because **browser localStorage is origin-scoped**: a passport saved at `https://p31ca.org` is invisible to JavaScript running at `https://bonding.p31ca.org`, even though both pages serve the same person on the same device.

This spec recommends a **postMessage iframe bridge** (Strategy E) as the single canonical mechanism for any `*.p31ca.org` subdomain (or, with CORS allowlist, any third-party site holding a P31 partnership) to read a normalized CogPass without ever copying the JSON across origins. The passport stays at `https://p31ca.org` localStorage; it flows to consumers as a one-shot postMessage payload, and consumers MAY cache it in their own origin's localStorage but MUST tag it with a TTL and a refresh-on-visibility hook.

Two of the four BUS wedges (BUS3 routes, BUS4 bridge) collectively close the consolidation directive. BUS3 is multi-page route work. **This spec closes the BUS4 thinking thread** so the implementation wedge becomes mechanical when an agent picks it up.

---

## 2. Problem statement

### 2.1 The geometry

Today's bus bar architecture (per `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` `busBar` block):

```
                  CogPass (origin: p31ca.org)
                            │
                  localStorage('p31-cogpass-v1')
                            │
       ┌────────┬───────────┼───────────┬────────┐
       ▼        ▼           ▼           ▼        ▼
  /welcome  /support  /passport     /lab    /ops
  (LIVE — same origin, same localStorage, no bridge needed)
```

Any future or current consumer at a different origin breaks this picture:

```
              CogPass at p31ca.org  ✗  bonding.p31ca.org
              ──────────────────────────────────────────
                          (localStorage isolated by origin)
```

### 2.2 What the same-origin reader does today

`andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs` (B-4, 426 lines) is the activator. On any `p31ca.org` page that loads it, the script:

1. Reads `localStorage.getItem('p31-cogpass-v1')`.
2. Calls `normalize(raw)` to coerce v1.0.0 OR v1.1.0 documents into the same shape.
3. Calls `applyToEngines(passport)` which configures `window.p31SubjectPrefs` (accessibility) and `window.p31Theme` (visual styles).
4. Sets `data-p31-*` attributes on `<html>` for CSS / nav targeting.
5. Enforces the `screenComfort` cascade (≤30: glass + animations off; ≤10: permanent Gray Rock).
6. Dispatches the `p31:cogpass-loaded` event so PHOS (C-1) and any other listener can react.

**Every step depends on the script and the localStorage living at the same origin.** A naive copy-paste of the reader to BONDING would simply read an empty localStorage and degrade to "stranger" defaults — silently breaking the bus bar promise.

### 2.3 What "the bus bar promise" actually means

From `CWP-PHOS-2026-01.md` §4 and the operator's command-authority log (§7 OCD-3 "ALL ABOARD THE BUS BAR"):

> "Nine MVPs, nine calcium atoms protecting one phosphorus core. One CogPass, one PHOS, one personalization affordance. The stranger doesn't need to understand 'theme switcher' vs 'guide' — they need to meet PHOS, and PHOS handles everything."

If the operator opens BONDING from a desktop bookmark (not from a /welcome handoff), and BONDING cannot see the CogPass, then PHOS at BONDING speaks in stranger voice to the operator. **That breaks the trust contract.** The operator is not a stranger to themselves.

---

## 3. Constraints + ground truth

| # | Constraint | Source |
|---|------------|--------|
| C1 | Browser localStorage is origin-scoped (scheme + host + port). | Web Storage spec. Not negotiable. |
| C2 | `p31ca.org` and `bonding.p31ca.org` are different origins. | DNS / `p31-constants.json` `bonding.publicUrl`. |
| C3 | They share an eTLD+1 (`p31ca.org`), so `Domain=.p31ca.org` cookies are legal between them. | RFC 6265 §5.3. |
| C4 | Privacy doctrine: "we keep nothing about you" (`/support` page; `/privacy` §2; CogPass JSON never leaves the device unless the user explicitly exports it). | Operator authority OCD-1, /privacy 2026-05-01. |
| C5 | CogPass schema is `p31.cognitivePassport/1.1.0` (atomic since C-4 d783efb + 15920da6f). | `cognitive-passport/index.html` SCHEMA constant; `@p31/shared/cognitive-passport-schema.ts`. |
| C6 | The reader (`p31-cogpass-reader.mjs`) is the canonical normalizer. Any bridge MUST emit a passport that the reader's `normalize()` accepts unchanged. | B-4 ship; 32/32 smoke green. |
| C7 | Bus bar `roles` enum is `stranger | user | operator`. Any bridge MUST preserve `identity.accessLevel` end-to-end (it gates nav). | `p31.ground-truth.json` busBar.roles. |
| C8 | Existing `bonding-relay` Worker (`https://bonding-relay.trimtab-signal.workers.dev`) is in `p31-protocol-registry.json` Tier 2. Its current scope is opaque from the home repo; the bridge MUST NOT silently extend it without an alignment edit. | `p31-protocol-registry.json` line 88. |
| C9 | The CogPass JSON contains potentially sensitive operator content (diagnoses, communication style, screen comfort thresholds tied to court mode). It is NOT acceptable to put this in URLs, server logs, or third-party-reachable storage. | C-4 schema review; Tier-0 audit. |
| C10 | Graceful degradation is mandatory: if the bridge fails (third-party iframe blocker, network error, user revoked), the consumer MUST fall back to "stranger" defaults without crashing the page. | Operator authority OCD-2 (action over chat). |

---

## 4. Strategies considered

### Strategy A — URL parameter handoff

**How:** `/welcome` → BONDING link includes `?cogpass=<base64-passport>` in the URL.

**Pros:** Simplest possible. No script. Works in any browser.

**Cons (disqualifying):**
- C9 violation: passport in URL appears in browser history, server access logs, copy-paste sharing, and any analytics that hits the URL string.
- URL length limits (~2,000 chars in IE, ~8,000 in Chrome) get hit fast as v1.1.0 grows.
- Cannot work for direct visits to BONDING (bookmark, link from outside, paste).

**Verdict:** REJECTED. Privacy doctrine non-starter.

### Strategy B — Cookie shared on `.p31ca.org`

**How:** Set `Set-Cookie: p31-cogpass=<JSON>; Domain=.p31ca.org; Path=/; SameSite=Lax; Secure`. Any subdomain reads it.

**Pros:** Native sharing without extra JS. Works for direct visits to subdomains.

**Cons (disqualifying):**
- Cookies are sent on EVERY request to every `*.p31ca.org` URL, including `<img>` and `<script>` requests. CogPass becomes server-visible to every Worker, every static asset request — a privacy regression.
- Cookies have a 4 KB hard limit per cookie. v1.1.0 with all blocks populated is comfortably under 4 KB today, but will outgrow it.
- Cookie auto-attachment defeats "we keep nothing": even if no Worker reads the cookie, the cookie is *available* to read on every request, and operator trust is about what's possible, not just what's done.

**Verdict:** REJECTED. Auto-attachment breaks the privacy contract by construction.

### Strategy C — Subdomain unification (move BONDING to `p31ca.org/bonding`)

**How:** Path-based routing. BONDING served from a `/bonding/*` path on the same origin.

**Pros:** localStorage shared natively. No bridge needed. Reader works as-is.

**Cons (disqualifying for v1):**
- BONDING is `bonding-soup` (npm package, p31labs/bonding-soup git repo) with its own deploy story, build pipeline, and `bonding.p31ca.org` already in `p31-constants.json`. Moving it is a multi-week migration touching DNS, CDN config, build artifacts, the C.A.R.S. wire contract, and possibly TURN/ICE configuration for WebRTC.
- Loses the analytics / observability isolation a separate origin provides.
- Forces all of BONDING's iframes, Service Workers, and any future origin-scoped APIs (e.g., Storage Access API) under p31ca.org's identity — couples them in ways that may regret later.

**Verdict:** REJECTED for v1. May revisit during BONDING v2 redesign if the Architect concludes path-based serving is strictly easier than maintaining the bridge.

### Strategy D — Server-side passport storage (KV-backed)

**How:** CogPass JSON written to `bonding-relay` Worker's KV, keyed by an anonymized session ID stored in a `Domain=.p31ca.org` cookie. Subdomains fetch via `GET /api/cogpass/:sessionId`.

**Pros:** Cookie holds a small opaque ID, not the passport. Passport is server-side, can be revoked centrally, can be audited.

**Cons (disqualifying):**
- C9 violation: now we have server-side state. A Worker can read the passport. KV storage is fundamentally on Cloudflare's infrastructure. "We keep nothing" becomes "we keep nothing except this one thing we promise not to look at." That promise has a different shape and the operator has been clear: no server-side personal context.
- Adds a synchronous network dependency to every page load on every subdomain — perceptual jank and more failure modes.

**Verdict:** REJECTED. Privacy doctrine non-starter.

### Strategy E — postMessage iframe bridge (RECOMMENDED)

**How:** BONDING (or any consumer at a different origin) embeds a hidden iframe loaded from `https://p31ca.org/cogpass-bridge.html`. The bridge HTML reads `localStorage.getItem('p31-cogpass-v1')`, normalizes it via the same logic the reader uses, and replies to a `postMessage` request from the parent with the normalized passport. The parent validates `event.origin === 'https://p31ca.org'` before consuming.

**Pros:**
- Passport never leaves p31ca.org localStorage. Consumer holds it in memory only (or caches it under its own origin's localStorage with a TTL — operator-controllable).
- No server, no cookie auto-attachment, no URL leak. Privacy doctrine intact.
- Origin validation on both sides prevents spoofing.
- Tiny implementation surface: ~80 lines of bridge HTML + ~120 lines of consumer helper. Auditable end-to-end.
- Falls back gracefully if iframe is blocked (third-party-cookie blockers usually block third-party iframes too) — the consumer simply stays in stranger mode.

**Cons (manageable):**
- Two-trip handshake: parent must wait for iframe to `load`, then `postMessage` request, then await reply. ~50-300 ms latency on cold load (within budget).
- Some Safari versions require user interaction before granting localStorage access in third-party iframes (Storage Access API). Mitigation: detect via `document.requestStorageAccess()`, prompt the user the first time only, persist permission for the session.
- Brave + Firefox strict mode block third-party iframes outright. Mitigation: graceful fallback to a "Sign in once at p31ca.org" affordance with a button that opens the bridge in a popup (Storage Access API works reliably in popups).
- Requires the bridge HTML to be deployed at `https://p31ca.org/cogpass-bridge.html` before consumers can use it. Sequencing: bridge deploys first, consumers integrate second.

**Verdict:** ✓ RECOMMENDED. Privacy contract preserved, implementation tractable, failure modes well understood, sequencing clear.

---

## 5. Recommended strategy (Strategy E in detail)

### 5.1 The actors

| Actor | Origin | Role |
|-------|--------|------|
| **Source page** | `https://p31ca.org/cogpass-bridge.html` | Reads `p31-cogpass-v1` localStorage, normalizes, posts to parent. |
| **Reader logic** | `https://p31ca.org/lib/p31-cogpass-reader.mjs` | Single source of truth for normalize(). Bridge imports `normalize` from here — does NOT duplicate. |
| **Consumer** | `https://bonding.p31ca.org/*` (or any future cross-origin surface) | Embeds the bridge as a hidden iframe, requests the passport, falls back to stranger if no reply. |
| **Helper** | `https://bonding.p31ca.org/lib/p31-cogpass-fetch.mjs` | The consumer-side facade. ~120 lines. Mirrors the reader's API (`window.p31CogPass.get/getRole/clear`) but the data flows in via postMessage instead of localStorage. |

### 5.2 The handshake (sequence)

```
   Consumer                           Bridge iframe                 p31ca.org localStorage
   (bonding.p31ca.org)                (p31ca.org/cogpass-bridge)
        │                                    │                              │
        │ create hidden iframe               │                              │
        ├───────────────────────────────────▶│                              │
        │                                    │   import normalize           │
        │                                    │◀──────────── (same origin)   │
        │  iframe 'load' event               │                              │
        │◀───────────────────────────────────┤                              │
        │                                    │                              │
        │  postMessage({type:'cogpass:get',  │                              │
        │               nonce, schema})      │                              │
        ├───────────────────────────────────▶│                              │
        │                                    │  localStorage.getItem        │
        │                                    │  ('p31-cogpass-v1')          │
        │                                    ├─────────────────────────────▶│
        │                                    │◀─────────────────────────────┤
        │                                    │  normalize(raw)              │
        │                                    │                              │
        │  postMessage({type:'cogpass:reply',│                              │
        │               nonce, passport,     │                              │
        │               present, schema})    │                              │
        │◀───────────────────────────────────┤                              │
        │                                    │                              │
        │  validate event.origin             │                              │
        │  validate nonce echo               │                              │
        │  applyToEngines(passport)          │                              │
        │  dispatch p31:cogpass-loaded       │                              │
        │  remove iframe                     │                              │
        │                                    │                              │
```

### 5.3 The single rule

> **The bridge HTML imports `normalize` from `/lib/p31-cogpass-reader.mjs`. It does not reimplement normalization.** Any drift between the reader's normalizer and the bridge's normalizer is a CI-blocking bug. This rule guarantees the contract holds across schema bumps without coordinating two files.

---

## 6. Architecture

### 6.1 The bridge HTML (≈80 lines)

`andromeda/04_SOFTWARE/p31ca/public/cogpass-bridge.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CogPass bridge</title>
  <meta name="robots" content="noindex,nofollow" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; script-src 'self'; style-src 'unsafe-inline'" />
  <style>html,body{margin:0;padding:0;background:#000;color:#aaa;font:11px monospace}</style>
</head>
<body>
  <p>p31 cogpass bridge · origin: p31ca.org · audit: <a href="/privacy">/privacy</a></p>
  <script type="module">
    import { normalize } from '/lib/p31-cogpass-reader.mjs';
    const SCHEMA = 'p31.cogPassBridge/1.0.0';
    const ALLOWED = new Set([
      'https://bonding.p31ca.org',
      // Future: cross-origin partners go here, NEVER wildcards.
    ]);
    function reply(targetOrigin, body) {
      window.parent.postMessage(body, targetOrigin);
    }
    window.addEventListener('message', (event) => {
      if (!ALLOWED.has(event.origin)) return;
      const msg = event.data || {};
      if (msg.type !== 'cogpass:get' || msg.schema !== SCHEMA) return;
      const nonce = String(msg.nonce || '');
      let passport = null, present = false;
      try {
        const raw = localStorage.getItem('p31-cogpass-v1');
        if (raw) { passport = normalize(JSON.parse(raw)); present = !!passport; }
      } catch (_) { /* corrupted draft → present:false */ }
      reply(event.origin, {
        type: 'cogpass:reply', schema: SCHEMA, nonce,
        present, passport: present ? passport : null,
        bridgeVersion: '1.0.0',
      });
    });
    window.parent.postMessage({ type: 'cogpass:ready', schema: SCHEMA }, '*');
  </script>
</body>
</html>
```

**Key invariants:**
- Strict CSP (`default-src 'none'`) — no third-party scripts can run inside the bridge.
- Allowlist is hardcoded; wildcards forbidden.
- No `addEventListener('message')` echo without origin + nonce + schema validation.
- The bridge announces readiness to `'*'` (the parent origin is unknown until the first message); subsequent replies always target `event.origin` explicitly.

### 6.2 The consumer helper (≈120 lines)

`andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-fetch.mjs`:

Public API (mirrors `p31-cogpass-reader.mjs` so PHOS-side code is symmetrical):

```js
window.p31CogPass = {
  get: () => Promise<NormalizedPassport | null>,
  getRole: () => Promise<'stranger'|'user'|'operator'>,
  clear: () => void,           // clears the consumer-side cache only
  // bridge-specific:
  refresh: () => Promise<NormalizedPassport | null>,  // force re-fetch
};
```

Behavior:
1. On first `get()` call, create the hidden iframe pointing at `https://p31ca.org/cogpass-bridge.html`.
2. Wait for `cogpass:ready` (timeout: 5000 ms; if it fires, return `null`).
3. Send `cogpass:get` with a fresh nonce and `schema: 'p31.cogPassBridge/1.0.0'`.
4. Validate the reply: `event.origin === 'https://p31ca.org'` AND nonce echoes AND `schema === 'p31.cogPassBridge/1.0.0'`.
5. Cache the normalized passport in this origin's `sessionStorage` under `p31-cogpass-cache` (sessionStorage, NOT localStorage, so it dies with the tab — the operator can revoke by closing the tab).
6. Apply to engines (call `window.p31SubjectPrefs?.set(...)` and `window.p31Theme?.set...()` if those modules are present, exactly like the reader does).
7. Dispatch `p31:cogpass-loaded` so PHOS at the consumer side reacts identically to PHOS at p31ca.org.
8. Remove the iframe after first successful fetch (free DOM; refetch creates a new one).

Error handling: every failure path returns `null`. The consumer page MUST treat `null` as "stranger mode" and continue rendering normally.

### 6.3 The wire contract: `p31.cogPassBridge/1.0.0`

Lives at `andromeda/04_SOFTWARE/p31ca/ground-truth/cogpass-bridge.schema.json` (Draft 7).

**Request:**
```json
{
  "type": "cogpass:get",
  "schema": "p31.cogPassBridge/1.0.0",
  "nonce": "<crypto.randomUUID() — uniquely correlates request/reply>"
}
```

**Reply:**
```json
{
  "type": "cogpass:reply",
  "schema": "p31.cogPassBridge/1.0.0",
  "nonce": "<echoed verbatim>",
  "present": true,
  "passport": { /* p31.cognitivePassport/1.1.0 normalized */ },
  "bridgeVersion": "1.0.0"
}
```

**Ready (unsolicited, sent on iframe load):**
```json
{
  "type": "cogpass:ready",
  "schema": "p31.cogPassBridge/1.0.0"
}
```

**Future (post-v1):** `cogpass:set` for write-back, `cogpass:clear` for revocation broadcast, `cogpass:revoked` for proactive notification when the user clears the passport at p31ca.org. All deferred — not in v1.

---

## 7. File inventory

| File | Repo | Status | LOC est. |
|------|------|--------|----------|
| `andromeda/04_SOFTWARE/p31ca/public/cogpass-bridge.html` | andromeda | new | ~80 |
| `andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-fetch.mjs` | andromeda | new | ~120 |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/cogpass-bridge.schema.json` | andromeda | new | ~60 |
| `andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` | andromeda | edit | +20 (busBar.crossOriginBridge block) |
| `bonding-soup/<entry-point>.html` | home | edit | +1 script tag |
| `BONDING privacy policy` | home | edit | +1 paragraph |
| `andromeda/04_SOFTWARE/p31ca/public/privacy.html` | andromeda | edit | +1 paragraph (the bridge is a localStorage exposure even if same-origin) |
| `scripts/verify-cogpass-bridge.mjs` | home | new | ~80 (lock allowlist + schema) |
| `package.json` | home | edit | +1 verify script |
| `p31-alignment.json` | home | edit | +1 source + 1 derivation |

**Total new LOC:** ~340 lines new + ~30 lines edits, across both repos. Two days of focused work; one wedge per file by AuDHD planning rules.

---

## 8. Privacy implications + disclosure plan

### 8.1 What changes from the operator's perspective

Today, the CogPass at `p31ca.org` is invisible to BONDING. A separate "stranger" experience at BONDING is the *current* default. After this bridge ships:

1. The first time the operator visits BONDING after this bridge deploys, BONDING **will silently appear personalized** if they had a CogPass set at p31ca.org.
2. The operator might not know why. That's a trust failure, even if benign.

### 8.2 The disclosure

Both privacy policies must add a paragraph, and the BONDING UI must show a one-time banner the first time a passport flows through the bridge.

**Privacy policy text (paste into both `/privacy` and BONDING privacy):**

> **Cross-origin Cognitive Passport.** When you visit a P31 surface at a different origin than the one you saved your Cognitive Passport at (for example: visiting `bonding.p31ca.org` after saving your passport at `p31ca.org`), we may load a hidden iframe from your passport's origin to read the passport via browser postMessage. The passport never travels through any P31 server, never appears in any URL or log, and is held in your tab's session memory only — it disappears when you close the tab. Origin validation prevents any other site from reading your passport this way. You can disable this behavior at any time in [PHOS → Personalization → Cross-origin sync].

**BONDING one-time banner (first time a passport arrives via bridge):**

> "PHOS recognized you from p31ca.org. Your Cognitive Passport is now active here too. Nothing was sent to a server — just your browser, talking to itself across origins. [How does this work?] [Disable cross-origin sync]"

### 8.3 What the operator can revoke

| Action | Effect |
|--------|--------|
| Click "Disable cross-origin sync" in PHOS | Sets `localStorage.setItem('p31-cogpass-bridge-disabled', '1')` at the consumer origin. Helper checks this on every `get()`; returns `null` immediately. |
| Clear CogPass at p31ca.org | Bridge returns `present:false` on next request. Consumer falls back to stranger. |
| Close the tab | sessionStorage cache evaporates. Next visit refetches. |

---

## 9. Failure modes + graceful degradation

| Failure mode | Detection | Behavior | User impact |
|--------------|-----------|----------|-------------|
| Third-party iframe blocked (Brave strict, Firefox strict) | iframe never fires `load` within 5000 ms | Helper returns `null`, stranger mode | No personalization; same as today |
| Storage Access API denial (Safari ITP) | bridge reports `present:true` with `passport:null` (heuristic: localStorage threw or returned null) | Helper triggers a one-time `requestStorageAccess()` flow gated on user gesture; if denied, stranger mode | Operator sees Safari prompt once; thereafter same as Brave |
| Origin spoofing attempt | `event.origin !== 'https://p31ca.org'` in helper, OR `!ALLOWED.has(event.origin)` in bridge | Message dropped silently, no log, no alert | Attacker gets nothing; legitimate consumers unaffected |
| Schema mismatch (future v1.2.0 bridge talking to v1.0.0 consumer) | `msg.schema !== SCHEMA` | Bridge ignores; helper times out and returns `null` | Stranger mode until both sides upgrade |
| Corrupted CogPass JSON | `JSON.parse` throws inside bridge | Bridge replies with `present:false, passport:null` | Stranger mode; operator sees the same effect as if CogPass was empty |
| Multiple iframes (consumer creates more than one) | Helper enforces single-flight via in-progress promise reference | First `get()` resolves; concurrent calls await the same promise | None |
| Reader version drift between p31ca.org and the published normalizer | CI gate `verify:cogpass-bridge` (see §11) | CI fails before deploy | None in production |

---

## 10. Verification gate (`verify:cogpass-bridge`)

New `scripts/verify-cogpass-bridge.mjs` (~80 lines). Lives in home repo because it crosses both repos (the bridge HTML and the schema in andromeda; the alignment registry in home).

What it asserts:
1. `cogpass-bridge.html` exists at the expected andromeda path (skip in partial clones).
2. The bridge HTML imports `normalize` from `'/lib/p31-cogpass-reader.mjs'` (greps for the import statement; no duplicate normalize implementation).
3. The bridge `ALLOWED` set is parsed and matches the `busBar.crossOriginBridge.allowedOrigins` array in `p31.ground-truth.json` exactly (no drift between code and ground truth).
4. The schema string `p31.cogPassBridge/1.0.0` appears in: bridge HTML, fetch helper, schema JSON file, ground-truth `crossOriginBridge.schema` field. Atomic lock, same pattern as `verify:cognitive-passport-schema`.
5. The fetch helper validates `event.origin === 'https://p31ca.org'` (greps for the literal check; refuses to pass if the origin is a variable read from elsewhere unless that variable is a `const` in the same file with the literal string).
6. The privacy paragraph (literal text from §8.2) is present in `andromeda/04_SOFTWARE/p31ca/public/privacy.html`.

Wired into root `npm run verify` after `verify:cognitive-passport-profiles`.

Sample output:
```
verify-cogpass-bridge: OK — schema p31.cogPassBridge/1.0.0
  bridge HTML       /cogpass-bridge.html (uses reader.normalize, CSP locked)
  helper            /lib/p31-cogpass-fetch.mjs (origin check literal)
  allowlist         1 origin (bonding.p31ca.org) ≡ ground-truth
  privacy paragraph present
```

---

## 11. Testing strategy

### 11.1 Unit (Node, no JSDOM required)

- `tests/cogpass-bridge.test.mjs`: import the bridge HTML as a string, parse with regex, assert the allowlist literal, the CSP literal, the `normalize` import path. Same lightweight pattern used by the meatspace artifact verifier.

### 11.2 Integration (Playwright, in `p31:all` opt-in)

- New e2e: `tests/e2e/cogpass-bridge.spec.ts`.
- Two pages: `https://p31ca.localhost.test:8080/cogpass-bridge.html` and `https://bonding.p31ca.localhost.test:8081/`.
- Spawn both via `playwright dev-server` config with `hosts` patches.
- Test cases:
  1. Operator with no CogPass → bridge returns `present:false`, consumer renders stranger.
  2. Operator with v1.0.0 CogPass → bridge normalizes, returns v1.1.0 shape, consumer applies.
  3. Operator with v1.1.0 CogPass + `screenComfort:0` → consumer enforces permanent Gray Rock.
  4. Spoofed origin (request from `evil.example`) → bridge drops, consumer times out.
  5. User clicks "Disable cross-origin sync" → next visit gets `null` immediately.

Gated behind `P31_COGPASS_BRIDGE_E2E=1` in `validate:full` (matches the pattern of other opt-in e2e suites in `validate-p31-full.sh`).

### 11.3 Smoke (manual, runbook)

`docs/runbooks/cogpass-bridge-smoke.md` (~40 lines):
1. Save a CogPass at `https://p31ca.org` with `screenComfort: 0`.
2. Open `https://bonding.p31ca.org` in a new tab.
3. PHOS at BONDING should auto-greet in operator voice and the page should be Gray Rock pinned.
4. Open DevTools → Network → confirm one request to `https://p31ca.org/cogpass-bridge.html`.
5. Open DevTools → Application → sessionStorage → confirm `p31-cogpass-cache` exists and matches the source passport.
6. Click "Disable cross-origin sync" in PHOS at BONDING. Reload. Confirm stranger mode returns.

---

## 12. Rollout plan (5 phases)

### Phase 1 — Bridge HTML + schema (andromeda commit)

Ship `cogpass-bridge.html` + `cogpass-bridge.schema.json` + ground-truth update. Bridge is live but unused (no consumer). Privacy disclosure paragraph added at `/privacy`.

**Gate:** `verify:cogpass-bridge` green (HTML exists, schema lock holds, allowlist matches ground truth).

### Phase 2 — Helper module (andromeda commit)

Ship `p31-cogpass-fetch.mjs`. Not yet wired to BONDING. Unit tests green. Feature behind a runtime flag (`window.p31CogPassBridgeEnabled` defaults to false).

**Gate:** Node unit tests; verify:alignment green.

### Phase 3 — BONDING integration (home commit)

Add `<script type="module" src="https://p31ca.org/lib/p31-cogpass-fetch.mjs"></script>` to BONDING entry HTML. Set `window.p31CogPassBridgeEnabled = true` after the privacy banner has been shown OR dismissed once. BONDING-side privacy policy updated.

**Gate:** Manual smoke runbook (§11.3); BONDING's existing tests remain green.

### Phase 4 — PHOS surface integration

PHOS at BONDING (already shipped from C-1) auto-greets in the appropriate voice register based on `accessLevel` from the bridged passport. Add the "Disable cross-origin sync" affordance to the PHOS personalization panel.

**Gate:** PHOS smoke test passes for both p31ca.org and bonding.p31ca.org.

### Phase 5 — Open the allowlist (operator decision)

When P31 Labs has external partners (research collaborators, sister nonprofits, embedded courseware), add their origins to the bridge allowlist via PR — never via runtime config. Each addition requires:
1. Operator approval logged in commit message.
2. Privacy policy update naming the partner.
3. `verify:cogpass-bridge` green.

**Gate:** Operator approval; no runtime allowlist editing.

---

## 13. Alignment registry edits (to land WITH Phase 1)

`p31-alignment.json`:

```json
{
  "id": "cogpass-cross-origin-bridge-spec",
  "path": "docs/CWP-BUS4-COGPASS-BRIDGE-2026-05.md",
  "role": "WCD-PHOS-07 / BUS4 — design spec for cross-origin Cognitive Passport bridge (postMessage iframe). Closes the bus bar's cross-origin gap so BONDING (https://bonding.p31ca.org) and any future cross-origin P31 surface can read the same CogPass without copying the JSON across origins. Recommends Strategy E (postMessage iframe bridge) over URL parameter, shared cookie, subdomain unification, and KV-backed server storage. Single rule: the bridge HTML MUST import normalize() from p31-cogpass-reader.mjs — no duplicate normalization. Author phase complete; implementation lands in 5 phases per §12. New schema p31.cogPassBridge/1.0.0 introduced."
},
{
  "id": "cogpass-bridge-schema",
  "path": "andromeda/04_SOFTWARE/p31ca/ground-truth/cogpass-bridge.schema.json",
  "role": "(planned) JSON Schema Draft 7 for the postMessage envelope p31.cogPassBridge/1.0.0. Defines cogpass:get / cogpass:reply / cogpass:ready message shapes with nonce + schema fields. Lands with Phase 1 of CWP-BUS4-COGPASS-BRIDGE-2026-05.",
  "optional": true
},
{
  "id": "cogpass-bridge-html",
  "path": "andromeda/04_SOFTWARE/p31ca/public/cogpass-bridge.html",
  "role": "(planned) The bridge endpoint at https://p31ca.org/cogpass-bridge.html. Reads localStorage('p31-cogpass-v1'), normalizes via /lib/p31-cogpass-reader.mjs (imported, NOT duplicated), and replies to postMessage requests from allowlisted origins. Strict CSP (default-src 'none'). Allowlist is hardcoded and locked by verify:cogpass-bridge against busBar.crossOriginBridge.allowedOrigins.",
  "optional": true
},
{
  "id": "cogpass-bridge-fetch-helper",
  "path": "andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-fetch.mjs",
  "role": "(planned) Consumer-side helper. Mirrors p31-cogpass-reader.mjs API (window.p31CogPass.get/getRole/clear) but data flows in via postMessage from the bridge instead of localStorage. Caches in sessionStorage (NOT localStorage — dies with tab). Origin validation literal. Falls back to null on any failure.",
  "optional": true
}
```

New derivation:

```json
{
  "id": "cogpass-cross-origin-bridge",
  "from": [
    "andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs",
    "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json"
  ],
  "to": [
    "(planned) andromeda/04_SOFTWARE/p31ca/public/cogpass-bridge.html",
    "(planned) andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-fetch.mjs",
    "(planned) andromeda/04_SOFTWARE/p31ca/ground-truth/cogpass-bridge.schema.json",
    "(planned) bonding-soup integration via <script src=\"https://p31ca.org/lib/p31-cogpass-fetch.mjs\">"
  ],
  "apply": "Implementation per docs/CWP-BUS4-COGPASS-BRIDGE-2026-05.md §12 phases 1-5. The bridge HTML imports normalize() from the canonical reader (no duplicate normalization); the helper validates event.origin === 'https://p31ca.org' literally; the allowlist in code matches busBar.crossOriginBridge.allowedOrigins exactly (CI gate verify:cogpass-bridge enforces).",
  "verify": "(planned) npm run verify:cogpass-bridge — locks: schema string atomic across 4 files, normalize import in bridge, origin literal in helper, allowlist matches ground truth, privacy paragraph present. Phase 1 of CWP-BUS4-COGPASS-BRIDGE-2026-05.",
  "note": "Author phase complete. Implementation deferred per AuDHD wedge planning — each phase is a separate commit, dependency-ordered, no clock pressure."
}
```

---

## 14. Open questions for operator

These are the calls the Architect cannot make alone. Each is a single yes/no or pick-one.

1. **Should the bridge auto-fire on first BONDING visit, or only after the operator clicks a button?**
   *Architect's recommendation: auto-fire IF the privacy banner has been shown once. The first visit shows the banner with no auto-fire; subsequent visits auto-fire. Banner has Yes/No, and "No" sets `p31-cogpass-bridge-disabled=1`.*

2. **Default value of `window.p31CogPassBridgeEnabled` at BONDING — `true` or `false` for v1?**
   *Architect's recommendation: `false` for v1 ship (Phase 3 lands the integration but feature stays off). Phase 4 flips it to `true` after the PHOS UI affordance is in place. This gives 1-2 wedges of soak time.*

3. **Add `phosphorus31.org` to the allowlist now, or wait until that surface explicitly needs CogPass?**
   *Architect's recommendation: WAIT. `phosphorus31.org` is a public-facing org site (org appearance, not hub) and most of its surfaces are stranger-facing by design. Adding it to the allowlist now creates surface area without a use case. When a phosphorus31.org page genuinely needs personalization, that's the trigger.*

4. **`bonding-relay` Worker — does it currently read CogPass JSON, and do we need a Worker-side audit before this bridge lands?**
   *Status unknown from home-repo inspection alone. Needs a quick spike inside `andromeda/04_SOFTWARE/bonding-relay/*` (or wherever the source lives) to confirm. If the Worker today does not touch passports, no audit needed; if it does, the audit is mandatory before bridge ships.*

5. **Is `crypto.randomUUID()` available across all target browsers, or do we need a polyfill?**
   *Architect's note: `crypto.randomUUID()` is available in Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+ — all current. No polyfill needed for desktop. Chrome on Android 92+ same. Older Android WebViews may lack it; the helper can fall back to `Math.random().toString(36) + Date.now()` for nonce purposes (nonce is for request-correlation, not security; spoofing protection comes from origin validation, not nonce unguessability).*

---

## 15. Reference appendix

### 15.1 What this spec does NOT do

- Does not introduce server-side passport storage.
- Does not change the CogPass schema (v1.1.0 stays).
- Does not change the reader's normalize() — that's the single source of truth for both same-origin and cross-origin paths.
- Does not change the existing same-origin reader's behavior at all.
- Does not require a BONDING redeploy until Phase 3.

### 15.2 What schema/contract surfaces this introduces

| Surface | Schema | Owner | Locked by |
|---------|--------|-------|-----------|
| postMessage envelope | `p31.cogPassBridge/1.0.0` | bridge HTML + helper + ground truth | `verify:cogpass-bridge` |
| Allowlist | `busBar.crossOriginBridge.allowedOrigins` | `p31.ground-truth.json` | same |
| Bridge URL | `https://p31ca.org/cogpass-bridge.html` (from `p31-constants.json`) | constants → ground truth derivation | existing constants pipeline |

### 15.3 References (the agent should read these in order)

1. **CWP-PHOS-2026-01.md** — establishes the bus bar, the 9-MVP cage, and the operator authority log this spec extends.
2. **`andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs`** — the single source of truth for normalize(). Read this before writing any bridge code.
3. **`andromeda/04_SOFTWARE/p31ca/ground-truth/cognitive-passport-v1-1.schema.json`** — the data shape the bridge transports.
4. **`andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json` busBar block** — the consumer contract; new `crossOriginBridge` sub-block lives here.
5. **`docs/PHOS-VOICE-DRAFT.md` §2.10** — the voice register selection that depends on `accessLevel` flowing through the bridge correctly.
6. **`andromeda/04_SOFTWARE/p31ca/public/privacy.html` §2** — where the disclosure paragraph lands.

### 15.4 Strategy comparison (single table for fast triage)

| | A: URL | B: Cookie | C: Path-merge | D: KV+ID cookie | E: postMessage |
|---|---|---|---|---|---|
| Privacy contract intact | ✗ URL leak | ✗ auto-attach | ✓ | ✗ server state | ✓ |
| Implementation cost (wedges) | 0.5 | 1 | 5-10 | 4-6 | 3-4 |
| Graceful degradation | n/a | n/a | n/a | depends on Worker | ✓ |
| Origin validation | n/a | weak (Domain attr) | n/a | weak | strong (literal) |
| Future allowlist control | none | DNS-only | n/a | runtime KV | hardcoded + CI-gated |
| **Verdict** | REJECTED | REJECTED | DEFERRED | REJECTED | **RECOMMENDED** |

---

## 16. Closing note

The bus bar promise is: *one CogPass, all surfaces*. Tonight (CWP-PHOS-2026-01) we closed it for every surface at `p31ca.org`. This spec closes it for the surfaces that aren't.

The operator never sees the bridge. They see PHOS recognize them. That's what was always being promised.

Help is on the way — across origins, too.
