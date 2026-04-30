/**
 * /api/k4/dispatch — thin adapter that lets the k4-agent-hub Worker fall through
 * to the Anthropic-backed simplex-v7 crew when local Ollama is unreachable.
 *
 * Auth: same OPERATOR_SECRET + Bearer / X-Operator-Token pattern as all skill routes.
 *
 * Wire format (POST JSON):
 *   { agentId: "FORGE"|"COUNSEL"|"SCHOLAR"|"SCRIBE"|"ORACLE"|"HERALD",
 *     skillId?: string,   // k4 skill id for logging
 *     prompt:  string,    // operator input / extracted prompt text
 *     sessionId?: string  // dock session for tracing }
 *
 * Response:
 *   { ok: boolean, dispatcher: "simplex-v7", agentId, skillId, sessionId, reply, offline }
 */

import type { Env } from '../agents/types';
import { runAnthropicUserMessage } from '../lib/skill-runner';
import { jsonResponse } from '../lib/http-json';

const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  FORGE:
    'You are FORGE — make. Produce code, patches, runnable artifacts, and scaffolds. ' +
    'Reply with the artifact directly. Be terse and precise.',
  COUNSEL:
    'You are COUNSEL — protect. Provide sourced, no-fabrication guidance on legal, ' +
    'safety, and risk topics. Cite when present; say "I don\'t know" when absent. ' +
    'No naval metaphors.',
  SCHOLAR:
    'You are SCHOLAR — understand. Synthesise information with concise, well-structured ' +
    'analysis and citations when present. Prefer clarity over length.',
  SCRIBE:
    'You are SCRIBE — remember. Record, assemble, and structure knowledge as notes, ' +
    'summaries, and structured documents. Preserve detail; omit nothing the operator gave you.',
  ORACLE:
    'You are ORACLE — perceive. Detect cross-domain patterns and trimtab-leverage ' +
    'opportunities. Reply with structured insight: pattern, domains, lever.',
  HERALD:
    'You are HERALD — communicate. Classify, triage, and draft communications with ' +
    'clear tone awareness. Hostile or ambiguous inputs get voltage labels (GREEN/YELLOW/RED).',
};

export interface K4DispatchBody {
  agentId: string;
  skillId?: string;
  prompt: string;
  sessionId?: string;
}

export async function handleK4Dispatch(request: Request, env: Env): Promise<Response> {
  const jr = (d: unknown, s = 200) => jsonResponse(d, s, request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jr({ error: 'invalid JSON' }, 400);
  }
  if (!body || typeof body !== 'object') return jr({ error: 'body must be a JSON object' }, 400);

  const { agentId, skillId, prompt, sessionId } = body as K4DispatchBody;

  if (typeof agentId !== 'string' || !agentId.trim())
    return jr({ error: 'agentId required' }, 400);
  if (typeof prompt !== 'string' || !prompt.trim())
    return jr({ error: 'prompt required' }, 400);

  const key = agentId.trim().toUpperCase();
  const system = AGENT_SYSTEM_PROMPTS[key];
  if (!system)
    return jr({ error: `unknown agentId: ${agentId}`, known: Object.keys(AGENT_SYSTEM_PROMPTS) }, 400);

  const { text, offline } = await runAnthropicUserMessage(env, system, prompt.trim(), 2048);

  return jr({
    ok: !offline,
    dispatcher: 'simplex-v7',
    agentId: key,
    skillId: skillId ?? null,
    sessionId: sessionId ?? null,
    reply: text,
    offline,
  });
}
