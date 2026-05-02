// Shared loader for nonprofit ground-truth contracts.
// Returns null for missing files (partial-clone friendly).

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../..');
const NONPROFIT_DIR = path.join(ROOT, 'andromeda/04_SOFTWARE/p31ca/ground-truth/nonprofit');

const CONTRACTS = [
  'governance',
  'compliance',
  'financials',
  'donor-policy',
  'programs',
  'grants',
  'legal',
  'risk',
  'people'
];

export function loadContract(name) {
  const file = path.join(NONPROFIT_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse ${name}.json: ${err.message}`);
  }
}

export function loadAllContracts() {
  const out = {};
  for (const name of CONTRACTS) {
    out[name] = loadContract(name);
  }
  return out;
}

export function contractsAvailable() {
  return CONTRACTS.every(n => loadContract(n) !== null);
}

export const ROOT_DIR = ROOT;
export const NONPROFIT_DIR_PATH = NONPROFIT_DIR;
