# CogPass v4.1 — Schema, Generator & Profiles Alignment

**Document:** P31-COGPASS-SCHEMA-ALIGNMENT  
**Date:** 2026-05-06  
**Scope:** Cognitive Passport schema, audience matrix, 8 profiles, generator UX, cross-system bindings  
**Current version:** v4.1

---

## 0. WHAT COGPASS IS

The Cognitive Passport is P31's universal context document. It travels with the operator (and eventually any user) across AI sessions, devices, and surfaces. Without it, a small model hallucinates. With it, a small model becomes extremely powerful.

CogPass is not a user profile. It's a cryptographic key for context. The right context transforms a conversation. The wrong context makes genius sound like conspiracy theory.

---

## 1. SCHEMA

**Location:** `@p31/shared/cognitive-passport-schema.ts`  
**Version:** 1.0.0  
**Verify:** `npm run verify:cognitive-passport-schema`

### Core Fields

| Field | Type | Purpose |
|-------|------|---------|
| version | string | Schema version (semver) |
| subject | SubjectBlock | Identity (name, pronouns, DOB, contact) |
| diagnoses | DiagnosisBlock[] | Medical/neurodevelopmental conditions |
| cognitive_profile | CognitiveProfileBlock | Processing style, bottlenecks, strengths |
| communication | CommunicationBlock | Style, triggers, dialect terms |
| accessibility | AccessibilityBlock | contrast, density, motion, theme preferences |
| products | ProductBlock[] | P31 product context (what's built, what's planned) |
| legal | LegalBlock | Active proceedings, constraints |
| financial | FinancialBlock | Snapshot (relevant for resource context) |
| ai_allocation | TriadBlock | Agent assignments and lane rules |
| daily_schedule | ScheduleBlock | Buffer Schedule time blocks |
| influences | InfluenceBlock[] | Key intellectual influences |

### Accessibility Sub-Schema (drives CSS)

```typescript
interface AccessibilityBlock {
  contrast: 'high' | 'normal' | 'low';
  density: 'compact' | 'comfortable' | 'spacious';
  motion: 'full' | 'reduced' | 'none';
  theme: 'light' | 'dark' | 'system';
  font_size_override?: number; // px
  line_height_override?: number;
}
```

These fields flow through `p31-subject-prefs.js` → CSS custom properties → every P31 surface.

---

## 2. AUDIENCE MATRIX (8 PROFILES)

**Location:** `@p31/shared/cognitive-passport-profiles.ts`  
**Document:** `COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`  
**Version:** 1.0.0 (locked)  
**Verify:** `npm run verify:cognitive-passport-profiles`

| # | Profile ID | Audience | What They See |
|---|-----------|----------|---------------|
| 1 | operator | Will (full context) | Everything — full cognitive passport |
| 2 | clinician | Doctors, therapists | Diagnoses, medications, cognitive profile, accessibility needs |
| 3 | legal | Court, attorneys | Legal proceedings, financial snapshot, custody context |
| 4 | grant-reviewer | Funders, program officers | Mission, products, tech stack, impact metrics |
| 5 | collaborator | Contributors, beta testers | Products, tech stack, repo structure, communication style |
| 6 | family | Trusted contacts | Family context, schedule, medical basics |
| 7 | public | Website visitors, social followers | Mission, published research, product descriptions |
| 8 | sentinel | SIMPLEX agent context | Full system state, device context, spoon budget |

**Profile derivation:** Each profile is a projection (in the geometric sense) of the full operator passport. The generator takes the complete document and projects it onto the audience's plane, filtering fields they shouldn't see.

---

## 3. GENERATOR

**Current state:** Schema done. Generator UX spec needed (WCD-COGPASS-03).

**Target flow:**
1. User picks a profile from the 8 presets (or starts blank)
2. Preview shows what the generated passport will contain
3. Genesis block created: SHA-256 hash of content + timestamp + subject_id
4. Output: JSON file (machine-readable) + Markdown file (human-readable) + Genesis block

**Genesis Block:** The cryptographic birth certificate of a passport instance. Contains:
```json
{
  "genesis_hash": "sha256:...",
  "created_at": "ISO 8601",
  "profile_id": "operator",
  "schema_version": "1.0.0",
  "subject_id": "...",
  "parent_hash": null
}
```

**Legal basis (from CogPass v4.0 §12):** Genesis block establishes provenance chain. Each update references the parent hash. The chain is Daubert-ready — expert witness can verify document integrity.

---

## 4. CROSS-SYSTEM BINDINGS

CogPass feeds data to multiple consumers:

| Consumer | Fields Used | Binding |
|----------|-----------|---------|
| p31-subject-prefs.js | accessibility.* | localStorage → CSS custom properties |
| SoupEngine.parseLocalRunbook() | cognitive_profile, accessibility | localRunbook payload via relay |
| SIMPLEX STEWARD agent | daily_schedule, financial | Spoon budget initialization |
| SIMPLEX MEDIC agent | diagnoses, medications | Med schedule, calcium gap detection |
| SIMPLEX ORACLE agent | cognitive_profile, influences | Q-Factor vertex weighting |
| k4-personal Worker | subject, communication | Agent personality and response style |
| Spaceship Earth | accessibility, cognitive_profile | Dome appearance, room defaults |
| Hub cards | products | Product status indicators |
| Legal document generator | legal, financial, subject | Court filing templates |

**Gap:** No automated check that CogPass field additions propagate to all consumers. If `accessibility` gains a new field (e.g., `audio_description`), none of the consumers will know.

**Fix:** `COGPASS_CONSUMER_REGISTRY` in @p31/shared — lists every consumer and which fields it reads. When schema bumps, verify script checks each consumer's field list against the new schema.

---

## 5. VERSION HISTORY

| Version | Date | Key Changes |
|---------|------|------------|
| v1.0 | Feb 2026 | Initial — BONDING context, daily schedule, product table |
| v1.1 | Feb 27, 2026 | Updated for WCD-05, test counts, BONDING ship timeline |
| v2.6 | ~Mar 2026 | Post-court updates, SSA exam results |
| v2.7 | ~Mar 2026 | Discovery response filed, psychiatrist appointment |
| v4.0 | Apr 8, 2026 | Major rewrite: incorporation, 558 tests, $550K pipeline, Genesis block §12 |
| v4.1 | Current | Corrections: 424/32 test baseline (not 558), 22 Zenodo pubs, current timeline |

**Important corrections in v4.1:**
- BONDING test count: 424/32 (not 488, 511, or 558)
- Zenodo: 22 publications (Papers I–XX + 2 standalone). K₄ is PLANAR (β₂=1).
- SE050 does NOT support post-quantum crypto
- SX1262 link budget: ~170 dB (not 178 dB)
- CogPass version: v4.1 (not v5 or v6)
- L.O.V.E. = "Ledger of Ontological Volume and Entropy"
- Larmor canonical = 863 Hz
- Relay: KV polling 3–10s (not Durable Objects or WebSocket)

---

## 6. WCD SEQUENCE

| WCD | Scope | Effort | Dep |
|-----|-------|--------|-----|
| WCD-COGPASS-01 | COGPASS_CONSUMER_REGISTRY in @p31/shared | 0.5 day | None |
| WCD-COGPASS-02 | verify:passport extension — check consumer field coverage | 0.5 day | 01 |
| WCD-COGPASS-03 | Generator UX (pick profile → preview → Genesis) | 2 days | Schema locked ✅ |
| WCD-COGPASS-04 | SoupEngine localRunbook wiring from CogPass profile | 1 day | CARS-CONNECT-02 |
| WCD-COGPASS-05 | SIMPLEX agent CogPass ingestion (STEWARD, MEDIC, ORACLE) | 1 day | SIMPLEX-02 |
| WCD-COGPASS-06 | Legacy name cleanup in CogPass v4.1 product table | 0.5 day | Naming canon decided |

---

*The passport is the key. The schema is the lock. The profiles are the projections. The Genesis block is the provenance.*
