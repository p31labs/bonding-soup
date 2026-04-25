/**
 * WCD-33 — Global Archive Worker
 * GET  /api/archive     — posners, highlights, totalSyntheses, lastUpdate
 * POST /api/synthesis   — { "increment": number } (bounded)
 * POST /api/highlight  — one sanitized community record
 *
 * Security: optional CORS allowlist (env.ARCHIVE_CORS_ALLOW), Cloudflare Rate Limit bindings.
 */

/** Bound via [[ratelimits]] in wrangler.toml */
interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

const STATE_KEY = "soup:archive:state";
const MAX_HIGHLIGHTS = 50;
const MAX_POSNERS = 20;
const MAX_INCREMENT = 500;
const MAX_BODY = 32_000;

export interface Env {
  ARCHIVE_KV: KVNamespace;
  /** Comma-separated exact origins. Empty = Access-Control-Allow-Origin: * (dev). Set for production. */
  ARCHIVE_CORS_ALLOW?: string;
  RL_READ: RateLimitBinding;
  RL_SYNTHESIS: RateLimitBinding;
  RL_HIGHLIGHT: RateLimitBinding;
}

type RemoteKind = "posner" | "highlight";

export interface RemoteMolecule {
  id: string;
  name: string;
  elementTally: Record<string, number>;
  personality: string;
  zone: string;
  emotionalContext: string;
  significance: number;
  creationTime: number;
  generation?: number;
  kind: RemoteKind;
  creatorLabel: string;
}

type ArchiveState = {
  totalSyntheses: number;
  lastUpdate: number;
  highlights: RemoteMolecule[];
  posners: RemoteMolecule[];
};

const emptyState = (): ArchiveState => ({
  totalSyntheses: 0,
  lastUpdate: Date.now(),
  highlights: [],
  posners: [],
});

function allowList(env: Env): string[] {
  return (env.ARCHIVE_CORS_ALLOW || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function readState(env: Env): Promise<ArchiveState> {
  const raw = await env.ARCHIVE_KV.get(STATE_KEY, "text");
  if (!raw) return emptyState();
  try {
    const o = JSON.parse(raw) as ArchiveState;
    if (typeof o.totalSyntheses !== "number" || !Array.isArray(o.highlights) || !Array.isArray(o.posners)) {
      return emptyState();
    }
    return o;
  } catch {
    return emptyState();
  }
}

async function writeState(env: Env, s: ArchiveState): Promise<void> {
  s.lastUpdate = Date.now();
  await env.ARCHIVE_KV.put(STATE_KEY, JSON.stringify(s));
}

function corsHeaders(env: Env, req: Request): Record<string, string> {
  const list = allowList(env);
  const origin = req.headers.get("Origin");
  let allow = "*";
  if (list.length > 0) {
    if (origin && list.includes(origin)) {
      allow = origin;
    } else if (!origin) {
      allow = "*";
    } else {
      allow = "null";
    }
  }
  const h: Record<string, string> = {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (list.length > 0) {
    h.Vary = "Origin";
  }
  return h;
}

function json(data: unknown, env: Env, req: Request, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, req),
    },
  });
}

/** Reject body for wrong browser origin when allow list is active. */
function forbiddenOriginResponse(): Response {
  return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
    status: 403,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** JSON lines for Cloudflare log search: filter `service == wcd33` */
function wcd33log(
  req: Request,
  type: "cors_denied" | "rate_limited",
  detail: { path: string; origin?: string; rlRoute?: "read" | "synthesis" | "highlight"; rlKey?: string }
): void {
  const line = {
    service: "wcd33",
    type,
    method: req.method,
    path: detail.path,
    origin: detail.origin,
    rlRoute: detail.rlRoute,
    rlKey: detail.rlKey,
    ts: Date.now(),
  };
  console.log(JSON.stringify(line));
}

function clientKey(req: Request): string {
  const cf = req.headers.get("CF-Connecting-IP");
  if (cf) return cf;
  const xff = req.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

async function enforceLimit(
  limiter: RateLimitBinding,
  key: string,
  env: Env,
  req: Request,
  path: string,
  rlRoute: "read" | "synthesis" | "highlight"
): Promise<Response | null> {
  const { success } = await limiter.limit({ key });
  if (success) return null;
  wcd33log(req, "rate_limited", { path, rlRoute, rlKey: key });
  return json({ error: "rate_limited", message: "Too many requests; try again shortly." }, env, req, 429);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function clampStr(s: unknown, max: number, fallback: string): string {
  if (typeof s !== "string") return fallback;
  return s.length > max ? s.slice(0, max) : fallback;
}

function validElementTally(t: unknown): Record<string, number> | null {
  if (!isRecord(t)) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(t)) {
    if (!/^[A-Za-z0-9]{1,3}$/.test(k)) return null;
    if (typeof v !== "number" || v < 0 || v > 5_000 || !Number.isFinite(v) || v !== Math.floor(v)) return null;
    out[k] = v;
  }
  let sum = 0;
  for (const n of Object.values(out)) sum += n;
  if (sum > 2_000) return null;
  if (Object.keys(out).length > 20) return null;
  return out;
}

function parseHighlight(a: unknown): RemoteMolecule | null {
  if (!isRecord(a)) return null;
  const id = clampStr(a.id, 64, "");
  if (!/^[A-Za-z0-9_\-:]{8,64}$/.test(id)) return null;
  const kind = a.kind;
  if (kind !== "posner" && kind !== "highlight") return null;
  const tally = validElementTally(a.elementTally);
  if (!tally) return null;
  const sig = a.significance;
  if (typeof sig !== "number" || sig < 0 || sig > 1) return null;
  const creationTime = a.creationTime;
  if (typeof creationTime !== "number" || creationTime < 0 || creationTime > Date.now() + 86_400_000) {
    return null;
  }
  const gen = a.generation;
  if (gen !== undefined && (typeof gen !== "number" || gen < 0 || gen > 1_000_000)) return null;
  return {
    id,
    name: clampStr(a.name, 100, "Molecule"),
    elementTally: tally,
    personality: clampStr(a.personality, 32, "fuel"),
    zone: clampStr(a.zone, 32, "unknown"),
    emotionalContext: clampStr(a.emotionalContext, 300, ""),
    significance: sig,
    creationTime,
    generation: gen as number | undefined,
    kind,
    creatorLabel: clampStr(a.creatorLabel, 40, "Anonymous"),
  };
}

function mergeUnique(list: RemoteMolecule[], item: RemoteMolecule, max: number): void {
  const i = list.findIndex((m) => m.id === item.id);
  if (i >= 0) list[i] = item;
  else {
    list.unshift(item);
    if (list.length > max) list.length = max;
  }
  list.sort((a, b) => b.significance - a.significance || b.creationTime - a.creationTime);
}

const handler: ExportedHandler<Env> = {
  async fetch(request, env) {
    const u = new URL(request.url);

    const list = allowList(env);
    const origin = request.headers.get("Origin");
    if (list.length > 0 && origin && !list.includes(origin)) {
      wcd33log(request, "cors_denied", { path: u.pathname, origin });
      return forbiddenOriginResponse();
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    if (request.method === "GET" && (u.pathname === "/" || u.pathname === "")) {
      return json(
        {
          service: "wcd33-soup-global-archive",
          get: "GET /api/archive",
          post: ["POST /api/synthesis { increment }", "POST /api/highlight { record }"],
          ratelimits: { read: "200/60s", synthesis: "20/60s", highlight: "30/60s", scope: "per IP per colo" },
        },
        env,
        request
      );
    }

    if (request.method === "GET" && u.pathname === "/api/archive") {
      const key = `read:${clientKey(request)}`;
      const blocked = await enforceLimit(env.RL_READ, key, env, request, u.pathname, "read");
      if (blocked) return blocked;
      const s = await readState(env);
      return json(
        {
          totalSyntheses: s.totalSyntheses,
          lastUpdate: s.lastUpdate,
          communityHighlights: s.highlights,
          posnerMolecules: s.posners,
        },
        env,
        request
      );
    }

    if (request.method === "POST" && u.pathname === "/api/synthesis") {
      const key = `syn:${clientKey(request)}`;
      const blocked = await enforceLimit(env.RL_SYNTHESIS, key, env, request, u.pathname, "synthesis");
      if (blocked) return blocked;

      let body: unknown;
      try {
        const text = await request.text();
        if (text.length > 512) {
          return json({ error: "body too large" }, env, request, 400);
        }
        body = text ? JSON.parse(text) : {};
      } catch {
        return json({ error: "invalid json" }, env, request, 400);
      }
      if (!isRecord(body)) {
        return json({ error: "invalid body" }, env, request, 400);
      }
      const inc = body.increment;
      if (typeof inc !== "number" || !Number.isFinite(inc) || inc < 0) {
        return json({ error: "increment must be a non-negative number" }, env, request, 400);
      }
      const n = Math.min(Math.floor(inc), MAX_INCREMENT);
      const s = await readState(env);
      s.totalSyntheses = Math.min(2 ** 50, s.totalSyntheses + n);
      await writeState(env, s);
      return json({ ok: true, totalSyntheses: s.totalSyntheses, lastUpdate: s.lastUpdate }, env, request);
    }

    if (request.method === "POST" && u.pathname === "/api/highlight") {
      const key = `hi:${clientKey(request)}`;
      const blocked = await enforceLimit(env.RL_HIGHLIGHT, key, env, request, u.pathname, "highlight");
      if (blocked) return blocked;

      let text = "";
      try {
        text = await request.text();
      } catch {
        return json({ error: "read error" }, env, request, 400);
      }
      if (text.length > MAX_BODY) {
        return json({ error: "body too large" }, env, request, 400);
      }
      let body: unknown;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        return json({ error: "invalid json" }, env, request, 400);
      }
      if (!isRecord(body)) {
        return json({ error: "object expected" }, env, request, 400);
      }
      const rec = parseHighlight(body);
      if (!rec) {
        return json({ error: "invalid record" }, env, request, 400);
      }
      const s = await readState(env);
      if (rec.kind === "posner") {
        mergeUnique(s.posners, rec, MAX_POSNERS);
      } else {
        mergeUnique(s.highlights, rec, MAX_HIGHLIGHTS);
      }
      await writeState(env, s);
      return json({ ok: true, lastUpdate: s.lastUpdate }, env, request);
    }

    return json({ error: "not found" }, env, request, 404);
  },
};

export default handler;
