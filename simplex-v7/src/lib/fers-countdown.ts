/** Wall time for FERS filing close — operator briefing: 2026-09-30 17:00 −04:00 */
export const FERS_DEADLINE_MS = Date.parse('2026-09-30T21:00:00.000Z');

export function fersDaysRemaining(nowMs: number): number {
  return Math.ceil((FERS_DEADLINE_MS - nowMs) / 86_400_000);
}

export type UrgencyBand = 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export function fersUrgency(daysRemaining: number): UrgencyBand {
  if (daysRemaining < 30) return 'CRITICAL';
  if (daysRemaining < 60) return 'HIGH';
  if (daysRemaining < 90) return 'MEDIUM';
  return 'NORMAL';
}
