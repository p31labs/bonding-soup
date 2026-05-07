/**
 * cogpass-bridge (Cloudflare Worker)
 * Purpose: Cognitive Passport schema endpoint
 */

export interface Env {
  // No external dependencies needed
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // GET /cogpass/schema - Return v3.0 schema
    if (request.method === 'GET') {
      const schema = {
        version: '3.0.0',
        description: 'P31 Cognitive Passport Schema',
        properties: {
          id: 'string',
          generatedAt: 'string',
          preferences: 'object',
          routing: 'object'
        }
      };
      return new Response(JSON.stringify(schema), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};