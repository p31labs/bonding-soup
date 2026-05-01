import Anthropic from '@anthropic-ai/sdk';
import type { Env } from '../agents/types';
import { extractJsonObject } from './json-extract';
import { runOllamaUserMessage } from './ollama-chat';

export const SKILL_MODEL = 'claude-sonnet-4-20250514';

export async function runAnthropicUserMessage(
  env: Env,
  system: string,
  user: string,
  maxTokens = 4096
): Promise<{ text: string; offline: boolean }> {
  const tryOllama = () => runOllamaUserMessage(env, system, user, maxTokens);

  if (!env.ANTHROPIC_API_KEY?.trim()) {
    return tryOllama();
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: SKILL_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');
    return { text, offline: false };
  } catch {
    const fb = await tryOllama();
    if (fb.text) return { ...fb, offline: false };
    return { text: '', offline: true };
  }
}

export async function runAnthropicJson(
  env: Env,
  system: string,
  user: string,
  maxTokens = 4096
): Promise<{ data: unknown; raw_text: string; offline: boolean }> {
  const { text, offline } = await runAnthropicUserMessage(env, system, user, maxTokens);
  if (offline || !text) {
    return { data: null, raw_text: text, offline: true };
  }
  const data = extractJsonObject(text);
  return { data, raw_text: text, offline: false };
}
