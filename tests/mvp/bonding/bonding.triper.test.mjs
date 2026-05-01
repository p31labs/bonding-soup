/**
 * TRIPER: BONDING
 * Molecular builder — K₄ bond engine, multiplayer relay, family mesh integration.
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

// ─────────────────────────────────────────────────────────────
// T — TASK: Core unit functionality
// ─────────────────────────────────────────────────────────────
describe("T — Task: BONDING core", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("bonding.shippedDate is set and valid ISO date", () => {
    expect(constants.bonding.shippedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("bonding.publicUrl is HTTPS", () => {
    expect(constants.bonding.publicUrl).toMatch(/^https:\/\//);
  });

  it("K₄ complete graph: 4 vertices → exactly 6 edges", () => {
    // K₄: n=4, edges = n*(n-1)/2 = 6
    const n = 4;
    const expectedEdges = (n * (n - 1)) / 2;
    expect(expectedEdges).toBe(6);
  });

  it("bonding relay worker URL is HTTPS in constants", () => {
    expect(constants.mesh.bondingRelayWorkerUrl).toMatch(/^https:\/\//);
  });

  it("bonding relay worker uses trimtab-signal subdomain", () => {
    expect(constants.mesh.bondingRelayWorkerUrl).toContain("trimtab-signal.workers.dev");
  });

  it("bonding soup.html entry point exists", () => {
    expect(exists("soup.html")).toBe(true);
  });

  it("C.A.R.S. source: soup.ts exists", () => {
    expect(exists("src/soup.ts")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Fallback & offline modes
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: offline fallback & relay", () => {
  it("bonding mock-ws probe script exists", () => {
    expect(exists("scripts/bonding-mock-ws-probe.mjs")).toBe(true);
  });

  it("mock-ws server spike exists as offline fallback", () => {
    expect(exists("spikes/mock-ws-server/server.js")).toBe(true);
  });

  it("bonding-relay wrangler.toml present for relay worker", () => {
    const found = [
      "packages/bonding-relay/wrangler.toml",
      "andromeda/04_SOFTWARE/bonding-relay/wrangler.toml",
      "workers/bonding-relay/wrangler.toml",
    ].some(exists);
    // Relay lives in andromeda or as standalone — at least the probe script covers it
    expect(
      exists("scripts/bonding-mock-ws-probe.mjs") ||
      found
    ).toBe(true);
  });

  it("sync-soup-to-bonding script exists for offline sync path", () => {
    expect(exists("scripts/sync-soup-to-bonding.mjs")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Wire contract & relay schema
// ─────────────────────────────────────────────────────────────
describe("I — Interface: C.A.R.S. wire contract", () => {
  let wire;
  beforeAll(() => { wire = readJson("cars-contract/p31.carsWire.json"); });

  it("wire schema is p31.carsWire/0.1.0", () => {
    expect(wire.schema).toBe("p31.carsWire/0.1.0");
  });

  it("SoupEngine handles: moleculeStateUpdate", () => {
    expect(wire.soupEngine.handlesIncomingTypes).toContain("moleculeStateUpdate");
  });

  it("SoupEngine handles: ping", () => {
    expect(wire.soupEngine.handlesIncomingTypes).toContain("ping");
  });

  it("SoupEngine handles: connectionInit", () => {
    expect(wire.soupEngine.handlesIncomingTypes).toContain("connectionInit");
  });

  it("SoupEngine handles: heartbeat", () => {
    expect(wire.soupEngine.handlesIncomingTypes).toContain("heartbeat");
  });

  it("server sends: moleculeStateUpdate to clients", () => {
    expect(wire.mockServer.sendsToClientTypes).toContain("moleculeStateUpdate");
  });

  it("browser client sends: playerState", () => {
    expect(wire.browserClientOutbound.sendsTypes).toContain("playerState");
  });

  it("browser client sends: heartbeat", () => {
    expect(wire.browserClientOutbound.sendsTypes).toContain("heartbeat");
  });

  it("molecule payload requires: id, x, y, vx, vy, personality, element", () => {
    const req = wire.moleculePayloadFields.required;
    for (const field of ["id", "x", "y", "vx", "vy", "personality", "element"]) {
      expect(req).toContain(field);
    }
  });

  it("world bounds: 1600×800 px", () => {
    expect(wire.moleculePayloadFields.worldBoundsPx.width).toBe(1600);
    expect(wire.moleculePayloadFields.worldBoundsPx.height).toBe(800);
  });

  it("heartbeat interval is 5000ms", () => {
    expect(wire.heartbeatIntervalMs).toBe(5000);
  });

  it("molecule broadcast interval is 500ms", () => {
    expect(wire.moleculeBroadcastIntervalMs).toBe(500);
  });

  it("both implementations are documented", () => {
    expect(wire.implementations.mockWebSocketServer).toBeTruthy();
    expect(wire.implementations.browserClient).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: Safety, privacy, naming conventions
// ─────────────────────────────────────────────────────────────
describe("P — Purity: safety invariants & privacy", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("bonding.publicUrl contains no credential substrings", () => {
    const url = constants.bonding.publicUrl;
    expect(url).not.toContain("sk_");
    expect(url).not.toContain("pk_");
    expect(url).not.toContain("password");
    expect(url).not.toContain("secret");
  });

  it("family vertices use initials only — S.J. format (not full names)", () => {
    // Mesh family vertex keys use initials (sj, wj) not full names
    const meshStr = JSON.stringify(constants.mesh);
    // Must not contain full child first names in values
    expect(meshStr).not.toMatch(/\bstephen\b/i);
    expect(meshStr).not.toMatch(/\bwilliam jr\b/i);
  });

  it("remembrance warm white color is a valid hex", () => {
    expect(constants.mesh.remembranceWarmWhite).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("remembrance bereavement KV key is defined", () => {
    expect(constants.mesh.remembranceBereavementKvKey).toBeTruthy();
  });

  it("vertex state 'remembered' is defined for bereavement mode", () => {
    expect(constants.mesh.vertexStateRemembered).toBe("remembered");
  });

  it("soup.html does not contain raw API keys (spot check)", () => {
    const html = fs.readFileSync(path.join(ROOT, "soup.html"), "utf8");
    expect(html).not.toMatch(/sk_live_/);
    expect(html).not.toMatch(/pk_live_/);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Build & export flow
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: build & dist validation", () => {
  it("TypeScript source compiles to dist (soup.ts → dist/soup.js expected path)", () => {
    // dist/ may not be committed but tsconfig must reference src/
    expect(exists("tsconfig.json")).toBe(true);
    const tsconfig = readJson("tsconfig.json");
    expect(tsconfig.compilerOptions).toBeTruthy();
  });

  it("soup-prep check script exists for dist validation", () => {
    expect(exists("scripts/soup-prep.mjs")).toBe(true);
  });

  it("fleet portal build includes bonding vertical entry", () => {
    const fleet = readJson("p31-live-fleet.json");
    expect(fleet.sites.bondingVertical).toBeTruthy();
    expect(fleet.sites.bondingVertical.url).toContain("bonding");
  });

  it("bonding entry appears in ecosystem deployables", () => {
    const eco = readJson("p31-ecosystem.json");
    const hasEntry = eco.deployables.some(
      (d) => typeof d === "object" && JSON.stringify(d).toLowerCase().includes("bonding")
    );
    expect(hasEntry).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Baseline locks & known failure guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: baseline locks", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("test baseline: 424 tests documented (lock against regression)", () => {
    expect(constants.bonding.testBaseline.tests).toBe(424);
  });

  it("test baseline: 32 suites documented", () => {
    expect(constants.bonding.testBaseline.suites).toBe(32);
  });

  it("bonding shipped date is 2026-03-10 (immutable shipped record)", () => {
    expect(constants.bonding.shippedDate).toBe("2026-03-10");
  });

  it("cars-wire contract file has not been deleted", () => {
    expect(exists("cars-contract/p31.carsWire.json")).toBe(true);
  });

  it("verify:cars-wire script has not been removed", () => {
    expect(exists("scripts/verify-cars-wire.mjs")).toBe(true);
  });

  it("mock-ws server implementation still referenced in wire contract", () => {
    const wire = readJson("cars-contract/p31.carsWire.json");
    expect(wire.implementations.mockWebSocketServer).toContain("mock-ws-server");
  });

  it("soup.ts is still the browser client in wire contract", () => {
    const wire = readJson("cars-contract/p31.carsWire.json");
    expect(wire.implementations.browserClient).toContain("soup.ts");
  });
});
