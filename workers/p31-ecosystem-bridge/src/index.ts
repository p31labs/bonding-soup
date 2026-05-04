/**
 * P31 Ecosystem Bridge — cross-site nervous system
 *
 * Routes:
 *   GET /health            → self health check (used by TRIPER + glass probes)
 *   GET /api/sync          → canonical org constants slice (both sites can read)
 *   GET /api/status        → aggregated health from both site stacks
 *   GET /api/fleet         → simplified live fleet for both sites
 *
 * CORS: phosphorus31.org ↔ p31ca.org (bidirectional, no wildcards)
 */

export interface Env {
  ENVIRONMENT: string;
  WORKER_VERSION: string;
  PHOS_ORIGIN: string;
  P31CA_ORIGIN: string;
}

const ALLOWED_ORIGINS = [
  "https://phosphorus31.org",
  "https://p31ca.org",
  "https://bonding.p31ca.org",
  // local dev
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Canonical constants slice — updated by npm run apply:constants
// This is the authoritative cross-site read surface for both sites.
const SYNC_PAYLOAD = {
  schema: "p31.ecosystemSync/1.0.0",
  generated: "2026-05-04",
  org: {
    legalName: "P31 Labs, Inc.",
    ein: "42-1888158",
    stateOfIncorporation: "GA",
    sosControlNumber: "26082141",
    status501c3: "determined_active",
    determinationDate: "2026-05-04",
    publicCharityStatus: "170(b)(1)(A)(vi)",
    deductibilityStatus: "tax_deductible_donations_enabled",
  },
  research: {
    zenodoPublicationCount: 22,
    researchSeriesCount: 22,
    drafts: 2,
    note: "Papers XXI + XXII drafted; Zenodo deposit pending",
  },
  grants: {
    active: 10,
    submissionReady: 4,
    submitted: 1,
    note: "ASAN opens 2026-05-15; NLnet rolling; Stimpunks opens 2026-06-01",
  },
  sites: {
    orgSite: "https://phosphorus31.org",
    techHub: "https://p31ca.org",
    orgStatusJson: "https://phosphorus31.org/p31-status.json",
    hubPublicSurface: "https://p31ca.org/p31-public-surface.json",
  },
  workers: {
    donateApi: "https://donate-api.phosphorus31.org",
    bufferApi: "https://p31-buffer-api.trimtab-signal.workers.dev",
    orchestrator: "https://p31-orchestrator.trimtab-signal.workers.dev",
    commandCenter: "https://command-center.trimtab-signal.workers.dev",
    ecosystemBridge: "https://ecosystem-bridge.trimtab-signal.workers.dev",
  },
};

// Upstream health probes — checked by /api/status
const PROBES: Array<{ id: string; url: string; expect?: number }> = [
  { id: "phos-site", url: "https://phosphorus31.org/" },
  { id: "phos-status-json", url: "https://phosphorus31.org/p31-status.json" },
  { id: "phos-donate-api", url: "https://donate-api.phosphorus31.org/health" },
  { id: "p31ca-site", url: "https://p31ca.org/" },
  { id: "p31ca-public-surface", url: "https://p31ca.org/p31-public-surface.json" },
  { id: "p31ca-mesh-constants", url: "https://p31ca.org/p31-mesh-constants.json" },
];

// SIMPLIFIED fleet for the /api/fleet route
const FLEET_SUMMARY = {
  schema: "p31.fleetSummary/1.0.0",
  sites: [
    { id: "phosphorus31.org", url: "https://phosphorus31.org", kind: "cloudflare-pages" },
    { id: "p31ca.org", url: "https://p31ca.org", kind: "cloudflare-pages" },
  ],
  workers: [
    { id: "ecosystem-bridge", url: "https://ecosystem-bridge.trimtab-signal.workers.dev", health: "/health" },
    { id: "donate-api", url: "https://donate-api.phosphorus31.org", health: "/health" },
    { id: "p31-buffer-api", url: "https://p31-buffer-api.trimtab-signal.workers.dev", health: "/health" },
    { id: "p31-orchestrator", url: "https://p31-orchestrator.trimtab-signal.workers.dev", health: "/api/orchestrator/status" },
    { id: "command-center", url: "https://command-center.trimtab-signal.workers.dev", health: "/api/health" },
    { id: "k4-personal", url: "https://k4-personal.trimtab-signal.workers.dev", health: "/api/health" },
    { id: "k4-cage", url: "https://k4-cage.trimtab-signal.workers.dev", health: "/api/health" },
    { id: "tetra-hub", url: "https://tetra-hub.trimtab-signal.workers.dev", health: "/api/health" },
  ],
};

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-P31-Client",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30, s-maxage=30",
      ...corsHeaders(origin),
    },
  });
}

async function probeOne(probe: (typeof PROBES)[0]): Promise<{ id: string; ok: boolean; status?: number; ms?: number; error?: string }> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(probe.url, {
      method: "HEAD",
      signal: ctrl.signal,
      headers: { "X-P31-Client": "ecosystem-bridge/1.0.0" },
    });
    clearTimeout(timer);
    const expect = probe.expect ?? 200;
    return { id: probe.id, ok: r.status < 400 || r.status === expect, status: r.status, ms: Date.now() - start };
  } catch (e: unknown) {
    return { id: probe.id, ok: false, ms: Date.now() - start, error: e instanceof Error ? e.message : "unknown" };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    switch (url.pathname) {
      case "/health":
        return json({
          ok: true,
          worker: "p31-ecosystem-bridge",
          version: env.WORKER_VERSION,
          environment: env.ENVIRONMENT,
          ts: new Date().toISOString(),
        }, 200, origin);

      case "/api/sync":
        return json(SYNC_PAYLOAD, 200, origin);

      case "/api/fleet":
        return json(FLEET_SUMMARY, 200, origin);

      case "/api/status": {
        const results = await Promise.allSettled(PROBES.map(probeOne));
        const probeResults = results.map((r) => (r.status === "fulfilled" ? r.value : { id: "unknown", ok: false, error: "rejected" }));
        const allOk = probeResults.every((p) => p.ok);
        const downCount = probeResults.filter((p) => !p.ok).length;
        return json({
          ok: allOk,
          status: allOk ? "green" : downCount > 2 ? "red" : "yellow",
          probes: probeResults,
          ts: new Date().toISOString(),
          worker: "p31-ecosystem-bridge",
        }, 200, origin);
      }

      default:
        return json({ error: "Not found", paths: ["/health", "/api/sync", "/api/status", "/api/fleet"] }, 404, origin);
    }
  },
};
