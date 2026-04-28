import type { VoltageLevel } from '../agents/types';

export interface VoltageAssessResult {
  voltage: VoltageLevel;
  score: number;
  rationale?: string;
  red_hits?: number;
  yellow_hits?: number;
}

/** Pure tomograph voltage (no I/O). Hostile set from `parseHostileSecret`. */
export function assessVoltagePure(
  text: string,
  sender: string,
  hostile: Set<string>
): VoltageAssessResult {
  const senderL = sender.trim().toLowerCase();
  const body = text.toLowerCase();
  if (senderL && hostile.has(senderL)) {
    return { voltage: 'CRITICAL', score: 100, rationale: 'Hostile sender — buffer, no raw delivery.' };
  }
  const redKeywords = ['contempt', 'motion', 'hearing', 'subpoena', 'order', 'custody', 'violation'];
  const yellowKeywords = ['deadline', 'required', 'respond', 'request', 'important', 'urgent'];
  const redHits = redKeywords.filter((k) => body.includes(k)).length;
  const yellowHits = yellowKeywords.filter((k) => body.includes(k)).length;
  const voltage: VoltageLevel =
    redHits >= 2
      ? 'RED'
      : redHits === 1
        ? 'YELLOW'
        : yellowHits >= 2
          ? 'YELLOW'
          : 'GREEN';
  const score = Math.min(100, redHits * 25 + yellowHits * 10);
  return { voltage, score, red_hits: redHits, yellow_hits: yellowHits };
}
