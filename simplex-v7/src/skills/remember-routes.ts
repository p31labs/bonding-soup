/**
 * Operator routes — consecrate remembered mesh vertices, bereavement window, list/status.
 */

import type { Env } from '../agents/types';
import { TOOL_REGISTRY } from '../agents/tools/index';
import {
  buildRemembranceContextBlock,
  clearBereavementWindow,
  consecrateVertex,
  getBereavementUntilMs,
  startBereavementWindow,
} from '../lib/mesh-remembrance';

const REMEMBER_PATHS = new Set([
  '/api/remember/consecrate',
  '/api/remember/list',
  '/api/remember/status',
  '/api/remember/bereavement',
  '/api/remember/context',
  '/api/remember/vertex',
]);

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const j = (await request.json()) as unknown;
    return j && typeof j === 'object' ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function handleRememberRoutes(
  method: string,
  pathname: string,
  request: Request,
  env: Env,
  jr: (d: unknown, s?: number) => Response
): Promise<Response | null> {
  if (!REMEMBER_PATHS.has(pathname)) return null;

  try {
    if (method === 'GET' && pathname === '/api/remember/list') {
      const rows = await env.DB.prepare(
        'SELECT id, display_name, memorial_line, date_born, date_passed, edges_summary, last_warm_at, consecrated_at, genesis_hash FROM remembered_vertices ORDER BY consecrated_at DESC LIMIT 100'
      ).all();
      return jr({ remembered: rows.results ?? [] });
    }

    if (method === 'GET' && pathname === '/api/remember/status') {
      const until = await getBereavementUntilMs(env);
      const active = until != null && until > Date.now();
      const c = await env.DB.prepare('SELECT COUNT(*) as n FROM remembered_vertices').first<{ n: number }>();
      return jr({
        bereavement_active: active,
        bereavement_until_ms: until,
        bereavement_until_iso: until ? new Date(until).toISOString() : null,
        remembered_count: c?.n ?? 0,
      });
    }

    if (method === 'GET' && pathname === '/api/remember/context') {
      const block = await buildRemembranceContextBlock(env);
      return jr({ markdown: block });
    }

    if (method === 'GET' && pathname === '/api/remember/vertex') {
      const id = new URL(request.url).searchParams.get('id')?.trim();
      if (!id) return jr({ error: 'missing_id_query' }, 400);
      const row = await env.DB.prepare(
        'SELECT id, display_name, memorial_line, date_born, date_passed, edges_summary, last_warm_at, consecrated_at, genesis_hash, created_at FROM remembered_vertices WHERE id = ?'
      )
        .bind(id)
        .first<Record<string, unknown>>();
      if (!row) return jr({ error: 'not_found' }, 404);
      return jr({ vertex: row, vertex_state: 'remembered' });
    }

    if (method !== 'POST') {
      return jr({ error: 'method_not_allowed' }, 405);
    }

    if (pathname === '/api/remember/consecrate') {
      const body = await readJson(request);
      const name = String(body.display_name ?? '').trim();
      if (!name) return jr({ error: 'missing_display_name' }, 400);
      const out = await consecrateVertex(env, {
        display_name: name,
        memorial_line: body.memorial_line !== undefined ? String(body.memorial_line) : undefined,
        date_born: body.date_born !== undefined ? String(body.date_born) : undefined,
        date_passed: body.date_passed !== undefined ? String(body.date_passed) : undefined,
        edges_summary: body.edges_summary !== undefined ? String(body.edges_summary) : undefined,
        last_warm_at:
          body.last_warm_at !== undefined && Number.isFinite(Number(body.last_warm_at))
            ? Number(body.last_warm_at)
            : undefined,
        start_bereavement_days:
          body.start_bereavement_days !== undefined ? Number(body.start_bereavement_days) : undefined,
      });
      if (body.log_accommodation === true) {
        await TOOL_REGISTRY.log_manual_accommodation.handler(
          {
            task_line: `Remembrance mesh: consecrated vertex ${out.id} (${name})`,
            tool: 'Other',
            limitation_kind: 'executive',
          },
          env
        );
      }
      return jr({ consecrated: true, ...out, vertex_state: 'remembered' });
    }

    if (pathname === '/api/remember/bereavement') {
      const body = await readJson(request);
      if (body.clear === true || String(body.action ?? '') === 'clear') {
        await clearBereavementWindow(env);
        return jr({ cleared: true });
      }
      const days = body.days !== undefined ? Number(body.days) : 30;
      const note = body.note !== undefined ? String(body.note) : undefined;
      const rel = body.related_remembered_id !== undefined ? String(body.related_remembered_id) : undefined;
      const { ends_at } = await startBereavementWindow(env, days, note, rel || undefined);
      return jr({ bereavement_started: true, ends_at, ends_at_iso: new Date(ends_at).toISOString() });
    }

    return null;
  } catch (e) {
    console.error('remember route:', pathname, e);
    return jr({ error: 'remember_failed', message: String(e) }, 500);
  }
}
