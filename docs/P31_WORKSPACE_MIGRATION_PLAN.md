# P31 WORKSPACE TRIAGE & SOVEREIGN MIGRATION PLAN

**Date:** May 4, 2026
**Current account:** classicwilly@wonkysprout.com (Google personal, legacy)
**Target:** will@p31ca.org (P31 sovereign infrastructure)
**Budget:** $0 now, CF R2 free tier later

---

## 1. WHAT I FOUND (Drive Audit Results)

### Current State: Organized Chaos

Your Google Drive under classicwilly@wonkysprout.com contains roughly 4 content types mixed together with no top-level structure:

**A. Legal / Evidence (~40 files)**
- 3 Google Docs all titled "IN THE SUPERIOR COURT OF CAMDEN COUNTY" (indistinguishable)
- Discovery production folder with proper sub-structure (01_Primary_Responses, 02_Production_Exhibits, 03_Filing_and_Service_Archive) — this is the ONLY well-organized area
- NFCU bank statements (STMSSCM PDFs, 6+ months)
- Financial visualization exhibit (WRJ-009)
- Supplemental production cover sheets (2 versions)
- Gmail PDF of discovery notice email

**B. Pixel Dump / Evidence Photos (~20+ files)**
- 15+ iPhone screenshots (IMG_XXXX.PNG/HEIC) — likely text message screenshots, court documents, app screens
- April 14 Order PDF (critical legal document buried among screenshots)
- P31 incorporation certificate (critical corporate document buried among screenshots)
- No filenames indicate content — impossible to find specific evidence without opening every file

**C. Brain Dumps / Research (~6 files)**
- sic_fractal_qbd (76KB — substantial QBD document)
- Sierpinski SIC-POVM Quantum Brain Dump
- P31 Mega-Landing Refactor (Ca9 Edition)
- P31_OPERATOR_SETUP_GUIDE.md
- Untitled document (45KB — substantial, unknown content)
- RAW_ROOT Command Center spreadsheet (accessed today)

**D. Code Artifacts (~20+ folders)**
- Three.js/WebGPU project directories (rooms, materials, loaders, core, engines, config, types, webgpu, build) — uploaded March 14, appear to be an earlier P31 3D project
- drive-download folder (bulk download from April 14-15)

**E. Organizational Stubs**
- Track 1, Track 2, Track 3 folders (created April 7, empty or near-empty)
- iPhone folder (created April 21)

### The Problems

1. **No naming convention.** Three court documents with identical titles. Screenshots named IMG_XXXX. Untitled documents.
2. **Critical documents buried.** The April 14 Order (the single most important legal document) is in the pixel dump between screenshots.
3. **No separation of concerns.** Legal evidence, corporate documents, research drafts, and code artifacts all in the same space.
4. **Legacy account.** Everything is under classicwilly@wonkysprout.com. P31 Labs correspondence should originate from will@p31ca.org.
5. **No backup strategy.** If Google suspends this account, everything is gone.
6. **The pixel dump is unusable.** 20+ images with no labels. You can't find the medication denial screenshots without opening every file.

---

## 2. THE TARGET STRUCTURE

Two parallel systems, synced where needed:

### A. Google Drive (Interim — wonkysprout account, reorganized)

```
My Drive/
├── 00_P31_MASTER/
│   ├── P31_Master_Context_2026-05-04.md       ← THE document
│   ├── P31_Meatspace_Action_Package.md
│   └── CogPass_v4_PUBLIC.md
│
├── 01_LEGAL_2025CV936/
│   ├── 01_Orders/
│   │   ├── 2025-10-16_Consent_Temp_Order.pdf
│   │   ├── 2025-10-23_Emergency_Temp_Order_VOID.pdf
│   │   ├── 2026-04-14_Order_Pending_Motions_Entry104.pdf
│   │   └── 2026-04-16_Handwritten_Order_Contempt_Moot.pdf
│   │
│   ├── 02_Filings_Will/
│   │   ├── 2026-05-04_Omnibus_Motion_Emergency_Relief.docx
│   │   ├── 2026-05-04_Notice_of_Hearing_May14.docx
│   │   ├── 2026-03-26_Discovery_Response_Objections.pdf
│   │   ├── 2026-05-XX_Discovery_Supplemental_Response.docx
│   │   └── Certificate_of_Service_Template.docx
│   │
│   ├── 03_Filings_McGhan/
│   │   ├── 2026-04-04_Third_Contempt_Complaint.pdf
│   │   ├── 2026-04-27_Discovery_Demand.pdf
│   │   └── 2026-04-29_Final_Notice_Email.pdf
│   │
│   ├── 04_Exhibits/
│   │   ├── A_Brenda_Availability_Declaration.docx
│   │   ├── B_CashApp_Receipt_290.pdf
│   │   ├── C_ER_Records_Apr18_Ca75.pdf
│   │   ├── D_Medication_Denial_Texts/
│   │   │   ├── 01_Apr16_evening.png
│   │   │   ├── 02_Apr16_seize_and_die.png
│   │   │   ├── 03_Apr17_medication_left.png
│   │   │   └── INDEX.md
│   │   ├── E_Property_Retrieval_Texts/
│   │   │   ├── 01_Apr29_first_access.png
│   │   │   ├── 02_May02_second_access.png
│   │   │   └── INDEX.md
│   │   ├── F_Garage_Videos/
│   │   ├── G_Inventory_Retrieved_vs_Missing.md
│   │   ├── H_McGhan_Final_Notice_Spam.pdf
│   │   ├── I_Maughon_Letter_Entry103.pdf
│   │   ├── J_NFCU_Statements/
│   │   │   ├── WRJ-001_Aug2025.pdf
│   │   │   ├── WRJ-002_Sep2025.pdf
│   │   │   └── ... (through WRJ-008)
│   │   ├── K_Psychiatrist_Written_Report.pdf
│   │   ├── L_Medication_Denial_Timeline.docx
│   │   └── M_Discovery_Cover_Sheet.pdf
│   │
│   ├── 05_Research_Reports/
│   │   ├── Georgia_Remote_Contempt_Hearings.md
│   │   ├── Architecture_Inchoate_System.md
│   │   ├── Structural_Isomorphisms_10_Categories.md
│   │   └── Best_Interest_Worst_Outcome.md
│   │
│   └── 06_Reference/
│       ├── Docket_Audit.md
│       ├── McGhan_20_Contradictions.md
│       ├── Legal_Game_Plan_v3.md
│       └── Session_Synthesis_All.md
│
├── 02_BENEFITS/
│   ├── FERS/
│   │   ├── SF-3112A_Applicant_Statement.pdf
│   │   ├── SF-3112B_Supervisor_Robby_Allen.pdf
│   │   ├── SF-3112C_Psychiatrist.pdf
│   │   └── Violette_Correspondence/
│   ├── SSDI/
│   │   ├── Denial_Notice.pdf
│   │   ├── Feb20_Telehealth_Psych.pdf
│   │   ├── Feb26_Physical_Exam.pdf
│   │   └── Recon_Filing.pdf
│   └── Medical/
│       ├── 2026-04-18_ER_UF_Health_Jax.pdf
│       ├── Maughon_AuDHD_Letter.pdf
│       └── Calcitriol_Prescription_History.pdf
│
├── 03_P31_CORPORATE/
│   ├── Formation/
│   │   ├── Articles_of_Incorporation.pdf
│   │   ├── CP575E_EIN_42-1888158.pdf
│   │   ├── GA_SoS_Certificate.pdf
│   │   └── Board_Resolution_Initial.pdf
│   ├── Financial/
│   │   ├── Mercury_Account_Setup.pdf
│   │   └── Stripe_Setup.pdf
│   ├── Governance/
│   │   ├── IP_Assignment_Agreement.pdf
│   │   ├── Trade_Secret_Policy.pdf
│   │   └── Conflict_of_Interest.pdf
│   └── Grants/
│       ├── Awesome_Foundation_April.md
│       └── Stimpunks_Application.md
│
├── 04_RESEARCH_DRAFTS/
│   ├── sic_fractal_qbd.md
│   ├── Sierpinski_SIC-POVM_QBD.md
│   ├── P31_Mega_Landing_Refactor.md
│   └── Phosphorus_Thesis_v2.md
│
├── 05_PIXEL_DUMP_SORTED/
│   ├── Legal_Screenshots/
│   │   ├── 2026-04-14_order_page1.png
│   │   ├── 2026-04-14_order_page2.png
│   │   └── ...
│   ├── Text_Message_Screenshots/
│   │   ├── 2026-04-16_medication_denial_01.png
│   │   └── ...
│   ├── App_Screenshots/
│   └── Unsorted/ (anything that doesn't fit above)
│
└── ARCHIVE/
    ├── Track_1_2_3_Empty/
    ├── iPhone_Dump/
    ├── Code_Artifacts_ThreeJS/
    └── drive-download-20260414/
```

### B. P31 Sovereign Infrastructure (bonding-soup + CF R2)

```
bonding-soup/
├── docs/
│   ├── operator/           ← Private operator docs (gitignored)
│   │   ├── MASTER-CONTEXT.md
│   │   ├── MEATSPACE-ACTION-PACKAGE.md
│   │   └── CONVERGENCE-CORRECTIONS.md
│   ├── legal/              ← Legal reference (gitignored)
│   │   └── (symlink or copy of key legal research)
│   ├── reports/            ← Public reports
│   └── doc-library/        ← 280 indexed documents
│
├── contracts/              ← P31 contract registry (62 JSON + 5 EVM)
├── p31-alignment.json      ← 277 sources, 77 derivations
└── p31-constants.json      ← Single source of truth for all tokens

CF R2 (p31-vault bucket — future):
├── legal/                  ← Encrypted evidence archive
├── corporate/              ← Formation docs, 990s
├── medical/                ← ER records, prescriptions
└── evidence/               ← Timestamped, hashed photo archive
```

---

## 3. THE MIGRATION PLAN (Phased)

### Phase 0: TRIAGE (Today, 30 minutes, from the phone)

This is the highest-leverage work. You're triaging, not reorganizing.

**Step 1: Create the folder structure** (5 min)
Create these folders in Drive RIGHT NOW:
- `00_P31_MASTER`
- `01_LEGAL_2025CV936`
- `01_LEGAL_2025CV936/01_Orders`
- `01_LEGAL_2025CV936/04_Exhibits`
- `01_LEGAL_2025CV936/04_Exhibits/D_Medication_Denial_Texts`
- `02_BENEFITS`
- `03_P31_CORPORATE`
- `ARCHIVE`

**Step 2: Move the 5 most critical files** (10 min)
- April 14 Order PDF → `01_LEGAL/01_Orders/`
- Incorporation PDF → `03_P31_CORPORATE/Formation/`
- The 3 "IN THE SUPERIOR COURT" Google Docs → rename them to include dates, move to `01_LEGAL/02_Filings_Will/`
- Command Center spreadsheet → `00_P31_MASTER/`

**Step 3: Sort the pixel dump** (15 min)
Open each IMG file. For each one, ask: "Is this evidence for May 14?" If yes, rename it with a date prefix and move to the appropriate exhibit subfolder. If no, leave it. You don't need to sort everything — sort the evidence.

### Phase 1: ORGANIZE (This week, between legal tasks)

**Rename every file that's going to May 14.**
Convention: `YYYY-MM-DD_Description_ShortCode.ext`

Examples:
- `2026-04-14_Order_Pending_Motions_Entry104.pdf`
- `2026-04-16_Text_Seize_And_Die.png`
- `2026-04-18_ER_Records_Ca75.pdf`
- `2026-04-29_Garage_Access_First.mp4`

**Move the NFCU statements** from `02_Production_Exhibits` to `01_LEGAL/04_Exhibits/J_NFCU_Statements/`. Keep the existing WRJ numbering.

**Upload the new documents** generated today:
- Brenda Availability Declaration → `01_LEGAL/04_Exhibits/`
- Exhibit L Timeline → `01_LEGAL/04_Exhibits/`
- Discovery Supplemental Response → `01_LEGAL/02_Filings_Will/`
- Master Context → `00_P31_MASTER/`

**Archive the noise:**
- Track 1/2/3 folders (empty) → `ARCHIVE/`
- Three.js code folders → `ARCHIVE/Code_Artifacts_ThreeJS/`
- drive-download folder → `ARCHIVE/`
- iPhone folder → merge into `05_PIXEL_DUMP_SORTED/`

### Phase 2: CONNECT (Post-May 14)

**Set up Google Workspace for P31** (when budget allows, $6/mo):
- Create will@p31ca.org as a Google Workspace account (or use Cloudflare Email Routing + free Google account)
- This gives you Drive, Docs, Calendar, Meet under the P31 domain
- Share the legal folder with Brenda and any retained attorney

**Wire the Command Center spreadsheet to the EPCP:**
- The RAW_ROOT_WonkySprout_Command_Center spreadsheet was accessed today
- This becomes the source of truth that the EPCP dashboard reads
- A CF Worker on `api.p31ca.org/epcp-state` can poll a published Google Sheet and serve JSON

**Set up Google Calendar integration:**
- May 14 hearing → calendar event with 3-day, 1-day, morning reminders
- SSDI recon deadline → calendar event
- FERS deadline → calendar event
- Weekly: "Run npm run audit:pages" → recurring event
- Weekly: "Check calcium, take meds" → daily recurring

### Phase 3: SOVEREIGN MIGRATION (Post-attorney, post-hearing)

**The goal:** No critical document lives ONLY in Google. Everything has a sovereign copy.

**CF R2 Evidence Vault:**
- Create a `p31-vault` R2 bucket (free tier: 10GB storage, 1M reads/month)
- A CF Worker uploads files with SHA-256 hash + timestamp metadata
- Every evidence file gets: `{ hash, uploadedAt, originalName, category, caseRef }`
- This is the Genesis Block pattern applied to evidence management

**Document Library Integration:**
- bonding-soup's doc-library already indexes 280 documents
- Legal research reports → add to doc-library with proper metadata
- Corporate formation docs → add to doc-library
- Each document gets a `p31.doc/1.0.0` schema entry in the alignment registry

**Email Migration:**
- Set up will@p31ca.org email via CF Email Routing (free) → Gmail forwarding
- Or set up full Google Workspace ($6/mo) for Drive + Docs + Calendar
- Update all court filings, benefits applications, and correspondence to use will@p31ca.org
- Keep classicwilly@wonkysprout.com as forwarding-only (already configured per memory)

**Backup Strategy:**
- Weekly: `rclone sync gdrive: /backup/gdrive/` on the desktop (automated)
- Monthly: Manual R2 snapshot of the evidence vault
- The bonding-soup repo on GitHub is already backed up (code + docs)
- The Zenodo publications are immutable (DOIs assigned)

---

## 4. THE COMMAND CENTER SPREADSHEET (Upgrade Plan)

The RAW_ROOT_WonkySprout_Command_Center spreadsheet can become the P31 operational database.

### Tab Structure:
1. **DEADLINES** — All dates with countdown formulas (hearing, SSDI, FERS, etc.)
2. **MEATSPACE** — Task list synced with the EPCP (checkbox, status, date due)
3. **EXHIBITS** — A-M checklist with status (collected/pending/N/A), file locations
4. **CONTACTS** — Quick reference (name, phone, email, role)
5. **FINANCIAL** — Income, expenses, child support tracking, bank balances
6. **P31_TECH** — Verify gates count, test counts, deploy status (manual update)
7. **DISCOVERY** — What's been produced, what's demanded, deadlines, gaps
8. **DOCKET_LOG** — Every entry with date, type, status (mirrors the 105+ entry audit)

The spreadsheet becomes the data backend for the EPCP React component. Publish the sheet as CSV → fetch from a CF Worker → render in the dashboard.

---

## 5. WHAT TO DO RIGHT NOW (Priority Order)

### Today (10 minutes, between FERS email and GLSP call):
1. Create `01_LEGAL_2025CV936/01_Orders/` folder in Drive
2. Move the April 14 Order PDF out of the pixel dump into it
3. Create `01_LEGAL_2025CV936/04_Exhibits/` folder
4. Rename the three identical "IN THE SUPERIOR COURT" docs

### Tomorrow (20 minutes):
5. Create the full folder structure from §2A
6. Move the NFCU statements into the exhibits folder
7. Upload today's generated documents (Brenda declaration, Exhibit L, Discovery response)
8. Archive the empty Track folders and code artifacts

### This week (30 minutes total, spread across days):
9. Sort the pixel dump — evidence screenshots get dates + descriptions
10. Upload any text message screenshots not yet in Drive
11. Create INDEX.md files in the exhibit subfolders listing what each file is

### Post-May 14:
12. Set up p31ca.org email (CF Email Routing or Google Workspace)
13. Create the R2 evidence vault
14. Wire the spreadsheet to the EPCP dashboard
15. Begin migrating canonical documents to bonding-soup doc-library

---

## 6. THE NAMING CONVENTION (Binding)

Every file in the P31 system follows this pattern:

```
YYYY-MM-DD_Category_Description_ShortCode.ext
```

**Categories:**
- `ORD` — Court orders
- `MOT` — Motions filed
- `EXH` — Exhibits
- `TXT` — Text message screenshots
- `MED` — Medical records
- `FIN` — Financial documents
- `COR` — Corporate documents
- `RES` — Research/drafts
- `REF` — Reference documents

**Examples:**
```
2026-04-14_ORD_Pending_Motions_Entry104.pdf
2026-04-16_TXT_Medication_Denial_01.png
2026-04-18_MED_ER_UF_Health_Ca75.pdf
2026-04-03_COR_Articles_Incorporation.pdf
2026-05-04_MOT_Omnibus_Emergency_Relief.docx
2026-05-04_EXH_A_Brenda_Availability.docx
```

This convention means: every file sorts chronologically in any file browser. Every file's purpose is readable without opening it. Every file can be found by date, category, or keyword search.

---

*The folder structure is the calcium cage for your documents. Without it, every file is a floating neutral — connected to nothing, protecting nothing. With it, every document has a vertex, an edge, and a purpose.*

💜🔺💜
