/**
 * P31 agent crew — type system — SIMPLEX v7
 * Delta topology: no hub, no master — peer messages via D1 + optional queue consumers.
 */

export type TriggerType =
  | 'cron'
  | 'http'
  | 'email_inbound'
  | 'queue_message'
  | 'agent_handoff'
  | 'manual';

export type AgentId =
  | 'STEWARD'
  | 'SENTINEL'
  | 'COUNSEL'
  | 'ADVOCATE'
  | 'TREASURER'
  | 'FORGE'
  | 'MEDIC'
  | 'HERALD'
  | 'SCHOLAR'
  | 'SCRIBE'
  | 'ORACLE';

export type VoltageLevel = 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface AgentMessage {
  id?: string;
  from?: AgentId | string;
  to?: AgentId | string;
  from_agent?: string;
  to_agent?: string;
  subject?: string;
  body?: string;
  priority?: Priority;
  requires_response?: number | boolean;
  delivered?: number;
  created_at?: number;
}

export interface AgentOutput {
  agent: AgentId;
  run_id: string;
  trigger: TriggerType;
  summary: string;
  items: OutputItem[];
  messages_sent: AgentMessage[];
  voltage: VoltageLevel;
  spoon_cost: number;
  duration_ms: number;
  timestamp: number;
}

export interface OutputItem {
  type:
    | 'alert'
    | 'draft'
    | 'report'
    | 'action_required'
    | 'info'
    | 'handoff';
  priority: Priority;
  title: string;
  content: string;
  deadline?: string;
  action_url?: string;
}

export interface AgentContext {
  trigger: TriggerType;
  trigger_data?: unknown;
  operator_spoons: number;
  system_voltage: VoltageLevel;
  date_utc: string;
  pending_messages: AgentMessage[];
}

export interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  handler: (input: Record<string, unknown>, env: Env) => Promise<unknown>;
}

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  systemPrompt: string;
  tools: string[];
  triggers: TriggerType[];
  cron?: string;
  maxSpoonCost: number;
  outputChannels: OutputChannel[];
}

export type OutputChannel =
  | { type: 'kv'; key: string }
  | { type: 'd1'; table: string }
  | { type: 'email'; address: string }
  | { type: 'agent_queue'; target: AgentId };

/** Cloudflare bindings + secrets (`wrangler secret put …`). Never hardcode DEVICE_SECRET or hostile addresses in repo. */
export interface Env {
  DB: D1Database;
  SIMPLEX_STATE: KVNamespace;
  AGENT_QUEUE: Queue<{ to?: string; trigger_data?: unknown }>;
  ANTHROPIC_API_KEY: string;
  DEVICE_SECRET: string;
  /** Newline-separated list of hostile email addresses (routing / tomograph — set via Worker secret only). */
  HOSTILE_SENDERS?: string;
  /** Home Assistant long-lived access token (`wrangler secret put HA_TOKEN`). Local-first hub. */
  HA_TOKEN?: string;
  /** Base URL including scheme, no trailing slash (e.g. `http://homeassistant.local:8123`). */
  HA_BASE_URL?: string;
  /** When set, operator skill routes require `Authorization: Bearer …` or `X-Operator-Token`. */
  OPERATOR_SECRET?: string;
  /** Optional cap on skill invocations per IP per day (default 80). Plain [var] or secret string digits. */
  SKILL_DAILY_LIMIT_PER_IP?: string;
  /** Phos companion: HMAC secret for `X-Phos-Signature` over raw POST body (preferred in prod). */
  PHOS_HMAC_SECRET?: string;
  /** Comma/space-separated allowed `child_id` values (mesh gate). Used with or without HMAC. */
  PHOS_CHILD_IDS?: string;
  /** Local hour (0–23) when Phos "wakes" (default 7). */
  PHOS_WAKE_START?: string;
  /** Local hour when Phos rests (default 20). */
  PHOS_WAKE_END?: string;
  /** Max LLM exchanges per garden session before quiet mode (default 10). */
  PHOS_MAX_EXCHANGES?: string;
  /**
   * HMAC secret shared with `simplex-email` Worker for `POST /api/ingest/email`
   * (`X-Simplex-Email-Signature` over raw body). `wrangler secret put SIMPLEX_EMAIL_INGEST_SECRET`
   */
  SIMPLEX_EMAIL_INGEST_SECRET?: string;
  /** Ollama OpenAI-compatible base (e.g. tunnel URL). Optional fallback for skills / crew when Anthropic fails. */
  OLLAMA_BASE_URL?: string;
  /** Ollama model id for `/api/chat` (default `qwen2.5:7b-instruct`). */
  OLLAMA_MODEL?: string;
}
