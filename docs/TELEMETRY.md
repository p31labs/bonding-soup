# P31 Telemetry Posture

**Status:** Active policy. CI-enforced. Operator-signed.
**Schema:** `p31.telemetryPosture/1.0.0`
**Edition:** 1.0.0
**Last reviewed:** 2026-05-02

---

## 1. The one-line answer

**P31 collects no client-side telemetry. Period. CI fails if any is added without a documented exception.**

---

## 2. What this means concretely

- **No Google Analytics** (any version: GA, GA4, gtag.js, analytics.js)
- **No Google Tag Manager**
- **No Plausible, Fathom, Simple Analytics, Umami, GoatCounter** — even the "privacy-respecting" ones
- **No Mixpanel, Amplitude, Segment, PostHog, Heap**
- **No Sentry, Bugsnag, Rollbar, Datadog browser RUM, New Relic browser**
- **No Hotjar, FullStory, LogRocket, Microsoft Clarity, Smartlook**
- **No Facebook Pixel, TikTok Pixel, Pinterest Tag, LinkedIn Insight, Twitter Analytics**
- **No Cloudflare Web Analytics on hub pages** (we do not run the script)
- **No A/B testing platforms** (Optimizely, VWO, Convert, etc.)
- **No session replay tools**
- **No advertising pixels of any kind**
- **No `navigator.sendBeacon` calls to third parties from any P31 page**
- **No client-side error reporting to a third-party endpoint**

---

## 3. What "no telemetry" does NOT mean

To be precise:

- **Cloudflare Pages and Cloudflare Workers retain their own access logs** under Cloudflare's policy. We do not separately collect or analyze those logs. We do not run a `cf-analytics` agent on hub pages. Cloudflare's edge-level retention is theirs.
- **Browsers retain their own histories.** That is the user's browser, not ours.
- **The user's installed extensions may report on their own.** That is between the user and their extension vendor.
- **The Cognitive Passport stays in localStorage** and is read by hub pages on the user's device. The hub never transmits the passport to a P31 server.
- **WebAuthn / passkey ceremonies** transmit only what the WebAuthn protocol requires — challenge response, public key, attestation. No tracking identifiers are added.
- **Stripe Checkout** runs on Stripe's domain when the user clicks "donate"; Stripe collects what Stripe collects per its own policy. P31 receives only the structured donation result.
- **Email** is processed via the `simplex-email` Cloudflare Worker; the worker keeps no persistent record beyond what is needed to deliver/route the message.
- **The local command center** (`http://127.0.0.1:3131`, operator-only) writes audit logs to `~/.p31/operator-shift.jsonl`. That is on the operator's machine, not transmitted off-device. It is not telemetry; it is local audit.

---

## 4. Why no telemetry

Five reasons, in priority order:

1. **The operator is the product.** Behavior surveillance of an operator with hypoparathyroidism, AuDHD, and an active civil case would be hostile.
2. **The K₄ family mesh holds children.** S.J. and W.J. are minors. Surveillance of their navigation patterns would be a betrayal even if the data never left our servers.
3. **The public hub serves cold strangers.** Anyone walking in deserves the same treatment we give the operator. Otherwise the substrate is two-tiered.
4. **Telemetry is the foundation of engagement-maximization.** P31's ethical style map (`docs/ETHICAL-STYLE-MAP.md`) and DELTA language (`docs/P31-DELTA-LANGUAGE.md`) bans engagement-maximization patterns. You cannot ban the patterns and then collect the data that feeds them.
5. **Transparency reports are easier when the answer is "we don't have it."** See `docs/transparency/REPORT-2026-Q4.md` §6.

---

## 5. CI enforcement

Gate: **`npm run verify:no-telemetry`**
Script: `scripts/verify-no-telemetry.mjs`
Wired into: root `npm run verify` chain (between `verify:a11y` and `verify:github-org`)
Alignment: `p31-alignment.json` derivation `p31-no-telemetry-policy`

What the gate scans:

- All `.html`, `.htm`, `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`, `.astro`, `.svelte`, `.vue`, `.css` files in:
  - The home repo `bonding-soup/`
  - `cognitive-passport/`
  - `andromeda/04_SOFTWARE/p31ca/` (when present)
  - `phosphorus31.org/` (when present)
- For each known telemetry vendor in `scripts/verify-no-telemetry.mjs::DENYLIST`
- Reports any match as a hard failure
- Operator may add a documented exception to `scripts/verify-no-telemetry.mjs::EXCEPTIONS` with a reason string and a link to the CWP that approved it

Adding telemetry to the codebase WITHOUT updating the EXCEPTIONS table is a CI-blocking change.

---

## 6. What if a future product genuinely needs analytics

Some legitimate cases:

- A future MLS-based group chat may need delivery-receipt-like signal so the sender knows their message landed. That is **product feedback**, not telemetry, and it stays inside the protocol.
- A future search box on the doc library could use server-side query logs (rotated, aggregated, never per-user) to improve coverage. That is **operations data**, not user surveillance, and it must be designed to be unable to identify any individual.
- An IRS or grant-reporting requirement might compel us to count unique distinct visitors. We would prefer to **not** ship if it requires real telemetry; we would explore whether Cloudflare's edge-level aggregate counts (no JS injected, no per-user cookies) suffice.

For each of those cases, the path is:

1. Author a sub-CWP describing the need
2. Add the documented exception to `scripts/verify-no-telemetry.mjs::EXCEPTIONS` with the CWP ID
3. Update this `docs/TELEMETRY.md` §2 with the named exception
4. Update the next transparency report in §6.1

The default remains "no."

---

## 7. Reporting a violation

If you find P31 collecting telemetry that is not on this exception list, please report it via `docs/security/REPORTING.md`. We treat undisclosed telemetry the same as an undisclosed security defect.

---

*Telemetry posture 1.0.0 — 2026-05-02. Companion to `docs/CWP-P31-PEER-COMP-2026-05.md` PEER-2D. Operator-reviewed annually with the transparency report.*
