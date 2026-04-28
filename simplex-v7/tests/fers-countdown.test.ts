import { describe, expect, it } from 'vitest';
import { FERS_DEADLINE_MS, fersDaysRemaining, fersUrgency } from '../src/lib/fers-countdown';

describe('FERS countdown', () => {
  const anchor = Date.parse('2026-04-28T12:00:00.000Z');

  it('computes ceil days remaining vs deadline constant', () => {
    expect(fersDaysRemaining(anchor)).toBe(
      Math.ceil((FERS_DEADLINE_MS - anchor) / 86_400_000)
    );
  });

  it('deadline constant is after anchor', () => {
    expect(FERS_DEADLINE_MS).toBeGreaterThan(anchor);
  });

  const urgencyCases: Array<[number, ReturnType<typeof fersUrgency>]> = [
    [10, 'CRITICAL'],
    [45, 'HIGH'],
    [75, 'MEDIUM'],
    [120, 'NORMAL'],
  ];

  it.each(urgencyCases)('fersUrgency(%i)=%s', (days, u) => {
    expect(fersUrgency(days)).toBe(u);
  });

  it('boundary 29 is CRITICAL', () => expect(fersUrgency(29)).toBe('CRITICAL'));
  it('boundary 30 is HIGH', () => expect(fersUrgency(30)).toBe('HIGH'));
  it('boundary 89 is MEDIUM', () => expect(fersUrgency(89)).toBe('MEDIUM'));
  it('boundary 90 is NORMAL', () => expect(fersUrgency(90)).toBe('NORMAL'));
});
