/**
 * stripe-webhook (Cloudflare Worker)
 * Purpose: Stripe event handling
 */

export interface Env {
  STRIPE_WEBHOOK_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Placeholder for Stripe webhook handling
    return new Response('Stripe webhook endpoint - TODO');
  },
};