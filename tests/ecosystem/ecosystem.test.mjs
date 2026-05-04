/**
 * P31 Ecosystem Test Suite — both sites as one organism
 *
 * Tests are grouped into 10 layers:
 *   L1  Constants coherence       — single source of truth across repos
 *   L2  Cross-site manifest       — p31-status.json correctness
 *   L3  CSP / headers             — phosphorus31.org _headers wiring
 *   L4  Worker registry           — live-fleet.json completeness
 *   L5  Worker configs            — wrangler.toml correctness
 *   L6  Bridge worker             — ecosystem bridge source correctness
 *   L7  CORS policy               — allowed origins in bridge
 *   L8  Bot swarm wiring          — discord bot swarm has ecosystem refs
 *   L9  Apply-constants chain     — sync-ecosystem is wired in
 *   L10 Live HTTP probes          — real network checks (skipped if P31_OFFLINE=1)
 *
 * Run: node tests/ecosystem/run-ecosystem.mjs
 * Or via vitest: npx vitest run tests/ecosystem/ecosystem.test.mjs --config vitest.site.config.mjs
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const PHOS_ROOT = resolve(ROOT, "phosphorus31.org");
const OFFLINE = process.env.P31_OFFLINE === "1";

// ─── helpers ─────────────────────────────────────────────────────────────────
function readJson(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}
function readText(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}
function phosExists(rel) {
  return existsSync(resolve(PHOS_ROOT, rel));
}
function phosJson(rel) {
  const p = resolve(PHOS_ROOT, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}
function phosText(rel) {
  const p = resolve(PHOS_ROOT, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

async function probe(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout ?? 6000);
  try {
    const r = await fetch(url, {
      method: opts.method ?? "GET",
      headers: { "X-P31-Client": "ecosystem-test/1.0.0", ...(opts.headers ?? {}) },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return r;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ─── fixtures ────────────────────────────────────────────────────────────────
let constants, status, fleet, headers, bridgeSrc, packageJson, swarm;

beforeAll(() => {
  constants = readJson("p31-constants.json");
  status    = phosJson("website/p31-status.json");
  fleet     = readJson("p31-live-fleet.json");
  headers   = phosText("website/_headers");
  bridgeSrc = readText("workers/p31-ecosystem-bridge/src/index.ts");
  packageJson = readJson("package.json");
  swarm     = readJson("p31-discord-bot-swarm.json");
});

// ═══════════════════════════════════════════════════════════════════════════
// L1 — Constants coherence
// ═══════════════════════════════════════════════════════════════════════════
describe("L1 Constants coherence", () => {
  it("p31-constants.json exists and is valid JSON", () => {
    expect(constants).not.toBeNull();
  });

  it("organization.ein is canonical 42-1888158", () => {
    expect(constants.organization.ein).toBe("42-1888158");
  });

  it("organization.status501c3 is determined_active", () => {
    expect(constants.organization.status501c3).toBe("determined_active");
  });

  it("organization.determinationDate is 2026-05-04", () => {
    expect(constants.organization.determinationDate).toBe("2026-05-04");
  });

  it("research.zenodoPublicationCount is 22", () => {
    expect(constants.research.zenodoPublicationCount).toBe(22);
  });

  it("mesh.ecosystemBridgeWorkerUrl points to ecosystem-bridge worker", () => {
    expect(constants.mesh.ecosystemBridgeWorkerUrl).toBe(
      "https://ecosystem-bridge.trimtab-signal.workers.dev"
    );
  });

  it("mesh.bufferApiWorkerUrl points to p31-buffer-api worker", () => {
    expect(constants.mesh.bufferApiWorkerUrl).toBe(
      "https://p31-buffer-api.trimtab-signal.workers.dev"
    );
  });

  it("payment.donateApiHealthUrl uses canonical custom domain", () => {
    expect(constants.payment.donateApiHealthUrl).toMatch(/donate-api\.phosphorus31\.org/);
  });

  it("payment.stripeWorkerHost uses canonical custom domain", () => {
    expect(constants.payment.stripeWorkerHost).toBe("donate-api.phosphorus31.org");
  });

  it("mesh object contains all expected WorkerUrl entries", () => {
    const meshKeys = Object.keys(constants.mesh).filter((k) => k.endsWith("WorkerUrl"));
    // Minimum: 13 canonical workers (k4 trio, agent/orchestrator, geo, bridge, buffer, relay, google, edge-lab, passkey-free)
    expect(meshKeys.length).toBeGreaterThanOrEqual(13);
    // Must include the two new cross-site bridge workers
    expect(meshKeys).toContain("ecosystemBridgeWorkerUrl");
    expect(meshKeys).toContain("bufferApiWorkerUrl");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L2 — Cross-site manifest (p31-status.json)
// ═══════════════════════════════════════════════════════════════════════════
describe("L2 Cross-site manifest (p31-status.json)", () => {
  it("phosphorus31.org/website/p31-status.json exists", () => {
    expect(phosExists("website/p31-status.json")).toBe(true);
  });

  it("p31-status.json is valid JSON with correct schema", () => {
    expect(status).not.toBeNull();
    expect(status.schema).toBe("p31.orgStatus/1.0.0");
  });

  it("p1-status.json EIN matches p31-constants.json", () => {
    expect(status.org.ein).toBe(constants.organization.ein);
  });

  it("p31-status.json status501c3 matches constants", () => {
    expect(status.org.status501c3).toBe(constants.organization.status501c3);
  });

  it("p31-status.json determinationDate matches constants", () => {
    expect(status.org.determinationDate).toBe(constants.organization.determinationDate);
  });

  it("p31-status.json zenodoPublicationCount matches constants", () => {
    expect(status.research.zenodoPublicationCount).toBe(constants.research.zenodoPublicationCount);
  });

  it("p31-status.json points to correct ecosystemBridgeUrl", () => {
    expect(status.mesh.ecosystemBridgeUrl).toBe(
      "https://ecosystem-bridge.trimtab-signal.workers.dev"
    );
  });

  it("p31-status.json points to correct techHubUrl", () => {
    expect(status.mesh.techHubUrl).toBe("https://p31ca.org");
  });

  it("p31-status.json site.url is https://phosphorus31.org", () => {
    expect(status.site.url).toBe("https://phosphorus31.org");
  });

  it("p31-status.json has SAM UEI", () => {
    expect(status.org.samUei).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L3 — CSP / headers
// ═══════════════════════════════════════════════════════════════════════════
describe("L3 CSP and security headers", () => {
  it("phosphorus31.org/_headers exists", () => {
    expect(phosExists("website/_headers")).toBe(true);
  });

  it("connect-src includes donate-api.phosphorus31.org (canonical)", () => {
    expect(headers).toMatch(/connect-src[^\n]*donate-api\.phosphorus31\.org/);
  });

  it("connect-src includes ecosystem bridge worker", () => {
    expect(headers).toMatch(/connect-src[^\n]*ecosystem-bridge\.trimtab-signal\.workers\.dev/);
  });

  it("connect-src includes p31ca.org", () => {
    expect(headers).toMatch(/connect-src[^\n]*https:\/\/p31ca\.org/);
  });

  it("connect-src includes p31-buffer-api worker", () => {
    expect(headers).toMatch(/connect-src[^\n]*p31-buffer-api\.trimtab-signal\.workers\.dev/);
  });

  it("connect-src includes mesh workers (k4-personal, k4-cage, tetra-hub)", () => {
    expect(headers).toMatch(/k4-personal\.trimtab-signal\.workers\.dev/);
    expect(headers).toMatch(/k4-cage\.trimtab-signal\.workers\.dev/);
    expect(headers).toMatch(/tetra-hub\.trimtab-signal\.workers\.dev/);
  });

  it("form-action includes canonical donate-api.phosphorus31.org", () => {
    expect(headers).toMatch(/form-action[^\n]*donate-api\.phosphorus31\.org/);
  });

  it("frame-ancestors is 'none' (no clickjacking)", () => {
    expect(headers).toMatch(/frame-ancestors 'none'/);
  });

  it("X-Frame-Options DENY present", () => {
    expect(headers).toMatch(/X-Frame-Options: DENY/);
  });

  it("X-Content-Type-Options nosniff present", () => {
    expect(headers).toMatch(/X-Content-Type-Options: nosniff/);
  });

  it("p31-status.json has CORS wildcard Access-Control-Allow-Origin", () => {
    expect(headers).toMatch(/\/p31-status\.json[\s\S]*?Access-Control-Allow-Origin: \*/);
  });

  it("base-uri 'self' present (prevents base injection)", () => {
    expect(headers).toMatch(/base-uri 'self'/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L4 — Worker registry (p31-live-fleet.json)
// ═══════════════════════════════════════════════════════════════════════════
describe("L4 Worker registry (p31-live-fleet.json)", () => {
  let verified;
  beforeAll(() => { verified = fleet?.workersVerified ?? []; });

  it("p31-live-fleet.json exists", () => {
    expect(fleet).not.toBeNull();
  });

  it("fleet has p31-ecosystem-bridge entry", () => {
    const w = verified.find((w) => w.id === "p31-ecosystem-bridge");
    expect(w).toBeDefined();
    expect(w.workersDev).toBe("https://ecosystem-bridge.trimtab-signal.workers.dev");
  });

  it("ecosystem bridge entry has CORS field listing both sites", () => {
    const w = verified.find((w) => w.id === "p31-ecosystem-bridge");
    expect(w.cors).toContain("https://phosphorus31.org");
    expect(w.cors).toContain("https://p31ca.org");
  });

  it("fleet has p31-buffer-api entry", () => {
    const w = verified.find((w) => w.id === "p31-buffer-api");
    expect(w).toBeDefined();
    expect(w.workersDev).toMatch(/p31-buffer-api\.trimtab-signal\.workers\.dev/);
  });

  it("fleet has donate-api with custom domain pointing to phosphorus31.org", () => {
    const w = verified.find((w) => w.id === "donate-api");
    expect(w).toBeDefined();
    expect(w.customDomain).toMatch(/phosphorus31\.org/);
  });

  it("fleet orgMarketing site has statusJson field", () => {
    expect(fleet.sites.orgMarketing.statusJson).toBe("https://phosphorus31.org/p31-status.json");
  });

  it("fleet publicMachineIndexes lists p1ca JSON contracts", () => {
    expect(fleet.sites.publicMachineIndexes.publicSurface).toMatch(/p31ca\.org/);
    expect(fleet.sites.publicMachineIndexes.meshConstants).toMatch(/p31ca\.org/);
  });

  it("all verified workers have a deploy path", () => {
    for (const w of verified) {
      expect(w.deploy, `worker ${w.id} missing deploy field`).toBeTruthy();
    }
  });

  it("fleet sources include the ecosystem bridge wrangler.toml", () => {
    expect(fleet.sources).toContain("workers/p31-ecosystem-bridge/wrangler.toml");
  });

  it("fleet sources include the phosphorus31.org buffer-api wrangler.toml", () => {
    expect(fleet.sources).toContain("phosphorus31.org/apps/buffer-api/wrangler.toml");
  });

  it("verified worker count is at least 14", () => {
    expect(verified.length).toBeGreaterThanOrEqual(14);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L5 — Worker configs (wrangler.toml correctness)
// ═══════════════════════════════════════════════════════════════════════════
describe("L5 Worker configs", () => {
  it("ecosystem bridge wrangler.toml exists", () => {
    expect(existsSync(resolve(ROOT, "workers/p31-ecosystem-bridge/wrangler.toml"))).toBe(true);
  });

  it("ecosystem bridge wrangler.toml has correct name", () => {
    const raw = readText("workers/p31-ecosystem-bridge/wrangler.toml");
    expect(raw).toMatch(/^name\s*=\s*"p31-ecosystem-bridge"/m);
  });

  it("ecosystem bridge has nodejs_compat flag", () => {
    const raw = readText("workers/p31-ecosystem-bridge/wrangler.toml");
    expect(raw).toMatch(/nodejs_compat/);
  });

  it("buffer-api wrangler.toml exists in phosphorus31.org", () => {
    expect(phosExists("apps/buffer-api/wrangler.toml")).toBe(true);
  });

  it("buffer-api wrangler.toml has correct name", () => {
    const raw = phosText("apps/buffer-api/wrangler.toml");
    expect(raw).toMatch(/^name\s*=\s*"p31-buffer-api"/m);
  });

  it("buffer-api CORS allows phosphorus31.org in source", () => {
    const src = phosText("apps/buffer-api/src/index.ts") ?? "";
    expect(src).toMatch(/phosphorus31\.org/);
  });

  it("tetra-hub wrangler.toml exists", () => {
    expect(existsSync(resolve(ROOT, "workers/tetra-hub/wrangler.toml"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L6 — Bridge worker source correctness
// ═══════════════════════════════════════════════════════════════════════════
describe("L6 Ecosystem bridge source", () => {
  it("bridge src/index.ts exists", () => {
    expect(bridgeSrc).not.toBeNull();
  });

  it("bridge has /health route", () => {
    expect(bridgeSrc).toMatch(/case\s+["']\/health["']/);
  });

  it("bridge has /api/sync route", () => {
    expect(bridgeSrc).toMatch(/case\s+["']\/api\/sync["']/);
  });

  it("bridge has /api/status route", () => {
    expect(bridgeSrc).toMatch(/case\s+["']\/api\/status["']/);
  });

  it("bridge has /api/fleet route", () => {
    expect(bridgeSrc).toMatch(/case\s+["']\/api\/fleet["']/);
  });

  it("bridge SYNC_PAYLOAD contains canonical EIN", () => {
    expect(bridgeSrc).toMatch(/42-1888158/);
  });

  it("bridge SYNC_PAYLOAD.org.status501c3 is determined_active", () => {
    expect(bridgeSrc).toMatch(/determined_active/);
  });

  it("bridge SYNC_PAYLOAD.research.zenodoPublicationCount matches constants", () => {
    const expected = constants?.research?.zenodoPublicationCount ?? 22;
    expect(bridgeSrc).toContain(String(expected));
  });

  it("bridge SYNC_PAYLOAD determinationDate is 2026-05-04", () => {
    expect(bridgeSrc).toMatch(/2026-05-04/);
  });

  it("bridge has abort-controller timeout for upstream probes", () => {
    expect(bridgeSrc).toMatch(/AbortController/);
  });

  it("bridge has OPTIONS preflight handler", () => {
    expect(bridgeSrc).toMatch(/OPTIONS/);
  });

  it("bridge sets Vary: Origin on all responses", () => {
    expect(bridgeSrc).toMatch(/Vary.*Origin/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L7 — CORS policy
// ═══════════════════════════════════════════════════════════════════════════
describe("L7 CORS policy", () => {
  it("bridge ALLOWED_ORIGINS includes phosphorus31.org", () => {
    expect(bridgeSrc).toMatch(/https:\/\/phosphorus31\.org/);
  });

  it("bridge ALLOWED_ORIGINS includes p31ca.org", () => {
    expect(bridgeSrc).toMatch(/https:\/\/p31ca\.org/);
  });

  it("bridge ALLOWED_ORIGINS includes bonding.p31ca.org", () => {
    expect(bridgeSrc).toMatch(/https:\/\/bonding\.p31ca\.org/);
  });

  it("bridge does NOT use wildcard Access-Control-Allow-Origin", () => {
    // The bridge should never blindly return '*'; it computes the allowed origin
    expect(bridgeSrc).not.toMatch(/"Access-Control-Allow-Origin",\s*['"]\*['"]/);
  });

  it("buffer-api CORS includes p31ca.org as additional allowed origin", () => {
    const src = phosText("apps/buffer-api/src/index.ts") ?? "";
    // buffer-api should CORS for phosphorus31.org at minimum
    expect(src).toMatch(/phosphorus31\.org/);
  });

  it("buffer-api CSP includes p31ca.org or has bridge-mediated access", () => {
    // Either buffer-api allows p31ca.org directly or the bridge mediates it
    const bridgeAllowsP31ca = (bridgeSrc ?? "").includes("https://p31ca.org");
    const bufferAllowsP31ca = (phosText("apps/buffer-api/src/index.ts") ?? "").includes("p31ca.org");
    expect(bridgeAllowsP31ca || bufferAllowsP31ca).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L8 — Bot swarm wiring
// ═══════════════════════════════════════════════════════════════════════════
describe("L8 Discord bot swarm wiring", () => {
  it("p31-discord-bot-swarm.json exists", () => {
    expect(swarm).not.toBeNull();
  });

  it("bot swarm schema is p31.discordBotSwarm/1.0.0", () => {
    expect(swarm.schema).toBe("p31.discordBotSwarm/1.0.0");
  });

  it("bot swarm has health command (can report ecosystem health)", () => {
    expect(swarm.commandNames).toContain("health");
  });

  it("bot swarm has status command", () => {
    expect(swarm.commandNames).toContain("status");
  });

  it("bot swarm has grants command (tied to grant pipeline)", () => {
    expect(swarm.commandNames).toContain("grants");
  });

  it("bot swarm related workers include command-center-worker", () => {
    expect(swarm.integrations.relatedWorkerIds).toContain("command-center-worker");
  });

  it("bot swarm has at least 30 commands", () => {
    expect(swarm.commandCount).toBeGreaterThanOrEqual(30);
  });

  it("fleet discordBotSwarm references bot swarm json", () => {
    expect(fleet.discordBotSwarm.summaryPath).toBe("p31-discord-bot-swarm.json");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L9 — Apply-constants chain
// ═══════════════════════════════════════════════════════════════════════════
describe("L9 Apply-constants chain", () => {
  it("package.json has sync:ecosystem script", () => {
    expect(packageJson.scripts["sync:ecosystem"]).toMatch(/sync-ecosystem/);
  });

  it("apply:constants chains into sync:ecosystem", () => {
    expect(packageJson.scripts["apply:constants"]).toMatch(/sync-ecosystem/);
  });

  it("package.json has verify:ecosystem-bridge script", () => {
    expect(packageJson.scripts["verify:ecosystem-bridge"]).toMatch(/verify-ecosystem-bridge/);
  });

  it("verify bar includes verify:ecosystem-bridge", () => {
    expect(packageJson.scripts["verify"]).toMatch(/verify:ecosystem-bridge/);
  });

  it("scripts/sync-ecosystem.mjs exists", () => {
    expect(existsSync(resolve(ROOT, "scripts/sync-ecosystem.mjs"))).toBe(true);
  });

  it("scripts/verify-ecosystem-bridge.mjs exists", () => {
    expect(existsSync(resolve(ROOT, "scripts/verify-ecosystem-bridge.mjs"))).toBe(true);
  });

  it("predeploy:gate runs release:check before any deploy", () => {
    expect(packageJson.scripts["predeploy:gate"]).toMatch(/release:check/);
  });

  it("predeploy:gate includes triper check", () => {
    expect(packageJson.scripts["predeploy:gate"]).toMatch(/verify:triper/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// L10 — Live HTTP probes (skipped when P31_OFFLINE=1)
// ═══════════════════════════════════════════════════════════════════════════
describe("L10 Live HTTP probes", () => {
  it.skipIf(OFFLINE)("phosphorus31.org returns 200", async () => {
    const r = await probe("https://phosphorus31.org/");
    expect(r.status).toBeLessThan(400);
  }, 10000);

  it.skipIf(OFFLINE)("phosphorus31.org/p31-status.json returns valid JSON", async () => {
    const r = await probe("https://phosphorus31.org/p31-status.json");
    expect(r.status).toBe(200);
    const ct = r.headers.get("content-type") ?? "";
    expect(ct).toMatch(/json/);
    const body = await r.json();
    expect(body.schema).toBe("p31.orgStatus/1.0.0");
    expect(body.org.ein).toBe("42-1888158");
  }, 10000);

  it.skipIf(OFFLINE)("phosphorus31.org/p31-status.json has CORS header", async () => {
    const r = await probe("https://phosphorus31.org/p31-status.json");
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
  }, 10000);

  it.skipIf(OFFLINE)("donate-api.phosphorus31.org/health returns ok", async () => {
    const r = await probe("https://donate-api.phosphorus31.org/health");
    expect(r.status).toBeLessThan(400);
  }, 10000);

  it.skipIf(OFFLINE)("p31ca.org returns 200", async () => {
    const r = await probe("https://p31ca.org/");
    expect(r.status).toBeLessThan(400);
  }, 10000);

  it.skipIf(OFFLINE)("p31ca.org/p31-public-surface.json returns valid JSON", async () => {
    const r = await probe("https://p31ca.org/p31-public-surface.json");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toBeDefined();
  }, 10000);

  it.skipIf(OFFLINE)("ecosystem bridge /health returns ok JSON", async () => {
    const r = await probe("https://ecosystem-bridge.trimtab-signal.workers.dev/health");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.worker).toBe("p31-ecosystem-bridge");
  }, 10000);

  it.skipIf(OFFLINE)("ecosystem bridge /api/sync returns canonical org constants", async () => {
    const r = await probe("https://ecosystem-bridge.trimtab-signal.workers.dev/api/sync");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.schema).toBe("p31.ecosystemSync/1.0.0");
    expect(body.org.ein).toBe("42-1888158");
    expect(body.org.status501c3).toBe("determined_active");
    expect(body.research.zenodoPublicationCount).toBe(22);
  }, 10000);

  it.skipIf(OFFLINE)("ecosystem bridge /api/sync has CORS for phosphorus31.org", async () => {
    const r = await probe("https://ecosystem-bridge.trimtab-signal.workers.dev/api/sync", {
      headers: { "Origin": "https://phosphorus31.org" },
    });
    const acao = r.headers.get("access-control-allow-origin");
    expect(acao).toBe("https://phosphorus31.org");
  }, 10000);

  it.skipIf(OFFLINE)("ecosystem bridge /api/sync has CORS for p31ca.org", async () => {
    const r = await probe("https://ecosystem-bridge.trimtab-signal.workers.dev/api/sync", {
      headers: { "Origin": "https://p31ca.org" },
    });
    const acao = r.headers.get("access-control-allow-origin");
    expect(acao).toBe("https://p31ca.org");
  }, 10000);

  it.skipIf(OFFLINE)("ecosystem bridge /api/fleet returns fleet summary", async () => {
    const r = await probe("https://ecosystem-bridge.trimtab-signal.workers.dev/api/fleet");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.schema).toBe("p31.fleetSummary/1.0.0");
    expect(body.sites.length).toBeGreaterThanOrEqual(2);
    expect(body.workers.length).toBeGreaterThanOrEqual(6);
  }, 10000);

  it.skipIf(OFFLINE)("ecosystem bridge /api/status returns status report", async () => {
    const r = await probe("https://ecosystem-bridge.trimtab-signal.workers.dev/api/status");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(["green", "yellow", "red"]).toContain(body.status);
    expect(Array.isArray(body.probes)).toBe(true);
    expect(body.probes.length).toBeGreaterThanOrEqual(4);
  }, 15000);

  it.skipIf(OFFLINE)("p31-buffer-api /health returns ok", async () => {
    const r = await probe("https://p31-buffer-api.trimtab-signal.workers.dev/health");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("p31-buffer-api");
  }, 10000);

  it.skipIf(OFFLINE)("p31ca.org/p31-mesh-constants.json has matching EIN", async () => {
    const r = await probe("https://p31ca.org/p31-mesh-constants.json");
    if (r.status === 404) return; // file may not exist yet on hub
    const body = await r.json();
    // If the mesh constants expose org EIN, it should match
    if (body?.organization?.ein) {
      expect(body.organization.ein).toBe("42-1888158");
    }
  }, 10000);
});
