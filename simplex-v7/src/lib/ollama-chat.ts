/**
 * Optional local Ollama fallback when Anthropic is unset or errors (CWP-P31-SIMPLEX-OFFLINE-OLLAMA).
 * Workers cannot reach localhost; use a tunnel or deploy Ollama on a reachable host for production fallback.
 */

import type { Env } from '../agents/types';

export async function runOllamaUserMessage(
  env: Env,
  system: string,
  user: string,
  _maxTokens: number
): Promise<{ text: string; offline: boolean }> {
  const base = env.OLLAMA_BASE_URL?.trim().replace(/\/$/, '');
  if (!base) return { text: '', offline: true };

  const model = env.OLLAMA_MODEL?.trim() || 'qwen2.5:7b-instruct';

  try {
    const r = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!r.ok) return { text: '', offline: true };
    const j = (await r.json()) as { message?: { content?: string } };
    const text = String(j.message?.content ?? '').trim();
    return { text, offline: !text };
  } catch {
    return { text: '', offline: true };
  }
}
