/**
 * P31 agent crew — runner — SIMPLEX v7
 * Orchestration: delta topology; failures per-agent; no crash-the-world.
 */

import Anthropic from '@anthropic-ai/sdk';
import { resolveSentinelContext } from '../lib/context-fallback';
import { AGENTS } from './registry';
import { TOOL_REGISTRY } from './tools/index';
import type {
  AgentId,
  AgentDefinition,
  AgentContext,
  AgentMessage,
  AgentOutput,
  OutputItem,
  VoltageLevel,
  Env,
} from './types';

export async function runAgentById(
  agentId: AgentId,
  env: Env
): Promise<AgentOutput> {
  return runAgent(agentId, await buildContext('manual', env), env);
}

export async function runAgent(
  agentId: AgentId,
  context: AgentContext,
  env: Env
): Promise<AgentOutput> {
  const startMs = Date.now();
  const agent = AGENTS[agentId];
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  if (agent.maxSpoonCost > 0 && context.operator_spoons < agent.maxSpoonCost) {
    return spoonGateOutput(agentId, context, agent.maxSpoonCost);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return offlineStubOutput(agentId, context);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const tools = agent.tools
    .filter((name) => TOOL_REGISTRY[name])
    .map((name) => ({
      name,
      description: TOOL_REGISTRY[name].description,
      input_schema: TOOL_REGISTRY[name].input_schema,
    }));

  const contextMsg = buildContextMessage(context, agentId);

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: contextMsg }];

  let response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: agent.systemPrompt,
    tools: tools as Anthropic.Tool[],
    messages,
  });

  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter((b) => b.type === 'tool_use');
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUses) {
      if (block.type !== 'tool_use') continue;
      const tool = TOOL_REGISTRY[block.name];
      let result: unknown;
      try {
        result = tool
          ? await tool.handler(block.input as Record<string, unknown>, env)
          : { error: `Tool ${block.name} not found` };
      } catch (err) {
        result = { error: String(err) };
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: agent.systemPrompt,
      tools: tools as Anthropic.Tool[],
      messages,
    });
  }

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('\n');

  const output = parseAgentOutput(agentId, text, context);
  output.duration_ms = Date.now() - startMs;

  await persistOutput(output, agent, env);

  return output;
}

export async function dispatch(
  trigger: AgentContext['trigger'],
  triggerData: unknown,
  env: Env
): Promise<AgentOutput[]> {
  const state = await getSystemState(env);
  const context: AgentContext = {
    trigger,
    trigger_data: triggerData,
    operator_spoons: state.current_spoons,
    system_voltage: state.system_voltage,
    date_utc: new Date().toISOString(),
    pending_messages: await getPendingMessages(env),
  };

  const manualAgent = extractManualAgent(triggerData);
  const queueTarget = extractQueueTarget(triggerData);
  const eligibleAgents = Object.values(AGENTS).filter((a) => {
    if (!a.triggers.includes(trigger)) return false;
    if (queueTarget && a.id !== queueTarget) return false;
    if (manualAgent && a.id !== manualAgent) return false;
    return true;
  });

  const outputs: AgentOutput[] = [];
  for (const agent of eligibleAgents) {
    try {
      const output = await runAgent(agent.id, context, env);
      outputs.push(output);
    } catch (err) {
      console.error(`Agent ${agent.id} failed:`, err);
    }
  }
  return outputs;
}

function extractManualAgent(triggerData: unknown): AgentId | undefined {
  if (!triggerData || typeof triggerData !== 'object') return undefined;
  const o = triggerData as Record<string, unknown>;
  const agent = typeof o.agent === 'string' ? o.agent.trim().toUpperCase() : '';
  const allowed: AgentId[] = [
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
  return allowed.includes(agent as AgentId) ? (agent as AgentId) : undefined;
}

function extractQueueTarget(triggerData: unknown): AgentId | undefined {
  if (!triggerData || typeof triggerData !== 'object') return undefined;
  const o = triggerData as Record<string, unknown>;
  const s = o.source;
  if (s === 'biometric' || s === 'home_assistant') return 'SENTINEL';
  return undefined;
}

export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  if (event.cron === '*/5 * * * *') {
    await runAgent('SENTINEL', await buildContext('cron', env), env);
    return;
  }
  await handleCron(new Date(event.scheduledTime).toISOString(), env);
}

async function handleCron(cronTime: string, env: Env): Promise<void> {
  const d = new Date(cronTime);
  const hour = d.getUTCHours();
  const dow = d.getUTCDay();

  if (hour === 6) await runAgent('STEWARD', await buildContext('cron', env), env);
  if (hour === 7 && [1, 3, 5].includes(dow))
    await runAgent('COUNSEL', await buildContext('cron', env), env);
  if (hour === 8 && dow === 1) await runAgent('ADVOCATE', await buildContext('cron', env), env);
  if (hour === 9) await runAgent('TREASURER', await buildContext('cron', env), env);
  if (hour === 10 && dow === 1) await runAgent('SCHOLAR', await buildContext('cron', env), env);
  if (hour % 4 === 0) await runAgent('FORGE', await buildContext('cron', env), env);
  if (hour % 6 === 0) await runAgent('MEDIC', await buildContext('cron', env), env);
  if (hour === 20) await runAgent('ORACLE', await buildContext('cron', env), env);
}

async function buildContext(
  trigger: AgentContext['trigger'],
  env: Env
): Promise<AgentContext> {
  const state = await getSystemState(env);
  return {
    trigger,
    operator_spoons: state.current_spoons,
    system_voltage: state.system_voltage,
    date_utc: new Date().toISOString(),
    pending_messages: await getPendingMessages(env),
  };
}

async function getSystemState(env: Env): Promise<{
  current_spoons: number;
  system_voltage: VoltageLevel;
  current_love: number;
}> {
  const sentinel = await resolveSentinelContext(env);
  const raw = await env.SIMPLEX_STATE.get('system_state');
  const defaults = {
    current_spoons: sentinel.spoons,
    system_voltage: 'GREEN' as VoltageLevel,
    current_love: 0,
  };
  try {
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<{
      current_spoons: number;
      system_voltage: VoltageLevel;
      current_love: number;
    }>;
    return {
      ...defaults,
      ...parsed,
      current_spoons: sentinel.spoons,
    };
  } catch {
    return defaults;
  }
}

async function getPendingMessages(env: Env): Promise<AgentMessage[]> {
  const result = await env.DB.prepare(
    'SELECT id, from_agent, to_agent, subject, body, priority, requires_response, delivered, created_at FROM agent_messages WHERE delivered = 0 ORDER BY created_at ASC LIMIT 20'
  ).all();
  const rows = (result.results ?? []) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    ...r,
    from: r.from_agent,
    to: r.to_agent,
  })) as AgentMessage[];
}

function buildContextMessage(context: AgentContext, agentId: AgentId): string {
  const pending = context.pending_messages
    .filter((m) => m.to === agentId || m.to_agent === agentId)
    .map((m) => `FROM ${m.from ?? m.from_agent}: [${m.priority}] ${m.subject}\n${m.body}`)
    .join('\n---\n');

  return `CURRENT DATE/TIME: ${context.date_utc}
OPERATOR SPOONS: ${context.operator_spoons}/12
SYSTEM VOLTAGE: ${context.system_voltage}
TRIGGER: ${context.trigger}
${context.trigger_data ? `TRIGGER DATA: ${JSON.stringify(context.trigger_data)}` : ''}
${pending ? `\nPENDING MESSAGES FOR YOU:\n${pending}` : ''}

Execute your standard run for this trigger. Use your tools. Be precise.`;
}

function offlineStubOutput(agentId: AgentId, context: AgentContext): AgentOutput {
  const runId = crypto.randomUUID();
  return {
    agent: agentId,
    run_id: runId,
    trigger: context.trigger,
    summary: 'ANTHROPIC_API_KEY not set — tool-only / offline stub.',
    items: [],
    messages_sent: [],
    voltage: 'YELLOW',
    spoon_cost: 0,
    duration_ms: 0,
    timestamp: Date.now(),
  };
}

function parseAgentOutput(agentId: AgentId, text: string, context: AgentContext): AgentOutput {
  const items: OutputItem[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const pMatch = line.match(/\[(P[0-3])\]/);
    if (pMatch) {
      items.push({
        type: line.toLowerCase().includes('draft')
          ? 'draft'
          : line.toLowerCase().includes('action')
            ? 'action_required'
            : line.toLowerCase().includes('alert')
              ? 'alert'
              : 'info',
        priority: pMatch[1] as OutputItem['priority'],
        title: line.replace(/\[(?:P[0-3])\]/, '').trim(),
        content: line,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      type: 'info',
      priority: 'P3',
      title: 'Agent run complete',
      content: text,
    });
  }

  const voltage: VoltageLevel = items.some((i) => i.priority === 'P0')
    ? 'RED'
    : items.some((i) => i.priority === 'P1')
      ? 'YELLOW'
      : 'GREEN';

  return {
    agent: agentId,
    run_id: crypto.randomUUID(),
    trigger: context.trigger,
    summary: lines[0] ?? '',
    items,
    messages_sent: [],
    voltage,
    spoon_cost: 0,
    duration_ms: 0,
    timestamp: Date.now(),
  };
}

async function persistOutput(output: AgentOutput, agent: AgentDefinition, env: Env): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO agent_runs (run_id, agent_id, trigger, voltage, summary, items_json, duration_ms, created_at) VALUES (?,?,?,?,?,?,?,?)'
  )
    .bind(
      output.run_id,
      output.agent,
      output.trigger,
      output.voltage,
      output.summary,
      JSON.stringify(output.items),
      output.duration_ms,
      output.timestamp
    )
    .run();

  for (const channel of agent.outputChannels) {
    if (channel.type === 'kv') {
      await env.SIMPLEX_STATE.put(channel.key, JSON.stringify(output), { expirationTtl: 86400 });
    }
  }
}

function spoonGateOutput(agentId: AgentId, context: AgentContext, required: number): AgentOutput {
  return {
    agent: agentId,
    run_id: crypto.randomUUID(),
    trigger: context.trigger,
    summary: `SPOON GATE: ${agentId} requires ${required} spoons. Operator at ${context.operator_spoons}. Deferred.`,
    items: [
      {
        type: 'info',
        priority: 'P2',
        title: `${agentId} deferred — insufficient spoons`,
        content: `Required: ${required}, Available: ${context.operator_spoons}. Retry when spoons replenish.`,
      },
    ],
    messages_sent: [],
    voltage: 'YELLOW',
    spoon_cost: 0,
    duration_ms: 0,
    timestamp: Date.now(),
  };
}
