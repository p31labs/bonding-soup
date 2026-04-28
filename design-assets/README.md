# Design assets (P31)

Version-controlled **operator design artefacts**: K₄ spinners, SVG “forge” tools, Ko-fi PNG export engine, and printable tetrahedron STL. This tree is the canonical home (no more floating HTML-only copies).

## Token binding

| Role | Hex (assets) | CSS variable (generated `p31-style.css`) |
|------|----------------|------------------------------------------|
| Coral | `#cc6247` | `--p31-coral` |
| Teal | `#25897d` | `--p31-teal` |
| Cyan | `#4db8a8` | `--p31-cyan` |
| Phosphorus | `#3ba372` | `--p31-phosphorus` |
| Butter | `#cda852` | `--p31-butter` |
| Cloud / text | `#e8e6e3` (tools) / `#d8d6d0` (passport) | `--p31-cloud` (hub) |
| Deep void (full-bleed tools) | `#05080c` | `--p31-void` is `#0f1115` in generator — **intentional deeper void** for marketing/tools; reconcile in a later pass if you want single void |

**Source of truth for palette:** `andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json` → `npm run apply:p31-style` → `cognitive-passport/p31-style.css`. These assets were aligned to the same hexes for semantic roles.

## Layout

| Path | Contents |
|------|----------|
| `spinners/` | `wye-sequence.svg`, `quantum-breath.svg`, `ghost-grid.svg` + README |
| `forge/` | `apex-forge.html` — click-to-copy SVG payloads (Apex v2: Larmor, PFP, banner) |
| `kofi/` | `kofi-engine.html` — canvas PNG export for storefront graphics |
| `stl/` | `P31_K4_Topology.stl` + README |

## Alignment

Registered in `p31-alignment.json` as **`design-assets-canon`**. Changes here should not drift token semantics without updating canon or documenting an exception in this README.

## Ethical / Ko-fi

Storefront product **names and claims** on generated cards are **placeholders** until operator review against `docs/ETHICAL-STYLE-MAP.md` and `docs/P31-CREATE-CONNECT-ETHICAL-MONETIZATION.md` (and hub `creator-economy.json` when applicable). Do not publish to Ko-fi without that review.
