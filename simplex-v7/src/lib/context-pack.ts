import type { Env } from '../agents/types';
import { resolveSentinelContext } from './context-fallback';
import { buildRemembranceContextBlock } from './mesh-remembrance';

/** Condensed live state for Composer prompts and ORACLE synthesis (D1 + KV). */
export async function buildOperatorContextPack(env: Env): Promise<string> {
  const sentinel = await resolveSentinelContext(env);
  const briefing = await env.SIMPLEX_STATE.get('daily_briefing');

  const [deadlines, wcds, agents, meds, grants, tomograph] = await Promise.all([
    env.DB.prepare(
      'SELECT title, track, due_date, notes FROM deadlines WHERE completed = 0 ORDER BY due_date ASC LIMIT 12'
    ).all(),
    env.DB.prepare(
      "SELECT id, scope, agent_lane, status, est_days FROM wcds WHERE status = 'OPEN' ORDER BY updated_at DESC LIMIT 8"
    ).all(),
    env.DB.prepare(
      'SELECT agent_id, voltage, summary, created_at FROM agent_runs ORDER BY created_at DESC LIMIT 15'
    ).all(),
    env.DB.prepare('SELECT name, logged_at FROM medications ORDER BY logged_at DESC LIMIT 8').all(),
    env.DB.prepare('SELECT name, status, amount, deadline, notes FROM grants').all(),
    env.DB.prepare(
      'SELECT sender, subject, voltage, created_at FROM tomograph_events ORDER BY created_at DESC LIMIT 10'
    ).all(),
  ]);

  const lines: string[] = [
    '## Sentinel',
    JSON.stringify(
      {
        spoons: sentinel.spoons,
        max_spoons: sentinel.max_spoons,
        safe_mode: sentinel.safe_mode,
        daily_allocation: sentinel.daily_allocation,
        source: sentinel.source,
      },
      null,
      2
    ),
    '',
    '## Daily briefing (KV)',
    briefing ?? '(none)',
    '',
    '## Open deadlines',
    JSON.stringify(deadlines.results ?? [], null, 2),
    '',
    '## Open WCDs',
    JSON.stringify(wcds.results ?? [], null, 2),
    '',
    '## Recent agent runs',
    JSON.stringify(agents.results ?? [], null, 2),
    '',
    '## Recent medications',
    JSON.stringify(meds.results ?? [], null, 2),
    '',
    '## Grants',
    JSON.stringify(grants.results ?? [], null, 2),
    '',
    '## Recent tomograph',
    JSON.stringify(tomograph.results ?? [], null, 2),
    '',
    await buildRemembranceContextBlock(env),
  ];

  return lines.join('\n');
}
