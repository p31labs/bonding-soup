import type { Env } from '../agents/types';

export type BreakerTarget =
  | 'agents'
  | 'email'
  | 'sentinel'
  | 'medic'
  | 'herald'
  | 'forge'
  | 'safe_mode';

const KV_PREFIX = 'simplex_breaker_';

export function breakerKey(target: BreakerTarget): string {
  return `${KV_PREFIX}${target}`;
}

export const ALL_BREAKERS: BreakerTarget[] = [
  'agents',
  'email',
  'sentinel',
  'medic',
  'herald',
  'forge',
  'safe_mode',
];

export type BreakerState = 'on' | 'off';

export function normalizeBreakerState(s: unknown): BreakerState {
  return s === 'off' ? 'off' : 'on';
}

export async function getBreakerState(env: Env, target: BreakerTarget): Promise<BreakerState> {
  const raw = await env.SIMPLEX_STATE.get(breakerKey(target));
  return normalizeBreakerState(raw);
}

export async function getAllBreakerStates(env: Env): Promise<Record<BreakerTarget, BreakerState>> {
  const out = {} as Record<BreakerTarget, BreakerState>;
  for (const t of ALL_BREAKERS) out[t] = await getBreakerState(env, t);
  return out;
}

export async function setBreakerState(
  env: Env,
  target: BreakerTarget,
  state: BreakerState,
  meta?: { actor?: string; reason?: string }
): Promise<void> {
  const value = normalizeBreakerState(state);
  await env.SIMPLEX_STATE.put(breakerKey(target), value, {
    metadata: meta && (meta.actor || meta.reason) ? { ...meta, ts: Date.now() } : undefined,
  });
}

export async function estopAll(env: Env, meta?: { actor?: string; reason?: string }): Promise<void> {
  const ts = Date.now();
  await Promise.all(
    ALL_BREAKERS.map((t) =>
      env.SIMPLEX_STATE.put(breakerKey(t), 'off', {
        metadata: meta && (meta.actor || meta.reason) ? { ...meta, ts } : undefined,
      })
    )
  );
}

