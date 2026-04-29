# PATCH-NOTES — April 25, 2026 review doc refresh

**Instructions:** The `docs/` files in this folder (`README-REVIEW-DOCS.md`, `GEMINI-OPUS-REVIEW-BUNDLE.md`, `REVIEW-SUPPLEMENT-A|B|C*.md`, this file) are **full replacements** for the review bundle. Apply the following to **`P31-ROOT-MAP.md`** and **`AGENTS.md`** in the live repo if not already present.

---

## 1. `P31-ROOT-MAP.md` — §5 `docs/`

**Find** the paragraph under **## 5. Narrative & spec — `docs/`** that starts with `**External model / handoff review**` and **replace or extend** with:

```markdown
**External model / handoff review (Gemini, Opus, etc.):** start at
**`docs/README-REVIEW-DOCS.md`** — index to
**`docs/GEMINI-OPUS-REVIEW-BUNDLE.md`** and workflow / Workers / CWP supplements.
**Updated 2026-04-25:** entity incorporation, BONDING ship status, Paper IV, Node Zero
firmware sprint, 10-worker fleet, WCD Batch 3 closure, HCB→Stripe pivot, CogPass 5.1 + **`CANONICAL-NUMBERING.md`**
renumber, Triad + KwaiPilot.
```

---

## 2. `AGENTS.md` — item 9 (handoff)

**Replace** the existing item **9** (Gemini/Opus handoff) with:

```markdown
9. **Handoff for Gemini / Opus (or other model review):**
   **`docs/README-REVIEW-DOCS.md`** — bundle + CI / worker / CWP supplements. Root
   **`npm run p31:ci`** = `scripts/p31-ci.mjs` (**`npm run verify`** then p31ca verify+build;
   in `CI` also root + p31ca **`npm ci`**). **Updated 2026-04-25.** The Triad includes **KwaiPilot**
   (Node Zero FW execution). WCD Batch 3 (WCDs 26–32) closed; CogPass long-form **5.1** (see **`CANONICAL-NUMBERING.md`**);
   P31 Labs, Inc. incorporated Apr 3, 2026; EIN 42-1888158; Stripe direct via
   **`donate-api.phosphorus31.org`** (HCB unresponsive; `api.phosphorus31.org` not deployed). See review bundle **§12** for snapshot.
```

---

## 3. Changelog: doc set vs. prior (Feb–Mar 2026) bundle

| Area | Previous (generic) | Updated (2026-04-25) |
|------|--------------------|------------------------|
| Entity | HCB / sponsor narrative varied | P31 Labs, Inc. Apr 3; EIN Apr 13; HCB dead path → **Stripe** Worker |
| BONDING | In-flight | **Shipped** Mar 10; **424 / 32** canonical (raised 2026-04-26; see `p31-constants.json`) |
| Research | I–III + defensive | Full series **I–XX** + 2 standalone (**22** Zenodo DOIs); **Paper XII** published (**10.5281/zenodo.19782969**) |
| Node Zero | Concept | **Firmware sprint** — hardware + ESP-IDF + LVGL + QSPI + LoRa / PSRAM rules |
| Edge fleet | Generic | **10** Worker fleet, telemetry + KV + spoons (per operator snapshot) |
| WCDs | Open batches | **Batch 3 (26–32) closed**, `tsc` clean |
| Triad | 4 agents | **+ KwaiPilot** |
| Legal | March hearing framing | **Apr 16** contempt thread; **Apr 30** wellness; void-order / §9-11-58(b) |
| FERS | Earlier deadline language | **~Sep 30, 2026**; SF-3112D/E; OPM Boyers option |
| CogPass | v5 in older indexes | **Superseded by `CANONICAL-NUMBERING.md`:** long-form **5.1** (H1); **v4.0** was non-canonical chat drift |
| Bundle | No §12 | **§12** operational state |
| Supp C | No §6–7 | **§C.6** DOI table; **§C.7** Node Zero handoff |

---

*When patches are applied, you may delete this file or keep it for audit.*
