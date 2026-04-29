import { describe, expect, it } from 'vitest';
import type { Env } from '../src/agents/types';
import { assertOperatorAuthorized } from '../src/lib/operator-auth';

function mockEnv(partial: Partial<Env>): Env {
  return {
    DB: null as unknown as D1Database,
    SIMPLEX_STATE: null as unknown as KVNamespace,
    AGENT_QUEUE: null as unknown as Queue<unknown>,
    ANTHROPIC_API_KEY: '',
    DEVICE_SECRET: '',
    ...partial,
  } as Env;
}

describe('assertOperatorAuthorized', () => {
  it('allows when OPERATOR_SECRET unset', () => {
    const req = new Request('https://example.test/api/braindump', { method: 'POST' });
    expect(assertOperatorAuthorized(mockEnv({}), req)).toBeNull();
  });

  it('allows matching bearer', () => {
    const req = new Request('https://example.test/api/braindump', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret-xyz' },
    });
    expect(assertOperatorAuthorized(mockEnv({ OPERATOR_SECRET: 'test-secret-xyz' }), req)).toBeNull();
  });

  it('blocks wrong token', () => {
    const req = new Request('https://example.test/api/braindump', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong' },
    });
    const r = assertOperatorAuthorized(mockEnv({ OPERATOR_SECRET: 'right' }), req);
    expect(r).not.toBeNull();
    expect(r!.status).toBe(401);
  });
});
