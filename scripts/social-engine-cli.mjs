#!/usr/bin/env node
/**
 * Read-only operator CLI for the deployed P31 social engine.
 * Only hits documented endpoints (worker.js handleRequest):
 *   GET  /              health + endpoint catalog
 *   GET  /status        platform secret presence (no values)
 *   GET  /waves         wave catalog + flags
 *   POST /preflight     run link health check (no platform posts)
 *
 * Never triggers a wave or broadcast — those are operator decisions.
 *
 * Default host: social.p31ca.org → workers.dev fallback when zone route is down.
 * Override:  P31_SOCIAL_HOST=https://social.example
 *            P31_SOCIAL_FORCE_WORKERS_DEV=1 (skip zone route attempt)
 */
const PRIMARY = process.env.P31_SOCIAL_HOST || "https://social.p31ca.org";
const WORKERS_DEV = "https://p31-social-worker.trimtab-signal.workers.dev";
const FORCE_DEV = process.env.P31_SOCIAL_FORCE_WORKERS_DEV === "1";

const cmd = process.argv[2] || "health";

const ROUTES = {
  health: { method: "GET", path: "/" },
  status: { method: "GET", path: "/status" },
  waves: { method: "GET", path: "/waves" },
  preflight: { method: "POST", path: "/preflight" },
};

if (!ROUTES[cmd]) {
  console.error(
    `social-engine-cli: unknown command "${cmd}"\n` +
      "  usage: node scripts/social-engine-cli.mjs [health|status|waves|preflight]",
  );
  process.exit(2);
}

async function tryHost(host) {
  const r = ROUTES[cmd];
  const url = host.replace(/\/$/, "") + r.path;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: r.method,
      headers: { Accept: "application/json,*/*" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text, url };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e?.message || String(e), url };
  }
}

async function main() {
  const hosts = FORCE_DEV ? [WORKERS_DEV] : [PRIMARY, WORKERS_DEV];
  let lastErr = null;
  for (const host of hosts) {
    const r = await tryHost(host);
    if (r.ok) {
      console.log(`# ${cmd} ← ${r.url}  (HTTP ${r.status})\n`);
      try {
        const json = JSON.parse(r.body);
        console.log(JSON.stringify(json, null, 2));
      } catch {
        console.log(r.body);
      }
      process.exit(0);
    }
    lastErr = r;
    console.error(
      `# ${cmd} ← ${r.url} → ${r.status ? "HTTP " + r.status : "FAIL"} ${r.error || ""}`,
    );
  }
  console.error(
    "\nsocial-engine-cli: all hosts failed — confirm worker is deployed (npx wrangler deploy in andromeda/04_SOFTWARE/cloudflare-worker/social-drop-automation).",
  );
  process.exit(1);
}

main();
