import { describe, expect, it } from 'vitest';
import { parseHostileSecret } from '../src/lib/hostile';

describe('parseHostileSecret', () => {
  it('returns empty Set for undefined', () => {
    expect([...parseHostileSecret(undefined)]).toHaveLength(0);
  });

  it('returns empty Set for whitespace', () => {
    expect([...parseHostileSecret('   \n  ')]).toHaveLength(0);
  });

  it('splits newline-separated addresses', () => {
    const s = parseHostileSecret('a@test.com\nB@Test.COM');
    expect(s.has('a@test.com')).toBe(true);
    expect(s.has('b@test.com')).toBe(true);
  });

  it('splits commas', () => {
    const s = parseHostileSecret('x@y,z@w');
    expect(s.has('x@y')).toBe(true);
    expect(s.has('z@w')).toBe(true);
  });

  it('trims whitespace', () => {
    const s = parseHostileSecret('  u@v.com  ');
    expect([...s]).toEqual(['u@v.com']);
  });

  it('filters empty fragments', () => {
    expect([...parseHostileSecret('\n,,,\n')]).toHaveLength(0);
  });
});
