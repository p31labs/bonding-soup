/**
 * command-center (Cloudflare Worker)
 * Purpose: Shift API and operator status
 */

export interface Env {
  P31_SHIFT_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // GET /cmd/status - Current operator status
    if (method === 'GET' && url.pathname === '/cmd/status') {
      const status = await env.P31_SHIFT_KV.get('operator:status') || 'OFFLINE';
      return new Response(JSON.stringify({ status, timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /cmd/shift/in - Operator shift in
    if (method === 'POST' && url.pathname === '/cmd/shift/in') {
      await env.P31_SHIFT_KV.put('operator:status', 'ACTIVE', { expirationTtl: 86400 });
      return new Response('Shift started');
    }

    // POST /cmd/shift/out - Operator shift out
    if (method === 'POST' && url.pathname === '/cmd/shift/out') {
      await env.P31_SHIFT_KV.put('operator:status', 'OFFLINE');
      return new Response('Shift ended');
    }

    return new Response('Not Found', { status: 404 });
  },
};