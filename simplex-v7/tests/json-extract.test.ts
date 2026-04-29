import { describe, expect, it } from 'vitest';
import { extractJsonObject } from '../src/lib/json-extract';

describe('extractJsonObject', () => {
  it('parses raw object', () => {
    const o = extractJsonObject('  {"a":1}  ') as { a: number };
    expect(o.a).toBe(1);
  });

  it('parses fenced json', () => {
    const o = extractJsonObject('Here:\n```json\n{"x":"y"}\n```') as { x: string };
    expect(o.x).toBe('y');
  });

  it('throws when no object', () => {
    expect(() => extractJsonObject('no json')).toThrow();
  });
});
