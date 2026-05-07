/**
 * bonding-relay (Cloudflare Worker)
 * Purpose: BONDING KV multiplayer relay
 */

export interface Env {
  P31_BONDING_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Route: /relay/:roomCode/player/:playerId
    const match = url.pathname.match(/\/relay\/([a-zA-Z0-9]{6})\/player\/([a-zA-Z0-9-]+)/);
    if (!match) return new Response('Not Found', { status: 404 });

    const [, roomCode, playerId] = match;
    const key = `room:${roomCode}:player:${playerId}`;

    if (method === 'GET') {
      const value = await env.P31_BONDING_KV.get(key);
      return new Response(value, { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
      const data = await request.json();
      await env.P31_BONDING_KV.put(key, JSON.stringify(data), { expirationTtl: 3600 });
      return new Response('OK');
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
