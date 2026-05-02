/**
 * scripts/meatspace/lib/canon.mjs
 *
 * Reads design-token canon for the meatspace generator. Single source =
 * andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json. If the file
 * is missing (partial clone), falls back to a frozen copy of the v1.2.0
 * brand anchors so business cards still print in offline mode.
 *
 * Cursor-rule consequence: do NOT add a parallel palette here. Extend the
 * canon file and re-run; this loader picks it up automatically.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const CANON_PATH = path.join(
  REPO_ROOT,
  'andromeda', '04_SOFTWARE', 'design-tokens', 'p31-universal-canon.json'
);

// Frozen fallback (v1.2.0 anchors) for partial-clone builds.
const FALLBACK = Object.freeze({
  palette: {
    coral: '#cc6247',
    teal: '#25897d',
    cyan: '#4db8a8',
    butter: '#cda852',
    lavender: '#8b7cc9',
    phosphorus: '#3ba372',
    phosphor: '#00FF88',
  },
  surfaces: {
    hub: {
      void: '#0f1115',
      surface: '#161920',
      cloud: '#d8d6d0',
      paper: '#f4f4f5',
      muted: '#6b7280',
    },
    org: {
      void: '#f5f4f0',
      surface: '#ffffff',
      cloud: '#1e293b',
      paper: '#fdfcfa',
      muted: '#64748b',
    },
  },
});

function loadCanon() {
  try {
    const raw = JSON.parse(fs.readFileSync(CANON_PATH, 'utf8'));
    // The canon JSON puts brand anchors under `palette` and surface colors
    // under appearance maps inside `appearances`. The theme-engine.mjs file
    // also pins the same hub/org surface hexes; we mirror those here so the
    // meatspace generator never has to duplicate the appearance derivation.
    return {
      source: 'andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json',
      version: raw.version || 'unknown',
      palette: { ...FALLBACK.palette, ...(raw.palette || {}) },
      surfaces: {
        // Always use the FALLBACK surfaces (hub/org) — they match the live
        // theme-engine.mjs pins and the canon JSON does not yet emit
        // appearance-resolved surface hexes in a meatspace-friendly shape.
        // When the canon adds an `appearances.hub.surfaces.*` block, swap
        // this to read from there.
        ...FALLBACK.surfaces,
      },
    };
  } catch (err) {
    return {
      source: 'fallback (canon JSON not available)',
      version: 'fallback-1.2.0',
      ...FALLBACK,
    };
  }
}

export const CANON = loadCanon();
