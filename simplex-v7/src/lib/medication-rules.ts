/** Hours between last Calcium/Mg log and now — Vyvanse requires >= 4h gap. */
export function hoursSinceCalciumForVyvanse(nowMs: number, lastCalciumMs: number | null): number | null {
  if (lastCalciumMs == null || lastCalciumMs <= 0) return null;
  return (nowMs - lastCalciumMs) / 3_600_000;
}

export function vyvanseBlockedByCalciumGap(nowMs: number, lastCalciumMs: number | null): boolean {
  const h = hoursSinceCalciumForVyvanse(nowMs, lastCalciumMs);
  if (h == null) return false;
  return h < 4;
}

/** Clamp 0..max after spend (positive cost = spend). */
export function applySpoonDelta(current: number, cost: number, max = 12): number {
  return Math.max(0, Math.min(max, current - cost));
}

export function safeModeActive(spoons: number, threshold = 3): boolean {
  return spoons <= threshold;
}
