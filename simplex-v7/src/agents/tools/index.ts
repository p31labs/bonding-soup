/**
 * P31 agent crew — tool implementations (D1/KV/HMAC).
 * Hostile sender matching: `env.HOSTILE_SENDERS` secret (newline-separated), never hardcoded addresses.
 */

import type { Tool, Env, VoltageLevel } from '../types';
import { parseHostileSecret } from '../../lib/hostile';
import { assessVoltagePure } from '../../lib/voltage';
import { computeQFactorPure } from '../../lib/q-factor';
import { fersDaysRemaining, fersUrgency } from '../../lib/fers-countdown';
import { mergeKvSystemStateWithSentinel, resolveSentinelContext } from '../../lib/context-fallback';
import {
  get_home_state as sentinel_get_home_state,
  set_home_scene as sentinel_set_home_scene,
  trigger_automation as sentinel_trigger_automation,
  get_biometric_feed as sentinel_get_biometric_feed,
  update_spoons_from_biometric as sentinel_update_spoons_from_biometric,
  get_device_health as sentinel_get_device_health,
  push_haptic as sentinel_push_haptic,
  get_meshtastic_status as sentinel_get_meshtastic_status,
  get_presence as sentinel_get_presence,
  send_tts as sentinel_send_tts,
  get_sentinel_context as sentinel_get_sentinel_context,
} from './sentinel';

const get_system_state: Tool = {
  name: 'get_system_state',
  description: 'Returns current operator spoon balance, system voltage, LOVE balance, heartbeat.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    return mergeKvSystemStateWithSentinel(env);
  },
};

const post_agent_message: Tool = {
  name: 'post_agent_message',
  description: 'Queue a message between agents (D1 outbound queue).',
  input_schema: {
    type: 'object',
    properties: {
      from: { type: 'string' },
      to: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' },
      priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
      requires_response: { type: 'boolean' },
    },
    required: ['to', 'subject', 'body', 'priority'],
  },
  async handler(input, env) {
    const id = crypto.randomUUID();
    const fromAgent = (input.from as string) || 'SYSTEM';
    const toAgent = String(input.to);
    await env.DB.prepare(
      'INSERT INTO agent_messages (id, from_agent, to_agent, subject, body, priority, requires_response, delivered, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
      .bind(
        id,
        fromAgent,
        toAgent,
        input.subject as string,
        input.body as string,
        input.priority as string,
        (input.requires_response ? 1 : 0),
        0,
        Date.now()
      )
      .run();
    return { message_id: id, status: 'queued' };
  },
};

const get_all_deadlines: Tool = {
  name: 'get_all_deadlines',
  description: 'Returns tracked deadlines with approximate days remaining.',
  input_schema: { type: 'object', properties: { include_past: { type: 'boolean' } }, required: [] },
  async handler(input, env) {
    const now = Date.now();
    const includePast = Boolean(input.include_past);
    const rows = await env.DB.prepare(
      'SELECT * FROM deadlines WHERE (? = 1 OR due_date > ?) ORDER BY due_date ASC'
    )
      .bind(includePast ? 1 : 0, now)
      .all();
    return (rows.results ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      days_remaining: Math.ceil(((d.due_date as number) - now) / 86_400_000),
    }));
  },
};

const get_agent_outputs: Tool = {
  name: 'get_agent_outputs',
  description: 'Most recent agent run per lane (optional filter + time window).',
  input_schema: {
    type: 'object',
    properties: {
      agent_ids: { type: 'array', items: { type: 'string' } },
      since_hours: { type: 'number' },
    },
    required: [],
  },
  async handler(input, env) {
    const since = Date.now() - ((input.since_hours as number) ?? 24) * 3_600_000;
    const agents = (input.agent_ids as string[])?.length
      ? (input.agent_ids as string[])
      : ['STEWARD', 'COUNSEL', 'ADVOCATE', 'TREASURER', 'FORGE', 'MEDIC', 'HERALD', 'SCHOLAR', 'SCRIBE', 'ORACLE'];
    const results: Record<string, unknown> = {};
    for (const id of agents) {
      const row = await env.DB.prepare(
        'SELECT * FROM agent_runs WHERE agent_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1'
      )
        .bind(id, since)
        .first();
      results[id] = row ?? null;
    }
    return results;
  },
};

const get_medication_status: Tool = {
  name: 'get_medication_status',
  description: 'Last log + due windows for core medications.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const meds = ['Calcitriol', 'EffexorXR', 'Vyvanse', 'Calcium/Magnesium'];
    const intervals: Record<string, number> = {
      Calcitriol: 12,
      EffexorXR: 24,
      Vyvanse: 24,
      'Calcium/Magnesium': 12,
    };
    const now = Date.now();
    const results = [];
    for (const med of meds) {
      const row = await env.DB.prepare(
        'SELECT logged_at FROM medications WHERE name = ? ORDER BY logged_at DESC LIMIT 1'
      )
        .bind(med)
        .first<{ logged_at: number }>();
      const lastLog = row?.logged_at ?? 0;
      const intervalMs = (intervals[med] ?? 24) * 3_600_000;
      const nextDue = lastLog + intervalMs;
      results.push({
        name: med,
        last_logged: lastLog ? new Date(lastLog).toISOString() : null,
        next_due: new Date(nextDue).toISOString(),
        overdue: now > nextDue,
        overdue_minutes: now > nextDue ? Math.floor((now - nextDue) / 60_000) : 0,
        critical: ['Calcitriol', 'EffexorXR', 'Vyvanse'].includes(med),
      });
    }
    return results;
  },
};

const log_medication: Tool = {
  name: 'log_medication',
  description: 'Log a medication event; enforces Ca/Mg vs Vyvanse gap rule.',
  input_schema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
  async handler(input, env) {
    const now = Date.now();
    const name = String(input.name);
    if (name === 'Vyvanse') {
      const calciumRow = await env.DB.prepare(
        'SELECT logged_at FROM medications WHERE name = ? ORDER BY logged_at DESC LIMIT 1'
      )
        .bind('Calcium/Magnesium')
        .first<{ logged_at: number }>();
      if (calciumRow) {
        const gapHours = (now - calciumRow.logged_at) / 3_600_000;
        if (gapHours < 4) {
          return {
            logged: false,
            warning: `CALCIUM ABSORPTION WINDOW VIOLATION — gap ${gapHours.toFixed(1)}h; need 4h before Vyvanse.`,
          };
        }
      }
    }
    await env.DB.prepare(
      'INSERT INTO medications (name, logged_at, interval_hours, critical) VALUES (?,?,?,?)'
    )
      .bind(
        name,
        now,
        name === 'Calcitriol' || name === 'Calcium/Magnesium' ? 12 : 24,
        ['Calcitriol', 'EffexorXR', 'Vyvanse'].includes(name) ? 1 : 0
      )
      .run();
    return { logged: true, timestamp: new Date(now).toISOString(), medication: name };
  },
};

const get_spoon_balance: Tool = {
  name: 'get_spoon_balance',
  description: 'Spoon ledger + safe mode flag.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const ctx = await resolveSentinelContext(env);
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const rows = await env.DB.prepare('SELECT activity, cost FROM spoons WHERE ts > ? ORDER BY ts DESC')
      .bind(startOfDay.getTime())
      .all<{ activity: string; cost: number }>();
    return {
      current: ctx.spoons,
      max: ctx.max_spoons,
      safe_mode_threshold: 3,
      safe_mode_active: ctx.safe_mode,
      sentinel_context_source: ctx.source,
      sentinel_stale_ms: ctx.stale_ms ?? null,
      ...(ctx.operator_note !== undefined ? { operator_note: ctx.operator_note } : {}),
      today_log: rows.results ?? [],
    };
  },
};

const update_spoons: Tool = {
  name: 'update_spoons',
  description: 'Debit/credit spoons (+ cost = spend, negative = recovery).',
  input_schema: {
    type: 'object',
    properties: {
      activity: { type: 'string' },
      cost: { type: 'number' },
    },
    required: ['activity', 'cost'],
  },
  async handler(input, env) {
    const sentinel = await resolveSentinelContext(env);
    const state = await env.SIMPLEX_STATE.get('system_state');
    let parsed: Record<string, unknown> = {};
    if (state) {
      try {
        parsed = JSON.parse(state) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
    }
    const baseRaw = parsed.current_spoons;
    const base =
      typeof baseRaw === 'number' && Number.isFinite(baseRaw) ? baseRaw : sentinel.spoons;
    const newBalance = Math.max(0, Math.min(12, base - Number(input.cost)));
    parsed.current_spoons = newBalance;
    await env.SIMPLEX_STATE.put('system_state', JSON.stringify(parsed));
    await env.DB.prepare(
      'INSERT INTO spoons (activity, cost, balance_after, ts) VALUES (?,?,?,?)'
    )
      .bind(input.activity, Number(input.cost), newBalance, Date.now())
      .run();
    return { new_balance: newBalance, safe_mode: newBalance <= 3 };
  },
};

const trigger_safe_mode: Tool = {
  name: 'trigger_safe_mode',
  description: 'Activates safe mode; external email via Email Worker in production.',
  input_schema: {
    type: 'object',
    properties: { reason: { type: 'string' } },
    required: ['reason'],
  },
  async handler(input, env) {
    const state = (await env.SIMPLEX_STATE.get('system_state')) ?? '{}';
    const parsed = JSON.parse(state) as Record<string, unknown>;
    parsed.safe_mode_active = true;
    parsed.safe_mode_reason = input.reason;
    parsed.safe_mode_ts = Date.now();
    await env.SIMPLEX_STATE.put('system_state', JSON.stringify(parsed));
    return { safe_mode: true, reason: input.reason, notified: 'configured_vault_contact' };
  },
};

const get_calcium_gap: Tool = {
  name: 'get_calcium_gap',
  description: 'Hours since last Calcium/Mg vs Vyvanse window.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const row = await env.DB.prepare(
      'SELECT logged_at FROM medications WHERE name = ? ORDER BY logged_at DESC LIMIT 1'
    )
      .bind('Calcium/Magnesium')
      .first<{ logged_at: number }>();
    if (!row) return { gap_hours: null, vyvanse_clear: false, message: 'No Calcium/Mg logged yet.' };
    const gapHours = (Date.now() - row.logged_at) / 3_600_000;
    return {
      gap_hours: gapHours.toFixed(2),
      vyvanse_clear: gapHours >= 4,
      hours_until_clear: gapHours < 4 ? (4 - gapHours).toFixed(1) : 0,
    };
  },
};

const assess_voltage: Tool = {
  name: 'assess_voltage',
  description: 'Voltage score; hostile list from HOSTILE_SENDERS secret only.',
  input_schema: {
    type: 'object',
    properties: { text: { type: 'string' }, sender: { type: 'string' } },
    required: ['text'],
  },
  async handler(input, env) {
    const hostile = parseHostileSecret(env.HOSTILE_SENDERS);
    return assessVoltagePure(String(input.text ?? ''), String(input.sender ?? ''), hostile);
  },
};

const log_tomograph_event: Tool = {
  name: 'log_tomograph_event',
  description: 'Log a Tomograph event row.',
  input_schema: {
    type: 'object',
    properties: {
      sender: { type: 'string' },
      subject: { type: 'string' },
      voltage: { type: 'string' },
      action: { type: 'string' },
    },
    required: ['sender', 'subject', 'voltage', 'action'],
  },
  async handler(input, env) {
    await env.DB.prepare(
      'INSERT INTO tomograph_events (sender, subject, voltage, action, created_at) VALUES (?,?,?,?,?)'
    )
      .bind(input.sender, input.subject, input.voltage, input.action, Date.now())
      .run();
    return { logged: true };
  },
};

const draft_response: Tool = {
  name: 'draft_response',
  description: 'Structure for LLM-assisted reply (fawn guard in model context).',
  input_schema: {
    type: 'object',
    properties: {
      original_text: { type: 'string' },
      sender: { type: 'string' },
      intent: { type: 'string' },
    },
    required: ['original_text', 'intent'],
  },
  async handler(input) {
    return {
      instructions: 'Draft neutral grounded reply; no false apology; flag fawn patterns.',
      original: input.original_text,
      intent: input.intent,
      sender: input.sender,
    };
  },
};

const flag_hostile_sender: Tool = {
  name: 'flag_hostile_sender',
  description: 'Append to KV-hosted hostile intercept list.',
  input_schema: {
    type: 'object',
    properties: { email: { type: 'string' }, reason: { type: 'string' } },
    required: ['email', 'reason'],
  },
  async handler(input, env) {
    const existing = await env.SIMPLEX_STATE.get('hostile_senders');
    const list: string[] = existing ? JSON.parse(existing) : [];
    if (!list.includes(String(input.email))) list.push(String(input.email));
    await env.SIMPLEX_STATE.put('hostile_senders', JSON.stringify(list));
    return { flagged: input.email, reason: input.reason, total_hostile_senders: list.length };
  },
};

const get_legal_events: Tool = {
  name: 'get_legal_events',
  description: 'Recent legal timeline rows.',
  input_schema: { type: 'object', properties: { days_back: { type: 'number' }, days_forward: { type: 'number' } } },
  async handler(input, env) {
    const now = Date.now();
    const from = now - Number(input.days_back ?? 7) * 86_400_000;
    const to = now + Number(input.days_forward ?? 30) * 86_400_000;
    const rows = await env.DB.prepare(
      'SELECT * FROM legal_events WHERE event_date BETWEEN ? AND ? ORDER BY event_date ASC'
    )
      .bind(from, to)
      .all();
    return rows.results ?? [];
  },
};

const log_legal_event: Tool = {
  name: 'log_legal_event',
  description: 'Append legal/agency row (private vault).',
  input_schema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['hearing', 'filing', 'deadline', 'correspondence', 'order', 'motion'] },
      description: { type: 'string' },
      event_date: { type: 'number' },
      case_number: { type: 'string' },
      parties: { type: 'string' },
    },
    required: ['type', 'description', 'event_date'],
  },
  async handler(input, env) {
    await env.DB.prepare(
      'INSERT INTO legal_events (type, description, event_date, case_number, parties, logged_at) VALUES (?,?,?,?,?,?)'
    )
      .bind(
        input.type,
        input.description,
        input.event_date,
        input.case_number ?? '2025CV936',
        input.parties ?? 'Johnson v. Johnson',
        Date.now()
      )
      .run();
    return { logged: true };
  },
};

const get_docket_status: Tool = {
  name: 'get_docket_status',
  description: 'High-level docket placeholders (populate from authoritative sources).',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler() {
    return {
      note: 'Operator-verified factual updates only.',
    };
  },
};

const draft_document: Tool = {
  name: 'draft_document',
  description: 'Queue SCRIBE formatting handoff.',
  input_schema: {
    type: 'object',
    properties: {
      document_type: { type: 'string' },
      content: { type: 'string' },
      case_number: { type: 'string' },
    },
    required: ['document_type', 'content'],
  },
  async handler(input, env) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO agent_messages (id, from_agent, to_agent, subject, body, priority, requires_response, delivered, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
      .bind(
        id,
        'COUNSEL',
        'SCRIBE',
        `Draft: ${input.document_type}`,
        JSON.stringify(input),
        'P1',
        1,
        0,
        Date.now()
      )
      .run();
    return { queued_for_scribe: true, message_id: id };
  },
};

const get_worker_health: Tool = {
  name: 'get_worker_health',
  description: 'KV mirror of synthetic fleet probes / manual entries.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const raw = await env.SIMPLEX_STATE.get('system_health');
    return raw
      ? JSON.parse(raw)
      : {
          workers: ['p31ca-hub', 'phosphorus31', 'bonding', 'fleet'],
          status: 'unknown — seed system_health KV',
        };
  },
};

const get_github_prs: Tool = {
  name: 'get_github_prs',
  description: 'Stub until GitHub PAT bound via secret.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler() {
    return { open_prs: [], note: 'Wire PAT + octokit behind FORGE lane.' };
  },
};

const get_wcd_status: Tool = {
  name: 'get_wcd_status',
  description: 'WCD rows from D1.',
  input_schema: { type: 'object', properties: { include_closed: { type: 'boolean' } } },
  async handler(input, env) {
    const rows = await env.DB.prepare(
      Boolean(input.include_closed)
        ? 'SELECT * FROM wcds ORDER BY created_at DESC LIMIT 50'
        : 'SELECT * FROM wcds WHERE status != "CLOSED" ORDER BY created_at DESC'
    ).all();
    return rows.results ?? [];
  },
};

const get_test_coverage: Tool = {
  name: 'get_test_coverage',
  description: 'Compare live test counts vs BONDING baseline (populate KV externally).',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const raw = await env.SIMPLEX_STATE.get('test_coverage');
    const current = raw ? JSON.parse(raw) : { tests: 424, files: 32 };
    return {
      current_tests: current.tests,
      current_files: current.files,
      baseline_tests: 424,
      baseline_files: 32,
      regression: current.tests < 424 || current.files < 32,
      delta_tests: current.tests - 424,
    };
  },
};

const get_grant_status: Tool = {
  name: 'get_grant_status',
  description: 'Grant pipeline rows.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const rows = await env.DB.prepare('SELECT * FROM grants ORDER BY deadline ASC').all();
    return rows.results ?? [];
  },
};

const update_grant_status: Tool = {
  name: 'update_grant_status',
  description: 'Mutate pipeline row.',
  input_schema: {
    type: 'object',
    properties: {
      grant_name: { type: 'string' },
      status: { type: 'string', enum: ['RESEARCHING', 'DRAFTING', 'SUBMITTED', 'IN_DELIBERATION', 'AWARDED', 'REJECTED', 'PAUSED'] },
      notes: { type: 'string' },
    },
    required: ['grant_name', 'status'],
  },
  async handler(input, env) {
    await env.DB.prepare(
      'UPDATE grants SET status = ?, notes = ?, updated_at = ? WHERE name = ?'
    )
      .bind(input.status, input.notes ?? '', Date.now(), input.grant_name)
      .run();
    return { updated: true };
  },
};

const get_kofi_balance: Tool = {
  name: 'get_kofi_balance',
  description: 'Ko-fi balance vs mission target.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const raw = await env.SIMPLEX_STATE.get('kofi_balance');
    const balance = raw ? parseFloat(raw) : 0;
    return {
      balance,
      target: 863,
      remaining: Math.max(0, 863 - balance),
      pct: ((balance / 863) * 100).toFixed(1),
    };
  },
};

const get_financial_snapshot: Tool = {
  name: 'get_financial_snapshot',
  description: 'High-level treasury snapshot KV.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const raw = await env.SIMPLEX_STATE.get('financial_snapshot');
    return raw
      ? JSON.parse(raw)
      : { note: 'Seed financial_snapshot JSON in KV.', snap_medicaid: 'unknown', mortgage_balance: null };
  },
};

const compute_q_factor: Tool = {
  name: 'compute_q_factor',
  description: 'Fisher-Escolà style composite from spoons, WCD load, synthesis velocity.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const sentinel = await resolveSentinelContext(env);
    const state = await env.SIMPLEX_STATE.get('system_state');
    let parsed: { system_voltage?: string } = { system_voltage: 'GREEN' };
    if (state) {
      try {
        parsed = JSON.parse(state) as { system_voltage?: string };
      } catch {
        parsed = { system_voltage: 'GREEN' };
      }
    }
    const openWcds = await env.DB.prepare('SELECT COUNT(*) as n FROM wcds WHERE status != "CLOSED"').first<{
      n: number;
    }>();
    const overdueDl = await env.DB.prepare('SELECT COUNT(*) as n FROM deadlines WHERE due_date < ? AND completed = 0')
      .bind(Date.now())
      .first<{ n: number }>();
    const taskLoad = (openWcds?.n ?? 0) + (overdueDl?.n ?? 0);
    const weekAgo = Date.now() - 7 * 86_400_000;
    const shipped = await env.DB.prepare(
      'SELECT COUNT(*) as n FROM wcds WHERE status = "CLOSED" AND updated_at > ?'
    )
      .bind(weekAgo)
      .first<{ n: number }>();
    const sv = (parsed.system_voltage ?? 'GREEN') as VoltageLevel;
    const q = computeQFactorPure({
      spoons: sentinel.spoons,
      taskLoad,
      voltage: sv,
      creationsThisWeek: shipped?.n ?? 0,
    });
    const energyScore = sentinel.spoons / 12;
    const taskScore = Math.max(0, 1 - taskLoad / 10);
    const voltageMap: Record<string, number> = { GREEN: 1, YELLOW: 0.6, RED: 0.3, CRITICAL: 0 };
    const envScore = voltageMap[parsed.system_voltage ?? 'GREEN'] ?? 0.7;
    const creationScore = Math.min(1, (shipped?.n ?? 0) / 3);
    return {
      q_factor: parseFloat(q.toFixed(3)),
      vertices: {
        energy: parseFloat(energyScore.toFixed(3)),
        tasks: parseFloat(taskScore.toFixed(3)),
        environment: envScore,
        creation: parseFloat(creationScore.toFixed(3)),
      },
      interpretation:
        q >= 0.8
          ? 'Full coherence.'
          : q >= 0.6
            ? 'Good coherence.'
            : q >= 0.4
              ? 'Partial decoherence — trim scope.'
              : 'Low coherence — stabilize lowest vertex.',
    };
  },
};

const detect_cross_domain_patterns: Tool = {
  name: 'detect_cross_domain_patterns',
  description: 'Heuristic cross-domain risk scan from agent_runs voltage.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const since = Date.now() - 86_400_000;
    const rows = await env.DB.prepare(
      'SELECT agent_id, voltage FROM agent_runs WHERE created_at > ? ORDER BY created_at DESC'
    )
      .bind(since)
      .all<{ agent_id: string; voltage: string }>();
    const byAgent: Record<string, string> = {};
    for (const row of rows.results ?? []) byAgent[row.agent_id] ||= row.voltage;
    const patterns: Array<{ pattern: string; severity: string; description: string }> = [];
    if ((byAgent.COUNSEL === 'RED' || byAgent.COUNSEL === 'CRITICAL') && byAgent.TREASURER === 'RED')
      patterns.push({
        pattern: 'LEGAL+FINANCIAL',
        severity: 'P0',
        description: 'Coincident legal pressure + treasury stress.',
      });
    if (!patterns.length)
      patterns.push({ pattern: 'NONE', severity: 'P3', description: 'No obvious cross-domain pattern.' });
    return { patterns, agents_sampled: Object.keys(byAgent) };
  },
};

const generate_qbd: Tool = {
  name: 'generate_qbd',
  description: 'Queue SCRIBE Quantum Brain Dump request.',
  input_schema: { type: 'object', properties: { focus: { type: 'string' } } },
  async handler(input, env) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO agent_messages (id, from_agent, to_agent, subject, body, priority, requires_response, delivered, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
      .bind(
        id,
        'ORACLE',
        'SCRIBE',
        'QBD synthesis',
        JSON.stringify({ focus: input.focus }),
        'P2',
        1,
        0,
        Date.now()
      )
      .run();
    return { queued: true, message_id: id };
  },
};

const get_publication_status: Tool = {
  name: 'get_publication_status',
  description: 'Publication inventory — operator truth overrides stub.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler() {
    return { series_complete: true, note: 'Authoritative list lives in operator vault + Zenodo.' };
  },
};

const draft_grant_narrative: Tool = {
  name: 'draft_grant_narrative',
  description: 'Canonical narrative fragments for grant assembly.',
  input_schema: {
    type: 'object',
    properties: { grant_name: { type: 'string' }, word_limit: { type: 'number' } },
    required: ['grant_name'],
  },
  async handler(input) {
    return {
      grant: input.grant_name,
      origin_statement:
        'AuDHD engineer building open assistive tech for neurodivergent operators — trimtab leverage, not hype.',
      mission: 'P31 Labs — Georgia nonprofit (operator-verified status in vault).',
    };
  },
};

const search_citations: Tool = {
  name: 'search_citations',
  description: 'Placeholder for Semantic Scholar / Crossref integration.',
  input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } },
  async handler(input) {
    return { query: input.query, note: 'Wire remote API with offline cache + rate limits.' };
  },
};

const get_forms_status: Tool = {
  name: 'get_forms_status',
  description: 'FERS + SSA status snapshot with countdown.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const now = Date.now();
    const daysLeft = fersDaysRemaining(now);
    const rows = await env.DB.prepare('SELECT * FROM benefits_log').all();
    return { fers_deadline: '2026-09-30', days_remaining: daysLeft, forms: rows.results ?? [], ssa: { determination: 'PENDING' } };
  },
};

const update_form_status: Tool = {
  name: 'update_form_status',
  description: 'Upsert SF / SSA row.',
  input_schema: {
    type: 'object',
    properties: { form: { type: 'string' }, status: { type: 'string' }, notes: { type: 'string' } },
    required: ['form', 'status'],
  },
  async handler(input, env) {
    await env.DB.prepare(
      'INSERT OR REPLACE INTO benefits_log (form, status, notes, updated_at) VALUES (?,?,?,?)'
    )
      .bind(input.form, input.status, input.notes ?? '', Date.now())
      .run();
    return { updated: true };
  },
};

const get_deadline_countdown: Tool = {
  name: 'get_deadline_countdown',
  description: 'FERS countdown + urgency band.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler() {
    const now = Date.now();
    const daysLeft = fersDaysRemaining(now);
    return {
      deadline: '2026-09-30',
      days_remaining: daysLeft,
      urgency: fersUrgency(daysLeft),
      nuclear_threshold_days: 60,
    };
  },
};

const get_open_wcds: Tool = {
  name: 'get_open_wcds',
  description: 'Open/in-progress WCD rows.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const rows = await env.DB.prepare(
      'SELECT * FROM wcds WHERE status IN ("OPEN","IN_PROGRESS") ORDER BY created_at ASC'
    ).all();
    return rows.results ?? [];
  },
};

const create_wcd: Tool = {
  name: 'create_wcd',
  description: 'Insert WCD row.',
  input_schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      scope: { type: 'string' },
      agent_lane: { type: 'string' },
      oqe: { type: 'string' },
      est_days: { type: 'number' },
    },
    required: ['id', 'scope', 'agent_lane', 'oqe'],
  },
  async handler(input, env) {
    const now = Date.now();
    await env.DB.prepare(
      'INSERT INTO wcds (id, scope, agent_lane, oqe, status, close_evidence, est_days, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
      .bind(input.id, input.scope, input.agent_lane, input.oqe, 'OPEN', null, input.est_days ?? 1, now, now)
      .run();
    return { created: true, wcd_id: input.id };
  },
};

const close_wcd: Tool = {
  name: 'close_wcd',
  description: 'Close after OQE evidence string recorded.',
  input_schema: {
    type: 'object',
    properties: { id: { type: 'string' }, oqe_evidence: { type: 'string' } },
    required: ['id', 'oqe_evidence'],
  },
  async handler(input, env) {
    await env.DB.prepare('UPDATE wcds SET status = "CLOSED", close_evidence = ?, updated_at = ? WHERE id = ?')
      .bind(input.oqe_evidence, Date.now(), input.id)
      .run();
    return { closed: true };
  },
};

const update_ops_manual: Tool = {
  name: 'update_ops_manual',
  description: 'Append ops-manual changelog row.',
  input_schema: {
    type: 'object',
    properties: { section: { type: 'string' }, change: { type: 'string' } },
    required: ['section', 'change'],
  },
  async handler(input, env) {
    await env.DB.prepare(
      'INSERT INTO ops_manual_log (section, change, created_at) VALUES (?,?,?)'
    )
      .bind(input.section, input.change, Date.now())
      .run();
    return { logged: true };
  },
};

function manualAccommodationCopy(limitation_kind: string): {
  accommodation: string;
  limitation: string;
  alternative: string;
} {
  switch (limitation_kind) {
    case 'serialization':
      return {
        accommodation:
          'Generative AI structured and externalized output the operator could not reliably serialize unassisted.',
        limitation:
          'AuDHD serialization bottleneck — accurate internal state with lossy real-time written or verbal output channel.',
        alternative:
          'Without AI: multi-day drafting, inconsistent structure, dropped relationships between concepts.',
      };
    case 'medical':
      return {
        accommodation: 'Structured recall and timing support for medical self-management tasks.',
        limitation:
          'Executive timing and chronic endocrine care — external audit trail and cueing required for safe windows.',
        alternative: 'Without assistive tooling: timing errors, missed context for care decisions.',
      };
    case 'sensory':
      return {
        accommodation: 'Load-buffering and pacing support for high-sensory communications and tasks.',
        limitation:
          'AuDHD sensory and social load — unfiltered demand overwhelms executive bandwidth and invites fawn escalation.',
        alternative:
          'Without tooling: meltdown risk, people-pleasing escalation, unsafe context switches.',
      };
    default:
      return {
        accommodation:
          'Externalized planning, tracking, and sequencing outside a depleted executive stack.',
        limitation:
          'Executive dysfunction — inability to reliably sustain multi-step tracking without prosthetic tooling.',
        alternative:
          'Without AI: missed deadlines, unpaid work debt, unsafe omissions under variable spoon load.',
      };
  }
}

const log_manual_accommodation: Tool = {
  name: 'log_manual_accommodation',
  description:
    'Append one operator-curated accommodation row when telemetry missed the event (phone script, meeting outline, BONDING, etc.).',
  input_schema: {
    type: 'object',
    properties: {
      task_line: { type: 'string' },
      tool: { type: 'string', enum: ['Claude', 'Cursor', 'Gemini', 'Ollama', 'BONDING', 'Other'] },
      limitation_kind: {
        type: 'string',
        enum: ['executive', 'serialization', 'medical', 'sensory'],
      },
    },
    required: ['task_line', 'tool', 'limitation_kind'],
  },
  async handler(input, env) {
    const task_line = String(input.task_line ?? '').trim();
    if (!task_line) return { error: 'task_line required' };
    const tools = new Set(['Claude', 'Cursor', 'Gemini', 'Ollama', 'BONDING', 'Other']);
    const tool = tools.has(String(input.tool)) ? String(input.tool) : 'Other';
    const kinds = new Set(['executive', 'serialization', 'medical', 'sensory']);
    const limitation_kind = kinds.has(String(input.limitation_kind))
      ? String(input.limitation_kind)
      : 'executive';
    const copy = manualAccommodationCopy(limitation_kind);
    const now = Date.now();
    const ref = `manual:${crypto.randomUUID()}`;
    const entry_date = new Date(now).toISOString().slice(0, 10);
    const entry_time = new Date(now).toISOString().slice(11, 19);
    await env.DB.prepare(
      `INSERT INTO accommodation_log (
        entry_date, entry_time, task, tool, accommodation, duration_min, limitation, alternative, outcome,
        source, is_auto, limitation_kind, source_ref, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        entry_date,
        entry_time,
        task_line,
        tool,
        copy.accommodation,
        null,
        copy.limitation,
        copy.alternative,
        'Operator attested; mesh did not observe raw channel.',
        'SCRIBE_manual',
        0,
        limitation_kind,
        ref,
        now,
      )
      .run();
    return { logged: true, source_ref: ref };
  },
};

const generate_session_synthesis: Tool = {
  name: 'generate_session_synthesis',
  description: 'Queue SCRIBE↔ORACLE synthesis ping.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO agent_messages (id, from_agent, to_agent, subject, body, priority, requires_response, delivered, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
      .bind(
        id,
        'SCRIBE',
        'ORACLE',
        'Session synthesis ping',
        'Generate synthesis from rolling agent outputs.',
        'P2',
        1,
        0,
        Date.now()
      )
      .run();
    return { queued: true, message_id: id };
  },
};

const prepare_zenodo_upload: Tool = {
  name: 'prepare_zenodo_upload',
  description: 'Zenodo deposit checklist stub.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'description'],
  },
  async handler(input) {
    return {
      metadata: { title: input.title, description: input.description, keywords: input.keywords ?? [] },
      deposit_url: 'https://zenodo.org/api/',
    };
  },
};

export const TOOL_REGISTRY: Record<string, Tool> = {
  get_system_state,
  post_agent_message,
  get_all_deadlines,
  get_agent_outputs,
  get_medication_status,
  log_medication,
  get_spoon_balance,
  update_spoons,
  trigger_safe_mode,
  get_calcium_gap,
  assess_voltage,
  log_tomograph_event,
  draft_response,
  flag_hostile_sender,
  get_legal_events,
  log_legal_event,
  get_docket_status,
  draft_document,
  get_worker_health,
  get_github_prs,
  get_wcd_status,
  get_test_coverage,
  get_grant_status,
  update_grant_status,
  get_kofi_balance,
  get_financial_snapshot,
  compute_q_factor,
  detect_cross_domain_patterns,
  generate_qbd,
  get_publication_status,
  draft_grant_narrative,
  search_citations,
  prepare_zenodo_upload,
  get_forms_status,
  update_form_status,
  get_deadline_countdown,
  get_open_wcds,
  create_wcd,
  close_wcd,
  update_ops_manual,
  generate_session_synthesis,
  log_manual_accommodation,
  /* SENTINEL */
  get_home_state: sentinel_get_home_state,
  set_home_scene: sentinel_set_home_scene,
  trigger_automation: sentinel_trigger_automation,
  get_biometric_feed: sentinel_get_biometric_feed,
  update_spoons_from_biometric: sentinel_update_spoons_from_biometric,
  get_device_health: sentinel_get_device_health,
  push_haptic: sentinel_push_haptic,
  get_meshtastic_status: sentinel_get_meshtastic_status,
  get_presence: sentinel_get_presence,
  send_tts: sentinel_send_tts,
  get_sentinel_context: sentinel_get_sentinel_context,
};
