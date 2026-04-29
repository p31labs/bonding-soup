import { describe, expect, it } from 'vitest';
import { isPhosAwakeHour, maxExchangesLimit, parseWakeHour } from '../src/skills/phos-config';

describe('phos-config', () => {
  it('parseWakeHour', () => {
    expect(parseWakeHour(undefined, 7)).toBe(7);
    expect(parseWakeHour('9', 7)).toBe(9);
    expect(parseWakeHour('99', 7)).toBe(23);
  });

  it('isPhosAwakeHour defaults open when hour omitted', () => {
    expect(isPhosAwakeHour(undefined, '7', '20')).toBe(true);
  });

  it('isPhosAwakeHour inclusive window', () => {
    expect(isPhosAwakeHour(7, '7', '20')).toBe(true);
    expect(isPhosAwakeHour(20, '7', '20')).toBe(true);
    expect(isPhosAwakeHour(6, '7', '20')).toBe(false);
    expect(isPhosAwakeHour(21, '7', '20')).toBe(false);
  });

  it('isPhosAwakeHour wraps overnight window', () => {
    expect(isPhosAwakeHour(22, '22', '6')).toBe(true);
    expect(isPhosAwakeHour(3, '22', '6')).toBe(true);
    expect(isPhosAwakeHour(12, '22', '6')).toBe(false);
  });

  it('maxExchangesLimit', () => {
    expect(maxExchangesLimit(undefined)).toBe(10);
    expect(maxExchangesLimit('5')).toBe(5);
    expect(maxExchangesLimit('99')).toBe(30);
    expect(maxExchangesLimit('bad')).toBe(10);
  });
});
