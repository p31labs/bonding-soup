/**
 * genesis-block (Cloudflare Worker)
 * Purpose: Append-only audit trail
 */

export interface Env {
  P31_DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'POST') {
      const data = await request.json();
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Calculate SHA-256 hash
      const payloadStr = JSON.stringify(data);
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payloadStr));
      const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Get previous hash
      const prevResult = await env.P31_DB.prepare(
        'SELECT hash FROM genesis_block ORDER BY timestamp DESC LIMIT 1'
      ).run();
      const previousHash = prevResult.results?.[0]?.hash || 'GENESIS';

      // Insert record
      await env.P31_DB.prepare(
        'INSERT INTO genesis_block (id, timestamp, type, payload, hash, previous_hash) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, timestamp, data.type, payloadStr, hashHex, previousHash).run();

      return new Response(JSON.stringify({ id, hash: hashHex }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'GET') {
      const result = await env.P31_DB.prepare(
        'SELECT id, timestamp, type, hash FROM genesis_block ORDER BY timestamp DESC LIMIT 10'
      ).run();

      return new Response(JSON.stringify(result.results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};