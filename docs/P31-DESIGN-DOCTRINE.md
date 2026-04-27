# P31 design doctrine — Gray Rock → Alive

**Schema:** `p31.designDoctrine/1.0.0`  
**Companion:** `p31-universal-canon.json` (tokens), `ETHICAL-STYLE-MAP.md` (psychology), `DESIGN-TOKENS-REFERENCE.md` (variables)  
**Verify:** `npm run verify:style-alignment` (about pages); visual inspection on Chromebook + iPhone

---

## 1. The Gray Rock Principle

Every P31 surface loads in Gray Rock state: minimal, calm, zero demands on attention. This is not a "loading state" — it is the default relationship between the surface and the human.

### Why

Neurodivergent processing (AuDHD in particular) treats visual noise as cognitive load. A surface that presents everything simultaneously creates a processing wall — the user cannot begin because beginning requires parsing the whole. Gray Rock removes the parse step. One thing to look at. One action available. Everything else is reachable but not present.

### Gray Rock visual rules

- Background: `var(--p31-void)` only. No gradients, no patterns, no background images on load.
- Text: `var(--p31-cloud)` for primary, `var(--p31-muted)` for secondary. No brand colors in body text.
- Borders: `var(--p31-border-subtle)` — barely visible. Structural, not decorative.
- Color: ZERO brand accent color visible on initial paint. Teal, coral, butter, lavender, phosphor — all absent until Layer 2.
- Motion: None for decorative or ambient layers on first paint. Respect **`prefers-reduced-motion`** always (see **`docs/ETHICAL-STYLE-MAP.md`** §4). Surfaces should treat **calm-by-default** as the design intent: engagement-driven motion may opt in after interaction or explicit “show more,” never autoplay hero loops on load.
- Typography: `var(--p31-font-sans)` (Atkinson Hyperlegible) for all body. `var(--p31-font-mono)` (JetBrains Mono) for code only — never for headings, labels, navigation, or UI chrome.
- Spacing: generous. Minimum `var(--p31-space-6)` (1.5rem) between content blocks. `var(--p31-space-8)` (2rem) preferred. Current surfaces at space-2/space-4 are too dense.

### Gray Rock type scale

| Role | Size | Weight | Color | Tracking |
|------|------|--------|-------|----------|
| Page title | `--p31-text-3xl` (1.875rem) | 700 | `--p31-cloud` | `--p31-tracking-tight` |
| Section heading | `--p31-text-xl` (1.25rem) | 700 | `--p31-cloud` | `--p31-tracking-normal` |
| Body | `--p31-text-md` (1.0625rem) | 400 | `--p31-cloud` | `--p31-tracking-normal` |
| Secondary / caption | `--p31-text-sm` (0.875rem) | 400 | `--p31-muted` | `--p31-tracking-wide` |
| Code | `--p31-text-sm` | 400 | `--p31-cloud` | `--p31-tracking-normal` |
| Caps label | `--p31-text-xs` (0.75rem) | 600 | `--p31-muted` | `--p31-tracking-caps` |

Line height: `--p31-leading-normal` (1.6) for body, `--p31-leading-tight` (1.25) for headings.

---

## 2. Brand Alive (Layer 2 — engagement response)

Brand color appears ONLY in response to user engagement: hover, focus, click, scroll past a threshold, or explicit "show me more" action.

### Engagement color mapping (K₄ vertices)

| Vertex | Action | Color | CSS variable |
|--------|--------|-------|-------------|
| Command | Hover / focus on interactive | `--p31-teal` | Links, buttons, focus rings |
| Create | Active state / building | `--p31-coral` | Active buttons, progress, creation indicators |
| Connect | Confirmation / success | `--p31-phosphorus` | Success states, connected indicators |
| Reflect | Informational / passive | `--p31-lavender` | Tags, badges, metadata |

### Rules

- **`--p31-phosphor`** (#00FF88): ONLY for confirmed user action feedback. Never decorative. Never on load.
- **`--p31-butter`**: warnings, attention-needed states. Never for headings or decoration.
- **`--p31-cyan`**: hover enhancement on teal elements (teal → cyan on hover). Not a standalone color.
- Transitions: `var(--p31-duration-fast)` (150ms) with `var(--p31-ease-standard)`. Not slow fades. Quick, honest responses.

### Glass panels (alive state)

Glass treatment appears when content is grouped and the user is engaged:

```css
.p31-glass {
  background: var(--p31-glass-surface);
  border: 1px solid var(--p31-glass-border);
  border-radius: var(--p31-radius-lg);
  padding: var(--p31-space-6);
}
```

ONE glass panel per viewport section. No nested glass. No glass-on-glass.

---

## 3. Personal (Layer 3 — passport-driven)

If a Cognitive Passport or user preferences exist (via `p31_subject_prefs` in localStorage or mesh-start profile), the surface adapts.

### Preference axes

| Axis | CSS custom property | Values | Default (Gray Rock) |
|------|-------------------|--------|-------------------|
| Contrast | `--p31-user-contrast` | `standard`, `high`, `max` | `standard` |
| Density | `--p31-user-density` | `comfortable`, `compact`, `spacious` | `comfortable` |
| Motion | `--p31-user-motion` | `full`, `reduced`, `none` | `reduced` |
| Temperature | `--p31-user-temp` | `cool`, `neutral`, `warm` | `neutral` |

These properties are set on `:root` by `public/lib/p31-subject-prefs.js` (via **`data-p31-*`** on `<html>`) and consumed by CSS. Surfaces that don't load the prefs script get Gray Rock defaults — the system degrades gracefully to calm.

### Density rules

- `comfortable` (default): `--p31-space-6` between blocks, `--p31-text-md` body
- `compact`: `--p31-space-4` between blocks, `--p31-text-base` body (for users who want density)
- `spacious`: `--p31-space-10` between blocks, `--p31-text-lg` body (for users who need air)

### High contrast rules

- `high`: `--p31-cloud` becomes `#ffffff`, `--p31-muted` becomes `#9ca3af`, border-subtle becomes `rgba(255,255,255,0.15)`
- `max`: same as high plus `--p31-void` becomes `#000000` (true black), all borders become solid `#ffffff`

---

## 4. Layout Templates

Every P31 surface uses ONE of three canonical layouts. Agents do not invent new layouts.

### Focus (single column, one thing)

```
┌─────────────────────────────────────┐
│            [nav bar]                │
│                                     │
│                                     │
│         [ focal element ]           │
│                                     │
│                                     │
│     [ secondary content below ]     │
│                                     │
│            [footer]                 │
└─────────────────────────────────────┘
```

- Max-width: 42rem (672px) centered
- Use for: onboarding, passport generator, device setup, education modules, single-document views
- One glass panel for the focal element. Secondary content in plain text below.

### Workshop (sidebar + main)

```
┌─────────────────────────────────────┐
│            [nav bar]                │
├──────────┬──────────────────────────┤
│          │                          │
│ sidebar  │     main content         │
│ (nav /   │     (focal area)         │
│  tools)  │                          │
│          │                          │
├──────────┴──────────────────────────┤
│            [footer]                 │
└─────────────────────────────────────┘
```

- Main: flex-grow, min-width 0. Sidebar: 14rem fixed, collapses to bottom on mobile (< 640px)
- Use for: Soup, command center, poets room, mesh-start, any tool with navigation + workspace
- Sidebar is Gray Rock (just links). Main area follows Layer 1→2 progression.

### Gallery (grid with progressive reveal)

```
┌─────────────────────────────────────┐
│            [nav bar]                │
│                                     │
│   [ card ] [ card ] [ card ]        │
│   [ card ] [ card ] [ card ]        │
│   [        more...          ]       │
│                                     │
│            [footer]                 │
└─────────────────────────────────────┘
```

- Grid: `repeat(auto-fill, minmax(min(100%, 18rem), 1fr))` with `gap: var(--p31-space-6)`
- Use for: hub home, education track listing, doc library results
- Cards are Gray Rock (border-subtle, no color). Hover/focus adds teal border + glass surface.
- Progressive: show 6-9 cards initially. "Show more" button (not infinite scroll — infinite scroll is a dark pattern per ETHICAL-STYLE-MAP).

---

## 5. Component Patterns

### Navigation bar

- Height: 3.5rem (56px). Fixed top, `--p31-z-sticky`.
- Background: `var(--p31-void)` with `border-bottom: 1px solid var(--p31-border-subtle)`.
- Logo/title: left. Nav links: right. Links are `--p31-muted` default, `--p31-teal` on hover/focus.
- Mobile (< 640px): hamburger or bottom bar. No horizontal scrolling nav.

### Card (gallery item)

- Border: `1px solid var(--p31-border-subtle)`. No background color on load.
- Padding: `var(--p31-space-5)` (1.25rem).
- Border-radius: `var(--p31-radius-lg)` (12px).
- Hover: `border-color: var(--p31-teal); background: var(--p31-glass-surface)`.
- Title: `--p31-text-lg`, weight 700. Description: `--p31-text-sm`, color `--p31-muted`.
- Tags/badges: `--p31-text-xs`, `--p31-tracking-caps`, uppercase, `--p31-muted` text on `var(--p31-surface2)` background, `--p31-radius-full` pill shape.

### Button

- Primary: `background: var(--p31-teal); color: var(--p31-void)`. Border-radius: `--p31-radius-md`. Padding: `--p31-space-3 --p31-space-5`. Font-weight: 600.
- Hover: `background: var(--p31-cyan)`.
- Secondary: `background: transparent; border: 1px solid var(--p31-border-subtle); color: var(--p31-cloud)`. Hover: `border-color: var(--p31-teal); color: var(--p31-teal)`.
- Min touch target: 48px height (already in responsive surface).
- Focus: `outline: var(--p31-focus-ring) solid var(--p31-focus-color-hub); outline-offset: var(--p31-focus-offset)`.

### Glass panel

- As defined in Layer 2. ONE per section. Contains grouped content.
- Inner spacing: `--p31-space-6`. Between items inside: `--p31-space-4`.

### Mission trio footer

- Already implemented. This is the reference for how navigation connects surfaces.
- Three pills: Build / Create / Connect. `aria-current="page"` on the active one.
- Positioned: fixed bottom or static depending on surface.

### Status badges

| Status | Background | Text color |
|--------|-----------|------------|
| LIVE | `color-mix(in srgb, var(--p31-phosphorus) 15%, transparent)` | `--p31-phosphorus` |
| RESEARCH | `color-mix(in srgb, var(--p31-lavender) 15%, transparent)` | `--p31-lavender` |
| PROTOTYPE | `color-mix(in srgb, var(--p31-butter) 15%, transparent)` | `--p31-butter` |
| PENDING | `var(--p31-surface2)` | `--p31-muted` |

---

## 6. Anti-patterns (agents must not do these)

- ❌ Brand color on initial paint (no teal headings, no coral backgrounds on load)
- ❌ JetBrains Mono for non-code text (headings, labels, nav — use Atkinson)
- ❌ Nested glass panels (glass inside glass)
- ❌ Less than 1.5rem (space-6) between content sections
- ❌ More than one focal element per viewport
- ❌ Infinite scroll (use "show more" button)
- ❌ Auto-playing animation without prefers-reduced-motion check
- ❌ Hardcoded hex values (use --p31-* variables)
- ❌ Inline font-family declarations (use --p31-font-sans or --p31-font-mono)
- ❌ Fixed pixel widths on containers (use max-width + percentage/rem)
- ❌ Hover-only interactions with no focus/active equivalent
- ❌ Color as the sole differentiator (always pair with shape, text, or position)

---

## 7. Verification

- `npm run verify:style-alignment` — checks about pages for token compliance
- Visual: load any surface on Chromebook at `soup.html?perf=1` — if FPS drops below 30 during idle, the surface is too heavy (see **`docs/SOUP-PERF-BUDGET.md`**)
- Accessibility: every interactive element has visible focus ring using `--p31-focus-*` tokens
- Mobile: test at 380px viewport width (iPhone SE). One column. No horizontal scroll. Touch targets 48px minimum.
