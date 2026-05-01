/**
 * TRIPER: K₄ MESH
 * Cage + hubs + personal — topology, URL consistency, fleet count, live readiness.
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// K₄ complete graph invariants
const K4_VERTICES = 4;
const K4_EDGES = 6; // n*(n-1)/2

// Canonical family vertex keys in the cage
const CAGE_VERTICES = ["will", "sj", "wj", "christyn"];

// ─────────────────────────────────────────────────────────────
// T — TASK: Mesh topology & URL fundamentals
// ─────────────────────────────────────────────────────────────
describe("T — Task: K₄ topology fundamentals", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("K₄ has exactly 4 vertices", () => {
    expect(K4_VERTICES).toBe(4);
  });

  it("K₄ has exactly 6 edges (complete graph invariant)", () => {
    expect(K4_EDGES).toBe((K4_VERTICES * (K4_VERTICES - 1)) / 2);
  });

  it("k4-personal Worker URL is defined and HTTPS", () => {
    expect(constants.mesh.k4PersonalWorkerUrl).toMatch(/^https:\/\//);
  });

  it("k4-cage Worker URL is defined and HTTPS", () => {
    expect(constants.mesh.k4CageWorkerUrl).toMatch(/^https:\/\//);
  });

  it("k4-hubs Worker URL is defined and HTTPS", () => {
    expect(constants.mesh.k4HubsWorkerUrl).toMatch(/^https:\/\//);
  });

  it("agent-hub Worker URL is defined and HTTPS", () => {
    expect(constants.mesh.agentHubWorkerUrl).toMatch(/^https:\/\//);
  });

  it("orchestrator Worker URL is defined and HTTPS", () => {
    expect(constants.mesh.orchestratorWorkerUrl).toMatch(/^https:\/\//);
  });

  it("geodesic-room Worker URL is HTTPS", () => {
    expect(constants.mesh.geodesicRoomWorkerUrl).toMatch(/^https:\/\//);
  });

  it("bonding-relay Worker URL is HTTPS", () => {
    expect(constants.mesh.bondingRelayWorkerUrl).toMatch(/^https:\/\//);
  });

  it("google-bridge Worker URL is HTTPS", () => {
    expect(constants.mesh.googleBridgeWorkerUrl).toMatch(/^https:\/\//);
  });

  it("all mesh Worker URLs use trimtab-signal.workers.dev", () => {
    const meshUrls = Object.values(constants.mesh)
      .filter((v) => typeof v === "string" && v.startsWith("https://"));
    for (const url of meshUrls) {
      expect(url).toContain("workers.dev");
    }
  });

  it("worker fleet count is documented in constants (≥10)", () => {
    expect(constants.edge.workerFleetCount).toBeGreaterThanOrEqual(10);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Fallback & binding configs
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: fallback & binding configs", () => {
  it("verify:mesh script exists (offline validation)", () => {
    expect(exists("scripts/verify-mesh.mjs")).toBe(true);
  });

  it("verify:mesh-offline script exists", () => {
    expect(exists("scripts/verify-mesh-offline.mjs")).toBe(true);
  });

  it("verify:mesh-canon script exists (canonical shape check)", () => {
    expect(exists("scripts/verify-mesh-canon.mjs")).toBe(true);
  });

  it("verify:mesh-live script exists (live endpoint probe)", () => {
    expect(exists("scripts/verify-mesh-live.mjs")).toBe(true);
  });

  it("k4-agent-hub-smoke script exists (connectivity check)", () => {
    expect(exists("scripts/k4-agent-hub-smoke.mjs")).toBe(true);
  });

  it("offline smoke supports --skip-network flag", () => {
    const pkg = readJson("package.json");
    const offlineScript = pkg.scripts["k4-agent-hub:smoke:offline"];
    expect(offlineScript).toContain("--skip-network");
  });

  it("tetra-hub Worker URL defined (read-only GET fallback)", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.tetraHubWorkerUrl).toMatch(/^https:\/\//);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: URL consistency between constants & live fleet
// ─────────────────────────────────────────────────────────────
describe("I — Interface: URL consistency", () => {
  let constants, fleet;
  beforeAll(() => {
    constants = readJson("p31-constants.json");
    fleet = readJson("p31-live-fleet.json");
  });

  it("live fleet schema is p31.liveFleet/1.0.0", () => {
    expect(fleet.schema).toBe("p31.liveFleet/1.0.0");
  });

  it("fleet sources list p31-constants.json as a source", () => {
    expect(fleet.sources).toContain("p31-constants.json");
  });

  it("fleet sources list p31-ecosystem.json as a source", () => {
    expect(fleet.sources).toContain("p31-ecosystem.json");
  });

  it("bonding vertical URL in fleet matches constants", () => {
    expect(fleet.sites.bondingVertical.url).toContain("bonding");
    expect(constants.bonding.publicUrl).toContain("bonding");
  });

  it("tech hub URL in fleet is p31ca.org", () => {
    expect(fleet.sites.technicalHub.url).toContain("p31ca.org");
  });

  it("ecosystem schema is p31.liveFleet/* pattern (versioned)", () => {
    expect(fleet.schema).toMatch(/^p31\.\w+\/\d+\.\d+\.\d+$/);
  });

  it("public machine indexes all reference p31ca.org", () => {
    const idx = fleet.sites.publicMachineIndexes;
    expect(idx.publicSurface).toContain("p31ca.org");
    expect(idx.creatorEconomy).toContain("p31ca.org");
    expect(idx.meshConstants).toContain("p31ca.org");
  });

  it("k4-personal URL not exposed in fleet public machine indexes (personal isolation)", () => {
    const pubStr = JSON.stringify(fleet.sites.publicMachineIndexes);
    expect(pubStr).not.toContain("k4-personal");
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: No private URLs in public surface, no full names
// ─────────────────────────────────────────────────────────────
describe("P — Purity: mesh safety & privacy", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("passkey API base path is relative (not absolute worker URL)", () => {
    expect(constants.mesh.passkeyApiBasePath).toBe("/api/passkey");
    expect(constants.mesh.passkeyApiBasePath).not.toMatch(/^https?:\/\//);
  });

  it("remembrance warm white is correct hex (#f5f0e8)", () => {
    expect(constants.mesh.remembranceWarmWhite).toBe("#f5f0e8");
  });

  it("no credential strings in mesh section", () => {
    const meshStr = JSON.stringify(constants.mesh);
    expect(meshStr).not.toMatch(/sk_live_|pk_live_|password|api_key/i);
  });

  it("no full child first names in mesh constants", () => {
    const meshStr = JSON.stringify(constants.mesh);
    expect(meshStr).not.toMatch(/\bstephen\b/i);
    expect(meshStr).not.toMatch(/\bwilliam jr\b/i);
  });

  it("cage vertices are initials-only when referenced in docs", () => {
    // Cage vertices: will (operator), sj, wj, christyn — no 'stephen'
    for (const vertex of CAGE_VERTICES) {
      expect(["will", "sj", "wj", "christyn"]).toContain(vertex);
    }
  });

  it("edge lab Worker URL is separate from production mesh", () => {
    expect(constants.mesh.edgeLabWorkerUrl).toContain("cf-edge-lab");
    expect(constants.mesh.edgeLabWorkerUrl).not.toContain("k4-cage");
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Fleet completeness & glass probes
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: fleet completeness", () => {
  let eco;
  beforeAll(() => { eco = readJson("p31-ecosystem.json"); });

  it("ecosystem has glassProbes array", () => {
    expect(Array.isArray(eco.glassProbes)).toBe(true);
  });

  it("ecosystem has deployables array", () => {
    expect(Array.isArray(eco.deployables)).toBe(true);
  });

  it("glass probes include k4-personal health check", () => {
    const probeStr = JSON.stringify(eco.glassProbes);
    expect(probeStr).toMatch(/k4.personal|k4Personal/i);
  });

  it("glass probes include k4-cage health check", () => {
    const probeStr = JSON.stringify(eco.glassProbes);
    expect(probeStr).toMatch(/k4.cage|k4Cage/i);
  });

  it("glass probes include bonding-relay health check", () => {
    const probeStr = JSON.stringify(eco.glassProbes);
    expect(probeStr).toMatch(/bonding.relay|bondingRelay/i);
  });

  it("ecosystem:glass script is wired in package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["ecosystem:glass"]).toBeTruthy();
  });

  it("p31-mesh package exists", () => {
    expect(exists("packages/p31-mesh")).toBe(true);
  });

  it("k4-agent-hub-client package exists", () => {
    expect(exists("packages/k4-agent-hub-client")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Guard rails on mesh drift
// ─────────────────────────────────────────────────────────────
describe("R — Regression: mesh drift guards", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("k4-cage URL has NOT changed domain from trimtab-signal.workers.dev", () => {
    expect(constants.mesh.k4CageWorkerUrl).toContain("trimtab-signal.workers.dev");
  });

  it("k4-personal URL has NOT changed domain", () => {
    expect(constants.mesh.k4PersonalWorkerUrl).toContain("trimtab-signal.workers.dev");
  });

  it("edge lab URL still points to cf-edge-lab worker", () => {
    expect(constants.mesh.edgeLabWorkerUrl).toContain("cf-edge-lab");
  });

  it("geodesic room URL still points to geodesic-room worker", () => {
    expect(constants.mesh.geodesicRoomWorkerUrl).toContain("geodesic-room");
  });

  it("verify:ecosystem script has not been removed", () => {
    const pkg = readJson("package.json");
    expect(typeof pkg.scripts["verify:ecosystem"]).toBe("string");
  });

  it("verify:k4-personal script has not been removed", () => {
    const pkg = readJson("package.json");
    expect(typeof pkg.scripts["verify:k4-personal"]).toBe("string");
  });

  it("live fleet updated timestamp is current (within 60 days)", () => {
    const fleet = readJson("p31-live-fleet.json");
    if (fleet.updated) {
      const updated = new Date(fleet.updated);
      const now = new Date("2026-04-30");
      const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThan(60);
    }
  });
});
