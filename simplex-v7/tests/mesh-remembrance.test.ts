import { describe, expect, it } from 'vitest';
import { remembranceStarFromDigestHex, REMEMBRANCE_WARM_WHITE } from '../src/lib/mesh-remembrance';

describe('mesh-remembrance', () => {
  it('reserves warm white for memorial surfaces', () => {
    expect(REMEMBRANCE_WARM_WHITE).toMatch(/^#[0-9a-f]{6}$/i);
    expect(REMEMBRANCE_WARM_WHITE.toLowerCase()).toBe('#f5f0e8');
  });

  it('remembranceStarFromDigestHex is deterministic and bounded', () => {
    const h = 'a'.repeat(64);
    const a = remembranceStarFromDigestHex(h);
    const b = remembranceStarFromDigestHex(h);
    expect(a).toEqual(b);
    expect(a.x).toBeGreaterThanOrEqual(0.08);
    expect(a.x).toBeLessThanOrEqual(0.92);
    expect(a.y).toBeGreaterThanOrEqual(0.08);
    expect(a.y).toBeLessThanOrEqual(0.92);
    expect(a.a).toBeGreaterThanOrEqual(0.085);
    expect(a.a).toBeLessThanOrEqual(0.14);
  });
});
