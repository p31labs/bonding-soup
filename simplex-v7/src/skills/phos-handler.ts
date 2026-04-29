/**
 * POST /api/phos/respond — Phos garden companion (children).
 * No conversation persistence. Auth: PHOS_HMAC_SECRET + X-Phos-Signature, or PHOS_CHILD_IDS allowlist.
 */

import type { Env } from '../agents/types';
import { verifyHmacSha256 } from '../lib/hmac-worker';
import { jsonResponse } from '../lib/http-json';
import { assertSkillRateOk } from '../lib/skill-rate-limit';
import { runAnthropicUserMessage } from '../lib/skill-runner';
import { isPhosAwakeHour, maxExchangesLimit } from './phos-config';
import { PHOS_SYSTEM_PROMPT } from './phos-prompt';
import { filterPhosResponse } from './phos-safety';

const ASLEEP_BUBBLE =
  'Phos is resting. The garden is still here — build something, and Phos will see it next visit.';
const QUIET_BUBBLE =
  "I'm going to watch the garden for a bit. You build — I'll be right here.";

async function assertPhosGate(
  env: Env,
  bodyText: string,
  childId: string,
  request: Request
): Promise<Response | null> {
  const hmacSecret = env.PHOS_HMAC_SECRET?.trim();
  const allow = env.PHOS_CHILD_IDS?.trim();

  if (!hmacSecret && !allow) {
    return jsonResponse(
      {
        error: 'phos_not_configured',
        hint: 'Set PHOS_HMAC_SECRET (and X-Phos-Signature on body) and/or PHOS_CHILD_IDS allowlist.',
      },
      503,
      request
    );
  }

  if (hmacSecret) {
    const sig = request.headers.get('X-Phos-Signature') ?? '';
    const ok = await verifyHmacSha256(bodyText, sig, hmacSecret);
    if (!ok) return jsonResponse({ error: 'invalid_phos_signature' }, 401, request);
  }

  if (allow) {
    const ids = allow.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!ids.includes(childId)) return jsonResponse({ error: 'child_not_in_mesh' }, 403, request);
  }

  return null;
}

export async function handlePhosRequest(request: Request, env: Env): Promise<Response> {
  const jr = (d: unknown, s = 200) => jsonResponse(d, s, request);
  const bodyText = await request.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return jr({ error: 'invalid_json' }, 400);
  }

  const childId = String(body.child_id ?? '').trim();
  if (!childId || childId.length > 128) {
    return jr({ error: 'missing_or_invalid_child_id' }, 400);
  }

  const gate = await assertPhosGate(env, bodyText, childId, request);
  if (gate) return gate;

  const rl = await assertSkillRateOk(env, `phos_${childId.slice(0, 24)}`, request);
  if (rl) return rl;

  const localHour = body.local_hour !== undefined ? Number(body.local_hour) : undefined;
  if (!isPhosAwakeHour(localHour, env.PHOS_WAKE_START, env.PHOS_WAKE_END)) {
    return jr({
      asleep: true,
      bubble: ASLEEP_BUBBLE,
      text: ASLEEP_BUBBLE,
      mood: 'rest',
      phos_note: 'Outside configured wake window (PHOS_WAKE_START / PHOS_WAKE_END).',
    });
  }

  const exchangeCount = Number(body.exchange_count ?? 0) || 0;
  if (exchangeCount >= maxExchangesLimit(env.PHOS_MAX_EXCHANGES)) {
    return jr({
      quiet: true,
      bubble: QUIET_BUBBLE,
      text: QUIET_BUBBLE,
      mood: 'content',
      exchange_count: exchangeCount,
    });
  }

  const preReader = Boolean(body.pre_reader);
  const input = String(body.input ?? '').trim();
  const gardenState = body.garden_state;

  if (preReader && !input) {
    return jr({
      no_words: true,
      mood: 'attentive',
      text: null,
      bubble: null,
      hum_hint: 'presence',
    });
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jr({
      offline: true,
      bubble: 'Phos is here, but the bright words are sleeping. The garden still listens.',
      text: 'Phos is here, but the bright words are sleeping. The garden still listens.',
      mood: 'content',
    });
  }

  const userPayload = {
    garden_state: gardenState ?? {},
    input_type: String(body.input_type ?? 'text'),
    input: input || '(child present in garden; react to garden_state only)',
    pre_reader: preReader,
    exchange_count: exchangeCount,
  };

  const userMsg =
    (preReader ? 'PRE_READER: use at most 12 simple words per reply if you use words at all.\n' : '') +
    JSON.stringify(userPayload);

  const maxTok = preReader ? 256 : 512;
  const { text: raw, offline } = await runAnthropicUserMessage(env, PHOS_SYSTEM_PROMPT, userMsg, maxTok);
  if (offline || !raw) {
    return jr({
      offline: true,
      bubble: 'Phos hums with the atoms — words soon.',
      text: 'Phos hums with the atoms — words soon.',
      mood: 'thinking',
    });
  }

  const safe = filterPhosResponse(raw);
  const mood = safe.ok ? guessMood(raw) : 'content';

  return jr({
    bubble: safe.text,
    text: safe.text,
    mood,
    exchange_count: exchangeCount + 1,
    safety_regenerated: !safe.ok,
    ...(safe.violations.length ? { safety_flags: safe.violations.length } : {}),
  });
}

function guessMood(t: string): string {
  const s = t.toLowerCase();
  if (s.includes("don't know") || s.includes('i wonder') || s.includes('hmm')) return 'thinking';
  if (s.includes('?')) return 'attentive';
  return 'content';
}
