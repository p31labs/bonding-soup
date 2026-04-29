import { describe, expect, it } from 'vitest';
import { SIMPLEX_CRON_EXPRESSIONS, SIMPLEX_QUEUE_NAME } from '../src/runtime-meta';

describe('/api/health runtime meta mirrors', () => {
  it('queue name is non-empty', () => {
    expect(SIMPLEX_QUEUE_NAME.length).toBeGreaterThan(3);
  });

  it('cron list is readonly array (may be empty for manual mode)', () => {
    expect(Array.isArray(SIMPLEX_CRON_EXPRESSIONS)).toBe(true);
  });
});
