/**
 * Home Assistant REST wrapper — local-first; URL + token from secrets only.
 */

import type { Env } from '../types';

export function haBaseUrl(env: Env): string {
  return (env.HA_BASE_URL ?? '').trim().replace(/\/$/, '');
}

export function haConfigured(env: Env): boolean {
  return Boolean(haBaseUrl(env) && (env.HA_TOKEN ?? '').trim().length);
}

/** POST/GET relative to `/api` — e.g. path `/states` → `{base}/api/states` */
export async function haApi(
  env: Env,
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; json?: unknown; text?: string }> {
  const base = haBaseUrl(env);
  const token = (env.HA_TOKEN ?? '').trim();
  if (!base || !token) {
    return { ok: false, status: 503, text: 'HA_BASE_URL and HA_TOKEN not set' };
  }
  const url = `${base}/api${path.startsWith('/') ? path : `/${path}`}`;
  const r = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const ct = r.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const json = await r.json();
    return { ok: r.ok, status: r.status, json };
  }
  const text = await r.text();
  return { ok: r.ok, status: r.status, text };
}
