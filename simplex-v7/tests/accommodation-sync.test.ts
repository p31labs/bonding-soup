import { describe, expect, it } from 'vitest';
import {
  mapAgentRunToAccommodation,
  mapMedicationToAccommodation,
  mapTomographToAccommodation,
  utcDayRangeMs,
} from '../src/lib/accommodation-sync';

describe('utcDayRangeMs', () => {
  it('returns UTC midnight bounds for calendar day', () => {
    const { start, end } = utcDayRangeMs('2026-04-28T19:00:00.000Z');
    expect(start).toBe(Date.UTC(2026, 3, 28));
    expect(end).toBe(Date.UTC(2026, 3, 29));
  });
});

describe('mapAgentRunToAccommodation', () => {
  it('maps agent_runs row to nine-column semantics', () => {
    const m = mapAgentRunToAccommodation({
      run_id: 'r1',
      agent_id: 'HERALD',
      trigger: 'cron',
      voltage: 'GREEN',
      summary: 'Email triage complete',
      duration_ms: 120_000,
      created_at: Date.UTC(2026, 4, 1, 12, 0, 0),
    });
    expect(m.task).toContain('Email triage');
    expect(m.tool).toContain('HERALD');
    expect(m.duration_min).toBeCloseTo(2, 5);
    expect(m.limitation_kind).toBe('executive');
  });
});

describe('mapTomographToAccommodation', () => {
  it('marks sensory / fawn limitation class', () => {
    const m = mapTomographToAccommodation({
      id: 9,
      sender: 'x@y',
      subject: 'Re: hearing',
      voltage: 'RED',
      action: 'buffer',
      created_at: 1,
    });
    expect(m.limitation_kind).toBe('sensory');
    expect(m.tool).toContain('HERALD');
  });
});

describe('mapMedicationToAccommodation', () => {
  it('marks medical limitation class', () => {
    const m = mapMedicationToAccommodation({
      id: 3,
      name: 'Calcitriol',
      logged_at: 1,
    });
    expect(m.limitation_kind).toBe('medical');
    expect(m.task).toContain('Calcitriol');
  });
});
