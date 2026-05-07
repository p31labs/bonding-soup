/**
 * shift-api (Cloudflare Worker)
 * Purpose: Shift in/out/status endpoints
 */

export interface Env {
  P31_SHIFT_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // GET /shift/status
    if (method === 'GET' && url.pathname === '/shift/status') {
      const status = await env.P31_SHIFT_KV.get('shift:current') || 'OFFLINE';
      const lastChange = await env.P31_SHIFT_KV.get('shift:lastChange') || 'UNKNOWN';
      return new Response(JSON.stringify({ status, lastChange }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /shift/in
    if (method === 'POST' && url.pathname === '/shift/in') {
      const timestamp = new Date().toISOString();
      await env.P31_SHIFT_KV.put('shift:current', 'ACTIVE');
      await env.P31_SHIFT_KV.put('shift:lastChange', timestamp);
      return new Response(JSON.stringify({ status: 'ACTIVE', timestamp }));
    }

    // POST /shift/out
    if (method === 'POST' && url.pathname === '/shift/out') {
      const timestamp = new Date().toISOString();
      await env.P31_SHIFT_KV.put('shift:current', 'OFFLINE');
      await env.P31_SHIFT_KV.put('shift:lastChange', timestamp);
      return new Response(JSON.stringify({ status: 'OFFLINE', timestamp }));
    }

    return new Response('Not Found', { status: 404 });
  },
};