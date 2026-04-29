/** Shared CORS + JSON helpers for simplex-worker (agents + operator skills). */

export const P31_CORS_ORIGIN = 'https://p31ca.org';

/** Echo localhost / 127.0.0.1 any port for dev probes (e.g. `npm run demo` + Phos curl/HTML). */
export function resolvedSkillCorsOrigin(request: Request | undefined): string {
  if (!request) return P31_CORS_ORIGIN;
  const o = request.headers.get('Origin');
  if (!o) return P31_CORS_ORIGIN;
  if (o === P31_CORS_ORIGIN) return o;
  if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(o)) return o;
  return P31_CORS_ORIGIN;
}

export function skillCorsHeaders(request?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolvedSkillCorsOrigin(request),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type,X-Device-Signature,Authorization,X-Operator-Token,X-Phos-Signature',
  };
}

export function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...skillCorsHeaders(request) },
  });
}
