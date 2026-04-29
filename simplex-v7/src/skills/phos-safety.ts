/**
 * Post-filter Phos model output. Conservative: strip to safe fallback on violation.
 */

const FORBIDDEN = [
  /\b(i love you|i'm proud of you|im proud of you|good job|well done|you're so smart|you are so smart|great work)\b/i,
  /\b(how are you feeling|how do you feel|are you okay|are you ok)\b/i,
  /\b(your mom|your dad|your mother|your father|custody|court|lawyer|judge|submarine|navy|naval)\b/i,
  /\b(i told your|i will tell your|i already told|i reported|i'm watching you|i am watching you)\b/i,
  /\b(come back tomorrow|daily reward|streak|leaderboard|achievement unlocked)\b/i,
];

const FALLBACK =
  "I like what you built in the garden. Want to try another molecule, or watch the atoms for a bit?";

export type PhosSafetyResult = { ok: boolean; text: string; violations: string[] };

export function filterPhosResponse(raw: string): PhosSafetyResult {
  const text = raw.trim().slice(0, 2000);
  const violations: string[] = [];
  for (const re of FORBIDDEN) {
    if (re.test(text)) violations.push(re.source);
  }
  if (violations.length) {
    return { ok: false, text: FALLBACK, violations };
  }
  return { ok: true, text, violations: [] };
}
