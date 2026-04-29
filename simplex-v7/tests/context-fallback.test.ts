import { describe, expect, it } from 'vitest';
import type { Env } from '../src/agents/types';
import {
  mergeKvSystemStateWithSentinel,
  resolveSentinelContextFromLayers,
} from '../src/lib/context-fallback';

/** Minimal Worker bindings for sentinel merge tests (Vitest-only). */
function mockEnvForStateMerge(opts: {
  kv?: Record<string, string | null>;
  lastSpoon?: { balance_after: number; ts: number } | null;
  remembranceCount?: number;
  remembranceIds?: string[];
}): Env {
  const kv = opts.kv ?? {};
  const remembranceCount = opts.remembranceCount ?? 0;
  const remembranceIds = opts.remembranceIds ?? [];
  return {
    SIMPLEX_STATE: {
      get: (k: string) => Promise.resolve(kv[k] ?? null),
      put: async () => {},
      delete: async () => {},
    },
    DB: {
      prepare: (sql: string) => {
        const s = sql.toLowerCase();
        return {
          bind: () => ({
            first: async () => null,
            run: async () => ({}),
            all: async () => ({ results: [] }),
          }),
          first: async <T>() => {
            if (s.includes('balance_after') && s.includes('spoons'))
              return (opts.lastSpoon ?? null) as T | null;
            if (s.includes('count(*)') && s.includes('remembered_vertices'))
              return { n: remembranceCount } as T;
            return null;
          },
          all: async () => {
            if (s.includes('remembered_vertices') && s.includes(' id')) {
              return { results: remembranceIds.map((id) => ({ id })) };
            }
            return { results: [] };
          },
          run: async () => ({}),
        };
      },
    },
    AGENT_QUEUE: {} as Env['AGENT_QUEUE'],
    ANTHROPIC_API_KEY: '',
    DEVICE_SECRET: '',
  } as unknown as Env;
}

describe('resolveSentinelContextFromLayers', () => {
  it('uses kv_live when system_state has finite current_spoons', async () => {
    const r = await resolveSentinelContextFromLayers({
      getSystemStateJson: async () => JSON.stringify({ current_spoons: 10, daily_allocation: 10 }),
      getLastSpoonBalance: async () => ({ balance_after: 5, ts: 1000 }),
      now: () => 10_000,
    });
    expect(r.source).toBe('kv_live');
    expect(r.spoons).toBe(10);
    expect(r.stale_ms).toBeUndefined();
  });

  it('falls through to d1_last_known when KV missing or invalid JSON', async () => {
    const r = await resolveSentinelContextFromLayers({
      getSystemStateJson: async () => '{"not_spoons":1}',
      getLastSpoonBalance: async () => ({ balance_after: 6, ts: 7000 }),
      now: () => 8000,
    });
    expect(r.source).toBe('d1_last_known');
    expect(r.spoons).toBe(6);
    expect(r.stale_ms).toBe(1000);
  });

  it('uses static_operator when KV empty and D1 empty', async () => {
    const r = await resolveSentinelContextFromLayers({
      getSystemStateJson: async () => null,
      getLastSpoonBalance: async () => null,
      getOperatorContextOverride: async () => null,
    });
    expect(r.source).toBe('static_operator');
    expect(r.spoons).toBe(8);
    expect(r.safe_mode).toBe(false);
  });

  it('uses operator_override after live + D1 miss', async () => {
    const r = await resolveSentinelContextFromLayers({
      getSystemStateJson: async () => null,
      getLastSpoonBalance: async () => null,
      getOperatorContextOverride: async () =>
        JSON.stringify({ current_spoons: 9, note: 'offline manual' }),
    });
    expect(r.source).toBe('operator_override');
    expect(r.spoons).toBe(9);
    expect(r.operator_note).toBe('offline manual');
  });

  it('safe_mode when spoons <= 3', async () => {
    const r = await resolveSentinelContextFromLayers({
      getSystemStateJson: async () => JSON.stringify({ current_spoons: 2 }),
      getLastSpoonBalance: async () => null,
    });
    expect(r.safe_mode).toBe(true);
  });
});

describe('mergeKvSystemStateWithSentinel', () => {
  it('preserves non-spoon KV keys and overlays resolved spoons when system_state lacks finite spoons', async () => {
    const env = mockEnvForStateMerge({
      kv: { system_state: JSON.stringify({ system_voltage: 'YELLOW', scene_tag: 'focus' }) },
      lastSpoon: null,
    });
    const m = await mergeKvSystemStateWithSentinel(env);
    expect(m.system_voltage).toBe('YELLOW');
    expect(m.scene_tag).toBe('focus');
    expect(m.current_spoons).toBe(8);
    expect(m.daily_allocation).toBe(8);
    expect(m.sentinel_context_source).toBe('static_operator');
    expect(m.remembered_vertex_count).toBe(0);
    expect(Array.isArray(m.remembrance_fixed_stars)).toBe(true);
  });

  it('falls back catch path on invalid JSON and still exposes sentinel totals', async () => {
    const invalidJson = '{bad json';
    const env = mockEnvForStateMerge({ kv: { system_state: invalidJson }, lastSpoon: null });
    const m = await mergeKvSystemStateWithSentinel(env);
    expect(m.current_spoons).toBe(8);
    expect(m.system_voltage).toBe('GREEN');
    expect(m.sentinel_context_source).toBe('static_operator');
    expect(m.remembered_vertex_count).toBe(0);
    expect(Array.isArray(m.remembrance_fixed_stars)).toBe(true);
  });

  it('merges remembrance public slice (counts + fixed stars, no names)', async () => {
    const env = mockEnvForStateMerge({
      kv: { system_state: null },
      lastSpoon: null,
      remembranceCount: 2,
      remembranceIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    });
    const m = await mergeKvSystemStateWithSentinel(env);
    expect(m.remembered_vertex_count).toBe(2);
    expect((m.remembrance_fixed_stars as unknown[]).length).toBe(2);
    const s0 = (m.remembrance_fixed_stars as { x: number; y: number; a: number }[])[0];
    expect(s0.x).toBeGreaterThan(0);
    expect(s0.x).toBeLessThan(1);
    expect(s0.y).toBeGreaterThan(0);
    expect(s0.y).toBeLessThan(1);
  });

  it('reflects bereavement_active from KV until timestamp', async () => {
    const until = Date.now() + 86_400_000;
    const env = mockEnvForStateMerge({
      kv: { system_state: null, mesh_bereavement_until: String(until) },
      lastSpoon: null,
      remembranceCount: 0,
    });
    const m = await mergeKvSystemStateWithSentinel(env);
    expect(m.bereavement_active).toBe(true);
    expect(m.bereavement_until_ms).toBe(until);
  });
});
