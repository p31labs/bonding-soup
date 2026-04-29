import type { Env } from '../agents/types';
import { jsonResponse } from './http-json';

/**
 * When `OPERATOR_SECRET` is set (wrangler secret), skill routes require Bearer or header token.
 * If unset, routes are open (local dev only — set secret in production).
 */
export function assertOperatorAuthorized(env: Env, request: Request): Response | null {
  const secret = env.OPERATOR_SECRET?.trim();
  if (!secret) return null;

  const auth = request.headers.get('Authorization') ?? '';
  const headerTok = request.headers.get('X-Operator-Token') ?? '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';

  if (bearer === secret || headerTok === secret) return null;

  return jsonResponse(
    {
      error: 'Unauthorized',
      hint: 'Set wrangler secret OPERATOR_SECRET and send Authorization: Bearer <token> or X-Operator-Token.',
    },
    401,
    request
  );
}
