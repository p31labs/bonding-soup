/**
 * simplex-email — inbound Cloudflare Email Worker (WCD-SIMPLEX-04).
 * Logs envelope + subject (no raw body to edge logs in production without operator opt-in).
 * Forwards to a single verified destination when MAIL_FORWARD_DESTINATION is set.
 */

export interface Env {
  /**
   * Verified Email Routing destination (operator mailbox). Required for production.
   * `wrangler secret put MAIL_FORWARD_DESTINATION`
   */
  MAIL_FORWARD_DESTINATION?: string;
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
