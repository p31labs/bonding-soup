import type { Env } from '../agents/types';

export type EdgeInput = {
  from_entity: string;
  to_entity: string;
  relationship: string;
  strength?: number;
};

/** Upsert edges: bump strength + last_seen when the triple already exists. */
export async function upsertKnowledgeEdges(
  env: Env,
  edges: EdgeInput[],
  source: string
): Promise<void> {
  const now = Date.now();
  for (const e of edges) {
    const from = e.from_entity.trim().slice(0, 500);
    const to = e.to_entity.trim().slice(0, 500);
    const rel = e.relationship.trim().slice(0, 500);
    if (!from || !to || !rel) continue;
    const strength = typeof e.strength === 'number' && e.strength > 0 ? Math.min(1, e.strength) : 0.5;

    const row = await env.DB.prepare(
      'SELECT id, strength FROM knowledge_edges WHERE from_entity = ? AND to_entity = ? AND relationship = ?'
    )
      .bind(from, to, rel)
      .first<{ id: number; strength: number }>();

    if (row) {
      const next = Math.min(1, (row.strength + strength) / 2 + 0.05);
      await env.DB.prepare(
        'UPDATE knowledge_edges SET strength = ?, last_seen = ? WHERE id = ?'
      )
        .bind(next, now, row.id)
        .run();
    } else {
      await env.DB.prepare(
        'INSERT INTO knowledge_edges (from_entity, to_entity, relationship, strength, first_seen, last_seen, source, created_at) VALUES (?,?,?,?,?,?,?,?)'
      )
        .bind(from, to, rel, strength, now, now, source, now)
        .run();
    }
  }
}

export async function queryKnowledgeGraph(
  env: Env,
  q: string | null,
  limit = 40
): Promise<unknown[]> {
  if (q && q.trim()) {
    const needle = `%${q.trim().slice(0, 120)}%`;
    const r = await env.DB.prepare(
      'SELECT id, from_entity, to_entity, relationship, strength, first_seen, last_seen, source FROM knowledge_edges WHERE from_entity LIKE ? OR to_entity LIKE ? OR relationship LIKE ? ORDER BY last_seen DESC LIMIT ?'
    )
      .bind(needle, needle, needle, limit)
      .all();
    return (r.results ?? []) as unknown[];
  }
  const r = await env.DB.prepare(
    'SELECT id, from_entity, to_entity, relationship, strength, first_seen, last_seen, source FROM knowledge_edges ORDER BY last_seen DESC LIMIT ?'
  )
    .bind(limit)
    .all();
  return (r.results ?? []) as unknown[];
}
