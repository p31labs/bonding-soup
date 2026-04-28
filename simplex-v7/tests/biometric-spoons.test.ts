import { describe, expect, it } from 'vitest';
import { allocateSpoonsFromBiometric } from '../src/lib/biometric-spoons';

describe('allocateSpoonsFromBiometric', () => {
  it('caps at 7 when sleep under 40', () => {
    const r = allocateSpoonsFromBiometric({ sleep_score: 35, hrv_ms: 35, resting_hr: 60 });
    expect(r.allocation).toBe(7);
  });

  it('P1 stress when HRV under 20 ms', () => {
    const r = allocateSpoonsFromBiometric({ sleep_score: 85, hrv_ms: 15 });
    expect(r.p1Stress).toBe(true);
    expect(r.allocation).toBeLessThan(12);
  });

  it('full allocation when sleep high and moderate HRV', () => {
    const r = allocateSpoonsFromBiometric({ sleep_score: 90, hrv_ms: 35, resting_hr: 65 });
    expect(r.allocation).toBe(12);
    expect(r.p1Stress).toBe(false);
  });
});
