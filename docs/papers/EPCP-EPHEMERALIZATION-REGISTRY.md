# EPCP Ephemeralization Registry
**Schema:** p31.derivation/1.0.0  
**Canonical Source:** EPCP Technical Specification (internal document)  
**Generated:** 2026-05-04

---

## Ephemeralization Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                     CANONICAL SOURCE                             │
│  EPCP Technical Specification (internal, ~15,000 words)       │
│  Contains: FERS details, legal specifics, medical records,     │
│  named individuals, contact information, case numbers            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (sanitization)
┌─────────────────────────────────────────────────────────────────┐
│                    SANITIZED SOURCE                            │
│  EPCP Architecture Review (this document)                       │
│  Contains: sanitized assessment, publication recommendations     │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Paper XXI   │  │  Paper XXII  │  │   Template   │
   │Spoon Budget  │  │Personal CP   │  │   Repo       │
   │  Algorithm   │  │              │  │              │
   └──────────────┘  └──────────────┘  └──────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │   Zenodo     │  │   Zenodo     │  │   GitHub     │
   │   Deposit    │  │   Deposit    │  │   Repo       │
   │   (DOI)      │  │   (DOI)      │  │   (MIT)      │
   └──────────────┘  └──────────────┘  └──────────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Blog Posts      │
                    │  p31ca.org/blog  │
                    └──────────────────┘
```

---

## Derivation Mapping

### Level 1: Canonical → Sanitized

| Field | Canonical | Sanitized | Method |
|-------|-----------|-----------|--------|
| Case numbers | 2025CV936 | Removed | Redaction |
| Names | Robby Allen, etc. | Removed | Redaction |
| Facilities | TRF Kings Bay | [Federal facility] | Generalization |
| MRNs | 40236686 | Removed | Redaction |
| Medical specifics | Hypoparathyroidism, Ca 7.5 | [Chronic condition] | Generalization |
| "Brenda" | Specific person | Stakeholder A | Anonymization |
| Family names | S.J., W.J. | Child 1, Child 2 | Anonymization |
| EIN | 42-1888158 | [Public nonprofit EIN] | Keep (already public) |

### Level 2: Sanitized → Derivatives

#### Derivation 1: Paper XXI — Spoon Budget Algorithm

**Source:** EPCP Section 2 (Cognitive-Metabolic Regulation)  
**Derivation:** Extract algorithms, formulas, UI patterns  
**Remove:** Medical specifics, Node One frequency, operator identity  
**Add:** Academic citations, formal notation, implementation guide  
**Output:** Standalone paper for Zenodo

**Derivation ID:** `epcp-spoon-budget-paper-xxi`  
**Verify command:** `npm run verify:paper-xxi`  
**Publish command:** `npm run publish:zenodo paper-xxi`

#### Derivation 2: Paper XXII — Personal Control Panel

**Source:** EPCP Sections 1, 3, 4, 5, 6 (Architecture, Schemas, K₄, AI, Implementation)  
**Derivation:** Extract architectural patterns, database schemas, integration protocols  
**Remove:** Specific legal/financial details, FERS specifics, named contacts  
**Add:** Generic field names, abstract examples, deployment guides  
**Output:** Standalone paper for Zenodo

**Derivation ID:** `epcp-pcp-paper-xxii`  
**Verify command:** `npm run verify:paper-xxii`  
**Publish command:** `npm run publish:zenodo paper-xxii`

#### Derivation 3: Open Source Template

**Source:** EPCP Section 6 (Implementation Protocols) + All 8 Node schemas  
**Derivation:** Create reusable templates with sanitized field names  
**Remove:** All personal data, specific formulas, branded frequencies  
**Add:** Placeholder instructions, example data, configuration guides  
**Output:** GitHub repository with MIT license

**Derivation ID:** `epcp-template-repo`  
**Verify command:** `npm run verify:epcp-template`  
**Publish command:** `npm run publish:github p31labs/epcp-template`

#### Derivation 4: Blog Post Series

**Source:** Executive summaries of Papers XXI and XXII  
**Derivation:** Plain-language explanations, visual diagrams, quick-start guides  
**Remove:** Formal notation, academic citations, implementation details  
**Add:** Storytelling, screenshots, step-by-step tutorials  
**Output:** p31ca.org/blog posts (5-part series)

**Derivation ID:** `epcp-blog-series`  
**Articles:**
1. "What is a Spoon Budget?" (introductory)
2. "The K₄ Coherence Score: Measuring Life Chaos" (explainer)
3. "Building Your Personal Control Panel" (tutorial)
4. "Progressive Sovereignty: Escaping Platform Lock-in" (philosophy)
5. "Open Sourcing the EPCP" (announcement)

---

## One-Way Dependencies

Per P31 Engineering Standard (one source, many sinks):

```
p31-constants.json (research.papers)
    └── docs/papers/PAPER-XXI-SPOON-BUDGET.md
        └── Zenodo deposit (DOI reserved)
            └── p31ca.org/research (metadata mirror)

p31-constants.json (research.papers)
    └── docs/papers/PAPER-XXII-PERSONAL-CONTROL-PANEL.md
        └── Zenodo deposit (DOI reserved)
            └── p31ca.org/research (metadata mirror)

EPCP Technical Spec (internal)
    └── docs/papers/EPCP-EPHEMERALIZATION-REGISTRY.md (this file)
        └── p31-alignment.json (derivation entry)
```

**Rule:** Changes to canonical source require updates to all derived surfaces.

---

## Verification Pipeline

### Pre-Publication Checks

```bash
# Verify sanitization
npm run verify:epcp-sanitization

# Check for PII leakage
npm run scan:epcp-pii

# Verify derivation chain
npm run verify:derivation epcp-spoon-budget-paper-xxi
npm run verify:derivation epcp-pcp-paper-xxii
npm run verify:derivation epcp-template-repo
```

### Post-Publication Updates

When canonical EPCP changes:
1. Update sanitized source
2. Re-run derivation pipeline
3. Update all derived surfaces
4. Run `npm run verify:ephemeralization`

---

## Publication Status

| Derivative | Status | DOI/URL | Date |
|------------|--------|---------|------|
| Paper XXI | Draft | [Pending] | — |
| Paper XXII | Draft | [Pending] | — |
| Template Repo | Draft | [Pending] | — |
| Blog Series | Planned | p31ca.org/blog | — |

---

## Files in Derivation Chain

| Path | Role | Sensitivity |
|------|------|-------------|
| `docs/EPCP-TECHNICAL-SPECIFICATION.md` | Canonical | Internal only |
| `docs/EPCP-ARCHITECTURE-REVIEW.md` | Sanitized assessment | Internal |
| `docs/papers/PAPER-XXI-SPOON-BUDGET.md` | Derived publication | Public |
| `docs/papers/PAPER-XXII-PERSONAL-CONTROL-PANEL.md` | Derived publication | Public |
| `docs/papers/EPCP-EPHEMERALIZATION-REGISTRY.md` | This file | Internal |
| `github.com/p31labs/epcp-template` | Derived repo | Public |

---

## Commands

```bash
# Full ephemeralization pipeline
npm run ephemeralize:epcp

# Individual derivations
npm run derive:paper-xxi
npm run derive:paper-xxii
npm run derive:epcp-template

# Verification
npm run verify:ephemeralization
npm run verify:paper-xxi
npm run verify:paper-xxii

# Publication
npm run publish:zenodo paper-xxi
npm run publish:zenodo paper-xxii
npm run publish:github epcp-template
```

---

*Registry created: 2026-05-04*  
*Canonical source: EPCP Technical Specification*  
*Derivation method: Sanitization → Extraction → Enhancement*  
*License: MIT (code), CC BY (papers)*
