import { describe, expect, it } from 'vitest';
import { filterPhosResponse } from '../src/skills/phos-safety';

describe('filterPhosResponse', () => {
  it('passes safe science talk', () => {
    const r = filterPhosResponse('Carbon makes long chains. Four in a row is butane.');
    expect(r.ok).toBe(true);
    expect(r.text).toContain('butane');
  });

  it('blocks evaluative praise', () => {
    const r = filterPhosResponse('Good job on that molecule!');
    expect(r.ok).toBe(false);
    expect(r.text.toLowerCase()).not.toContain('good job');
  });

  it('blocks emotional probe', () => {
    const r = filterPhosResponse('How are you feeling today?');
    expect(r.ok).toBe(false);
  });

  it('blocks custody-adjacent words', () => {
    const r = filterPhosResponse('Tell your mom about this.');
    expect(r.ok).toBe(false);
  });
});
