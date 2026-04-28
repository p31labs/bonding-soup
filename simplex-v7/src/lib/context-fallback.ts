/**
 * SENTINEL Context resolution per **S** semantics (`docs/COGNITIVE-PASSPORT-AUDIENCE-MATRIX.md`):
 * prefer live KV → D1 last-known → operator KV override → static defaults (exports never fail closed).
 */

import type { Env } from '../agents/types';

/** KV key `operator_context_override`: `{"current_spoons":N,"daily_allocation"?:N,"safe_mode"?:bool,"note"?:string}` */
export type SentinelContextSource =
  | 'kv_live'
  | 'd1_last_known'
  | 'operator_override'
  | 'static_operator';

const MAX_SPOONS = 12;

export interface SentinelContextSlice {
  spoons: number;
  max_spoons: number;
  safe_mode: boolean;
  daily_allocation: number;
  source: SentinelContextSource;
  /** Present when source is `d1_last_known` — age of snapshot. */
  stale_ms?: number;
  /** When source is `operator_override` — optional operator free-text. */
  operator_note?: string;
}

const STATIC_OPERATOR_DEFAULT: Omit<SentinelContextSlice, 'source'> = {
  spoons: 8,
  max_spoons: MAX_SPOONS,
  safe_mode: false,
  daily_allocation: 8,
};

function clampSpoons(n: number): number {
  if (!Number.isFinite(n)) return STATIC_OPERATOR_DEFAULT.spoons;
  return Math.max(0, Math.min(MAX_SPOONS, n));
}

export interface SentinelContextLayers {
  getSystemStateJson: () => Promise<string | null>;
  getLastSpoonBalance: () => Promise<{ balance_after: number; ts: number } | null>;
  /** KV `operator_context_override` — used only after live + D1 miss (manual / offline Core–Context UI). */
  getOperatorContextOverride?: () => Promise<string | null>;
  now?: () => number;
}

/**
 * Core resolution (testable without full Worker bindings).
 */
export async function resolveSentinelContextFromLayers(
  layers: SentinelContextLayers
): Promise<SentinelContextSlice> {
  const now = layers.now?.() ?? Date.now();

  const raw = await layers.getSystemStateJson();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as {
        current_spoons?: unknown;
        daily_allocation?: unknown;
      };
      const rawSpoons = Number(parsed.current_spoons);
      if (Number.isFinite(rawSpoons)) {
        const spoons = clampSpoons(rawSpoons);
        const dailyRaw = Number(parsed.daily_allocation);
        return {
          spoons,
          max_spoons: MAX_SPOONS,
          safe_mode: spoons <= 3,
          daily_allocation: Number.isFinite(dailyRaw) ? clampSpoons(dailyRaw) : spoons,
          source: 'kv_live',
        };
      }
    } catch {
      /* fall through */
    }
  }

  const last = await layers.getLastSpoonBalance();
  if (last && Number.isFinite(last.balance_after)) {
    const spoons = clampSpoons(last.balance_after);
    return {
      spoons,
      max_spoons: MAX_SPOONS,
      safe_mode: spoons <= 3,
      daily_allocation: spoons,
      source: 'd1_last_known',
      stale_ms: Math.max(0, now - last.ts),
    };
  }

  const opRaw = layers.getOperatorContextOverride ? await layers.getOperatorContextOverride() : null;
  if (opRaw) {
    try {
      const op = JSON.parse(opRaw) as {
        current_spoons?: unknown;
        daily_allocation?: unknown;
        safe_mode?: unknown;
        note?: unknown;
      };
      const rawSpoons = Number(op.current_spoons);
      if (Number.isFinite(rawSpoons)) {
        const spoons = clampSpoons(rawSpoons);
        const dailyRaw = Number(op.daily_allocation);
        const safeDefault = spoons <= 3;
        const safe =
          typeof op.safe_mode === 'boolean' ? op.safe_mode : safeDefault;
        const note = typeof op.note === 'string' ? op.note : undefined;
        return {
          spoons,
          max_spoons: MAX_SPOONS,
          safe_mode: safe,
          daily_allocation: Number.isFinite(dailyRaw) ? clampSpoons(dailyRaw) : spoons,
          source: 'operator_override',
          ...(note !== undefined ? { operator_note: note } : {}),
        };
      }
    } catch {
      /* fall through */
    }
  }

  return {
    ...STATIC_OPERATOR_DEFAULT,
    source: 'static_operator',
  };
}

/**
 * Worker entry: KV `system_state` → D1 `spoons` → KV `operator_context_override` → static.
 */
export async function resolveSentinelContext(env: Env): Promise<SentinelContextSlice> {
  return resolveSentinelContextFromLayers({
    getSystemStateJson: () => env.SIMPLEX_STATE.get('system_state'),
    getLastSpoonBalance: async () => {
      const row = await env.DB.prepare(
        'SELECT balance_after, ts FROM spoons ORDER BY ts DESC LIMIT 1'
      ).first<{ balance_after: number; ts: number }>();
      if (!row) return null;
      return { balance_after: row.balance_after, ts: row.ts };
    },
    getOperatorContextOverride: () => env.SIMPLEX_STATE.get('operator_context_override'),
  });
}

/**
 * KV `system_state` JSON merged with authoritative spoon fields from **`resolveSentinelContext`**
 * (matches STEWARD **`get_system_state`**, **`GET /api/state`** `state`).
 */
export async function mergeKvSystemStateWithSentinel(env: Env): Promise<Record<string, unknown>> {
  const sentinel = await resolveSentinelContext(env);
  const raw = await env.SIMPLEX_STATE.get('system_state');
  try {
    const base = raw
      ? (JSON.parse(raw) as Record<string, unknown>)
      : { current_love: 0, system_voltage: 'GREEN' };
    return {
      ...base,
      current_spoons: sentinel.spoons,
      daily_allocation: sentinel.daily_allocation,
      safe_mode: sentinel.safe_mode,
      sentinel_context_source: sentinel.source,
      ...(sentinel.stale_ms !== undefined ? { sentinel_stale_ms: sentinel.stale_ms } : {}),
      ...(sentinel.operator_note !== undefined ? { operator_note: sentinel.operator_note } : {}),
    };
  } catch {
    return {
      current_spoons: sentinel.spoons,
      daily_allocation: sentinel.daily_allocation,
      current_love: 0,
      system_voltage: 'GREEN',
      safe_mode: sentinel.safe_mode,
      sentinel_context_source: sentinel.source,
    };
  }
}
