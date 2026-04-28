import { describe, expect, it } from 'vitest';
import {
  applySpoonDelta,
  hoursSinceCalciumForVyvanse,
  safeModeActive,
  vyvanseBlockedByCalciumGap,
} from '../src/lib/medication-rules';

describe('hoursSinceCalciumForVyvanse', () => {
  it('null when no calcium log', () => {
    expect(hoursSinceCalciumForVyvanse(10_000, null)).toBe(null);
  });

  it('computes hours', () => {
    const gap = hoursSinceCalciumForVyvanse(3_600_000 + 500, 500);
    expect(gap).toBeCloseTo(1, 5);
  });
});

describe('vyvanseBlockedByCalciumGap', () => {
  it('blocked when calcium 2h ago', () => {
    const now = 10 * 3_600_000;
    expect(vyvanseBlockedByCalciumGap(now, now - 2 * 3_600_000)).toBe(true);
  });

  it('allows when calcium 5h ago', () => {
    const now = 10 * 3_600_000;
    expect(vyvanseBlockedByCalciumGap(now, now - 5 * 3_600_000)).toBe(false);
  });

  it('allows when unknown calcium gap', () => {
    expect(vyvanseBlockedByCalciumGap(99, null)).toBe(false);
  });
});

describe('applySpoonDelta', () => {
  it('subtracts spoons', () => expect(applySpoonDelta(8, 3)).toBe(5));
  it('floors at 0', () => expect(applySpoonDelta(2, 5)).toBe(0));
  it('caps at 12', () => expect(applySpoonDelta(12, -5)).toBe(12));
  it('credits spoons', () => expect(applySpoonDelta(4, -2)).toBe(6));
});

describe('safeModeActive', () => {
  it('active at threshold', () => expect(safeModeActive(3)).toBe(true));
  it('inactive above threshold', () => expect(safeModeActive(4)).toBe(false));
  it('custom threshold', () => expect(safeModeActive(6, 5)).toBe(false));
});
