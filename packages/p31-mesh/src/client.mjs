/**
 * Minimal HTTP helpers for mesh Workers (GET + JSON parse + timeout).
 */

/**
 * @param {string} baseUrl - Origin, no trailing slash preferred
 * @param {string} suffix - Path e.g. /api/health
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function meshGet(baseUrl, suffix, opts = {}) {
  const { fetch: fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = opts;
  const u = new URL(suffix.startsWith("/") ? suffix : `/${suffix}`, baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let r;
  try {
    r = await fetchImpl(u, { method: "GET", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* leave null */
  }
  return { url: u.href, status: r.status, text, json };
}

/**
 * @param {string} baseUrl
 * @param {string} suffix - Path e.g. /agent/demo/chat
 * @param {unknown} body - JSON-serializable
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [opts]
 */
export async function meshPost(baseUrl, suffix, body, opts = {}) {
  const { fetch: fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = opts;
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const path = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const u = new URL(path, base);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let r;
  try {
    r = await fetchImpl(u, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* leave null */
  }
  return { url: u.href, status: r.status, text, json };
}
