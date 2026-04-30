/**
 * Operator skill HTTP routes — Anthropic-backed prosthetics + surprises.
 */

import type { Env } from '../agents/types';
import { handlePhosRequest } from './phos-handler';
import { handleRememberRoutes } from './remember-routes';
import { buildOperatorContextPack } from '../lib/context-pack';
import { jsonResponse } from '../lib/http-json';
import { assertOperatorAuthorized } from '../lib/operator-auth';
import { assertSkillRateOk } from '../lib/skill-rate-limit';
import { queryKnowledgeGraph, upsertKnowledgeEdges, type EdgeInput } from '../lib/knowledge-graph';
import { runAnthropicJson } from '../lib/skill-runner';
import { sha256HexUtf8 } from '../lib/sha256-hex';
import * as P from './prompts';
import { handleK4Dispatch } from './k4-dispatch';

const SKILL_PATHS = new Set([
  '/api/k4/dispatch',
  '/api/braindump',
  '/api/legal/preflight',
  '/api/medical/interaction',
  '/api/email/draft-check',
  '/api/wcd/generate',
  '/api/debrief',
  '/api/message/kid-safe',
  '/api/grant/section',
  '/api/accommodation/narrative',
  '/api/context/composer',
  '/api/git/describe',
  '/api/spoons/forecast',
  '/api/catch',
  '/api/context-card',
  '/api/oracle/synthesize',
  '/api/calibrator/suggest',
  '/api/knowledge-graph',
  '/api/time-capsule',
  '/api/constellation-whisper',
  '/api/parallel-thoughts',
  '/api/trimtab-spin',
  '/api/mesh-breath',
  '/api/lucky-byte',
  '/api/remember/consecrate',
  '/api/remember/list',
  '/api/remember/status',
  '/api/remember/bereavement',
  '/api/remember/context',
  '/api/remember/vertex',
]);

function skillIdForPath(path: string): string {
  return path.replace(/\//g, '_').replace(/^_api_/, '') || 'skill';
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const j = (await request.json()) as unknown;
    return j && typeof j === 'object' ? (j as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function asEdgesFromConnections(raw: unknown): EdgeInput[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: EdgeInput[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    const from = String(o.from ?? o.pattern ?? '').trim();
    const to = String(o.to ?? o.domains ?? '').trim();
    const rel = String(o.insight ?? o.description ?? o.relationship ?? 'related').trim();
    if (from && to) out.push({ from_entity: from, to_entity: to, relationship: rel || 'related' });
  }
  return out;
}

function asEdgesFromOracle(data: Record<string, unknown>): EdgeInput[] {
  const patterns = data.cross_domain_patterns;
  if (!Array.isArray(patterns)) return [];
  const out: EdgeInput[] = [];
  for (const p of patterns) {
    if (!p || typeof p !== 'object') continue;
    const o = p as Record<string, unknown>;
    const pat = String(o.pattern ?? 'pattern').trim();
    const doms = Array.isArray(o.domains) ? (o.domains as string[]).join(', ') : 'multi';
    const desc = String(o.description ?? '').trim().slice(0, 400);
    if (pat) out.push({ from_entity: pat, to_entity: doms, relationship: desc || 'cross_domain' });
  }
  return out;
}

export async function handleOperatorSkillRequest(
  method: string,
  pathname: string,
  request: Request,
  env: Env
): Promise<Response | null> {
  if (method === 'POST' && pathname === '/api/phos/respond') {
    return handlePhosRequest(request, env);
  }

  if (!SKILL_PATHS.has(pathname)) return null;

  const authBlock = assertOperatorAuthorized(env, request);
  if (authBlock) return authBlock;

  const sid = skillIdForPath(pathname);
  const rl = await assertSkillRateOk(env, sid, request);
  if (rl) return rl;

  const jr = (d: unknown, s = 200) => jsonResponse(d, s, request);
  try {
    const rememberResp = await handleRememberRoutes(method, pathname, request, env, jr);
    if (rememberResp) return rememberResp;

    // ── K₄ agent-hub cloud fallback ────────────────────────────
    if (method === 'POST' && pathname === '/api/k4/dispatch') {
      return handleK4Dispatch(request, env);
    }

    // ── GET routes ─────────────────────────────────────────────
    if (method === 'GET' && pathname === '/api/context/composer') {
      const pack = await buildOperatorContextPack(env);
      const { data, offline } = await runAnthropicJson(
        env,
        P.PROMPT_COMPOSER_APPEND,
        `OPERATOR_CONTEXT_PACK:\n${pack}`,
        2048
      );
      if (offline || data === null) {
        return jr({
          offline: true,
          composer_system_prompt: `# P31 operator context (offline)\n${pack.slice(0, 6000)}`,
          trimtab_line: 'Set ANTHROPIC_API_KEY for AI-composed Composer block.',
          risks: ['Model offline — pack is raw only.'],
        });
      }
      return jr(data);
    }

    if (method === 'GET' && pathname === '/api/knowledge-graph') {
      const url = new URL(request.url);
      const q = url.searchParams.get('q');
      const rows = await queryKnowledgeGraph(env, q, 60);
      return jr({ edges: rows, query: q });
    }

    if (method === 'GET' && pathname === '/api/time-capsule') {
      const url = new URL(request.url);
      const now = Date.now();
      const deliver = url.searchParams.get('deliver') === '1';
      if (deliver) {
        const due = await env.DB.prepare(
          'SELECT id, fire_at, message, created_at FROM time_capsules WHERE opened_at IS NULL AND fire_at <= ? ORDER BY fire_at ASC LIMIT 20'
        )
          .bind(now)
          .all();
        const rows = (due.results ?? []) as Array<{ id: number }>;
        for (const r of rows) {
          await env.DB.prepare('UPDATE time_capsules SET opened_at = ? WHERE id = ?').bind(now, r.id).run();
        }
        return jr({ delivered: due.results ?? [], note: 'Rows marked opened_at.' });
      }
      const upcoming = await env.DB.prepare(
        'SELECT id, fire_at, message, created_at FROM time_capsules WHERE opened_at IS NULL ORDER BY fire_at ASC LIMIT 20'
      ).all();
      return jr({ upcoming: upcoming.results ?? [] });
    }

    if (method === 'GET' && pathname === '/api/trimtab-spin') {
      const d = await env.DB.prepare(
        'SELECT title, due_date FROM deadlines WHERE completed = 0 ORDER BY due_date ASC LIMIT 8'
      ).all();
      const pack = JSON.stringify(d.results ?? [], null, 2);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_TRIMTAB_SPIN, `Deadlines JSON:\n${pack}`, 512);
      if (offline || data === null) {
        const rows = (d.results ?? []) as Array<{ title?: string }>;
        const pick = rows[Math.floor(Math.random() * Math.max(1, rows.length))]?.title ?? 'Ship one verify step.';
        return jr({ offline: true, trimtab: pick, luck_score: 0.5, vibe: 'deterministic fallback' });
      }
      return jr(data);
    }

    if (method === 'GET' && pathname === '/api/mesh-breath') {
      // Surprise: no LLM — rhythmic status for wearables / calm UI
      const ctx = await buildOperatorContextPack(env);
      const hash = await sha256HexUtf8(ctx.slice(0, 2000));
      const phase = Date.now() % 7000 < 3500 ? 'inhale' : 'exhale';
      return jr({
        phase,
        pulse_hz: phase === 'inhale' ? 0.12 : 0.08,
        context_fingerprint: hash.slice(0, 16),
        whisper: 'The cage is isostatic; you only need one more constraint to lock the day.',
        surprise: 'mesh_breath',
      });
    }

    if (method === 'GET' && pathname === '/api/lucky-byte') {
      const b = crypto.getRandomValues(new Uint8Array(1))[0];
      const oracle = await env.DB.prepare('SELECT summary FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1')
        .bind('ORACLE')
        .first<{ summary: string }>();
      return jr({
        byte: b,
        hex: b.toString(16).padStart(2, '0'),
        hint: b % 4 === 0 ? 'K₄ face: ship' : b % 4 === 1 ? 'Edge: document' : b % 4 === 2 ? 'Vertex: rest' : 'Body: connect',
        last_oracle_summary: oracle?.summary ?? null,
        surprise: 'lucky_byte',
      });
    }

    if (method !== 'POST') {
      return jr({ error: 'Method not allowed', path: pathname }, 405);
    }

    const body = await readJson(request);

    // ── POST routes ────────────────────────────────────────────
    if (pathname === '/api/braindump') {
      const text = String(body.text ?? body.dump ?? '');
      if (!text.trim()) return jr({ error: 'missing text' }, 400);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_BRAINDUMP, text, 3072);
      if (offline || data === null) {
        return jr({
          offline: true,
          trimtab: '(offline) Open one WCD or run verify.',
          tasks: [],
          connections: [],
          parking_lot: [text.slice(0, 200)],
          emotional_register: 'unknown',
          spoon_estimate: 0,
          disclaimer: 'ANTHROPIC_API_KEY not set.',
        });
      }
      const obj = data as Record<string, unknown>;
      await upsertKnowledgeEdges(env, asEdgesFromConnections(obj.connections), 'braindump');
      return jr(obj);
    }

    if (pathname === '/api/legal/preflight') {
      const text = String(body.document ?? body.text ?? '');
      if (!text.trim()) return jr({ error: 'missing document' }, 400);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_LEGAL_PREFLIGHT, text, 3072);
      if (offline || data === null) {
        return jr({
          offline: true,
          checks: [],
          flags: ['Model offline — manual review only.'],
          disclaimer: 'Not legal advice. ANTHROPIC_API_KEY not set.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/medical/interaction') {
      const user = JSON.stringify({
        current_meds: body.current_meds ?? body.medications ?? [],
        proposed_addition: String(body.proposed ?? body.proposed_addition ?? ''),
      });
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_MEDICAL_INTERACTION, user, 2048);
      if (offline || data === null) {
        return jr({
          offline: true,
          flags: [{ severity: 'info', note: 'Configure ANTHROPIC_API_KEY for screening text.' }],
          verify_with_pharmacist: true,
          disclaimer: 'Not medical advice.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/email/draft-check') {
      const text = String(body.draft ?? body.text ?? '');
      if (!text.trim()) return jr({ error: 'missing draft' }, 400);
      const ctx = body.context ? `\nContext: ${String(body.context)}` : '';
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_EMAIL_DRAFT, text + ctx, 3072);
      if (offline || data === null) {
        return jr({
          offline: true,
          voltage_outgoing: 'YELLOW',
          fawn_score: 0,
          flags: ['Offline stub — no analysis.'],
          revised_draft: text,
          disclaimer: 'ANTHROPIC_API_KEY not set.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/wcd/generate') {
      const one = String(body.idea ?? body.request ?? '');
      if (!one.trim()) return jr({ error: 'missing idea' }, 400);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_WCD, one, 2048);
      if (offline || data === null) {
        return jr({
          offline: true,
          id: 'WCD-SKILL-OFFLINE',
          scope: one.slice(0, 120),
          agent_lane: 'Mechanic',
          oqe: 'ANTHROPIC_API_KEY set; re-run',
          verification_steps: ['npm run verify'],
          est_spoon_days: 0.25,
          trimtab_hint: 'Wire key then POST again',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/debrief') {
      const raw = String(body.raw ?? body.text ?? '');
      if (!raw.trim()) return jr({ error: 'missing raw' }, 400);
      const hash = await sha256HexUtf8(raw);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_DEBRIEF, raw, 3072);
      if (offline || data === null) {
        await env.DB.prepare(
          'INSERT INTO debrief_log (raw_text, output_json, content_hash, created_at) VALUES (?,?,?,?)'
        )
          .bind(raw, JSON.stringify({ offline: true }), hash, Date.now())
          .run();
        return jr({
          offline: true,
          content_hash: hash,
          factual_summary: raw.slice(0, 400),
          disclaimer: 'ANTHROPIC_API_KEY not set; stored raw hash only.',
        });
      }
      const out = data as Record<string, unknown>;
      await env.DB.prepare(
        'INSERT INTO debrief_log (raw_text, output_json, content_hash, created_at) VALUES (?,?,?,?)'
      )
        .bind(raw, JSON.stringify(out), hash, Date.now())
        .run();
      return jr({ ...out, content_hash: hash });
    }

    if (pathname === '/api/message/kid-safe') {
      const msg = String(body.message ?? body.text ?? '');
      if (!msg.trim()) return jr({ error: 'missing message' }, 400);
      const age = body.child_age !== undefined ? Number(body.child_age) : undefined;
      const { data, offline } = await runAnthropicJson(
        env,
        P.PROMPT_KID_SAFE,
        JSON.stringify({ message: msg, child_age: age }),
        2048
      );
      if (offline || data === null) {
        return jr({
          offline: true,
          flags: ['Kid-safe model offline — do not send without human review.'],
          revised: msg,
          disclaimer: 'Human must review all child messages.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/grant/section') {
      const grant = String(body.grant ?? body.grant_name ?? 'Stimpunks');
      const section = String(body.section ?? 'Need Statement');
      const facts = String(body.facts_pack ?? '');
      const { data, offline } = await runAnthropicJson(
        env,
        P.PROMPT_GRANT,
        `Grant: ${grant}\nSection: ${section}\nFacts:\n${facts || '(use public P31 facts only)'}`,
        3072
      );
      if (offline || data === null) {
        return jr({
          offline: true,
          section_title: section,
          body_markdown: `_Offline — add ANTHROPIC_API_KEY._\n\n## ${section}\nDraft pending for **${grant}**.`,
          verify_markers: ['[V: verify all claims against repo]'],
          disclaimer: 'Grants require human fact-check.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/accommodation/narrative') {
      const days = Math.min(30, Math.max(1, Number(body.days ?? 7) || 7));
      const cutoff = Date.now() - days * 86_400_000;
      const rows = await env.DB.prepare(
        'SELECT entry_date, task, tool, accommodation, limitation, outcome FROM accommodation_log WHERE created_at >= ? ORDER BY created_at DESC LIMIT 400'
      )
        .bind(cutoff)
        .all();
      const user = JSON.stringify({ days, rows: rows.results ?? [] });
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_ACCOMMODATION_NARRATIVE, user, 4096);
      if (offline || data === null) {
        return jr({
          offline: true,
          narrative: `Offline stub: ${days} day window, ${(rows.results ?? []).length} rows loaded.`,
          stats_line: 'ANTHROPIC_API_KEY not set',
          disclaimer: 'Not a legal or medical determination.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/git/describe') {
      const diff = String(body.diff ?? body.patch ?? body.summary ?? '');
      if (!diff.trim()) return jr({ error: 'missing diff or summary' }, 400);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_GIT_DESCRIBE, diff.slice(0, 24000), 2048);
      if (offline || data === null) {
        return jr({
          offline: true,
          title_line: 'chore: update (offline stub)',
          body: diff.slice(0, 400),
          accommodation_line: 'Serialization assist unavailable without API key.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/spoons/forecast') {
      const pack = await buildOperatorContextPack(env);
      const extra = String(body.notes ?? '');
      const { data, offline } = await runAnthropicJson(
        env,
        P.PROMPT_SPOON_FORECAST,
        `${extra}\n\n${pack}`,
        2048
      );
      if (offline || data === null) {
        return jr({
          offline: true,
          tomorrow_predicted_spoons: 6,
          confidence: 0.35,
          factors: ['API offline — default mid budget'],
          recommendation: 'Keep one deep-work block before noon.',
          disclaimer: 'Heuristic only, not clinical.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/catch') {
      const thought = String(body.thought ?? '');
      if (!thought.trim()) return jr({ error: 'missing thought' }, 400);
      const hash = await sha256HexUtf8(thought);
      let domain: string | null = null;
      if (env.ANTHROPIC_API_KEY) {
        const { data } = await runAnthropicJson(env, P.PROMPT_CATCH_CLASSIFY, thought.slice(0, 4000), 256);
        if (data && typeof data === 'object') {
          domain = String((data as Record<string, unknown>).domain ?? 'unknown');
        }
      }
      await env.DB.prepare(
        'INSERT INTO caught_thoughts (thought, domain, genesis_hash, created_at) VALUES (?,?,?,?)'
      )
        .bind(thought.slice(0, 8000), domain, hash, Date.now())
        .run();
      return jr({
        caught: true,
        id: hash.slice(0, 16),
        genesis_hash: hash,
        domain,
        note: 'Appears in STEWARD briefing via your existing pipelines when wired to KV.',
      });
    }

    if (pathname === '/api/context-card') {
      const audience = String(body.audience ?? 'technical peer');
      const duration = Number(body.duration_minutes ?? 5) || 5;
      const emphasis = String(body.emphasis ?? 'balanced');
      const { data, offline } = await runAnthropicJson(
        env,
        P.PROMPT_CONTEXT_CARD,
        JSON.stringify({ audience, duration_minutes: duration, emphasis }),
        2048
      );
      if (offline || data === null) {
        return jr({
          offline: true,
          audience,
          duration_minutes: duration,
          card_markdown: `**Will — P31 Labs.** AuDHD + hypoparathyroidism-aware builder. ${duration} min intro — ask me about edge mesh + evidence tooling.`,
          disclaimer: 'Tune when API online.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    if (pathname === '/api/oracle/synthesize') {
      const pack = await buildOperatorContextPack(env);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_ORACLE_SYNTH, pack, 3072);
      if (offline || data === null) {
        return jr({
          offline: true,
          cross_domain_patterns: [],
          trimtab_override: null,
          disclaimer: 'ANTHROPIC_API_KEY not set.',
        });
      }
      const obj = data as Record<string, unknown>;
      await upsertKnowledgeEdges(env, asEdgesFromOracle(obj), 'oracle_synthesize');
      return jr(obj);
    }

    if (pathname === '/api/calibrator/suggest') {
      const runs = await env.DB.prepare(
        'SELECT agent_id, summary, created_at FROM agent_runs ORDER BY created_at DESC LIMIT 40'
      ).all();
      const user = JSON.stringify(runs.results ?? []);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_CALIBRATOR, user, 3072);
      if (offline || data === null) {
        return jr({ offline: true, suggestions: [], needs_operator_review: true });
      }
      const out = data as Record<string, unknown>;
      await env.DB.prepare('INSERT INTO calibrator_proposals (proposals_json, created_at) VALUES (?,?)')
        .bind(JSON.stringify(out), Date.now())
        .run();
      return jr(out);
    }

    if (pathname === '/api/time-capsule') {
      const fireAt = Number(body.fire_at ?? body.open_at);
      const message = String(body.message ?? '');
      if (!Number.isFinite(fireAt) || !message.trim()) {
        return jr({ error: 'need fire_at (epoch ms) and message' }, 400);
      }
      await env.DB.prepare(
        'INSERT INTO time_capsules (fire_at, message, created_at) VALUES (?,?,?)'
      )
        .bind(fireAt, message.slice(0, 8000), Date.now())
        .run();
      return jr({ stored: true, fire_at: fireAt, surprise: 'time_capsule' });
    }

    if (pathname === '/api/constellation-whisper') {
      const seed = String(body.seed ?? crypto.randomUUID());
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_CONSTELLATION, `seed: ${seed}`, 512);
      if (offline || data === null) {
        return jr({
          offline: true,
          whisper: 'Four vertices; one silence; the edge you fear is load-bearing.',
          seed_note: seed,
          mesh_color: '#6ee7b7',
        });
      }
      return jr({ ...(data as Record<string, unknown>), seed });
    }

    if (pathname === '/api/parallel-thoughts') {
      const thought = String(body.thought ?? '');
      if (!thought.trim()) return jr({ error: 'missing thought' }, 400);
      const { data, offline } = await runAnthropicJson(env, P.PROMPT_PARALLEL, thought, 1024);
      if (offline || data === null) {
        return jr({
          offline: true,
          technical: thought,
          emotional: 'This matters because it carries hope and pressure together.',
          systems: 'Treat as signal in the mesh: log, trim tab, verify.',
        });
      }
      return jr(data as Record<string, unknown>);
    }

    return jr({ error: 'Unhandled skill path' }, 500);
  } catch (e) {
    console.error('skill route:', pathname, e);
    return jr({ error: 'skill_failed', message: String(e) }, 500);
  }
}
