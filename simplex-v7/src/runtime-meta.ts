/**
 * Build-time mirrors of `simplex-v7/wrangler.toml` (cron + queue).
 * When you change triggers or the queue name in Wrangler, update this file in the same commit.
 */

/** Producer queue name — must match `[[queues.producers]].queue`. */
export const SIMPLEX_QUEUE_NAME = 'simplex-agent-queue';

/**
 * Cron expressions deployed on the Worker — must match `[triggers].crons` in `wrangler.toml`.
 * Empty means no Cloudflare cron triggers (manual / external scheduler only).
 */
export const SIMPLEX_CRON_EXPRESSIONS: readonly string[] = [];
