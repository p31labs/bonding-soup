/**
 * Daily spoon allocation from wearable summary metrics (GadgetBridge → HA/Tasker → Worker).
 * Pure math — MEDIC/STEWARD policy layer reads `allocation_reason` + flags.
 */

export interface BiometricAllocationInput {
  sleep_score: number;
  hrv_ms?: number;
  resting_hr?: number;
}

export interface BiometricAllocationResult {
  allocation: number;
  p1Stress: boolean;
  breakdown: string;
}

export function biometricDerivedModifierHint(bio: Record<string, unknown>): number {
  const sleep = Number(bio.sleep_score ?? bio.value ?? 75);
  const hrv = Number(bio.hrv_ms ?? 35);
  let m = 0;
  if (sleep < 60) m -= 2;
  if (hrv < 25) m -= 1;
  if (hrv > 50) m += 1;
  return m;
}


/** HRV < 20 ms → P1 stress flag regardless of sleep (matches mesh spec). */
export function allocateSpoonsFromBiometric(input: BiometricAllocationInput): BiometricAllocationResult {
  const sleep = Number(input.sleep_score);
  const hrv = input.hrv_ms ?? 35;
  const rhr = input.resting_hr ?? 60;

  let allocation = 12;
  if (sleep < 40) allocation = 7;
  else if (sleep < 60) allocation = 9;
  else if (sleep < 75) allocation = 11;

  if (hrv < 20) allocation = Math.max(5, allocation - 2);
  else if (hrv > 50) allocation = Math.min(12, allocation + 1);

  if (rhr > 80) allocation = Math.max(5, allocation - 1);

  const p1Stress = hrv < 20;
  return {
    allocation,
    p1Stress,
    breakdown: `sleep:${sleep} hrv:${hrv} rhr:${rhr}`,
  };
}
