#!/usr/bin/env node
/**
 * scripts/meatspace/generate.mjs
 *
 * P31 meatspace artifact generator.
 *
 * Produces print-ready PDFs that the operator can hand to humans when speech
 * fails or context is short. Outputs to dist/meatspace/. All artifacts read
 * brand colors from andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json
 * so they stay token-aligned with the website without hand-syncing hex values.
 *
 * Artifacts (CWP-PHOS-2026-01 · WCD D-2 through D-6):
 *   business-card  — 3.5"×2"  with bleed (CWP D-2, ships first)
 *   qr-stickers    — 12-up sticker sheet on US Letter (CWP D-3)
 *   elevator-card  — 5"×3" index card, 3-sentence pitch front, QR back (CWP D-4)
 *   one-pager      — US Letter handout (CWP D-5)
 *   pro-handout    — 5.5"×8.5" professional handout (CWP D-6)
 *
 * Usage:
 *   node scripts/meatspace/generate.mjs                  # all artifacts
 *   node scripts/meatspace/generate.mjs --only=business-card
 *   node scripts/meatspace/generate.mjs --qr-target=https://p31ca.org/welcome
 *
 * Print specs:
 *   - 72-pt logical units (pdf-lib default; convert at print time)
 *   - Bleed marks 0.125" (9 pt) where applicable
 *   - QR codes use HIGH error correction (30% damage tolerance)
 *
 * Font note (v1 → v2 path):
 *   v1 ships with built-in Helvetica fallback. The canonical typeface is
 *   Atkinson Hyperlegible (per docs/P31-DESIGN-DOCTRINE.md §1.4). When the
 *   .ttf is added to scripts/meatspace/fonts/AtkinsonHyperlegible-{Regular,Bold}.ttf,
 *   this script will pick it up automatically (see loadFonts()) and re-emit
 *   the artifacts. The print pipeline never breaks; only the typography
 *   improves.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANON } from './lib/canon.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'dist', 'meatspace');
const FONTS_DIR = path.join(__dirname, 'fonts');

const ARGS = parseArgs(process.argv.slice(2));
// Default QR target is /welcome — the meatspace bridge's intended landing
// pad. /welcome wires the bus bar nervous system (subject-prefs + cogpass-
// reader + phos-guide) so PHOS auto-expands and greets the human in the
// operator's voice. Override with --qr-target=https://p31ca.org/elsewhere
// when needed (preview branches, campaign-specific URLs, etc.).
const QR_TARGET = ARGS['qr-target'] || 'https://p31ca.org/welcome';
const ONLY = ARGS['only']; // optional artifact id

// ─── canonical operator contact (per CWP-PHOS-2026-01 § Meatspace) ──────────
const OPERATOR = {
  name: 'William Johnson',
  title: 'Founder',
  email: 'will@p31ca.org',
  phone: '(912) 227-4980',
  domainPrimary: 'phosphorus31.org',
  domainHub: 'p31ca.org',
};
const ENTITY = {
  legal: 'P31 Labs, Inc.',
  ein: '42-1888158',
  jurisdiction: 'Georgia nonprofit',
  pendingNote: '501(c)(3) application pending',
};
const TAGLINE_PRIMARY = 'Technology that adapts to your brain — not the other way around.';
const TAGLINE_OPERATOR_VOICE = 'For every family out there figuring it out as they go — help is on the way.';
const TRUST_LINE = 'Open source · Nonprofit · Free';

// ─── unit helpers ───────────────────────────────────────────────────────────
const IN = 72;            // 1 inch = 72 PDF points
const BLEED = 0.125 * IN; // 9 pt
const SAFE = 0.125 * IN;  // safe inset from trim

// ─── color helpers (token → pdf-lib rgb) ────────────────────────────────────
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) throw new Error(`Bad hex: ${hex}`);
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}
const C = {
  void: hexToRgb(CANON.surfaces.hub.void),
  cloud: hexToRgb(CANON.surfaces.hub.cloud),
  paper: hexToRgb(CANON.surfaces.hub.paper),
  muted: hexToRgb(CANON.surfaces.hub.muted),
  coral: hexToRgb(CANON.palette.coral),
  teal: hexToRgb(CANON.palette.teal),
  cyan: hexToRgb(CANON.palette.cyan),
  phosphorus: hexToRgb(CANON.palette.phosphorus),
};

// ─── font loader (v1: Helvetica; v2: Atkinson Hyperlegible if present) ──────
async function loadFonts(pdf) {
  const atkRegular = path.join(FONTS_DIR, 'AtkinsonHyperlegible-Regular.ttf');
  const atkBold = path.join(FONTS_DIR, 'AtkinsonHyperlegible-Bold.ttf');
  const hasAtk =
    (await exists(atkRegular)) && (await exists(atkBold));
  if (hasAtk) {
    pdf.registerFontkit((await import('@pdf-lib/fontkit')).default);
    const reg = await pdf.embedFont(await fs.readFile(atkRegular));
    const bold = await pdf.embedFont(await fs.readFile(atkBold));
    return { regular: reg, bold, label: 'Atkinson Hyperlegible' };
  }
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  return { regular: reg, bold, label: 'Helvetica (v1 fallback)' };
}
async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

// ─── QR code → PNG bytes ────────────────────────────────────────────────────
async function qrPng(text, sizePx = 600) {
  return await QRCode.toBuffer(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: sizePx,
    color: { dark: '#0f1115', light: '#ffffff' },
  });
}

// ─── K₄ tetrahedron mark (vector, drawn programmatically) ───────────────────
/**
 * Draw a small K₄ mark: 4 vertices, 6 edges. The "front" face is a triangle;
 * the 4th vertex sits inside as the centroid (2D projection of a tetrahedron).
 * Phosphorus-coral nucleus, teal edges. Aligned with hub branding.
 */
function drawK4Mark(page, cx, cy, radius) {
  // 3 outer vertices on a triangle (top, bottom-left, bottom-right)
  const r = radius;
  const sqrt3_2 = Math.sqrt(3) / 2;
  const vertices = [
    { x: cx,                 y: cy + r },              // top
    { x: cx - r * sqrt3_2,   y: cy - r / 2 },          // bottom-left
    { x: cx + r * sqrt3_2,   y: cy - r / 2 },          // bottom-right
    { x: cx,                 y: cy },                  // centroid (4th vertex)
  ];
  // 6 edges (K₄ is the complete graph)
  const edges = [
    [0, 1], [0, 2], [0, 3],
    [1, 2], [1, 3], [2, 3],
  ];
  for (const [a, b] of edges) {
    page.drawLine({
      start: { x: vertices[a].x, y: vertices[a].y },
      end:   { x: vertices[b].x, y: vertices[b].y },
      thickness: 0.7,
      color: C.teal,
      opacity: 0.85,
    });
  }
  // 4 vertex dots (outer 3 in cloud, center in coral — phosphorus core)
  for (let i = 0; i < 3; i++) {
    page.drawCircle({ x: vertices[i].x, y: vertices[i].y, size: 1.6, color: C.cloud });
  }
  page.drawCircle({ x: vertices[3].x, y: vertices[3].y, size: 2.2, color: C.coral });
}

// ─── BUSINESS CARD (3.5" × 2", 2-page PDF: front + back) ────────────────────
async function generateBusinessCard() {
  const trimW = 3.5 * IN;
  const trimH = 2.0 * IN;
  const pageW = trimW + 2 * BLEED;
  const pageH = trimH + 2 * BLEED;

  const pdf = await PDFDocument.create();
  pdf.setTitle('P31 Labs · business card');
  pdf.setAuthor('P31 Labs, Inc.');
  pdf.setSubject('Print at 100% on 3.5×2 stock with 0.125" bleed');
  pdf.setProducer('scripts/meatspace/generate.mjs');
  const fonts = await loadFonts(pdf);

  // ── Page 1: FRONT ─────────────────────────────────────────────────────────
  const front = pdf.addPage([pageW, pageH]);
  front.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.void });

  const xL = BLEED + SAFE;            // safe-zone left
  const yT = BLEED + trimH - SAFE;    // safe-zone top
  const yB = BLEED + SAFE;            // safe-zone bottom

  // K₄ mark + wordmark (top-left)
  drawK4Mark(front, xL + 9, yT - 9, 9);
  front.drawText('P31 LABS', {
    x: xL + 26, y: yT - 12,
    size: 11, font: fonts.bold, color: C.cloud,
    characterSpacing: 1.2,
  });

  // Operator name + title (middle-left)
  front.drawText(OPERATOR.name, {
    x: xL, y: yT - 42,
    size: 13, font: fonts.bold, color: C.cloud,
  });
  front.drawText(OPERATOR.title, {
    x: xL, y: yT - 58,
    size: 9, font: fonts.regular, color: C.muted,
  });

  // Contact block (lower)
  const contactLines = [
    OPERATOR.email,
    OPERATOR.phone,
    OPERATOR.domainPrimary,
  ];
  let cy = yB + 28;
  for (const line of contactLines.reverse()) {
    front.drawText(line, {
      x: xL, y: cy,
      size: 8.5, font: fonts.regular, color: C.cloud,
    });
    cy += 12;
  }

  // ── Page 2: BACK ──────────────────────────────────────────────────────────
  const back = pdf.addPage([pageW, pageH]);
  back.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.void });

  // Tagline (top, wrapped to two lines)
  const taglineSize = 9;
  const taglineLines = wrapText(TAGLINE_PRIMARY, fonts.bold, taglineSize, trimW - 2 * SAFE);
  let ty = yT - 14;
  for (const line of taglineLines) {
    const w = fonts.bold.widthOfTextAtSize(line, taglineSize);
    back.drawText(line, {
      x: BLEED + (trimW - w) / 2, y: ty,
      size: taglineSize, font: fonts.bold, color: C.cloud,
    });
    ty -= 12;
  }

  // QR code (centered)
  const qrBytes = await qrPng(QR_TARGET, 600);
  const qrImg = await pdf.embedPng(qrBytes);
  const qrSize = 64;
  back.drawImage(qrImg, {
    x: BLEED + (trimW - qrSize) / 2,
    y: BLEED + (trimH - qrSize) / 2 - 6,
    width: qrSize, height: qrSize,
  });

  // Trust line + entity (bottom)
  const trustW = fonts.regular.widthOfTextAtSize(TRUST_LINE, 7);
  back.drawText(TRUST_LINE, {
    x: BLEED + (trimW - trustW) / 2, y: yB + 14,
    size: 7, font: fonts.regular, color: C.muted,
    characterSpacing: 0.6,
  });
  const entityLine = `${ENTITY.legal} · EIN ${ENTITY.ein}`;
  const entW = fonts.regular.widthOfTextAtSize(entityLine, 6);
  back.drawText(entityLine, {
    x: BLEED + (trimW - entW) / 2, y: yB + 4,
    size: 6, font: fonts.regular, color: C.muted,
  });

  return { pdf, name: 'p31-business-card.pdf', font: fonts.label };
}

// ─── ONE-PAGER (US Letter, single page, 3-tile body + big QR) ──────────────
/**
 * The leave-behind handout. Goes in FERS appeal envelopes, on library
 * bulletin boards, in therapist waiting rooms, at community centers, in
 * the "take one" boxes at coffee shops. Larger than the elevator card →
 * room for actual prose; smaller than a brochure → no fold required.
 *
 * Audience: parents of neurodivergent kids, therapists, case workers,
 * nonprofit administrators. Slightly more attentive than the sticker
 * audience but still strangers. Tier-0 vocabulary discipline applies
 * (PHOS-VOICE-DRAFT §2.11) — no K₄, no Posner, no synergetics.
 *
 * Anatomy (top to bottom):
 *   1. Header strip   — K₄ mark + wordmark + operator §3.1 tagline
 *   2. Hero block     — H1 + 2-sentence intro
 *   3. Three tiles    — what / how it's different / how to help
 *   4. Legal block    — compact terms §5 disclosure
 *   5. QR + scan-to-start — large scannable target
 *   6. Footer         — entity + trust
 */
async function generateOnePager() {
  const pageW = 8.5 * IN;
  const pageH = 11 * IN;
  const M = 0.5 * IN;        // page margin
  const innerW = pageW - 2 * M;

  const pdf = await PDFDocument.create();
  pdf.setTitle('P31 Labs · one-pager');
  pdf.setAuthor('P31 Labs, Inc.');
  pdf.setSubject(
    `US Letter handout. Print at 100% on cardstock or plain paper. ` +
    `QR target: ${QR_TARGET}`
  );
  pdf.setProducer('scripts/meatspace/generate.mjs');
  const fonts = await loadFonts(pdf);

  const page = pdf.addPage([pageW, pageH]);
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.void });

  // Cursor pattern: y starts at top, decreases as we draw downward
  let y = pageH - M;

  // ── 1. Header strip (K₄ mark + wordmark + operator tagline) ─────────────
  drawK4Mark(page, M + 11, y - 11, 11);
  page.drawText('P31 LABS', {
    x: M + 30, y: y - 14,
    size: 13, font: fonts.bold, color: C.cloud,
    characterSpacing: 1.4,
  });
  // Operator §3.1 tagline (right-aligned)
  const taglineSize = 9;
  const taglineW = fonts.bold.widthOfTextAtSize(TAGLINE_OPERATOR_VOICE, taglineSize);
  if (taglineW <= innerW - 130) {
    page.drawText(TAGLINE_OPERATOR_VOICE, {
      x: M + innerW - taglineW, y: y - 13,
      size: taglineSize, font: fonts.bold, color: C.coral,
    });
  } else {
    // wrap to two lines on the right
    const lines = wrapText(TAGLINE_OPERATOR_VOICE, fonts.bold, taglineSize, innerW - 130);
    let ty = y - 11;
    for (const line of lines) {
      const w = fonts.bold.widthOfTextAtSize(line, taglineSize);
      page.drawText(line, {
        x: M + innerW - w, y: ty,
        size: taglineSize, font: fonts.bold, color: C.coral,
      });
      ty -= taglineSize * 1.25;
    }
  }
  y -= 36;

  // separator line
  page.drawLine({
    start: { x: M, y }, end: { x: M + innerW, y },
    thickness: 0.5, color: C.muted, opacity: 0.5,
  });
  y -= 28;

  // ── 2. Hero block ────────────────────────────────────────────────────────
  const heroH1 = 'Tools that adapt to your brain.';
  const heroH1Size = 26;
  const heroH1W = fonts.bold.widthOfTextAtSize(heroH1, heroH1Size);
  page.drawText(heroH1, {
    x: M + (innerW - heroH1W) / 2, y: y - heroH1Size,
    size: heroH1Size, font: fonts.bold, color: C.cloud,
  });
  y -= heroH1Size + 14;

  const heroSub =
    'P31 Labs builds free, open-source software for neurodivergent families. ' +
    'Every page changes itself for the person reading it — contrast, density, ' +
    'motion, the way it talks — without asking you to log in or share data.';
  const heroSubSize = 11.5;
  const heroSubLines = wrapText(heroSub, fonts.regular, heroSubSize, innerW - 60);
  for (const line of heroSubLines) {
    const w = fonts.regular.widthOfTextAtSize(line, heroSubSize);
    page.drawText(line, {
      x: M + (innerW - w) / 2, y: y - heroSubSize,
      size: heroSubSize, font: fonts.regular, color: C.cloud,
    });
    y -= heroSubSize * 1.45;
  }
  y -= 22;

  // ── 3. Three tiles ───────────────────────────────────────────────────────
  const tileGap = 12;
  const tileW = (innerW - tileGap * 2) / 3;
  const tileH = 230;
  const tileY = y - tileH;

  const tiles = [
    {
      heading: 'What we build',
      lines: [
        'A context card you fill in once and use everywhere.',
        'Family mesh — share the load without sharing data.',
        'Tools for kids: Node Zero, electronics, mesh comms.',
        'Cognitive Passport for AI conversations.',
        'Open-source code anyone can read or fork.',
      ],
      accent: C.teal,
    },
    {
      heading: "How it's different",
      lines: [
        'Free forever. No "pro" tier. No "premium" features.',
        'No login. No tracking. No accounts.',
        'One slider quiets the whole interface for sensory load.',
        'Built by an AuDHD operator on disability income.',
        'Every dollar of donations is line-item visible.',
      ],
      accent: C.cyan,
    },
    {
      heading: 'How to help',
      lines: [
        'Use the tools. Tell a friend.',
        'Ko-fi: ko-fi.com/trimtab69420',
        'Stripe direct: donate-api.phosphorus31.org',
        'Donations not yet tax-deductible',
        '(501(c)(3) application pending IRS).',
      ],
      accent: C.coral,
    },
  ];

  for (let i = 0; i < tiles.length; i++) {
    const tx = M + i * (tileW + tileGap);
    const t = tiles[i];

    // Tile background
    page.drawRectangle({
      x: tx, y: tileY,
      width: tileW, height: tileH,
      color: rgb(1, 1, 1), opacity: 0.025,
    });
    // Top accent line
    page.drawLine({
      start: { x: tx + 8, y: tileY + tileH - 4 },
      end:   { x: tx + 32, y: tileY + tileH - 4 },
      thickness: 2.2, color: t.accent,
    });

    // Heading
    page.drawText(t.heading, {
      x: tx + 12, y: tileY + tileH - 28,
      size: 11, font: fonts.bold, color: t.accent,
      characterSpacing: 0.5,
    });

    // Bullet lines
    let by = tileY + tileH - 50;
    for (const line of t.lines) {
      const wrapped = wrapText('• ' + line, fonts.regular, 9.5, tileW - 20);
      for (const wline of wrapped) {
        page.drawText(wline, {
          x: tx + 12, y: by,
          size: 9.5, font: fonts.regular, color: C.cloud,
        });
        by -= 13;
      }
      by -= 4; // small gap between bullets
    }
  }
  y = tileY - 18;

  // ── 4. Compact legal block ───────────────────────────────────────────────
  page.drawLine({
    start: { x: M, y }, end: { x: M + innerW, y },
    thickness: 0.4, color: C.butter, opacity: 0.5,
  });
  y -= 14;
  const legalLines = [
    'P31 Labs, Inc. is a Georgia domestic nonprofit (EIN 42-1888158, incorporated April 3, 2026). ' +
    'Our 501(c)(3) application (Form 1023-EZ, Pay.gov ID 281TLBGO) was filed 2026-04-30 and is ' +
    'pending IRS determination. Until a determination letter is issued, donations are NOT deductible.',
  ];
  for (const line of legalLines) {
    const wrapped = wrapText(line, fonts.regular, 8, innerW - 20);
    for (const wline of wrapped) {
      page.drawText(wline, {
        x: M + 10, y: y - 8,
        size: 8, font: fonts.regular, color: C.muted,
      });
      y -= 11;
    }
  }
  y -= 14;

  // ── 5. Big QR + "scan to start" ──────────────────────────────────────────
  const qrSize = 1.4 * IN;
  const qrTilePad = 8;
  const qrTileSize = qrSize + qrTilePad * 2;
  const qrX = M + (innerW - qrTileSize) / 2;
  const qrY = y - qrTileSize - 4;

  const qrBytes = await qrPng(QR_TARGET, 600);
  const qrImg = await pdf.embedPng(qrBytes);
  page.drawRectangle({
    x: qrX, y: qrY,
    width: qrTileSize, height: qrTileSize,
    color: C.paper,
  });
  page.drawImage(qrImg, {
    x: qrX + qrTilePad, y: qrY + qrTilePad,
    width: qrSize, height: qrSize,
  });

  // "scan to start" + URL beside the QR (left side, vertically centered)
  const scanText = 'Scan to start';
  const scanSize = 16;
  const scanW = fonts.bold.widthOfTextAtSize(scanText, scanSize);
  page.drawText(scanText, {
    x: qrX - scanW - 18, y: qrY + qrTileSize / 2 + 4,
    size: scanSize, font: fonts.bold, color: C.cloud,
  });
  const urlText = 'p31ca.org/welcome';
  const urlSize = 11;
  const urlW = fonts.regular.widthOfTextAtSize(urlText, urlSize);
  page.drawText(urlText, {
    x: qrX - urlW - 18, y: qrY + qrTileSize / 2 - 14,
    size: urlSize, font: fonts.regular, color: C.coral,
  });

  // "two minutes" + privacy line on the right of the QR
  const timeText = 'Two minutes.';
  const timeSize = 16;
  page.drawText(timeText, {
    x: qrX + qrTileSize + 18, y: qrY + qrTileSize / 2 + 4,
    size: timeSize, font: fonts.bold, color: C.cloud,
  });
  page.drawText('We keep nothing.', {
    x: qrX + qrTileSize + 18, y: qrY + qrTileSize / 2 - 14,
    size: urlSize, font: fonts.regular, color: C.coral,
  });

  // ── 6. Footer ────────────────────────────────────────────────────────────
  const footerEntity = 'P31 Labs, Inc. · EIN 42-1888158 · Georgia domestic nonprofit corporation';
  const footerTrust = 'Open source · No tracking · No login · We keep nothing about you';
  const footerSize = 7.5;
  const fEntW = fonts.regular.widthOfTextAtSize(footerEntity, footerSize);
  const fTrW = fonts.regular.widthOfTextAtSize(footerTrust, footerSize);
  page.drawText(footerEntity, {
    x: M + (innerW - fEntW) / 2, y: M - 4,
    size: footerSize, font: fonts.regular, color: C.muted,
  });
  page.drawText(footerTrust, {
    x: M + (innerW - fTrW) / 2, y: M - 14,
    size: footerSize, font: fonts.regular, color: C.muted,
  });

  return { pdf, name: 'p31-one-pager.pdf', font: fonts.label };
}

// ─── ELEVATOR CARD (5" × 3", 2-page PDF: front=pitch, back=QR + tagline) ────
/**
 * Larger canvas than a business card. Designed to be handed to a stranger when
 * the operator has ten seconds and zero spoons for explanation. Front carries
 * a three-sentence pitch in Tier-0 stranger vocabulary (per PHOS-VOICE-DRAFT
 * §2.11). Back carries the operator-voice tagline + a large scannable QR.
 *
 * Tier-0 vocabulary discipline (front face):
 *   ALLOWED: brain, tools, free, adapt, yours, safe, help, here
 *   BANNED:  K₄, Posner, synergetics, jitterbug, Larmor, isostatic,
 *            sovereignty, tetrahedral, decoherence (these belong in /lab)
 *
 * The pitch was authored in this commit; operator may revise via PHOS-VOICE
 * draft §4 once the iPad is warm. Until then this copy is the ship default.
 *
 * Print options:
 *   • Plain US Letter cardstock, 4-up layout (operator hand-cuts to 5×3)
 *   • 5×3 commercial index card stock (single PDF page per card)
 *   • Pre-cut 5×3 perforated index card sheets
 */
async function generateElevatorCard() {
  const trimW = 5.0 * IN;
  const trimH = 3.0 * IN;
  const pageW = trimW + 2 * BLEED;
  const pageH = trimH + 2 * BLEED;

  const pdf = await PDFDocument.create();
  pdf.setTitle('P31 Labs · elevator card');
  pdf.setAuthor('P31 Labs, Inc.');
  pdf.setSubject(
    `5"×3" leave-behind card. Print at 100% on 5×3 stock with 0.125" bleed, ` +
    `or 4-up on US Letter and trim. QR target: ${QR_TARGET}`
  );
  pdf.setProducer('scripts/meatspace/generate.mjs');
  const fonts = await loadFonts(pdf);

  const xL = BLEED + SAFE;
  const xR = BLEED + trimW - SAFE;
  const yT = BLEED + trimH - SAFE;
  const yB = BLEED + SAFE;
  const innerW = trimW - 2 * SAFE;

  // ── Page 1: FRONT — three-sentence pitch ─────────────────────────────────
  const front = pdf.addPage([pageW, pageH]);
  front.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.void });

  // Header: K₄ mark + wordmark (top-left, same anchor as business card)
  drawK4Mark(front, xL + 9, yT - 9, 9);
  front.drawText('P31 LABS', {
    x: xL + 26, y: yT - 12,
    size: 11, font: fonts.bold, color: C.cloud,
    characterSpacing: 1.2,
  });

  // Three sentences (operator-rewritable; ship default in §2 of this generator)
  const sentences = [
    {
      text: 'P31 Labs builds free tools that adapt to how your brain works.',
      size: 13, font: fonts.bold, color: C.cloud,
    },
    {
      text: 'The whole site changes for you — contrast, density, motion, the way it talks — without ever asking for a login.',
      size: 10, font: fonts.regular, color: C.cloud,
    },
    {
      text: 'Scan to start. Two minutes. We keep nothing about you.',
      size: 11.5, font: fonts.bold, color: C.coral,
    },
  ];

  // Lay out the three sentences in the body region, centered vertically
  // between header (yT - 32) and footer (yB + 16). Each sentence wraps to
  // innerW; sentences separated by an 8pt gap.
  const bodyTop = yT - 32;
  const bodyBottom = yB + 18;
  const bodyHeight = bodyTop - bodyBottom;

  // Pre-wrap to measure total height
  const wrapped = sentences.map(s => ({
    ...s,
    lines: wrapText(s.text, s.font, s.size, innerW),
    lineHeight: s.size * 1.25,
  }));
  const totalH =
    wrapped.reduce((sum, s) => sum + s.lines.length * s.lineHeight, 0) +
    (wrapped.length - 1) * 10; // 10pt gap between sentences
  let cy = bodyBottom + (bodyHeight + totalH) / 2;

  for (const { lines, font, size, color, lineHeight } of wrapped) {
    for (const line of lines) {
      front.drawText(line, {
        x: xL, y: cy - size,
        size, font, color,
      });
      cy -= lineHeight;
    }
    cy -= 10; // inter-sentence gap
  }

  // Footer: domain + trust line (muted, tiny)
  const footerLine = `${OPERATOR.domainHub} · ${TRUST_LINE.toLowerCase()}`;
  front.drawText(footerLine, {
    x: xL, y: yB + 2,
    size: 7, font: fonts.regular, color: C.muted,
    characterSpacing: 0.4,
  });

  // ── Page 2: BACK — tagline + large QR + entity ───────────────────────────
  const back = pdf.addPage([pageW, pageH]);
  back.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.void });

  // Tagline (top, centered) — operator voice §3.1
  const taglineSize = 14;
  const taglineW = fonts.bold.widthOfTextAtSize(TAGLINE_OPERATOR_VOICE, taglineSize);
  let taglineX, taglineFinalSize;
  if (taglineW > innerW) {
    // Wrap to two lines if it overflows
    const lines = wrapText(TAGLINE_OPERATOR_VOICE, fonts.bold, taglineSize, innerW);
    let ty = yT - 14;
    for (const line of lines) {
      const w = fonts.bold.widthOfTextAtSize(line, taglineSize);
      back.drawText(line, {
        x: BLEED + (trimW - w) / 2, y: ty,
        size: taglineSize, font: fonts.bold, color: C.cloud,
      });
      ty -= taglineSize * 1.25;
    }
  } else {
    taglineX = BLEED + (trimW - taglineW) / 2;
    back.drawText(TAGLINE_OPERATOR_VOICE, {
      x: taglineX, y: yT - 16,
      size: taglineSize, font: fonts.bold, color: C.cloud,
    });
  }

  // QR (centered, large — 1.6" square; the elevator card's job is "scan me")
  const qrBytes = await qrPng(QR_TARGET, 600);
  const qrImg = await pdf.embedPng(qrBytes);
  const qrSize = 1.5 * IN;
  const qrTilePad = 6;
  const qrTileSize = qrSize + qrTilePad * 2;
  const qrTileX = BLEED + (trimW - qrTileSize) / 2;
  const qrTileY = yB + 26;
  back.drawRectangle({
    x: qrTileX, y: qrTileY,
    width: qrTileSize, height: qrTileSize,
    color: C.paper,
  });
  back.drawImage(qrImg, {
    x: qrTileX + qrTilePad, y: qrTileY + qrTilePad,
    width: qrSize, height: qrSize,
  });

  // Domain under QR
  const domLine = OPERATOR.domainHub;
  const domW = fonts.bold.widthOfTextAtSize(domLine, 10);
  back.drawText(domLine, {
    x: BLEED + (trimW - domW) / 2, y: qrTileY - 14,
    size: 10, font: fonts.bold, color: C.cloud,
    characterSpacing: 0.6,
  });

  // Entity footer (very bottom, muted)
  const entityLine =
    `${ENTITY.legal} · EIN ${ENTITY.ein} · ${ENTITY.pendingNote}`;
  const entW = fonts.regular.widthOfTextAtSize(entityLine, 6.5);
  back.drawText(entityLine, {
    x: BLEED + (trimW - entW) / 2, y: yB + 2,
    size: 6.5, font: fonts.regular, color: C.muted,
  });

  return { pdf, name: 'p31-elevator-card.pdf', font: fonts.label };
}

// ─── QR STICKERS (12-up sheet on US Letter, 2.5" square stickers) ──────────
/**
 * 12 stickers per US Letter sheet, arranged 3 cols × 4 rows, 2.5" square,
 * butted edge-to-edge. Cut marks live in the 0.5" page margins for hand
 * trimming with scissors or a paper cutter.
 *
 * Each sticker (Gray Rock by default — dark, high contrast, designed to pop
 * on laptops / water bottles / notebooks):
 *   • Top:    K₄ mark + P31 LABS wordmark
 *   • Middle: QR code on a paper-cream tile (scanner-friendly contrast)
 *   • Bottom: "help is on the way" tagline (operator voice §3.1) + p31ca.org
 *
 * Doctrine: the sticker is itself a Layer 1 (Gray Rock) artifact — inert,
 * minimal stimulus, no chroma except brand teal/coral accents. Scanning the
 * QR is the activation that takes the human into Layer 2 (Alive). The
 * meatspace bridge mirrors the website's interaction model exactly.
 */
async function generateQrStickers() {
  const pageW = 8.5 * IN;
  const pageH = 11 * IN;
  const cols = 3;
  const rows = 4;
  const stickerSize = 2.5 * IN;
  const gridW = cols * stickerSize;
  const gridH = rows * stickerSize;
  const marginX = (pageW - gridW) / 2;
  const marginY = (pageH - gridH) / 2;

  const pdf = await PDFDocument.create();
  pdf.setTitle('P31 Labs · QR sticker sheet (12-up)');
  pdf.setAuthor('P31 Labs, Inc.');
  pdf.setSubject(
    `12 stickers, 2.5" square. Print at 100% on US Letter cardstock or sticker stock. ` +
    `Cut along the gridlines (corner ticks in the page margins). QR target: ${QR_TARGET}`
  );
  pdf.setProducer('scripts/meatspace/generate.mjs');
  const fonts = await loadFonts(pdf);

  const page = pdf.addPage([pageW, pageH]);

  // Page background: paper (light) so cut marks are easy to see
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.paper });

  // Pre-render QR PNG once; embed once; draw 12 references
  const qrBytes = await qrPng(QR_TARGET, 600);
  const qrImg = await pdf.embedPng(qrBytes);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = marginX + c * stickerSize;
      // PDF y origin is bottom-left; row 0 (top in print order) sits highest
      const sy = marginY + (rows - 1 - r) * stickerSize;
      drawSticker(page, sx, sy, stickerSize, qrImg, fonts);
    }
  }

  drawCutGuides(page, marginX, marginY, gridW, gridH, stickerSize, cols, rows);

  return { pdf, name: 'p31-qr-stickers-12up.pdf', font: fonts.label };
}

function drawSticker(page, x, y, size, qrImg, fonts) {
  // Sticker face: void background (Layer 1 / Gray Rock)
  page.drawRectangle({ x, y, width: size, height: size, color: C.void });

  const cx = x + size / 2;

  // ── Top: K₄ mark + wordmark ──────────────────────────────────────────────
  const headerY = y + size - 16;
  drawK4Mark(page, cx - 22, headerY, 6);
  page.drawText('P31 LABS', {
    x: cx - 9, y: headerY - 4,
    size: 7.5, font: fonts.bold, color: C.cloud,
    characterSpacing: 1.1,
  });

  // ── Middle: QR on paper-cream tile (scanner-friendly contrast) ───────────
  const qrSize = 1.4 * IN;
  const qrTilePad = 5;
  const qrTileSize = qrSize + qrTilePad * 2;
  const qrTileX = cx - qrTileSize / 2;
  const qrTileY = y + (size - qrTileSize) / 2 - 4;
  page.drawRectangle({
    x: qrTileX, y: qrTileY,
    width: qrTileSize, height: qrTileSize,
    color: C.paper,
  });
  page.drawImage(qrImg, {
    x: qrTileX + qrTilePad,
    y: qrTileY + qrTilePad,
    width: qrSize, height: qrSize,
  });

  // ── Bottom: tagline (operator voice §3.1) + domain ───────────────────────
  const tagline = 'help is on the way';
  const tagSize = 8.5;
  const tagW = fonts.bold.widthOfTextAtSize(tagline, tagSize);
  page.drawText(tagline, {
    x: cx - tagW / 2, y: y + 18,
    size: tagSize, font: fonts.bold, color: C.coral,
  });
  const domain = OPERATOR.domainHub;
  const domSize = 7;
  const domW = fonts.regular.widthOfTextAtSize(domain, domSize);
  page.drawText(domain, {
    x: cx - domW / 2, y: y + 7,
    size: domSize, font: fonts.regular, color: C.cloud,
    characterSpacing: 0.4,
  });
}

// ─── WIRING POSTER (11 × 17 tabloid landscape, single sheet) ────────────────
// CWP-PHOS-2026-01 D-7. Operator wall reference for the entire P31 mesh.
// Source of truth: docs/P31-WIRING-DIAGRAM.md (the markdown has all detail
// + Mermaid + ASCII; this poster is the single-glance overview).
//
// Layout (1224 × 792 pt = 17 × 11 inches, landscape):
//
//   ┌────────────────────────── HEADER (56pt) ──────────────────────────┐
//   │   P31 ANDROMEDA — WIRING DIAGRAM        v1.0.0  ·  2026-05-01     │
//   │   "For every family out there figuring it out as they go..."      │
//   ├──────────────────────────┬────────────────────────────────────────┤
//   │  Q1: PUBLIC PORTALS      │  Q2: EDGE FLEET (30 unique Workers)    │
//   │  (hubs + routes + role)  │  (mesh + agents + bridges + identity)  │
//   │                          │                                        │
//   ├──────────────────────────┼────────────────────────────────────────┤
//   │  Q3: BUS BAR + PHOS      │  Q4: SOURCES + SWARMS + GATES          │
//   │  (5 scripts; voice JSON) │  (apply:constants; 10+11 agents; CI)   │
//   │                          │                                        │
//   ├──────────────────────────┴────────────────────────────────────────┤
//   │   FOOTER: doc reference + npm verify · the cage is closed          │
//   └────────────────────────────────────────────────────────────────────┘
async function generateWiringPoster() {
  const pdf = await PDFDocument.create();
  const fonts = await loadFonts(pdf);
  const W = 17 * IN;   // 1224 pt
  const H = 11 * IN;   // 792 pt
  const page = pdf.addPage([W, H]);

  const HEADER_H = 56;
  const FOOTER_H = 56;
  const BODY_H = H - HEADER_H - FOOTER_H;
  const BODY_Y = FOOTER_H;
  const QUAD_W = W / 2;
  const QUAD_H = BODY_H / 2;

  // ── canvas: void background w/ subtle grid ─────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.void });

  // grid (cyan 4% alpha approximation via near-void color)
  const gridColor = rgb(0.10, 0.11, 0.13);
  const gridStep = 24;
  for (let x = 0; x <= W; x += gridStep) {
    page.drawLine({ start: { x, y: 0 }, end: { x, y: H }, thickness: 0.25, color: gridColor });
  }
  for (let y = 0; y <= H; y += gridStep) {
    page.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: 0.25, color: gridColor });
  }

  // ── HEADER ─────────────────────────────────────────────────────────────
  const headerY = H - HEADER_H;
  page.drawRectangle({ x: 0, y: headerY, width: W, height: HEADER_H, color: C.void });
  page.drawLine({
    start: { x: 0, y: headerY },
    end: { x: W, y: headerY },
    thickness: 1, color: C.teal,
  });
  page.drawText('P31 ANDROMEDA', {
    x: 24, y: headerY + 28,
    size: 22, font: fonts.bold, color: C.cloud,
    characterSpacing: 1.2,
  });
  page.drawText('WIRING DIAGRAM', {
    x: 24, y: headerY + 8,
    size: 12, font: fonts.regular, color: C.teal,
    characterSpacing: 1.6,
  });
  const versionLabel = 'p31.wiringDiagram/1.0.0  ·  2026-05-01';
  const verW = fonts.regular.widthOfTextAtSize(versionLabel, 9);
  page.drawText(versionLabel, {
    x: W - 24 - verW, y: headerY + 36,
    size: 9, font: fonts.regular, color: C.muted,
  });
  page.drawText(TAGLINE_OPERATOR_VOICE, {
    x: W - 24 - fonts.regular.widthOfTextAtSize(TAGLINE_OPERATOR_VOICE, 9), y: headerY + 16,
    size: 9, font: fonts.regular, color: C.cloud,
  });
  page.drawText('— PHOS-VOICE-DRAFT.md §3.1 (OPERATOR-VOICE)', {
    x: W - 24 - fonts.regular.widthOfTextAtSize('— PHOS-VOICE-DRAFT.md §3.1 (OPERATOR-VOICE)', 7), y: headerY + 4,
    size: 7, font: fonts.regular, color: C.muted,
  });

  // ── QUADRANT FRAMES ────────────────────────────────────────────────────
  const Q1 = { x: 0,            y: BODY_Y + QUAD_H, w: QUAD_W, h: QUAD_H };
  const Q2 = { x: QUAD_W,       y: BODY_Y + QUAD_H, w: QUAD_W, h: QUAD_H };
  const Q3 = { x: 0,            y: BODY_Y,          w: QUAD_W, h: QUAD_H };
  const Q4 = { x: QUAD_W,       y: BODY_Y,          w: QUAD_W, h: QUAD_H };
  for (const q of [Q1, Q2, Q3, Q4]) {
    page.drawLine({
      start: { x: q.x, y: q.y },
      end: { x: q.x + q.w, y: q.y },
      thickness: 0.5, color: C.muted,
    });
    page.drawLine({
      start: { x: q.x + q.w, y: q.y },
      end: { x: q.x + q.w, y: q.y + q.h },
      thickness: 0.5, color: C.muted,
    });
  }

  drawQuadrantPortals(page, Q1, fonts);
  drawQuadrantFleet(page, Q2, fonts);
  drawQuadrantBusBar(page, Q3, fonts);
  drawQuadrantSwarms(page, Q4, fonts);

  // ── FOOTER ─────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: 0, y: FOOTER_H },
    end: { x: W, y: FOOTER_H },
    thickness: 1, color: C.teal,
  });
  page.drawText('Source of truth:', {
    x: 24, y: 32,
    size: 8, font: fonts.bold, color: C.muted,
  });
  page.drawText('docs/P31-WIRING-DIAGRAM.md  (10 sections, every system, every file)', {
    x: 110, y: 32,
    size: 8, font: fonts.regular, color: C.cloud,
  });
  page.drawText('Verify on every commit:', {
    x: 24, y: 18,
    size: 8, font: fonts.bold, color: C.muted,
  });
  page.drawText('npm run verify  ->  alignment · phos-voice · cogpass-bridge · constants · facts · 50+ gates', {
    x: 140, y: 18,
    size: 8, font: fonts.regular, color: C.cloud,
  });
  page.drawText('Print on cardstock:', {
    x: 24, y: 4,
    size: 7, font: fonts.bold, color: C.muted,
  });
  page.drawText('npm run meatspace:print:wiring-poster   ·   11 × 17 tabloid landscape   ·   pin where you will see it', {
    x: 110, y: 4,
    size: 7, font: fonts.regular, color: C.muted,
  });
  // bottom-right tag
  const tag = 'Nine calcium · One phosphorus · The cage is complete';
  const tagW = fonts.regular.widthOfTextAtSize(tag, 9);
  page.drawText(tag, {
    x: W - 24 - tagW, y: 22,
    size: 9, font: fonts.regular, color: C.coral,
  });

  return { pdf, name: 'p31-wiring-poster.pdf', font: fonts.label };
}

// ─── Q1: Public portals (hubs + routes + role gates) ───────────────────────
function drawQuadrantPortals(page, q, fonts) {
  drawQuadrantHeader(page, q, fonts, '1', 'PUBLIC PORTALS', 'Hubs · Routes · Role gates');

  // Three role lanes vertically
  const innerY = q.y + 28;
  const innerH = q.h - 56;
  const lanes = [
    { label: 'STRANGER',  color: C.cloud,   roles: 'no CogPass',          y: innerY + innerH * 0.78 },
    { label: 'USER',      color: C.teal,    roles: 'CogPass user',        y: innerY + innerH * 0.45 },
    { label: 'OPERATOR',  color: C.coral,   roles: 'CogPass operator',    y: innerY + innerH * 0.12 },
  ];
  for (const lane of lanes) {
    page.drawText(lane.label, {
      x: q.x + 16, y: lane.y + 14,
      size: 9, font: fonts.bold, color: lane.color, characterSpacing: 1.0,
    });
    page.drawText(lane.roles, {
      x: q.x + 16, y: lane.y + 4,
      size: 7, font: fonts.regular, color: C.muted,
    });
    // Lane underline across quadrant
    page.drawLine({
      start: { x: q.x + 16, y: lane.y + 1 },
      end:   { x: q.x + q.w - 16, y: lane.y + 1 },
      thickness: 0.4, color: C.muted,
    });
  }

  // Routes positioned by role
  const routes = [
    { id: '/welcome',   role: 0, x: q.x + 100, color: C.teal,   note: 'PHOS first contact' },
    { id: '/passport/', role: 0, x: q.x + 200, color: C.teal,   note: 'localStorage card' },
    { id: '/support',   role: 0, x: q.x + 300, color: C.teal,   note: 'Ko-fi / Stripe' },
    { id: '/research',  role: 0, x: q.x + 400, color: C.teal,   note: '22 papers' },
    { id: '/lab',       role: 1, x: q.x + 100, color: C.cyan,   note: 'product catalog' },
    { id: '/stylebook', role: 1, x: q.x + 220, color: C.cyan,   note: 'design system' },
    { id: '/bonding',   role: 1, x: q.x + 340, color: C.coral,  note: 'cross-origin (BUS4)' },
    { id: '/ops',       role: 2, x: q.x + 100, color: C.coral,  note: 'dashboard' },
    { id: '/ede',       role: 2, x: q.x + 200, color: C.coral,  note: 'IDE' },
    { id: '/buffer',    role: 2, x: q.x + 290, color: C.coral,  note: 'comms drafts' },
    { id: '/glass-box', role: 2, x: q.x + 390, color: C.coral,  note: 'transparency' },
  ];
  for (const r of routes) {
    const lane = lanes[r.role];
    drawRouteBox(page, r.x, lane.y - 18, r.id, r.note, r.color, fonts);
  }

  // BUS4 bridge note (right edge)
  const bridgeX = q.x + q.w - 110;
  const bridgeY = lanes[1].y - 22;
  page.drawRectangle({
    x: bridgeX, y: bridgeY - 18,
    width: 100, height: 30,
    borderColor: C.phosphorus, borderWidth: 0.7, color: C.void,
  });
  page.drawText('BUS4 BRIDGE', {
    x: bridgeX + 6, y: bridgeY + 2,
    size: 7, font: fonts.bold, color: C.phosphorus, characterSpacing: 0.5,
  });
  page.drawText('cogpass-bridge.html', {
    x: bridgeX + 6, y: bridgeY - 8,
    size: 6, font: fonts.regular, color: C.cloud,
  });
  page.drawText('postMessage  ·  CSP-locked', {
    x: bridgeX + 6, y: bridgeY - 16,
    size: 5.5, font: fonts.regular, color: C.muted,
  });
}

// ─── Q2: Edge fleet (Workers grouped) ──────────────────────────────────────
function drawQuadrantFleet(page, q, fonts) {
  drawQuadrantHeader(page, q, fonts, '2', 'EDGE FLEET', '14 verified · 18 allowlisted · 30 unique (overlap: bonding-relay, p31-google-bridge)');

  const groups = [
    {
      title: 'MESH (THE CAGE)',          color: C.teal,
      x: q.x + 16,  y: q.y + q.h - 60,   w: 180, h: 84,
      items: ['k4-personal · DO+KV', 'k4-cage · DO+KV', 'k4-hubs · life-context', 'tetra-hub'],
    },
    {
      title: 'AGENTS + ORCH',            color: C.phosphorus,
      x: q.x + 200, y: q.y + q.h - 60,   w: 180, h: 84,
      items: ['k4-agent-hub', 'p31-agent-hub', 'p31-orchestrator', 'command-center', 'p31-cortex · grants', 'p31-forge'],
    },
    {
      title: 'COLLAB + BRIDGES',         color: C.cyan,
      x: q.x + 384, y: q.y + q.h - 60,   w: 180, h: 84,
      items: ['geodesic-room · WS DO', 'p31-google-bridge', 'bonding-relay', 'cf-edge-lab', 'spaceship-relay'],
    },
    {
      title: 'IDENTITY + AUTH',          color: C.coral,
      x: q.x + 16,  y: q.y + 12,         w: 180, h: 84,
      items: ['p31-passkey  ·  zone route', '   p31ca.org/api/passkey/*', 'genesis-gate', 'p31-bouncer'],
    },
    {
      title: 'PAYMENTS + COMMS',         color: C.coral,
      x: q.x + 200, y: q.y + 12,         w: 180, h: 84,
      items: ['donate-api  ·  Stripe', '   donate-api.phosphorus31.org', 'p31-social-worker', 'p31-social-broadcast', 'p31-pwa'],
    },
    {
      title: 'OPERATOR TOOLS',           color: C.muted,
      x: q.x + 384, y: q.y + 12,         w: 180, h: 84,
      items: ['p31-hearing-ops', 'p31-state', 'p31-quantum-edge', 'p31-telemetry', 'kenosis-mesh'],
    },
  ];
  for (const g of groups) drawWorkerGroup(page, g, fonts);

  // Constraints note
  const noteY = q.y + 110;
  page.drawText('CONSTRAINTS:  10 ms CPU  ·  1000 internal subrequests  ·  zero-budget edge', {
    x: q.x + 16, y: noteY,
    size: 7, font: fonts.regular, color: C.muted,
  });
}

// ─── Q3: Bus bar + PHOS voice pipeline ─────────────────────────────────────
function drawQuadrantBusBar(page, q, fonts) {
  drawQuadrantHeader(page, q, fonts, '3', 'BUS BAR + PHOS PIPELINE', 'BaseLayout 5-script load order');

  // Vertical script stack on the left half
  const stackX = q.x + 24;
  const stackY = q.y + q.h - 80;
  const scripts = [
    { num: '1', name: 'p31-subject-prefs.js',     mode: 'inline · sync',     color: C.cloud },
    { num: '2', name: 'p31-theme-engine.mjs',     mode: 'module',            color: C.teal  },
    { num: '3', name: 'p31-cogpass-reader.mjs',   mode: 'module',            color: C.cyan  },
    { num: '4', name: 'p31-phos-guide.mjs',       mode: 'module · CLAIMS',   color: C.phosphorus },
    { num: '5', name: 'p31-theme-switcher.mjs',   mode: 'module · SUPPRESS', color: C.muted },
  ];
  const stepH = 22;
  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    const y = stackY - i * stepH;
    page.drawText(s.num + '.', {
      x: stackX, y,
      size: 11, font: fonts.bold, color: s.color,
    });
    page.drawText(s.name, {
      x: stackX + 18, y,
      size: 9, font: fonts.bold, color: C.cloud,
    });
    page.drawText(s.mode, {
      x: stackX + 170, y,
      size: 7, font: fonts.regular, color: C.muted,
    });
    if (i < scripts.length - 1) {
      page.drawLine({
        start: { x: stackX + 6, y: y - 4 },
        end:   { x: stackX + 6, y: y - stepH + 12 },
        thickness: 0.5, color: C.muted,
      });
    }
  }
  // Outcome callout
  const outY = stackY - scripts.length * stepH - 8;
  page.drawRectangle({
    x: stackX, y: outY - 24,
    width: 280, height: 22,
    borderColor: C.coral, borderWidth: 0.7, color: C.void,
  });
  page.drawText('PHOS = only floating personalization affordance', {
    x: stackX + 6, y: outY - 16,
    size: 8, font: fonts.bold, color: C.coral,
  });

  // PHOS voice pipeline on the right half
  const pipeX = q.x + 320;
  page.drawText('PHOS VOICE', {
    x: pipeX, y: q.y + q.h - 40,
    size: 9, font: fonts.bold, color: C.teal, characterSpacing: 1.0,
  });
  const pipe = [
    { line: 'docs/PHOS-VOICE-DRAFT.md §4',     note: '13 slots · 1 OP · 12 DRAFT', color: C.cloud },
    { line: '   v   npm run build:phos-voice',  note: 'parser strips fenced examples', color: C.muted },
    { line: 'p31-phos-voice.json',              note: 'p31ca/public/lib/ · deterministic', color: C.cloud },
    { line: '   v   runtime fetch (every page)', note: 'tryLoadVoiceJson()', color: C.muted },
    { line: 'PHOS guide renders right copy',    note: 'voiceForPage(pathname)', color: C.cloud },
    { line: '!  CI gate: verify:phos-voice',    note: '5 checks · SHA-locked', color: C.coral },
  ];
  for (let i = 0; i < pipe.length; i++) {
    const p = pipe[i];
    const y = q.y + q.h - 56 - i * 16;
    page.drawText(p.line, {
      x: pipeX, y,
      size: 8, font: fonts.bold, color: p.color,
    });
    page.drawText(p.note, {
      x: pipeX + 8, y: y - 8,
      size: 6.5, font: fonts.regular, color: C.muted,
    });
  }
}

// ─── Q4: Sources + Swarms + Gates ──────────────────────────────────────────
function drawQuadrantSwarms(page, q, fonts) {
  drawQuadrantHeader(page, q, fonts, '4', 'SOURCES + SWARMS + GATES', 'Apply-constants · Ollama · simplex-v7 · CI');

  // Top: apply-constants derivation graph (compact)
  const topY = q.y + q.h - 50;
  page.drawText('APPLY-CONSTANTS  ->  10 sinks (one source, many derived)', {
    x: q.x + 16, y: topY,
    size: 8, font: fonts.bold, color: C.teal, characterSpacing: 0.6,
  });
  page.drawText('p31-constants.json  ->  ground-truth · mesh x2 · integrations x2 · research x2 · dev-workbench · cog-passport HTML · generated.ts', {
    x: q.x + 16, y: topY - 12,
    size: 6.5, font: fonts.regular, color: C.cloud,
  });

  // Middle: two swarm columns
  const swarmY = topY - 30;
  // Local Ollama (left)
  page.drawText('LOCAL OLLAMA (10 · operator host)', {
    x: q.x + 16, y: swarmY,
    size: 8, font: fonts.bold, color: C.cyan, characterSpacing: 0.6,
  });
  const ollama = [
    'mechanic · firmware · counsel',
    'narrator · triage · quick',
    'phos · scribe · oracle · debrief',
  ];
  for (let i = 0; i < ollama.length; i++) {
    page.drawText(ollama[i], {
      x: q.x + 16, y: swarmY - 12 - i * 9,
      size: 7, font: fonts.regular, color: C.cloud,
    });
  }
  page.drawText('lanes:  A=MCP  ·  B=tunnel  ·  C=Continue.dev', {
    x: q.x + 16, y: swarmY - 12 - ollama.length * 9,
    size: 6, font: fonts.regular, color: C.muted,
  });
  page.drawText('B BANS counsel · triage · phos (cloud round-trip)', {
    x: q.x + 16, y: swarmY - 22 - ollama.length * 9,
    size: 6, font: fonts.regular, color: C.coral,
  });

  // Cloud crew (right)
  const crewX = q.x + 300;
  page.drawText('SIMPLEX-V7 (11 · Cloudflare cron + D1)', {
    x: crewX, y: swarmY,
    size: 8, font: fonts.bold, color: C.phosphorus, characterSpacing: 0.6,
  });
  const crew = [
    'STEWARD · COUNSEL · ADVOCATE',
    'TREASURER · FORGE · MEDIC',
    'HERALD · SCHOLAR · SCRIBE',
    'SENTINEL · ORACLE',
  ];
  for (let i = 0; i < crew.length; i++) {
    page.drawText(crew[i], {
      x: crewX, y: swarmY - 12 - i * 9,
      size: 7, font: fonts.regular, color: C.cloud,
    });
  }
  page.drawText('ADVOCATE: FERS hard deadline 2026-09-30', {
    x: crewX, y: swarmY - 12 - crew.length * 9,
    size: 6, font: fonts.regular, color: C.coral,
  });

  // Bottom: gate ladder (compact)
  const gateY = q.y + 14;
  page.drawText('CI GATES (npm run verify · ordered · fast-fail · 50+ checks):', {
    x: q.x + 16, y: gateY + 60,
    size: 8, font: fonts.bold, color: C.teal, characterSpacing: 0.5,
  });
  const gates = [
    'alignment · nonprofit · protocol-registry · contract-registry · sovereign-chain',
    'sovereign-layers · launch-readiness · reports-* · verify-pulse · glass-box · demos',
    'facts · subscriptions · p31-env · shipbox · passport · cog-passport-schema · profiles',
    'cogpass-bridge · phos-voice · constants · mesh-canon · ecosystem · live-fleet',
    'production-readiness · launch-lane-sync · map-pipeline · p31-style · command-center',
    'p31ca-contracts · egg-hunt · onboarding · fleet-portal · cars-wire · poets-room',
    'runbooks · delta-language · public-voice · doc-index · simplex-* · edge-lab · tsc',
  ];
  for (let i = 0; i < gates.length; i++) {
    page.drawText(gates[i], {
      x: q.x + 16, y: gateY + 48 - i * 8.5,
      size: 6.2, font: fonts.regular, color: C.cloud,
    });
  }
}

function drawQuadrantHeader(page, q, fonts, num, title, subtitle) {
  const baseY = q.y + q.h - 18;
  page.drawText(num, {
    x: q.x + 16, y: baseY,
    size: 16, font: fonts.bold, color: C.teal,
  });
  page.drawText(title, {
    x: q.x + 32, y: baseY,
    size: 12, font: fonts.bold, color: C.cloud, characterSpacing: 1.2,
  });
  page.drawText(subtitle, {
    x: q.x + 32, y: baseY - 10,
    size: 7, font: fonts.regular, color: C.muted,
  });
}

function drawRouteBox(page, x, y, label, note, color, fonts) {
  const w = 92, h = 26;
  page.drawRectangle({
    x, y, width: w, height: h,
    borderColor: color, borderWidth: 0.7, color: C.void,
  });
  page.drawText(label, {
    x: x + 6, y: y + 14,
    size: 8, font: fonts.bold, color: color,
  });
  page.drawText(note, {
    x: x + 6, y: y + 4,
    size: 6, font: fonts.regular, color: C.muted,
  });
}

function drawWorkerGroup(page, g, fonts) {
  page.drawRectangle({
    x: g.x, y: g.y, width: g.w, height: g.h,
    borderColor: g.color, borderWidth: 0.6, color: C.void,
  });
  page.drawText(g.title, {
    x: g.x + 6, y: g.y + g.h - 12,
    size: 7, font: fonts.bold, color: g.color, characterSpacing: 0.7,
  });
  for (let i = 0; i < g.items.length; i++) {
    page.drawText(g.items[i], {
      x: g.x + 6, y: g.y + g.h - 24 - i * 10,
      size: 6.5, font: fonts.regular, color: C.cloud,
    });
  }
}

function drawCutGuides(page, ox, oy, gridW, gridH, sticker, cols, rows) {
  const tick = 0.18 * IN;
  const lineColor = C.muted;
  const thickness = 0.5;

  // Vertical column dividers — ticks at top and bottom of the page
  for (let c = 0; c <= cols; c++) {
    const x = ox + c * sticker;
    page.drawLine({
      start: { x, y: oy + gridH },
      end:   { x, y: oy + gridH + tick },
      thickness, color: lineColor,
    });
    page.drawLine({
      start: { x, y: oy },
      end:   { x, y: oy - tick },
      thickness, color: lineColor,
    });
  }
  // Horizontal row dividers — ticks at left and right of the page
  for (let r = 0; r <= rows; r++) {
    const y = oy + r * sticker;
    page.drawLine({
      start: { x: ox - tick, y },
      end:   { x: ox,        y },
      thickness, color: lineColor,
    });
    page.drawLine({
      start: { x: ox + gridW,        y },
      end:   { x: ox + gridW + tick, y },
      thickness, color: lineColor,
    });
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────
function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg);
    if (m) out[m[1]] = m[2] ?? true;
  }
  return out;
}

async function writePdf({ pdf, name, font }) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, name);
  await fs.writeFile(out, await pdf.save());
  return { out, font };
}

// ─── main ───────────────────────────────────────────────────────────────────
async function main() {
  const planned = [
    { id: 'business-card',  fn: generateBusinessCard },
    { id: 'elevator-card',  fn: generateElevatorCard },
    { id: 'one-pager',      fn: generateOnePager     },
    { id: 'qr-stickers',    fn: generateQrStickers   },
    { id: 'wiring-poster',  fn: generateWiringPoster },
    // Future WCD (D-6 pro-handout) plugs in here. Keep alphabetical by id.
  ];
  const todo = ONLY ? planned.filter(p => p.id === ONLY) : planned;
  if (ONLY && todo.length === 0) {
    console.error(`Unknown artifact: ${ONLY}`);
    console.error(`Known: ${planned.map(p => p.id).join(', ')}`);
    process.exit(2);
  }

  console.log(`P31 meatspace · target: ${OUT_DIR}`);
  console.log(`           QR target: ${QR_TARGET}`);
  console.log('');

  for (const { id, fn } of todo) {
    process.stdout.write(`  ${id} ... `);
    const built = await fn();
    const { out, font } = await writePdf(built);
    console.log(`${path.relative(REPO_ROOT, out)}  [font: ${font}]`);
  }

  console.log('');
  console.log('Print on cardstock (front then back, short-edge flip for landscape cards).');
  console.log('Test: scan the QR with your phone before printing the full batch.');
}

main().catch(err => {
  console.error('meatspace generate failed:', err);
  process.exit(1);
});
