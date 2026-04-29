import { describe, expect, it } from 'vitest';
import { computeQFactorPure, energyVertexScore } from '../src/lib/q-factor';

describe('computeQFactorPure', () => {
  it('returns 1 when all vertices maxed', () => {
    const q = computeQFactorPure({
      spoons: 12,
      taskLoad: 0,
      voltage: 'GREEN',
      creationsThisWeek: 3,
    });
    expect(q).toBeCloseTo(1, 5);
  });

  it('drops with CRITICAL voltage', () => {
    const q = computeQFactorPure({
      spoons: 12,
      taskLoad: 0,
      voltage: 'CRITICAL',
      creationsThisWeek: 3,
    });
    expect(q).toBeLessThan(0.85);
  });

  it('drops with high task load', () => {
    const q = computeQFactorPure({
      spoons: 12,
      taskLoad: 20,
      voltage: 'GREEN',
      creationsThisWeek: 0,
    });
    expect(q).toBeLessThan(0.75);
  });

  it('respects custom spoon max', () => {
    const q = computeQFactorPure({
      spoons: 6,
      spoonMax: 6,
      taskLoad: 0,
      voltage: 'GREEN',
      creationsThisWeek: 0,
    });
    expect(q).toBeCloseTo(0.75, 2);
  });

  it('energyVertexScore uses reduced max (bereavement baseline)', () => {
    expect(energyVertexScore(6, 6)).toBe(1);
    expect(energyVertexScore(3, 6)).toBe(0.5);
    expect(energyVertexScore(6, 12)).toBe(0.5);
  });

  const matrix: Array<[number, number]> = [
    [0, 0.25],
    [12, 0],
  ];

  it.each(matrix)('taskLoad %i gives bounded output', (load) => {
    const q = computeQFactorPure({ spoons: 6, taskLoad: load, voltage: 'YELLOW', creationsThisWeek: 1 });
    expect(q).toBeGreaterThan(0);
    expect(q).toBeLessThanOrEqual(1);
  });
});
