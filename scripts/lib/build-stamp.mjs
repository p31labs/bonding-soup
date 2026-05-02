/**
 * build-stamp.mjs — deterministic timestamp helper for generated artifacts.
 *
 * Why: artifacts that ship to disk (and to git) but include a wall-clock
 * `generatedAt` field cause perpetual git-status churn: every `npm run verify`
 * regenerates them with a fresh ISO string, forcing the operator to either
 * commit timestamp-only diffs forever or `git checkout --` them by hand.
 *
 * The Operator's own pattern (PDF generation in scripts/meatspace/generate.mjs
 * uses FROZEN_PDF_EPOCH for byte-deterministic outputs) generalizes here.
 *
 * Resolution order (highest priority first):
 *   1. SOURCE_DATE_EPOCH env var (seconds since epoch — the standard
 *      reproducible-build switch; CI pipelines and `release:public` set this
 *      to the HEAD commit time so artifacts match the source revision exactly).
 *   2. git log -1 --format=%cI on HEAD — local-dev default. Stable per commit;
 *      the artifact only re-stamps when the operator actually commits something.
 *      No more cycling on every verify run.
 *   3. new Date().toISOString() — final fallback (no git, e.g. tarball install).
 *
 * Returns ISO 8601 string with millisecond precision normalized to a Z suffix
 * (matches the legacy `new Date().toISOString()` shape so downstream consumers
 * see no schema change).
 */
import { execSync } from "node:child_process";

let _cached = null;

export function buildStamp() {
  if (_cached !== null) return _cached;

  const sde = process.env.SOURCE_DATE_EPOCH;
  if (sde && /^\d+$/.test(sde)) {
    _cached = new Date(Number(sde) * 1000).toISOString();
    return _cached;
  }

  try {
    // %cI = committer date in strict ISO 8601, e.g. 2026-05-02T01:09:00-04:00
    const iso = execSync("git log -1 --format=%cI HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (iso) {
      // Normalize to ms-precision UTC Z (legacy shape from new Date().toISOString())
      _cached = new Date(iso).toISOString();
      return _cached;
    }
  } catch {
    // git not available or detached worktree — fall through
  }

  _cached = new Date().toISOString();
  return _cached;
}

/**
 * For tests or generators that explicitly want NOW (e.g. an audit log entry
 * that records when the human ran the script, not when the source was last
 * committed). Use sparingly — the whole point of buildStamp() is to avoid this.
 */
export function nowStamp() {
  return new Date().toISOString();
}
