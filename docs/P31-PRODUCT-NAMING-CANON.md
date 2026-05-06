# Product Naming Canon & Domain Map

**Document:** P31-PRODUCT-NAMING-CANON  
**Date:** 2026-05-06  
**Scope:** Every product name (current, retired, planned), domain assignments, legacy name grep-and-replace targets

---

## 1. DOMAIN MAP

| Domain | Purpose | Stack | Repo Location |
|--------|---------|-------|--------------|
| **p31ca.org** | App / PWA hub | Astro + static + hub cards | andromeda/04_SOFTWARE/p31ca/ |
| **phosphorus31.org** | Institutional / Daubert-ready | Astro 5, JSON-LD, self-hosted fonts | phosphorus31.org/ (CF Pages) |
| **api.phosphorus31.org** | API (SIMPLEX v7 Worker) | CF Worker + D1 | simplex-v7/ (pending deploy) |
| **bonding.p31ca.org** | BONDING game + /soup | Vite + React + R3F | andromeda/04_SOFTWARE/bonding/ |
| **social.p31ca.org** | Social media broadcast engine | CF Worker | Social engine Worker |
| **p31.io** | Registered, unused | CF Registrar | — |
| **p31.dev** | Backup domain | CF Registrar | — |

**p31ca.org** = the Posner molecule in a URL. P31 (phosphorus-31) + CA (calcium). This is the organism.  
**phosphorus31.org** = the institutional face. Court filings, grant applications, Zenodo citations reference this domain.

**Rule:** Every new surface gets a subdomain of p31ca.org or a path on an existing domain. No new root domains.

---

## 2. CURRENT PRODUCT NAMES

| Product | Canonical Name | Domain / Path | Type |
|---------|---------------|--------------|------|
| BONDING | BONDING | bonding.p31ca.org | Game (shipped) |
| C.A.R.S. | C.A.R.S. (Collaborative Affective Realtime Sim) | Internal framework name for SoupEngine | Engine (internal only) |
| The Soup | The Soup | bonding.p31ca.org/soup | Spatial world layer |
| Spaceship Earth | Spaceship Earth | p31ca.org (Three.js shell) | Dashboard (in progress) |
| SIMPLEX | SIMPLEX v7 | api.phosphorus31.org | Agent fleet (scaffolded) |
| Node One / The Totem | Node One | Physical device | Hardware (prototype) |
| Node Zero | Node Zero | Physical device (maker variant) | Hardware (firmware active) |
| Ping | Ping | In BONDING | Reaction protocol |
| The Centaur / Tandem | The Centaur | Active | Human+AI protocol |
| L.O.V.E. | Ledger of Ontological Volume and Entropy | Economy layer | Token system |
| CogPass | Cognitive Passport v4.1 | Schema + generator | Identity document |
| Whale Channel | Whale Channel | Planned | Low-frequency comms |
| Thick Click | Thick Click | Concept | Haptic feedback |

---

## 3. RETIRED NAMES — GREP AND REPLACE

| Legacy Name | Replaced By | Where It Still Appears | Action |
|------------|-------------|----------------------|--------|
| Wonky Sprout | P31 Labs, Inc. | SIMPLEX v6 GAS code, old emails | Not in active repo — no action |
| PHENIX Navigator | SIMPLEX | Old docs, some chat references | Grep active docs, replace or annotate |
| Cognitive Shield | HERALD agent (Tomograph) | CogPass v1.1 product table | Replace in CogPass v4.1+ |
| The Scope | Spaceship Earth | CogPass v1.1, some old docs | Replace |
| Vertex One | Node One (Totem) | CogPass v1.1, some docs | Replace |
| The Buffer (standalone) | HERALD agent | CogPass v1.1, grant narratives | Retire as standalone. Buffer capability lives in HERALD. |
| EDE | Spaceship Earth / Hub | Early 2026 naming | Was an intermediate name. Use Spaceship Earth. |
| Shelter | BONDING / The Soup | February 2026 chats | Was an early concept name. Retired. |
| Omega Protocol | SIMPLEX | Pre-v7 engine module | Subsumed into SIMPLEX agent architecture |
| Proof of Care | Exhibit A / SCRIBE | Pre-SIMPLEX naming | Retired as product name; concept lives in SCRIBE agent |

**Grep command for full sweep:**
```bash
grep -rn "PHENIX\|Cognitive Shield\|The Scope\|Vertex One\|Omega Protocol\|Proof of Care" \
  docs/ src/ andromeda/04_SOFTWARE/ --include="*.md" --include="*.ts" --include="*.tsx" --include="*.json"
```

---

## 4. PLANNED PRODUCTS — NAMING LOCKED

These names are locked for future use. No renaming without operator decision.

| Name | Purpose | Dependencies |
|------|---------|-------------|
| The Soup | Spatial chat world inside BONDING | CARS SoupEngine |
| Module Maker | Custom reaction rules for BONDING | BONDING molecule engine |
| Breathing Room | 4-4-6 pulse room in Spaceship Earth | SE room router |
| Calcium Logger | Med → molecule brightness | MEDIC agent + SE |
| simplex-email | CF Email Worker | CF Email Routing |
| SENTINEL | Physical layer bridge (already built as agent #11) | HA + MQTT |

---

## 5. NAMING RULES

1. **Products get human names.** BONDING, Spaceship Earth, Node One, The Soup. Not acronyms, not version numbers.
2. **Internal frameworks get acronyms.** C.A.R.S., SIMPLEX, SOULSAFE. These appear in code and technical docs, not marketing.
3. **Agents get mythological/role names.** STEWARD, HERALD, ORACLE, SENTINEL. Uppercase. No "Agent-1" or "Bot-7."
4. **Protocols get descriptive names.** Ping, The Centaur, Tandem. Not "Protocol v2."
5. **Legacy names get a single mention** ("formerly known as X") in the relevant doc, then never again.
6. **Domain names encode the thesis.** p31ca = Posner molecule. phosphorus31 = the element. bonding = the chemistry.

---

*One name per thing. One thing per name. The naming is the architecture.*
