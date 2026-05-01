/**
 * simplex-email — inbound Cloudflare Email Worker (WCD-SIMPLEX-04).
 * Logs envelope + subject (no raw body to edge logs in production without operator opt-in).
 * Forwards to a single verified destination when MAIL_FORWARD_DESTINATION is set.
 * Optional: HMAC-signed POST to simplex-worker `/api/ingest/email` (tomograph row).
 */

import { hmacSha256Hex } from './hmac';

export interface Env {
  /**
   * Verified Email Routing destination (operator mailbox). Required for production.
   * `wrangler secret put MAIL_FORWARD_DESTINATION`
   */
  MAIL_FORWARD_DESTINATION?: string;
  /**
   * Full URL to simplex-worker ingest (e.g. `https://simplex-worker.<sub>.workers.dev/api/ingest/email`).
   * Requires `SIMPLEX_EMAIL_INGEST_SECRET` on **both** Workers (same value).
   */
  SIMPLEX_INGEST_URL?: string;
  /** Shared secret for `X-Simplex-Email-Signature` over raw JSON body. */
  SIMPLEX_EMAIL_INGEST_SECRET?: string;
}

export default {
  /** Health / version probe (Email Workers also expose `email` below). */
  fetch(): Response {
    return new Response(
      JSON.stringify({
        worker: 'simplex-email',
        note: 'Inbound mail is handled by the `email` handler; configure Email Routing in the zone.',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  },

  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const subject = message.headers.get('subject') ?? '';
    const digest = {
      pipeline: 'simplex-email',
      from: message.from,
      to: message.to,
      subject_snippet: subject.slice(0, 500),
      ts: Date.now(),
    };
    console.log(JSON.stringify(digest));

    const ingestUrl = env.SIMPLEX_INGEST_URL?.trim();
    const ingestSecret = env.SIMPLEX_EMAIL_INGEST_SECRET?.trim();
    if (ingestUrl && ingestSecret) {
      try {
        const bodyObj = {
          from: message.from,
          to: message.to,
          subject_snippet: subject.slice(0, 500),
          text_preview: subject.slice(0, 400),
          ts: digest.ts,
        };
        const body = JSON.stringify(bodyObj);
        const sig = await hmacSha256Hex(ingestSecret, body);
        const ir = await fetch(ingestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Simplex-Email-Signature': sig,
          },
          body,
        });
        console.log(
          JSON.stringify({
            simplex_ingest: ir.ok ? 'ok' : 'fail',
            status: ir.status,
          })
        );
      } catch (e) {
        console.log(JSON.stringify({ simplex_ingest: 'error', err: String(e) }));
      }
    }

    const dest = env.MAIL_FORWARD_DESTINATION?.trim();
    if (dest) {
      await message.forward(dest);
      return;
    }

    message.setReject(
      'simplex-email: MAIL_FORWARD_DESTINATION secret not set — configure wrangler secret before production'
    );
  },
};
