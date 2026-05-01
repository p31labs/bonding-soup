/**
 * simplex-worker — CF entry (fetch + cron + queue)
 */

import { dispatch, handleScheduled, runAgentById } from './agents/runner';
import { TOOL_REGISTRY } from './agents/tools/index';
import type { AgentId, Env } from './agents/types';
import { verifyHmacSha256 } from './lib/hmac-worker';
import { mergeKvSystemStateWithSentinel, resolveSentinelContext } from './lib/context-fallback';
import { skillCorsHeaders } from './lib/http-json';
import { assertOperatorAuthorized } from './lib/operator-auth';
import { ALL_BREAKERS, estopAll, getAllBreakerStates, setBreakerState } from './lib/breakers';
import { SIMPLEX_CRON_EXPRESSIONS, SIMPLEX_QUEUE_NAME } from './runtime-meta';
import { handleOperatorSkillRequest } from './skills/router';
import { parseHostileSecret } from './lib/hostile';
import { assessVoltagePure } from './lib/voltage';

const ALLOWED_AGENTS: AgentId[] = [
  'STEWARD',
  'SENTINEL',
  'COUNSEL',
  'ADVOCATE',
  'TREASURER',
  'FORGE',
  'MEDIC',
  'HERALD',
  'SCHOLAR',
  'SCRIBE',
  'ORACLE',
];

function bioUnit(key: string): string {
  const u: Record<string, string> = {
    sleep_score: 'score',
    hrv_ms: 'ms',
    resting_hr: 'bpm',
    steps: 'count',
    spo2: '%',
    stress: 'index',
    active_minutes: 'min',
    calories: 'kcal',
    skin_temp: 'c',
  };
  return u[key] ?? 'raw';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = skillCorsHeaders(request);

    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...skillCorsHeaders(request) },
      });

    try {
      const skillEarly = await handleOperatorSkillRequest(method, url.pathname, request, env);
      if (skillEarly) return skillEarly;

      // Always-online health probe (bypasses breakers; no auth).
      if (method === 'GET' && url.pathname === '/api/health') {
        const crons = [...SIMPLEX_CRON_EXPRESSIONS];
        return json({
          ok: true,
          service: 'simplex-v7',
          ts: Date.now(),
          runtime: {
            crons: {
              count: crons.length,
              expressions: crons,
              mode: crons.length > 0 ? 'scheduled' : 'manual',
            },
            queue: { name: SIMPLEX_QUEUE_NAME, binding: 'AGENT_QUEUE' },
          },
        });
      }

      // Breakers (operator only). Used as lockout/tagout for dispatch.
      if (url.pathname === '/api/admin/breakers' && method === 'GET') {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        return json({ ok: true, breakers: await getAllBreakerStates(env) });
      }

      if (url.pathname === '/api/admin/breaker' && method === 'POST') {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        const body = (await request.json()) as { target?: string; state?: string; reason?: string };
        const target = String(body.target ?? '').trim() as (typeof ALL_BREAKERS)[number];
        const state = body.state === 'off' ? 'off' : 'on';
        if (!ALL_BREAKERS.includes(target)) return json({ ok: false, error: 'Unknown breaker target' }, 400);
        await setBreakerState(env, target, state, { actor: 'operator', reason: body.reason });
        return json({ ok: true, target, state });
      }

      if (url.pathname === '/api/admin/estop' && method === 'POST') {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        const body = (await request.json()) as { reason?: string };
        await estopAll(env, { actor: 'operator', reason: body.reason ?? 'estop' });
        return json({ ok: true, state: 'off', breakers: await getAllBreakerStates(env) });
      }

      if (method === 'GET' && url.pathname === '/api/state') {
        const briefing = await env.SIMPLEX_STATE.get('daily_briefing');
        const health = await env.SIMPLEX_STATE.get('system_health');
        return json({
          state: await mergeKvSystemStateWithSentinel(env),
          briefing: briefing ? JSON.parse(briefing) : null,
          health: health ? JSON.parse(health) : null,
        });
      }

      if (method === 'GET' && url.pathname === '/api/agents') {
        const rows = await env.DB.prepare(
          'SELECT agent_id, voltage, summary, created_at FROM agent_runs ORDER BY created_at DESC LIMIT 200'
        ).all();
        return json(rows.results ?? []);
      }

      if (method === 'GET' && url.pathname === '/api/deadlines') {
        const rows = await env.DB.prepare(
          'SELECT * FROM deadlines WHERE completed = 0 ORDER BY due_date ASC'
        ).all();
        return json(rows.results ?? []);
      }

      if (method === 'GET' && url.pathname === '/api/accommodation-log') {
        const daysRaw = url.searchParams.get('days');
        const days = Math.min(90, Math.max(1, Number(daysRaw ?? 14) || 14));
        const cutoff = Date.now() - days * 86_400_000;
        const cutoffDate = new Date(cutoff).toISOString().slice(0, 10);
        const rows = await env.DB.prepare(
          'SELECT id, entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome, source, is_auto, limitation_kind, source_ref, created_at FROM accommodation_log WHERE created_at >= ? ORDER BY created_at DESC LIMIT 2000'
        )
          .bind(cutoff)
          .all();
        return json({ days, cutoff_date: cutoffDate, rows: rows.results ?? [] });
      }

      if (method === 'POST' && url.pathname === '/api/accommodation-log') {
        const body = (await request.json()) as {
          task_line?: string;
          tool?: string;
          limitation_kind?: string;
        };
        const result = await TOOL_REGISTRY.log_manual_accommodation.handler(
          {
            task_line: body.task_line,
            tool: body.tool ?? 'Other',
            limitation_kind: body.limitation_kind ?? 'executive',
          },
          env
        );
        return json(result);
      }

      if (method === 'GET' && url.pathname === '/api/spoons') {
        const ctx = await resolveSentinelContext(env);
        return json({
          spoons: ctx.spoons,
          max: ctx.max_spoons,
          safe_mode: ctx.safe_mode,
          daily_allocation: ctx.daily_allocation,
          sentinel_context_source: ctx.source,
          sentinel_stale_ms: ctx.stale_ms ?? null,
          ...(ctx.operator_note !== undefined ? { operator_note: ctx.operator_note } : {}),
        });
      }

      if (method === 'POST' && url.pathname === '/api/biometric') {
        const sig = request.headers.get('X-Device-Signature') ?? '';
        const bodyText = await request.text();
        const secret = env.DEVICE_SECRET ?? '';
        if (sig && secret) {
          const ok = await verifyHmacSha256(bodyText, sig, secret);
          if (!ok) return json({ error: 'Invalid signature' }, 401);
        } else if (sig && !secret) {
          return json({ error: 'DEVICE_SECRET not configured' }, 500);
        }
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(bodyText) as Record<string, unknown>;
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        const src = String(data.source ?? 'gadgetbridge');
        const stmts: D1PreparedStatement[] = [];
        const hasSleep = typeof data.sleep_score === 'number';
        for (const [k, val] of Object.entries(data)) {
          if (k === 'source' || typeof val !== 'number') continue;
          if (hasSleep && k === 'sleep_score') continue;
          stmts.push(
            env.DB.prepare(
              'INSERT INTO biometric_log (type, value, unit, source, ts) VALUES (?,?,?,?,?)'
            ).bind(k, val, bioUnit(k), src, Date.now())
          );
        }
        if (stmts.length) await env.DB.batch(stmts);

        if (hasSleep) {
          await TOOL_REGISTRY.update_spoons_from_biometric.handler(
            {
              sleep_score: data.sleep_score as number,
              hrv_ms: data.hrv_ms as number | undefined,
              resting_hr: data.resting_hr as number | undefined,
            },
            env
          );
        }

        await env.SIMPLEX_STATE.put('biometric_current', JSON.stringify({ ...data, ts: Date.now() }));
        await dispatch('queue_message', { source: 'biometric', payload: data }, env);
        return json({ received: true, keys_logged: Object.keys(data).filter((k) => k !== 'source') });
      }

      if (method === 'GET' && url.pathname === '/api/home/state') {
        const raw = await env.SIMPLEX_STATE.get('home_state');
        const bio = await env.SIMPLEX_STATE.get('biometric_current');
        const dev = await env.DB.prepare('SELECT entity_id, state, attributes, updated_at FROM device_states').all();
        return json({
          home: raw ? JSON.parse(raw as string) : null,
          biometric: bio ? JSON.parse(bio as string) : null,
          devices: dev.results ?? [],
        });
      }

      if (method === 'POST' && url.pathname === '/api/home') {
        const body = (await request.json()) as Record<string, unknown>;
        await env.DB.prepare(
          'INSERT INTO home_events (type, entity_id, data, created_at) VALUES (?,?,?,?)'
        )
          .bind(
            String(body.event ?? 'ha_event'),
            String(body.entity_id ?? ''),
            JSON.stringify(body.data ?? body),
            Date.now()
          )
          .run();
        await dispatch('queue_message', { source: 'home_assistant', payload: body }, env);
        return json({ logged: true });
      }

      if (method === 'POST' && url.pathname === '/api/home/scene') {
        const b = (await request.json()) as { scene: string; reason?: string };
        const r = await TOOL_REGISTRY.set_home_scene.handler(
          { scene: b.scene, reason: b.reason },
          env
        );
        return json(r);
      }

      if (method === 'POST' && url.pathname === '/api/device/meshtastic') {
        const sig = request.headers.get('X-Device-Signature') ?? '';
        const bodyText = await request.text();
        if (!env.DEVICE_SECRET) return json({ error: 'DEVICE_SECRET not configured' }, 500);
        const ok = await verifyHmacSha256(bodyText, sig, env.DEVICE_SECRET);
        if (!ok) return json({ error: 'Invalid signature' }, 401);
        let data: unknown;
        try {
          data = JSON.parse(bodyText);
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        await env.SIMPLEX_STATE.put('meshtastic_status', JSON.stringify({ ...(data as object), updated_at: Date.now() }));
        await env.DB.prepare(
          'INSERT INTO mqtt_log (topic, payload, direction, created_at) VALUES (?,?,?,?)'
        )
          .bind('p31/meshtastic/nodes', bodyText.slice(0, 8000), 'inbound', Date.now())
          .run();
        return json({ received: true });
      }

      if (method === 'POST' && url.pathname === '/api/hardware') {
        const sig = request.headers.get('X-Device-Signature') ?? '';
        const body = await request.text();
        const secret = env.DEVICE_SECRET ?? '';
        if (!secret) return json({ error: 'DEVICE_SECRET not configured' }, 500);
        const verified = await verifyHmacSha256(body, sig, secret);
        if (!verified) return json({ error: 'Invalid signature' }, 401);
        await env.DB.prepare(
          'INSERT INTO engineering_log (type, description, metadata, created_at) VALUES (?,?,?,?)'
        )
          .bind('hardware', 'Node packet', body.slice(0, 8000), Date.now())
          .run();
        return json({ received: true });
      }

      if (method === 'POST' && url.pathname === '/api/medical') {
        const { medication } = (await request.json()) as { medication: string };
        const result = await TOOL_REGISTRY.log_medication.handler({ name: medication }, env);
        return json(result);
      }

      if (method === 'POST' && url.pathname === '/api/spoons') {
        const { activity, cost } = (await request.json()) as { activity: string; cost: number };
        const result = await TOOL_REGISTRY.update_spoons.handler({ activity, cost }, env);
        return json(result);
      }

      if (method === 'POST' && url.pathname.startsWith('/api/agent/')) {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        const seg = url.pathname.split('/').pop();
        if (!seg) return json({ error: 'Missing agent id' }, 400);
        const agentId = seg.toUpperCase() as AgentId;
        if (!ALLOWED_AGENTS.includes(agentId)) return json({ error: 'Unknown agent' }, 400);
        const output = await runAgentById(agentId, env);
        return json(output);
      }

      // Telemetry helpers for command-center / mobile (operator only).
      if (method === 'GET' && url.pathname === '/api/telemetry/tomograph') {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        const limitRaw = Number(url.searchParams.get('limit') ?? 10);
        const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 10));
        const rows = await env.DB.prepare(
          'SELECT id, sender, subject, voltage, action, created_at FROM tomograph_events ORDER BY created_at DESC LIMIT ?'
        )
          .bind(limit)
          .all();
        return json({ ok: true, limit, rows: rows.results ?? [] });
      }

      if (method === 'GET' && url.pathname === '/api/telemetry/spoons') {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        const hoursRaw = Number(url.searchParams.get('hours') ?? 24);
        const hours = Math.min(168, Math.max(1, Number.isFinite(hoursRaw) ? hoursRaw : 24));
        const cutoff = Date.now() - hours * 3_600_000;
        const rows = await env.DB.prepare(
          'SELECT activity, cost, balance_after, ts FROM spoons WHERE ts >= ? ORDER BY ts DESC LIMIT 1000'
        )
          .bind(cutoff)
          .all();
        return json({ ok: true, hours, rows: rows.results ?? [] });
      }

      if (method === 'GET' && url.pathname === '/api/telemetry/accommodation') {
        const denied = assertOperatorAuthorized(env, request);
        if (denied) return denied;
        const daysRaw = Number(url.searchParams.get('days') ?? 1);
        const days = Math.min(30, Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 1));
        const cutoff = Date.now() - days * 86_400_000;
        const agg = await env.DB.prepare(
          'SELECT COUNT(*) AS n FROM accommodation_log WHERE created_at >= ?'
        )
          .bind(cutoff)
          .first();
        const rows = await env.DB.prepare(
          'SELECT entry_date, entry_time, task, tool, limitation_kind, outcome, created_at FROM accommodation_log WHERE created_at >= ? ORDER BY created_at DESC LIMIT 20'
        )
          .bind(cutoff)
          .all();
        return json({ ok: true, days, count: Number(agg?.n ?? 0), rows: rows.results ?? [] });
      }

      if (method === 'POST' && url.pathname === '/api/ingest/email') {
        const bodyText = await request.text();
        const ingestSecret = env.SIMPLEX_EMAIL_INGEST_SECRET?.trim();
        if (!ingestSecret) {
          return json(
            {
              error: 'email_ingest_disabled',
              hint: 'Set wrangler secret SIMPLEX_EMAIL_INGEST_SECRET (same value as simplex-email Worker)',
            },
            503
          );
        }
        const sigHeader = request.headers.get('X-Simplex-Email-Signature') ?? '';
        const okSig = await verifyHmacSha256(bodyText, sigHeader, ingestSecret);
        if (!okSig) return json({ error: 'invalid_signature' }, 401);

        let parsed: {
          from?: string;
          to?: string;
          subject_snippet?: string;
          text_preview?: string;
          ts?: number;
        };
        try {
          parsed = JSON.parse(bodyText) as typeof parsed;
        } catch {
          return json({ error: 'invalid_json' }, 400);
        }

        const from = String(parsed.from ?? 'unknown');
        const subject = String(parsed.subject_snippet ?? '').slice(0, 500);
        const preview = String(parsed.text_preview ?? '').slice(0, 2000);
        const textBlob = `${subject}\n${preview}`;
        const hostile = parseHostileSecret(env.HOSTILE_SENDERS);
        const { voltage } = assessVoltagePure(textBlob, from, hostile);

        await TOOL_REGISTRY.log_tomograph_event.handler(
          {
            sender: from,
            subject: subject || '(no subject)',
            voltage,
            action: 'email_worker_ingest',
          },
          env
        );
        return json({ ok: true, voltage, tomograph: true });
      }

      if (method === 'POST' && url.pathname === '/api/chaos') {
        const body = (await request.json()) as { text?: string; sender?: string };
        await TOOL_REGISTRY.assess_voltage.handler(
          { text: body.text ?? '', sender: body.sender ?? '' },
          env
        );
        await TOOL_REGISTRY.log_tomograph_event.handler(
          {
            sender: body.sender ?? 'unknown',
            subject: 'CHAOS_INGEST',
            voltage: 'YELLOW',
            action: 'manual_buffer',
          },
          env
        );
        const herald = await runAgentById('HERALD', env);
        return json({ processed: true, herald_summary: herald.summary });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('simplex-worker:', err);
      return json({ error: 'Internal error', message: String(err) }, 500);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleScheduled(event, env);
  },

  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        const body = msg.body as { trigger_data?: unknown; source?: string };
        const td = body.trigger_data ?? body;
        await dispatch('queue_message', td, env);
        msg.ack();
      } catch {
        msg.retry();
      }
    }
  },
};
