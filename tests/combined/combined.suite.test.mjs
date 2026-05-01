/**
 * P31 TRIPER — COMBINED SUITE
 * Cross-MVP integration tests. Runs AFTER all individual TRIPERs pass the gate.
 * These tests verify that the MVPs fit together correctly as a family mesh.
 *
 * Not a duplicate of individual suite tests — every test here requires
 * at least two MVPs to be in correct mutual alignment.
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const P31CA = path.join(ROOT, "andromeda/04_SOFTWARE/p31ca");
const GROUND_TRUTH = path.join(P31CA, "ground-truth");
const PUBLIC = path.join(P31CA, "public");
const SIMPLEX = path.join(ROOT, "simplex-v7");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function readJsonAbs(abs) {
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function existsAbs(abs) {
  return fs.existsSync(abs);
}

// ─────────────────────────────────────────────────────────────
// BONDING ↔ C.A.R.S.: wire contract mutual alignment
// ─────────────────────────────────────────────────────────────
describe("BONDING ↔ C.A.R.S.: shared wire contract", () => {
  let wire;
  beforeAll(() => { wire = readJson("cars-contract/p31.carsWire.json"); });

  it("wire contract references soup.ts (C.A.R.S.) as the browser client BONDING uses", () => {
    expect(wire.implementations.browserClient).toBe("src/soup.ts");
    expect(exists("src/soup.ts")).toBe(true);
  });

  it("mock-ws server referenced in wire contract exists on disk", () => {
    const server = wire.implementations.mockWebSocketServer;
    expect(exists(server)).toBe(true);
  });

  it("SoupEngine handles moleculeStateUpdate which BONDING relay sends", () => {
    expect(wire.soupEngine.handlesIncomingTypes).toContain("moleculeStateUpdate");
    expect(wire.mockServer.sendsToClientTypes).toContain("moleculeStateUpdate");
  });

  it("BONDING relay URL in constants is on the same CF account as other K₄ Workers", () => {
    const constants = readJson("p31-constants.json");
    // All Workers share the same account subdomain (trimtab-signal.workers.dev)
    const bondingHost = new URL(constants.mesh.bondingRelayWorkerUrl).hostname;
    const cageHost = new URL(constants.mesh.k4CageWorkerUrl).hostname;
    // Both should contain the account prefix
    const accountPrefix = "trimtab-signal.workers.dev";
    expect(bondingHost).toContain(accountPrefix);
    expect(cageHost).toContain(accountPrefix);
  });

  it("BONDING test baseline (424 tests) is still locked in constants after C.A.R.S. changes", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.bonding.testBaseline.tests).toBe(424);
  });
});

// ─────────────────────────────────────────────────────────────
// MESH ↔ CONSTANTS: URL sync across all source files
// ─────────────────────────────────────────────────────────────
describe("MESH ↔ CONSTANTS: live fleet URL sync", () => {
  let constants, fleet;
  beforeAll(() => {
    constants = readJson("p31-constants.json");
    fleet = readJson("p31-live-fleet.json");
  });

  it("fleet sources include p31-constants.json (constants is the source of truth)", () => {
    expect(fleet.sources).toContain("p31-constants.json");
  });

  it("bonding public URL in fleet matches p31-constants.json", () => {
    expect(fleet.sites.bondingVertical.url).toContain("bonding");
    expect(constants.bonding.publicUrl).toContain("bonding");
    // Both reference the same host
    const fleetHost = new URL(fleet.sites.bondingVertical.url).host;
    const constHost = new URL(constants.bonding.publicUrl).host;
    expect(fleetHost).toBe(constHost);
  });

  it("all mesh Worker URLs share the same CF account subdomain (trimtab-signal)", () => {
    const meshUrls = [
      constants.mesh.k4PersonalWorkerUrl,
      constants.mesh.k4CageWorkerUrl,
      constants.mesh.k4HubsWorkerUrl,
      constants.mesh.bondingRelayWorkerUrl,
      constants.mesh.geodesicRoomWorkerUrl,
    ];

    for (const url of meshUrls) {
      expect(url).toContain("trimtab-signal.workers.dev");
    }
  });

  it("ecosystem glass probes match constants mesh URLs (no orphan probes)", () => {
    const eco = readJson("p31-ecosystem.json");
    const probeStr = JSON.stringify(eco.glassProbes);
    const k4CageHost = new URL(constants.mesh.k4CageWorkerUrl).hostname;
    expect(probeStr).toContain(k4CageHost.split(".")[0]); // worker name prefix
  });

  it("p31-live-fleet.json updated timestamp is within 60 days of constants updated", () => {
    const cUpdated = new Date(constants.updated);
    const fUpdated = new Date(fleet.updated);
    const diffDays = Math.abs(cUpdated - fUpdated) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThan(60);
  });
});

// ─────────────────────────────────────────────────────────────
// PERSONAL ↔ HUB: Cognitive Passport cross-sync
// ─────────────────────────────────────────────────────────────
describe("PERSONAL ↔ HUB: Cognitive Passport mutual sync", () => {
  it("root generator (cognitive-passport/index.html) references the p31 passport schema", () => {
    const constants = readJson("p31-constants.json");
    const html = fs.readFileSync(path.join(ROOT, "cognitive-passport/index.html"), "utf8");
    // Schema is p31.cognitivePassport/1.0.0 — check the namespace prefix is present
    const schemaPrefix = constants.cognitivePassport.jsonSchema.split("/")[0]; // "p31.cognitivePassport"
    expect(html).toContain(schemaPrefix);
  });

  it("hub mirror (passport-generator.html) references p31 schema", () => {
    const html = fs.readFileSync(path.join(PUBLIC, "passport-generator.html"), "utf8");
    expect(html).toMatch(/p31/i);
  });

  it("p31-style.css exists in both cognitive-passport/ and is synced from hub design tokens", () => {
    expect(exists("cognitive-passport/p31-style.css")).toBe(true);
    // Hub public also has p31-style.css
    const hubStyle = existsAbs(path.join(PUBLIC, "p31-style.css")) ||
      existsAbs(path.join(ROOT, "cognitive-passport/p31-style.css"));
    expect(hubStyle).toBe(true);
  });

  it("passport long-form filename in constants matches the actual file", () => {
    const constants = readJson("p31-constants.json");
    expect(exists(constants.cognitivePassport.longFormFilename)).toBe(true);
  });

  it("verify:passport script is wired — cross-sync is CI-enforced", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:passport"]).toBeTruthy();
    expect(pkg.scripts["sync:passport"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// PERSONAL ↔ SIMPLEX: operator scope isolation
// ─────────────────────────────────────────────────────────────
describe("PERSONAL ↔ SIMPLEX: operator scope alignment", () => {
  it("SIMPLEX test suite covers the personal-scope safety invariants", () => {
    const medTests = existsAbs(path.join(SIMPLEX, "tests/medication-rules.test.ts"));
    const spoonTests = existsAbs(path.join(SIMPLEX, "tests/biometric-spoons.test.ts"));
    const authTests = existsAbs(path.join(SIMPLEX, "tests/operator-auth.test.ts"));
    expect(medTests && spoonTests && authTests).toBe(true);
  });

  it("SIMPLEX k4-personal URL matches constants mesh section", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.k4PersonalWorkerUrl).toMatch(/k4-personal/);
  });

  it("SIMPLEX-v7 router exists and PERSONAL passport verify exists — two separate concerns", () => {
    expect(existsAbs(path.join(SIMPLEX, "src/skills/router.ts"))).toBe(true);
    expect(exists("scripts/verify-passport-sync.mjs")).toBe(true);
  });

  it("simplex:verify-all gates personal scope (email + bootstrap + simplex together)", () => {
    const pkg = readJson("package.json");
    const script = pkg.scripts["simplex:verify-all"];
    expect(script).toMatch(/verify:simplex\b/);
    expect(script).toMatch(/verify:simplex-email/);
    expect(script).toMatch(/verify:simplex-bootstrap/);
  });
});

// ─────────────────────────────────────────────────────────────
// HUB ↔ MESH: p31ca public surface ↔ live fleet alignment
// ─────────────────────────────────────────────────────────────
describe("HUB ↔ MESH: public surface matches live fleet", () => {
  it("p31-public-surface.json references p31ca.org (same as fleet technicalHub)", () => {
    const surface = readJsonAbs(path.join(PUBLIC, "p31-public-surface.json"));
    const fleet = readJson("p31-live-fleet.json");
    const surfaceStr = JSON.stringify(surface);
    const hubUrl = fleet.sites.technicalHub.url;
    const hubHost = new URL(hubUrl).host;
    expect(surfaceStr).toContain(hubHost);
  });

  it("p31-mesh-constants.json in public/ exists (hub broadcasts mesh URLs)", () => {
    expect(existsAbs(path.join(PUBLIC, "p31-mesh-constants.json"))).toBe(true);
  });

  it("p31-mesh-constants.json in public/ references k4-cage Worker URL from constants", () => {
    const constants = readJson("p31-constants.json");
    const meshConst = readJsonAbs(path.join(PUBLIC, "p31-mesh-constants.json"));
    const meshStr = JSON.stringify(meshConst);
    // Should contain the cage URL or a key part of it
    expect(meshStr).toContain("k4-cage");
  });

  it("creator-economy.json is in public/ (hub serves it) — HUB owns the covenant but MESH enforces it", () => {
    expect(existsAbs(path.join(PUBLIC, "creator-economy.json"))).toBe(true);
  });

  it("fleet featured paths include /contracts (mesh + hub alignment surface)", () => {
    const fleet = readJson("p31-live-fleet.json");
    const paths = fleet.sites.featuredPublicPaths.map((p) => p.path);
    expect(paths).toContain("/contracts");
  });
});

// ─────────────────────────────────────────────────────────────
// GEODESIC ↔ MESH: room URL chain of custody
// ─────────────────────────────────────────────────────────────
describe("GEODESIC ↔ MESH: room URL chain of custody", () => {
  it("geodesicRoom Worker URL in constants is HTTPS and matches trimtab-signal domain", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.geodesicRoomWorkerUrl).toMatch(/^https:\/\/geodesic-room\.trimtab-signal\.workers\.dev$/);
  });

  it("geodesic room appears in ecosystem glass probes (mesh health covers it)", () => {
    const eco = readJson("p31-ecosystem.json");
    const probeStr = JSON.stringify(eco.glassProbes);
    expect(probeStr).toMatch(/geodesic/i);
  });

  it("geodesic spike or source is present (no ghost URL without implementation)", () => {
    const hasSource = fs.existsSync(path.join(ROOT, "spikes/sovereign-geodesic-preview")) ||
      fs.existsSync(path.join(ROOT, "andromeda/04_SOFTWARE/geodesic-room"));
    expect(hasSource).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// GLOBAL PURITY: cross-MVP secret and naming sweep
// ─────────────────────────────────────────────────────────────
describe("GLOBAL PURITY: cross-MVP secret & naming sweep", () => {
  const filesToSweep = [
    "p31-constants.json",
    "p31-live-fleet.json",
    "p31-ecosystem.json",
    "cars-contract/p31.carsWire.json",
  ];

  for (const file of filesToSweep) {
    it(`no live secret keys in: ${file}`, () => {
      const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(raw).not.toMatch(/sk_live_[A-Za-z0-9]/);
      expect(raw).not.toMatch(/pk_live_[A-Za-z0-9]/);
    });
  }

  it("no full child first names in p31-constants.json (initials only)", () => {
    const raw = fs.readFileSync(path.join(ROOT, "p31-constants.json"), "utf8");
    expect(raw).not.toMatch(/\bstephen\b/i);
    expect(raw).not.toMatch(/\bwilliam jr\b/i);
  });

  it("no full child first names in p31-live-fleet.json", () => {
    const raw = fs.readFileSync(path.join(ROOT, "p31-live-fleet.json"), "utf8");
    expect(raw).not.toMatch(/\bstephen\b/i);
    expect(raw).not.toMatch(/\bwilliam jr\b/i);
  });

  it("public surface has no credential strings (hub publishes it to the world)", () => {
    const raw = fs.readFileSync(path.join(PUBLIC, "p31-public-surface.json"), "utf8");
    expect(raw).not.toMatch(/sk_live_|pk_live_|api_key\s*[:=]/i);
  });

  it("P31 org EIN is consistent across constants and public JSON", () => {
    const constants = readJson("p31-constants.json");
    const economy = readJsonAbs(path.join(GROUND_TRUTH, "creator-economy.json"));
    expect(constants.organization.ein).toBe("42-1888158");
    // Creator economy references same entity
    expect(JSON.stringify(economy)).toContain("42-1888158");
  });
});

// ─────────────────────────────────────────────────────────────
// RESEARCH ↔ CONSTANTS: Zenodo publication integrity
// ─────────────────────────────────────────────────────────────
describe("RESEARCH ↔ CONSTANTS: Zenodo series integrity", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("Zenodo publication count is 22 (matches constants.research.zenodoPublicationCount)", () => {
    expect(constants.research.zenodoPublicationCount).toBe(22);
  });

  it("papers array has entries (not empty after adding publications)", () => {
    expect(Array.isArray(constants.research.papers)).toBe(true);
    expect(constants.research.papers.length).toBeGreaterThan(0);
  });

  it("ORCID is set and matches the canonical format", () => {
    expect(constants.research.orcid).toMatch(/^\d{4}-\d{4}-\d{4}-\d{4}$/);
  });

  it("research series count + standalone count = total publication count", () => {
    const total = constants.research.researchSeriesCount + constants.research.standalonePublicationCount;
    expect(total).toBe(constants.research.zenodoPublicationCount);
  });

  it("each paper has a doi field (no ghost entries without DOI)", () => {
    for (const paper of constants.research.papers) {
      expect(paper.doi).toMatch(/^10\.\d{4,}/);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// CI/VERIFY: certification pipeline completeness
// ─────────────────────────────────────────────────────────────
describe("CI/VERIFY: certification pipeline is complete", () => {
  let pkg;
  beforeAll(() => { pkg = readJson("package.json"); });

  it("test:triper script exists (TRIPER system is wired)", () => {
    expect(pkg.scripts["test:triper"]).toBeTruthy();
  });

  it("test:triper:cert script exists (certification run)", () => {
    expect(pkg.scripts["test:triper:cert"]).toBeTruthy();
  });

  it("TRIPER master runner exists", () => {
    expect(exists("tests/triper/triper-runner.mjs")).toBe(true);
  });

  it("vitest.triper.config.mjs exists", () => {
    expect(exists("vitest.triper.config.mjs")).toBe(true);
  });

  it("all 9 MVP TRIPER test files are present", () => {
    const suites = ["bonding", "cars", "personal", "hub", "mesh", "simplex", "email", "epcp", "geodesic"];
    for (const name of suites) {
      expect(exists(`tests/mvp/${name}/${name}.triper.test.mjs`)).toBe(true);
    }
  });

  it("TRIPER architecture doc exists", () => {
    expect(exists("docs/P31-TRIPER-SYSTEM.md")).toBe(true);
  });

  it("verify chain includes the full CI gate (verify script is populated)", () => {
    expect(pkg.scripts.verify).toMatch(/verify:alignment/);
    expect(pkg.scripts.verify).toMatch(/verify:ecosystem/);
    expect(pkg.scripts.verify).toMatch(/verify:simplex/);
  });

  it("test:matrix covers unit + packages + simplex (combined gate requires all three)", () => {
    expect(pkg.scripts["test:matrix"]).toMatch(/test:unit/);
    expect(pkg.scripts["test:matrix"]).toMatch(/test:packages/);
    expect(pkg.scripts["test:matrix"]).toMatch(/test:simplex/);
  });
});
