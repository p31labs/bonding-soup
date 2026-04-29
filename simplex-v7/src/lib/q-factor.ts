import type { VoltageLevel } from '../agents/types';

const VOLTAGE_SCORE: Record<VoltageLevel, number> = {
  GREEN: 1,
  YELLOW: 0.6,
  RED: 0.3,
  CRITICAL: 0,
};

export interface QFactorInput {
  spoons: number;
  /** During bereavement (or any lowered baseline), pass the *current* daily allocation here so spoons/max stays fair (e.g. 6/6, not 6/12). */
  spoonMax?: number;
  /** open WCD-ish load */
  taskLoad: number;
  voltage: VoltageLevel;
  creationsThisWeek: number;
}

/** Energy vertex contribution: spoons / max, clamped to [0, 1]. */
export function energyVertexScore(spoons: number, spoonMax = 12): number {
  const max = Math.max(1, spoonMax);
  return Math.max(0, Math.min(1, spoons / max));
}

export function computeQFactorPure(input: QFactorInput): number {
  const max = input.spoonMax ?? 12;
  const energyScore = energyVertexScore(input.spoons, max);
  const taskScore = Math.max(0, 1 - input.taskLoad / 10);
  const envScore = VOLTAGE_SCORE[input.voltage] ?? 0.7;
  const creationScore = Math.min(1, input.creationsThisWeek / 3);
  return (energyScore + taskScore + envScore + creationScore) / 4;
}
