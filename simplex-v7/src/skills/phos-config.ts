/** Pure helpers for Phos wake window + exchange cap (unit-tested). */

export function parseWakeHour(raw: string | undefined, fallback: number): number {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const n = parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? Math.min(23, Math.max(0, n)) : fallback;
}

/**
 * @param localHour 0–23 from child device; if undefined, Phos is treated as available (caller sends hour when known).
 */
export function isPhosAwakeHour(
  localHour: number | undefined,
  wakeStartStr: string | undefined,
  wakeEndStr: string | undefined
): boolean {
  if (localHour === undefined || !Number.isFinite(localHour)) return true;
  const start = parseWakeHour(wakeStartStr, 7);
  const end = parseWakeHour(wakeEndStr, 20);
  if (start <= end) return localHour >= start && localHour <= end;
  return localHour >= start || localHour <= end;
}

export function maxExchangesLimit(raw: string | undefined): number {
  const v = raw?.trim();
  const n = v ? parseInt(v, 10) : 10;
  return Number.isFinite(n) && n >= 2 ? Math.min(30, n) : 10;
}
