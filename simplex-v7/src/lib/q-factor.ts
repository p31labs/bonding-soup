import type { VoltageLevel } from '../agents/types';

const VOLTAGE_SCORE: Record<VoltageLevel, number> = {
  GREEN: 1,
  YELLOW: 0.6,
  RED: 0.3,
  CRITICAL: 0,
};

export interface QFactorInput {
  spoons: number;
  spoonMax?: number;
  /** open WCD-ish load */
  taskLoad: number;
  voltage: VoltageLevel;
  creationsThisWeek: number;
}

export function computeQFactorPure(input: QFactorInput): number {
  const max = input.spoonMax ?? 12;
  const energyScore = input.spoons / max;
  const taskScore = Math.max(0, 1 - input.taskLoad / 10);
  const envScore = VOLTAGE_SCORE[input.voltage] ?? 0.7;
  const creationScore = Math.min(1, input.creationsThisWeek / 3);
  return (energyScore + taskScore + envScore + creationScore) / 4;
}
