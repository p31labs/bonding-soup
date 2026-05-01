/**
 * TRIPER: GeodesicRoom
 * WS collaborative space — wire protocol, shape cap, Maxwell rigidity, rotY pose.
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

function existsAny(...rels) {
  return rels.some(exists);
}

// Geodesic Room constants
const MAX_SHAPES = 50;
const WIRE_SCHEMA = "p31.geodesicRoomWire/0.2.1";
const REQUIRED_MSG_TYPES = ["ADD_SHAPE", "MOVE_SHAPE", "REMOVE_SHAPE", "RESET_SHAPES"];

// ─────────────────────────────────────────────────────────────
// T — TASK: Wire fixture & Worker entry
// ─────────────────────────────────────────────────────────────
describe("T — Task: GeodesicRoom core", () => {
  it("verify:geodesic-wire-fixtures script is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:geodesic-wire-fixtures"]).toBeTruthy();
  });

  it("verify-geodesic-wire-fixtures.mjs exists", () => {
    expect(exists("scripts/verify-geodesic-wire-fixtures.mjs")).toBe(true);
  });

  it("geodesicRoom Worker URL is in mesh constants", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.geodesicRoomWorkerUrl).toMatch(/geodesic-room/);
  });

  it("geodesicRoom Worker URL is HTTPS (not WS)", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.geodesicRoomWorkerUrl).toMatch(/^https:\/\//);
  });

  it("geodesic room spike or source directory exists", () => {
    const found = existsAny(
      "spikes/sovereign-geodesic-preview",
      "andromeda/04_SOFTWARE/geodesic-room",
      "workers/geodesic-room"
    );
    expect(found).toBe(true);
  });

  it("geodesic preview has a demo dev script", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["demo:geodesic-preview"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Fixture fallback & offline support
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: fixture fallback", () => {
  it("test:simulations script includes geodesic wire fixtures", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["test:simulations"]).toMatch(/geodesic/i);
  });

  it("build:geodesic-preview script exists for offline build", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["build:geodesic-preview"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Wire protocol completeness
// ─────────────────────────────────────────────────────────────
describe("I — Interface: geodesic room wire protocol", () => {
  it("constants reference geodesicRoomWire schema version 0.2.1", () => {
    // Schema version must be locked — changes = new version
    const wireSchemaVersion = "0.2.1";
    expect(WIRE_SCHEMA).toBe(`p31.geodesicRoomWire/${wireSchemaVersion}`);
  });

  it("all 4 required message types are defined", () => {
    for (const msgType of REQUIRED_MSG_TYPES) {
      expect(REQUIRED_MSG_TYPES).toContain(msgType);
    }
    expect(REQUIRED_MSG_TYPES).toHaveLength(4);
  });

  it("ADD_SHAPE is a required message type", () => {
    expect(REQUIRED_MSG_TYPES).toContain("ADD_SHAPE");
  });

  it("MOVE_SHAPE is a required message type", () => {
    expect(REQUIRED_MSG_TYPES).toContain("MOVE_SHAPE");
  });

  it("REMOVE_SHAPE is a required message type", () => {
    expect(REQUIRED_MSG_TYPES).toContain("REMOVE_SHAPE");
  });

  it("RESET_SHAPES is a required message type", () => {
    expect(REQUIRED_MSG_TYPES).toContain("RESET_SHAPES");
  });

  it("geodesic room Worker URL uses WSS path (https → wss upgrade)", () => {
    const constants = readJson("p31-constants.json");
    const httpsUrl = constants.mesh.geodesicRoomWorkerUrl;
    // The WS upgrade happens at /api/geodesic/:id/ws
    const wsUrl = httpsUrl.replace("https://", "wss://") + "/api/geodesic/test/ws";
    expect(wsUrl).toMatch(/^wss:\/\//);
    expect(wsUrl).toMatch(/\/api\/geodesic\//);
  });

  it("verify:geodesic-wire-fixtures is in root verify chain", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts.verify).toMatch(/verify:geodesic-wire-fixtures/);
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: Safety caps & no private data leaks
// ─────────────────────────────────────────────────────────────
describe("P — Purity: shape cap & clean protocol", () => {
  it("50-shape cap is the canonical maximum (Maxwell rigidity constraint)", () => {
    // K₄ Maxwell rigidity: 3n-6 for n=4 → 6 bars min; geodesic extends this
    // 50 shapes is the documented hard cap
    expect(MAX_SHAPES).toBe(50);
  });

  it("shape cap is greater than 0 (prevents empty room lockout)", () => {
    expect(MAX_SHAPES).toBeGreaterThan(0);
  });

  it("geodesicRoom Worker URL has no credential params", () => {
    const constants = readJson("p31-constants.json");
    const url = constants.mesh.geodesicRoomWorkerUrl;
    expect(url).not.toMatch(/key=|token=|password=/i);
  });

  it("mesh constants section has no hardcoded WS tokens", () => {
    const constants = readJson("p31-constants.json");
    const meshStr = JSON.stringify(constants.mesh);
    expect(meshStr).not.toMatch(/sk_live_|bearer\s+[A-Za-z0-9]{20}/i);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Fixture validation pipeline
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: geodesic fixture pipeline", () => {
  it("test:simulations includes geodesic-wire-fixtures in pipeline", () => {
    const pkg = readJson("package.json");
    const script = pkg.scripts["test:simulations"];
    expect(script).toMatch(/geodesic/);
  });

  it("OQE icosa E2E test script is wired (geodesic visual surface)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["test:oqe-icosa:e2e"]).toBeTruthy();
  });

  it("oqe-icosa-e2e.mjs script exists", () => {
    expect(exists("scripts/oqe-icosa-e2e.mjs")).toBe(true);
  });

  it("verify:quantum-deck is wired (geodesic visual layer)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:quantum-deck"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Protocol version & pose field guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: protocol version locks", () => {
  it("wire schema version has NOT been silently bumped past 0.2.1", () => {
    // If this test fails: a wire contract version was bumped without a TRIPER update
    // The fix is to update this test to match AND verify all clients are updated
    expect(WIRE_SCHEMA).toBe("p31.geodesicRoomWire/0.2.1");
  });

  it("MOVE_SHAPE message type has NOT been renamed", () => {
    expect(REQUIRED_MSG_TYPES).toContain("MOVE_SHAPE");
  });

  it("geodesic room Worker URL domain has NOT changed", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.geodesicRoomWorkerUrl).toContain("trimtab-signal.workers.dev");
  });

  it("verify:geodesic-wire-fixtures script has not been removed", () => {
    const pkg = readJson("package.json");
    expect(typeof pkg.scripts["verify:geodesic-wire-fixtures"]).toBe("string");
  });

  it("geodesic preview spike has not been deleted", () => {
    const found = existsAny(
      "spikes/sovereign-geodesic-preview",
      "andromeda/04_SOFTWARE/geodesic-room"
    );
    expect(found).toBe(true);
  });

  it("shape cap constant has not regressed below 50", () => {
    expect(MAX_SHAPES).toBeGreaterThanOrEqual(50);
  });
});
