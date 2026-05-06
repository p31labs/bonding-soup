# P31 Labs — Canonical brand & aesthetic guidelines

**Version:** 2.0 (Operator Console)  
**Updated:** 2026-04-28  
**Alignment:** Palette + typography anchored in `andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json` (`npm run apply:p31-style`).  
**Interactive pack (hub):** [https://p31ca.org/branding/](https://p31ca.org/branding/) — SVG generators, STL, matrix spinners.

---

## Core philosophy

P31 visuals are the **Ultimate Operator Console**: sovereign cognitive infrastructure, not SaaS engagement patterns or crypto-hype gradients.

Instrumentation tone: precise, dark-room, instrumentation-first.

**Golden rule:** Default UI is dark. Hub “void” tiers may use `#05080c` (EDE / console framing) atop the canonical **`p31-void`** from design tokens (`#0f1115`). Do not invent light-themed hub screens without an explicit **`data-p31-appearance`** contract.

---

## Color system

| Token / role | Hex | Usage |
|----------------|-----|--------|
| **Void** | `#0f1115` | Deepest framing (portals, command strips) |
| **Surface 1** | `#11151c` | Translucent shells |
| **Surface 2** | `#1a1f29` | Elevated panels, inputs |
| **Cloud** | `#e8e6e3` | Primary prose |
| **Muted** | `#5a6b7c` | Secondary labels |
| **Glass border** | `rgba(255,255,255,0.05)` | Hairline dividers |
| **Teal** | `#25897d` | Baseline strokes, geometric edges |
| **Cyan** | `#4db8a8` | Active focus / CLI highlights |
| **Coral** | `#cc6247` | Connect / pairing / urgency |
| **Butter** | `#cda852` | Research / prototypes |
| **Phosphorus** | `#3ba372` | Build / LIVE / telemetry OK |
| **Lavender** | `#8b7cc9` | Conceptual / research bridges |

Canon palette duplicates (coral/teal/cyan…) are normative across rings; regenerate hub CSS via **`apply:p31-style`** when tokens change — do not fork hex drift in prose alone.

---

## Typography (three-way tension)

| Face | Usage |
|------|--------|
| **JetBrains Mono** | Telemetry, KPIs, API logs, nav microcopy, monospace UI |
| **Atkinson Hyperlegible** | Body copy, bullets, neuro-inclusive UI text |
| **Playfair Display** *italic* | **Page `<h1>` titles only** — human sovereign layer |

---

## Topology & spinners

**Wye–Delta readout:** four active nodes arranged as inverted “Y” on a **strict 3×3 terminal dot lattice** (`viewBox 0 0 24 24`), mapping center hub + three deltas. Sequential LED-style keyframes (**steps / sharp opacity**) — not soft ease-all animation — for parity with Cursor / Tailscale CLI “thinking” affordance.

**Large backgrounds:** Thin-stroke Δ / mesh rigs, optional **`feGaussianBlur`** bloom sparingly (`public/branding/` examples).

---

## Shell components (reference naming)

| Class | Behavior |
|--------|----------|
| **`.terminal-glass`** | Gradient glass, backdrop blur (~24px), hairline rim |
| **`.op-input`** | Frosted rectangle; focus ring snaps **teal → cyan** |
| **`.cmd-block`** | Log / monospace blocks; left accent rule optional |
| **`p31-btn`** family | **`--primary`** = coral lineage for irreversible CONNECT-style actions |

---

## Tailwind extension (verbatim map)

Agents may mirror this **`theme.extend`** when creating **Tailwind CDN** pages that cannot import the Astro pipeline:

```js
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        void: '#05080c', surface: '#11151c', surface2: '#1a1f29',
        coral: '#cc6247', teal: '#25897d', cyan: '#4db8a8',
        cloud: '#e8e6e3', butter: '#cda852', lavender: '#8b7cc9',
        phosphorus: '#3ba372', muted: '#5a6b7c',
      },
      backgroundImage: {
        'glow-radial':
          'radial-gradient(circle at 50% 0%, rgba(37, 137, 125, 0.15) 0%, transparent 60%)',
        'glass-gradient':
          'linear-gradient(180deg, rgba(26, 31, 41, 0.6) 0%, rgba(17, 21, 28, 0.8) 100%)',
        'command-active':
          'linear-gradient(90deg, rgba(37, 137, 125, 0.1) 0%, transparent 100%)',
      },
      boxShadow: {
        glass:
          '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'neon-teal':
          '0 0 20px rgba(37, 137, 125, 0.3), inset 0 0 10px rgba(37, 137, 125, 0.2)',
      },
    },
  },
};
```

Generated hub surfaces should still prefer **`/p31-style.css`** + **`window.P31_TAILWIND_EXTEND`** where the pipeline exists.

---

## Asset pipeline (implementations)

| Asset | Path |
|--------|------|
| Matrix CLI spinners (3 variants) | `p31ca/public/branding/cli-matrix-spinners.html` |
| Sovereign Asset Forge | `p31ca/public/branding/sovereign-asset-forge.html` |
| Apex Forge (Larmor / PFP / Tomography banners) | `p31ca/public/branding/apex-forge.html` |
| STL — inscribed K₄ / regular tetrahedron | `p31ca/public/branding/stl/p31-k4-tetrahedron.stl` |
| Hub launcher | `p31ca/public/branding/index.html` |

**Usage:** Open any HTML locally via `npm run demo` (repo root) or deploy `p31ca` — click-to-copy extracts raw SVG payloads to the clipboard (`navigator.clipboard`).

**Motion accessibility:** Animated examples honor **`prefers-reduced-motion: reduce`** (`animation: none`, static opacity).

---

## Agent instruction (copy-paste)

> Read **`docs/P31-BRAND-GUIDELINES.md`** and **`https://p31ca.org/branding/`**. Build **[Feature]** using **`/p31-style.css`**, **`JetBrains Mono` / `Playfair`** rules above, **`#05080c`** framing for Operator surfaces, matrix spinners for async states — no neon Web3 marketing kits, no light-mode hubs by default.

---

## Governance

Structural token edits → **`p31-universal-canon.json`** → **`apply:p31-style`** → **`verify`**. Visual experiments may live under **`public/branding/`** without duplicating contradictory hex lore in random markdown.

