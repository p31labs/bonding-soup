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
const TAGLINE_OPERATOR_VOICE = 'For all the parents and kids out there raw dogging life — help is on the way.';
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
    { id: 'business-card', fn: generateBusinessCard },
    { id: 'elevator-card', fn: generateElevatorCard },
    { id: 'qr-stickers',   fn: generateQrStickers   },
    // Future WCDs (D-5, D-6) plug in here. Keep alphabetical by id.
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
