/**
 * Lazy-load the canonical Cognitive Passport → p31ca mirror transform.
 * Static `export * from "../andromeda/... fails on bonding-soup CI (no andromeda tree).
 * @see andromeda/04_SOFTWARE/p31ca/scripts/passport-p31ca-transform.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Canonical transform file under p31ca (missing in partial clone). */
export const canonicalPassportTransformPath = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/scripts/passport-p31ca-transform.mjs"
);

/**
 * @returns {Promise<null | { toP31caMirror: (html: string) => string }>}
 */
export async function importPassportTransformModule() {
  if (!fs.existsSync(canonicalPassportTransformPath)) return null;
  return import(pathToFileURL(canonicalPassportTransformPath).href);
}
