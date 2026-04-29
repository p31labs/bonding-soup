/**
 * Remembrance mesh — consecrated vertices (gone, not offline) + bereavement window (KV + D1 audit).
 * Warm white reserved for memorial UI: `#f5f0e8` (bone / candle through frosted glass).
 */

import type { Env } from '../agents/types';
import { sha256HexUtf8 } from './sha256-hex';

/** Must match `p31-constants.json` → `mesh.remembranceWarmWhite`. */
export const REMEMBRANCE_WARM_WHITE = '#f5f0e8';

/** Must match `p31-constants.json` → `mesh.remembranceBereavementKvKey`. */
export const KV_BEREAVEMENT_UNTIL = 'mesh_bereavement_until';

export async function getBereavementUntilMs(env: Env): Promise<number | null> {
  const raw = await env.SIMPLEX_STATE.get(KV_BEREAVEMENT_UNTIL);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export async function isBereavementActive(env: Env): Promise<boolean> {
  const t = await getBereavementUntilMs(env);
  return t != null && t > Date.now();
}

/** Deterministic normalized star slot from SHA-256 hex (no PII in coordinates). */
export function remembranceStarFromDigestHex(digestHex: string): { x: number; y: number; a: number } {
  const d = (digestHex || '0').replace(/[^0-9a-f]/gi, '').padEnd(16, '0').slice(0, 16);
  const hi = parseInt(d.slice(0, 8), 16);
  const lo = parseInt(d.slice(8, 16), 16);
  const hiN = Number.isFinite(hi) ? hi >>> 0 : 0;
  const loN = Number.isFinite(lo) ? lo >>> 0 : 0;
  const x = 0.08 + (hiN / 4294967295) * 0.84;
  const y = 0.08 + (loN / 4294967295) * 0.84;
  const a = 0.09 + ((hiN ^ loN) % 256) / 2500;
  return { x, y, a: Math.min(0.14, Math.max(0.085, a)) };
}

export type RemembrancePublicSlice = {
  bereavement_active: boolean;
  bereavement_until_ms: number | null;
  remembered_vertex_count: number;
  /** Normalized canvas coords (0–1); warm-white draw in starfield — no names or raw ids. */
  remembrance_fixed_stars: Array<{ x: number; y: number; a: number }>;
};

/**
 * Public-safe fields merged into **`GET /api/state`** for ambient UI (starfield fixed stars, grief window).
 * On D1/schema errors returns zeros (deploy may lag schema apply).
 */
export async function buildRemembrancePublicState(env: Env): Promise<RemembrancePublicSlice> {
  try {
    const until = await getBereavementUntilMs(env);
    const active = until != null && until > Date.now();
    const countRow = await env.DB.prepare('SELECT COUNT(*) as n FROM remembered_vertices').first<{ n: number }>();
    const n = Number(countRow?.n ?? 0);
    const rows =
      n > 0
        ? await env.DB.prepare(
            'SELECT id FROM remembered_vertices ORDER BY consecrated_at ASC LIMIT 48'
          ).all<{ id: string }>()
        : { results: [] as { id: string }[] };
    const ids = (rows.results ?? []).map((r) => r.id).filter(Boolean);
    const digests = await Promise.all(ids.map((id) => sha256HexUtf8(id)));
    const remembrance_fixed_stars = digests.map((hex) => remembranceStarFromDigestHex(hex));
    return {
      bereavement_active: active,
      bereavement_until_ms: until,
      remembered_vertex_count: n,
      remembrance_fixed_stars,
    };
  } catch {
    return {
      bereavement_active: false,
      bereavement_until_ms: null,
      remembered_vertex_count: 0,
      remembrance_fixed_stars: [],
    };
  }
}

export async function clearBereavementWindow(env: Env): Promise<void> {
  await env.SIMPLEX_STATE.delete(KV_BEREAVEMENT_UNTIL);
}

/**
 * Start or extend bereavement window (operator). Persists audit row + KV for agents / context pack.
 */
export async function startBereavementWindow(
  env: Env,
  days: number,
  note: string | undefined,
  relatedRememberedId: string | undefined
): Promise<{ ends_at: number }> {
  const d = Math.min(365, Math.max(1, Math.floor(days) || 30));
  const now = Date.now();
  const ends = now + d * 86_400_000;
  await env.SIMPLEX_STATE.put(KV_BEREAVEMENT_UNTIL, String(ends));
  await env.DB.prepare(
    'INSERT INTO bereavement_periods (started_at, ends_at, note, related_remembered_id, created_at) VALUES (?,?,?,?,?)'
  )
    .bind(now, ends, note ?? null, relatedRememberedId ?? null, now)
    .run();
  return { ends_at: ends };
}

/** Short block appended to operator context / ORACLE pack. */
export async function buildRemembranceContextBlock(env: Env): Promise<string> {
  const until = await getBereavementUntilMs(env);
  const active = until != null && until > Date.now();
  const rows = await env.DB.prepare(
    'SELECT id, display_name, memorial_line, date_passed, consecrated_at FROM remembered_vertices ORDER BY consecrated_at DESC LIMIT 12'
  ).all();
  const list = (rows.results ?? []) as Array<Record<string, unknown>>;
  const lines = [
    '## Remembrance mesh',
    `bereavement_active: ${active}`,
    until ? `bereavement_until_iso: ${new Date(until).toISOString()}` : 'bereavement_until_iso: null',
    `remembered_vertex_count_recent: ${list.length}`,
    'remembered_vertices (recent):',
    JSON.stringify(
      list.map((r) => ({
        id: r.id,
        display_name: r.display_name,
        memorial_line: r.memorial_line,
        date_passed: r.date_passed,
        consecrated_at: r.consecrated_at,
      })),
      null,
      2
    ),
    '',
    'If bereavement_active, ORACLE and accommodation narratives should treat grief as a first-class capacity modifier (elevated support needs, no performative sympathy).',
  ];
  return lines.join('\n');
}

export async function consecrateVertex(
  env: Env,
  input: {
    display_name: string;
    memorial_line?: string;
    date_born?: string;
    date_passed?: string;
    edges_summary?: string;
    last_warm_at?: number;
    start_bereavement_days?: number;
  }
): Promise<{ id: string; genesis_hash: string }> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const payload = JSON.stringify({
    id,
    display_name: input.display_name,
    memorial_line: input.memorial_line ?? '',
    date_born: input.date_born ?? '',
    date_passed: input.date_passed ?? '',
    edges_summary: input.edges_summary ?? '',
    consecrated_at: now,
  });
  const genesis_hash = await sha256HexUtf8(payload);
  await env.DB.prepare(
    `INSERT INTO remembered_vertices (
      id, display_name, memorial_line, date_born, date_passed, edges_summary,
      last_warm_at, consecrated_at, genesis_hash, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      id,
      input.display_name.slice(0, 200),
      (input.memorial_line ?? '').slice(0, 800),
      (input.date_born ?? '').slice(0, 80),
      (input.date_passed ?? '').slice(0, 80),
      (input.edges_summary ?? '').slice(0, 2000),
      input.last_warm_at ?? null,
      now,
      genesis_hash,
      now
    )
    .run();

  const days = input.start_bereavement_days;
  if (days != null && Number(days) > 0) {
    await startBereavementWindow(env, Number(days), `after consecration ${id}`, id);
  }

  return { id, genesis_hash };
}
