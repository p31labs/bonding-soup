/**
 * WCD-33 — set `window.BONDING_ARCHIVE_URL` to your Worker origin (no trailing slash),
 * e.g. http://127.0.0.1:8787 in dev, or your deployed wcd33-soup-archive URL.
 */
export function getBondingArchiveUrl(): string {
  if (typeof window === "undefined" || !window) return "";
  const u = (window as { BONDING_ARCHIVE_URL?: string }).BONDING_ARCHIVE_URL;
  if (typeof u === "string" && u.length > 0) {
    return u.replace(/\/$/, "");
  }
  return "";
}
