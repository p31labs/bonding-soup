import type { Env } from '../agents/types';
import { jsonResponse } from './http-json';

const DEFAULT_DAILY = 80;

export async function assertSkillRateOk(
  env: Env,
  skillId: string,
  request: Request
): Promise<Response | null> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'anon';
  const day = new Date().toISOString().slice(0, 10);
  const key = `skill_rl:${skillId}:${ip}:${day}`;
  const limitRaw = env.SKILL_DAILY_LIMIT_PER_IP?.trim();
  const limit = limitRaw ? Math.max(1, Number(limitRaw) || DEFAULT_DAILY) : DEFAULT_DAILY;

  const raw = await env.SIMPLEX_STATE.get(key);
  const n = raw ? parseInt(raw, 10) || 0 : 0;
  if (n >= limit) {
    return jsonResponse({ error: 'rate_limit', skill: skillId, limit, window: '24h' }, 429, request);
  }

  await env.SIMPLEX_STATE.put(key, String(n + 1), { expirationTtl: 172800 });
  return null;
}
