import { describe, expect, it } from 'vitest';
import { parseHostileSecret } from '../src/lib/hostile';
import { assessVoltagePure } from '../src/lib/voltage';

describe('email ingest tomograph voltage', () => {
  it('flags hostile sender as CRITICAL', () => {
    const hostile = parseHostileSecret('bad@example.com');
    const r = assessVoltagePure('hello meeting', 'bad@example.com', hostile);
    expect(r.voltage).toBe('CRITICAL');
  });

  it('uses subject + preview for keyword scan', () => {
    const hostile = new Set<string>();
    const r = assessVoltagePure('motion hearing custody', 'a@b.com', hostile);
    expect(['RED', 'YELLOW']).toContain(r.voltage);
  });
});
