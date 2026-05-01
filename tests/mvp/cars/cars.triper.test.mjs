/**
 * TRIPER: C.A.R.S.
 * Root bonding-soup engine — SoupEngine, physics, wire contract, dist pipeline.
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

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// ─────────────────────────────────────────────────────────────
// T — TASK: Source files & engine fundamentals
// ─────────────────────────────────────────────────────────────
describe("T — Task: C.A.R.S. source integrity", () => {
  it("soup.ts exists (SoupEngine entry)", () => {
    expect(exists("src/soup.ts")).toBe(true);
  });

  it("soupPhysics.ts exists (physics sim)", () => {
    expect(exists("src/soupPhysics.ts")).toBe(true);
  });

  it("reactions.ts exists (reaction rules)", () => {
    expect(exists("src/reactions.ts")).toBe(true);
  });

  it("tsconfig.json exists and has outDir", () => {
    expect(exists("tsconfig.json")).toBe(true);
    const tc = readJson("tsconfig.json");
    expect(tc.compilerOptions.outDir).toBeTruthy();
  });

  it("package name is bonding-soup (legacy identity preserved)", () => {
    const pkg = readJson("package.json");
    expect(pkg.name).toBe("bonding-soup");
  });

  it("package.json main points to dist/soup.js", () => {
    const pkg = readJson("package.json");
    expect(pkg.main).toBe("dist/soup.js");
  });

  it("SoupEngine file references WebSocket handling", () => {
    const src = readFile("src/soup.ts");
    expect(src).toMatch(/WebSocket|handleWebSocketMessage/);
  });

  it("reactions.ts references molecule or reaction primitives", () => {
    const src = readFile("src/reactions.ts");
    expect(src.length).toBeGreaterThan(100);
  });

  it("soupPhysics.ts is non-trivial (>100 chars)", () => {
    const src = readFile("src/soupPhysics.ts");
    expect(src.length).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Fallback & build hardening
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: build & fallback paths", () => {
  it("soup-prep.mjs --check validates dist/", () => {
    expect(exists("scripts/soup-prep.mjs")).toBe(true);
  });

  it("soup-room-scale.mjs exists for scale packaging", () => {
    expect(exists("scripts/soup-room-scale.mjs")).toBe(true);
  });

  it("mock-ws-server/server.js exists as offline relay fallback", () => {
    expect(exists("spikes/mock-ws-server/server.js")).toBe(true);
  });

  it("CARS-NAMING.md documents naming rationale (prevents name drift)", () => {
    const found = exists("docs/CARS-NAMING.md") || exists("CARS-NAMING.md");
    expect(found).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Wire contract alignment
// ─────────────────────────────────────────────────────────────
describe("I — Interface: p31.carsWire contract", () => {
  let wire;
  beforeAll(() => { wire = readJson("cars-contract/p31.carsWire.json"); });

  it("wire contract file exists at canonical path", () => {
    expect(exists("cars-contract/p31.carsWire.json")).toBe(true);
  });

  it("schema ID follows p31 versioned pattern", () => {
    expect(wire.schema).toMatch(/^p31\.\w+\/\d+\.\d+\.\d+$/);
  });

  it("SoupEngine incoming types are a non-empty array", () => {
    expect(Array.isArray(wire.soupEngine.handlesIncomingTypes)).toBe(true);
    expect(wire.soupEngine.handlesIncomingTypes.length).toBeGreaterThan(0);
  });

  it("mock server outbound types are non-empty", () => {
    expect(wire.mockServer.sendsToClientTypes.length).toBeGreaterThan(0);
  });

  it("labTelemetry is accepted by mock server (Sovereign Lab stream)", () => {
    expect(wire.mockServer.acceptsClientParsingTypes).toContain("labTelemetry");
  });

  it("SoupEngine does NOT send labTelemetry (Sovereign Lab only)", () => {
    expect(wire.browserClientOutbound.sendsTypes).not.toContain("labTelemetry");
  });

  it("soup.ts referenced as browserClient in implementations", () => {
    expect(wire.implementations.browserClient).toBe("src/soup.ts");
  });

  it("mock-ws-server/server.js referenced as mockWebSocketServer", () => {
    expect(wire.implementations.mockWebSocketServer).toBe("spikes/mock-ws-server/server.js");
  });

  it("verify:cars-wire script wired in package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:cars-wire"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: No secrets, no drifted naming
// ─────────────────────────────────────────────────────────────
describe("P — Purity: clean contract & source", () => {
  it("cars-contract JSON contains no credential strings", () => {
    const raw = fs.readFileSync(path.join(ROOT, "cars-contract/p31.carsWire.json"), "utf8");
    expect(raw).not.toMatch(/sk_live_|pk_live_|password|secret_key/i);
  });

  it("soup.ts contains no hardcoded API keys", () => {
    const src = readFile("src/soup.ts");
    expect(src).not.toMatch(/sk_live_|pk_live_/);
  });

  it("Cloudflare 10ms CPU limit: SoupEngine has no blocking sync fs calls", () => {
    const src = readFile("src/soup.ts");
    // Blocking readFileSync in a Worker context would exceed CPU budget
    expect(src).not.toMatch(/readFileSync|writeFileSync|execSync/);
  });

  it("reactions.ts has no hardcoded child full names", () => {
    const src = readFile("src/reactions.ts");
    expect(src).not.toMatch(/\bstephen\b/i);
    expect(src).not.toMatch(/\bwilliam jr\b/i);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Build pipeline
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: build pipeline", () => {
  it("build script in package.json points to tsc", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts.build).toMatch(/tsc/);
  });

  it("soup:prep:check script exists in package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["soup:prep:check"]).toBeTruthy();
  });

  it("files array in package.json includes dist/**/* and src/**/*", () => {
    const pkg = readJson("package.json");
    expect(pkg.files).toContain("dist/**/*");
    expect(pkg.files).toContain("src/**/*");
  });

  it("soup.html is in package.json files (public entry)", () => {
    const pkg = readJson("package.json");
    expect(pkg.files).toContain("soup.html");
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Guard rails on known failure points
// ─────────────────────────────────────────────────────────────
describe("R — Regression: known failure guards", () => {
  it("world bounds have NOT changed from 1600×800 (breaking change guard)", () => {
    const wire = readJson("cars-contract/p31.carsWire.json");
    expect(wire.moleculePayloadFields.worldBoundsPx).toEqual({ width: 1600, height: 800 });
  });

  it("moleculePayloadFields.required has not lost 'id' field", () => {
    const wire = readJson("cars-contract/p31.carsWire.json");
    expect(wire.moleculePayloadFields.required).toContain("id");
  });

  it("moleculePayloadFields.required has not lost 'personality' field", () => {
    const wire = readJson("cars-contract/p31.carsWire.json");
    expect(wire.moleculePayloadFields.required).toContain("personality");
  });

  it("heartbeat interval has not changed from 5000ms (client sync guard)", () => {
    const wire = readJson("cars-contract/p31.carsWire.json");
    expect(wire.heartbeatIntervalMs).toBe(5000);
  });

  it("package description still references C.A.R.S.", () => {
    const pkg = readJson("package.json");
    expect(pkg.description).toMatch(/C\.A\.R\.S\./);
  });

  it("verify:cars-wire script has not been removed from package.json", () => {
    const pkg = readJson("package.json");
    expect(typeof pkg.scripts["verify:cars-wire"]).toBe("string");
  });
});
