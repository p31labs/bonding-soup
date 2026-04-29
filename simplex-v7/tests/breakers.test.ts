import { describe, expect, it } from 'vitest';
import type { Env } from '../src/agents/types';
import { getAllBreakerStates, getBreakerState, setBreakerState } from '../src/lib/breakers';

function mockEnvWithKv(seed?: Record<string, string | null>) {
  const store: Record<string, string> = {};
  for (const [k, v] of Object.entries(seed ?? {})) {
    if (typeof v === 'string') store[k] = v;
  }
  const kv: KVNamespace = {
    get: async (k: string) => (k in store ? store[k] : null),
    put: async (k: string, v: string) => {
      store[k] = v;
    },
    delete: async (k: string) => {
      delete store[k];
    },
  } as unknown as KVNamespace;

  const env: Env = {
    DB: null as unknown as D1Database,
    SIMPLEX_STATE: kv,
    AGENT_QUEUE: null as unknown as Queue<unknown>,
    ANTHROPIC_API_KEY: '',
    DEVICE_SECRET: '',
  } as Env;

  return { env, store };
}

describe('breakers', () => {
  it('defaults to on when unset', async () => {
    const { env } = mockEnvWithKv();
    expect(await getBreakerState(env, 'agents')).toBe('on');
    expect(await getBreakerState(env, 'sentinel')).toBe('on');
  });

  it('setBreakerState persists and getAllBreakerStates returns map', async () => {
    const { env } = mockEnvWithKv();
    await setBreakerState(env, 'agents', 'off');
    await setBreakerState(env, 'medic', 'off');
    const m = await getAllBreakerStates(env);
    expect(m.agents).toBe('off');
    expect(m.medic).toBe('off');
    expect(m.herald).toBe('on');
  });
});

