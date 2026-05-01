/**
 * Tetra Hub — read-only aggregator over the K₄ edge trio (k4-personal, k4-cage, k4-hubs).
 * One HTTP round-trip for dashboards: GET /api/tetra (personal /api/mesh + cage /api/mesh + hubs /api/hubs).
 *
 * Deploy after K₄ trio on the same Cloudflare account (service bindings).
 * @see workers/tetra-hub/README.md
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-P31-Trace",
  "Access-Control-Max-Age": "86400",
};

function withCors(res) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

async function bindingJson(service, path, init = {}) {
  if (!service) return { error: "binding_missing" };
  const method = init.method || "GET";
  const req = new Request(`https://tetra.internal${path}`, {
    method,
    headers: init.headers,
    body: init.body ?? null,
  });
  try {
    const res = await service.fetch(req);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { _parseError: true, status: res.status, snippet: text.slice(0, 800) };
    }
    if (!res.ok) return { error: "upstream_http", status: res.status, body };
    return body;
  } catch (e) {
    return { error: "fetch_failed", message: String(e && e.message ? e.message : e) };
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>tetra-hub</title></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem">
<h1>tetra-hub</h1>
<p>Read-only K₄ trio aggregator. Bindings: <code>K4_PERSONAL</code>, <code>K4_CAGE</code>, <code>K4_HUBS</code>.</p>
<ul>
<li><a href="/api/health"><code>GET /api/health</code></a> — upstream liveness</li>
<li><a href="/api/tetra"><code>GET /api/tetra</code></a> — fused meshes + hub list (<code>p31.tetraHub/1.0.0</code>)</li>
</ul>
</body></html>`;
      return withCors(
        new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }),
      );
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      const [cageH, personalH, hubsH] = await Promise.all([
        bindingJson(env.K4_CAGE, "/api/health"),
        bindingJson(env.K4_PERSONAL, "/api/health"),
        bindingJson(env.K4_HUBS, "/health"),
      ]);
      const alive = (h) => Boolean(h && h.error === undefined);

      const body = {
        schema: "p31.tetraHubHealth/1.0.0",
        ok: true,
        worker: "tetra-hub",
        bindings: {
          K4_CAGE: Boolean(env.K4_CAGE),
          K4_PERSONAL: Boolean(env.K4_PERSONAL),
          K4_HUBS: Boolean(env.K4_HUBS),
        },
        upstream: {
          cage: { alive: alive(cageH), sample: cageH.error ? cageH : pickHealthSample(cageH) },
          personal: { alive: alive(personalH), sample: personalH.error ? personalH : pickHealthSample(personalH) },
          hubs: { alive: alive(hubsH), sample: hubsH.error ? hubsH : pickHealthSample(hubsH) },
        },
      };
      return withCors(Response.json(body));
    }

    if (request.method === "GET" && url.pathname === "/api/tetra") {
      const [personalMesh, cageMesh, hubsList] = await Promise.all([
        bindingJson(env.K4_PERSONAL, "/api/mesh"),
        bindingJson(env.K4_CAGE, "/api/mesh"),
        bindingJson(env.K4_HUBS, "/api/hubs"),
      ]);

      const body = {
        schema: "p31.tetraHub/1.0.0",
        gatheredAt: new Date().toISOString(),
        topology: {
          kind: "K4",
          vertices: 4,
          edges: 6,
          note:
            "Personal lattice uses pillars a–d; family cage uses named vertices; k4-hubs fuses life-context rosters. This payload is three parallel reads, not a fourth mesh.",
        },
        faces: {
          personal: personalMesh,
          cage: cageMesh,
          hubs: hubsList,
        },
      };
      return withCors(Response.json(body));
    }

    return withCors(new Response("Not found", { status: 404 }));
  },
};

function pickHealthSample(h) {
  if (!h || typeof h !== "object") return h;
  const out = {};
  for (const k of ["status", "ok", "service", "worker", "version", "WORKER_VERSION", "ENVIRONMENT"]) {
    if (h[k] !== undefined) out[k] = h[k];
  }
  return Object.keys(out).length ? out : { _note: "opaque health body" };
}
