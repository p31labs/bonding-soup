import { describe, expect, it } from 'vitest';
import { assessVoltagePure } from '../src/lib/voltage';

const hostile = () => new Set(['bad@test.com']);

describe('assessVoltagePure', () => {
  it('marks known hostile sender as CRITICAL without reading body keywords', () => {
    const r = assessVoltagePure('routine meeting notes', 'bad@test.com', hostile());
    expect(r.voltage).toBe('CRITICAL');
    expect(r.score).toBe(100);
  });

  it('ignored senders not listed as hostile proceed to lexical scan', () => {
    const r = assessVoltagePure('no stress here', 'ok@test.com', hostile());
    expect(r.voltage).toBe('GREEN');
  });

  it('empty sender skips hostile match block', () => {
    const r = assessVoltagePure('contempt motion subpoena violation', '', hostile());
    expect(r.voltage).toBe('RED');
    expect(r.red_hits).toBeGreaterThanOrEqual(2);
  });

  const cases: Array<[string, string]> = [
    ['GREEN', 'everything is calm'],
    ['YELLOW', 'one motion only'],
    ['RED', 'contempt motion hearing'],
    ['YELLOW', 'deadline required respond request important'],
  ];

  it.each(cases)('expected band %s for keyword mix', (expected, text) => {
    const r = assessVoltagePure(text, 'friend@test.com', new Set());
    expect(r.voltage).toBe(expected);
  });

  it('single red keyword stays YELLOW', () => {
    const r = assessVoltagePure('there was a motion filed', 'x@y', new Set());
    expect(r.voltage).toBe('YELLOW');
  });

  it('two red keywords go RED', () => {
    const r = assessVoltagePure('motion and contempt in same email', 'x@y', new Set());
    expect(r.voltage).toBe('RED');
  });

  it('score caps at 100', () => {
    const r = assessVoltagePure(
      'contempt motion hearing subpoena order custody violation deadline required respond request important urgent',
      'x',
      new Set()
    );
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
