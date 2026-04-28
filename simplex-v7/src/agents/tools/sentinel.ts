/**
 * SENTINEL tools — physical layer (HA, MQTT log, biometric, mesh KV).
 */

import type { Tool, Env } from '../types';
import { haApi, haConfigured } from './ha-api';
import { allocateSpoonsFromBiometric, biometricDerivedModifierHint } from '../../lib/biometric-spoons';
import { resolveSentinelContext } from '../../lib/context-fallback';

/** Matches `home-assistant/scenes.reference.yaml` → `scene.p31_*`. */
const P31_SCENE_ENTITY: Record<string, string> = {
  focus: 'scene.p31_focus',
  reset: 'scene.p31_reset',
  legal: 'scene.p31_legal',
  'deep-work': 'scene.p31_deep_work',
  play: 'scene.p31_play',
  'night-mode': 'scene.p31_night_mode',
  decompression: 'scene.p31_decompression',
  morning: 'scene.p31_morning',
  'medication-alert': 'scene.p31_medication_alert',
  'calcium-timer': 'scene.p31_calcium_timer',
};

export const get_sentinel_context: Tool = {
  name: 'get_sentinel_context',
  description:
    'Unified SENTINEL Context for **S** semantics: same resolution as GET /api/spoons (KV system_state → D1 spoons → KV operator_context_override → static).',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    return resolveSentinelContext(env);
  },
};

export const get_home_state: Tool = {
  name: 'get_home_state',
  description: 'Home Assistant entity states (REST /api/states subset or full list).',
  input_schema: {
    type: 'object',
    properties: {
      entity_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'If empty, returns snapshot note to use full GET /states from HA.',
      },
    },
    required: [],
  },
  async handler(input, env) {
    const ids = input.entity_ids as string[] | undefined;
    if (ids?.length) {
      const out: unknown[] = [];
      for (const id of ids) {
        const r = await haApi(env, `/states/${encodeURIComponent(id)}`);
        if (r.json) out.push(r.json);
      }
      return { entities: out, ha_configured: haConfigured(env) };
    }
    const all = await haApi(env, '/states');
    return Array.isArray(all.json)
      ? { entities: all.json, configured: true }
      : { error: all.text ?? 'HA unavailable', status: all.status };
  },
};

export const set_home_scene: Tool = {
  name: 'set_home_scene',
  description: 'Activate scene.p31_<scene> in Home Assistant.',
  input_schema: {
    type: 'object',
    properties: {
      scene: {
        type: 'string',
        enum: [
          'focus',
          'reset',
          'legal',
          'deep-work',
          'play',
          'night-mode',
          'decompression',
          'morning',
          'calcium-timer',
          'medication-alert',
        ],
      },
      reason: { type: 'string' },
    },
    required: ['scene'],
  },
  async handler(input, env) {
    const key = String(input.scene);
    const entityId = P31_SCENE_ENTITY[key];
    if (!entityId) return { error: 'unknown scene', scene: key };
    const r = await haApi(env, '/services/scene/turn_on', {
      method: 'POST',
      body: JSON.stringify({ entity_id: entityId }),
    });
    await env.DB.prepare(
      'INSERT INTO home_events (type, entity_id, data, created_at) VALUES (?,?,?,?)'
    )
      .bind('scene_activate', entityId, JSON.stringify({ reason: input.reason, key }), Date.now())
      .run()
      .catch(() => {});
    return { activated: entityId, ha: r.ok, status: r.status, reason: input.reason ?? null };
  },
};

export const trigger_automation: Tool = {
  name: 'trigger_automation',
  description: 'Trigger HA automation entity_id.',
  input_schema: {
    type: 'object',
    properties: { automation_id: { type: 'string' } },
    required: ['automation_id'],
  },
  async handler(input, env) {
    const r = await haApi(env, '/services/automation/trigger', {
      method: 'POST',
      body: JSON.stringify({ entity_id: input.automation_id }),
    });
    return { triggered: input.automation_id, ha: r.ok, status: r.status };
  },
};

export const get_biometric_feed: Tool = {
  name: 'get_biometric_feed',
  description: 'Last biometric_log rows — D1 only, rolling retention enforced by cron job.',
  input_schema: { type: 'object', properties: { hours_back: { type: 'number' } }, required: [] },
  async handler(input, env) {
    const since = Date.now() - ((Number(input.hours_back) || 24) * 3_600_000);
    const rows = await env.DB.prepare(
      'SELECT * FROM biometric_log WHERE ts > ? ORDER BY ts DESC LIMIT 100'
    )
      .bind(since)
      .all();
    const arr = rows.results ?? [];
    const latest = arr[0] as Record<string, unknown> | undefined;
    const mod = latest ? biometricDerivedModifierHint(latest) : 0;
    return { latest: latest ?? null, history: arr, spoon_modifier_hint: mod };
  },
};

export const update_spoons_from_biometric: Tool = {
  name: 'update_spoons_from_biometric',
  description: 'Set daily_allocation + current spoons from sleep/HRV/resting HR; notify MEDIC via D1.',
  input_schema: {
    type: 'object',
    properties: {
      sleep_score: { type: 'number' },
      hrv_ms: { type: 'number' },
      resting_hr: { type: 'number' },
    },
    required: ['sleep_score'],
  },
  async handler(input, env) {
    const alloc = allocateSpoonsFromBiometric({
      sleep_score: Number(input.sleep_score),
      hrv_ms: input.hrv_ms as number | undefined,
      resting_hr: input.resting_hr as number | undefined,
    });
    const state = await env.SIMPLEX_STATE.get('system_state');
    const parsed = state ? JSON.parse(state) : {};
    parsed.current_spoons = alloc.allocation;
    parsed.daily_allocation = alloc.allocation;
    parsed.allocation_reason = alloc.breakdown;
    await env.SIMPLEX_STATE.put('system_state', JSON.stringify(parsed));

    await env.DB.prepare(
      'INSERT INTO biometric_log (type, value, unit, source, ts) VALUES (?,?,?,?,?)'
    )
      .bind('sleep_score', Number(input.sleep_score), 'score', 'gadgetbridge', Date.now())
      .run();

    const pid = crypto.randomUUID();
    const pri = alloc.p1Stress ? 'P1' : 'P3';
    await env.DB.prepare(
      'INSERT INTO agent_messages (id, from_agent, to_agent, subject, body, priority, requires_response, delivered, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
      .bind(
        pid,
        'SENTINEL',
        'MEDIC',
        'Daily spoon allocation — biometric',
        JSON.stringify(alloc),
        pri,
        0,
        0,
        Date.now()
      )
      .run();

    return {
      allocated_spoons: alloc.allocation,
      p1_stress: alloc.p1Stress,
      breakdown: alloc.breakdown,
      modifier_applied:
        alloc.allocation !== 12 ? `adjusted from baseline 12 → ${alloc.allocation}` : 'full allocation',
    };
  },
};

export const get_device_health: Tool = {
  name: 'get_device_health',
  description: 'Node Zero / Meshtastic snapshot from KV + device_states table.',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const raw = await env.SIMPLEX_STATE.get('device_health');
    const mesh = await env.SIMPLEX_STATE.get('meshtastic_status');
    return {
      node_zero: raw ? JSON.parse(raw as string) : { status: 'unknown', last_ping: null },
      meshtastic: mesh ? JSON.parse(mesh as string) : { node_count: 0, nodes: [], last_updated: null },
      note: 'MQTT hardware bridge publishes into KV/device_states.',
    };
  },
};

export const push_haptic: Tool = {
  name: 'push_haptic',
  description: 'Log haptic intent; optionally trigger HA wearable automation webhook flow.',
  input_schema: {
    type: 'object',
    properties: {
      target: { type: 'string', enum: ['node_zero', 'wearable', 'both'] },
      pattern: {
        type: 'string',
        enum: ['alert', 'medication', 'confirmation', 'safe-mode', 'meltdown', 'calcium-clear', 'ping'],
      },
      intensity: { type: 'number' },
    },
    required: ['target', 'pattern'],
  },
  async handler(input, env) {
    await env.DB.prepare(
      'INSERT INTO home_events (type, entity_id, data, created_at) VALUES (?,?,?,?)'
    )
      .bind(
        'haptic',
        String(input.target),
        JSON.stringify({ pattern: input.pattern, intensity: input.intensity ?? 60 }),
        Date.now()
      )
      .run()
      .catch(() => {});

    if (input.target === 'wearable' || input.target === 'both') {
      await haApi(env, '/services/automation/trigger', {
        method: 'POST',
        body: JSON.stringify({ entity_id: 'automation.p31_wearable_haptic' }),
      });
    }
    return { sent: input.target, pattern: input.pattern };
  },
};

export const get_meshtastic_status: Tool = {
  name: 'get_meshtastic_status',
  description: 'Meshtastic mesh snapshot (KV or future HTTP device API).',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const raw = await env.SIMPLEX_STATE.get('meshtastic_status');
    return raw
      ? JSON.parse(raw as string)
      : { node_count: 0, nodes: [], note: 'Push from Node One / HA integration.' };
  },
};

export const get_presence: Tool = {
  name: 'get_presence',
  description: 'Filter HA /states for person.* and device_tracker.*',
  input_schema: { type: 'object', properties: {}, required: [] },
  async handler(_input, env) {
    const r = await haApi(env, '/states');
    if (!Array.isArray(r.json)) return { error: 'HA states unavailable', status: r.status };
    type Ent = { entity_id: string; state: string; attributes: Record<string, unknown> };
    const ents = r.json as Ent[];
    const persons = ents.filter((e) => e.entity_id.startsWith('person.'));
    const deviceTrackers = ents.filter((e) => e.entity_id.startsWith('device_tracker.'));
    return {
      persons: persons.map((p) => ({
        id: p.entity_id,
        name: p.attributes?.friendly_name,
        state: p.state,
      })),
      devices_home: deviceTrackers.filter((d) => d.state === 'home').map((d) => d.entity_id),
    };
  },
};

export const send_tts: Tool = {
  name: 'send_tts',
  description: 'TTS via HA tts/google_translate_say (or swap service in HA).',
  input_schema: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      entity_id: { type: 'string' },
      volume: { type: 'number' },
    },
    required: ['message'],
  },
  async handler(input, env) {
    const player = (input.entity_id as string) || 'media_player.home_hub';
    if (typeof input.volume === 'number') {
      await haApi(env, '/services/media_player/volume_set', {
        method: 'POST',
        body: JSON.stringify({ entity_id: player, volume_level: input.volume }),
      });
    }
    const res = await haApi(env, '/services/tts/google_translate_say', {
      method: 'POST',
      body: JSON.stringify({
        entity_id: player,
        message: input.message,
        language: 'en',
      }),
    });
    return { spoken: input.message, player, ha: res.ok };
  },
};
