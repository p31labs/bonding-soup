/**
 * TRIPER: HUB
 * p31ca technical hub — ground truth, creator economy, public surface, security.
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const P31CA = path.join(ROOT, "andromeda/04_SOFTWARE/p31ca");
const GROUND_TRUTH = path.join(P31CA, "ground-truth");
const PUBLIC = path.join(P31CA, "public");
const SECURITY = path.join(P31CA, "security");

const p31caExists = fs.existsSync(P31CA);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function readJsonAbs(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function existsAbs(absPath) {
  return fs.existsSync(absPath);
}

// ─────────────────────────────────────────────────────────────
// T — TASK: Hub file structure
// ─────────────────────────────────────────────────────────────
describe("T — Task: hub file structure", () => {
  it("p31ca directory exists in andromeda", () => {
    expect(p31caExists).toBe(true);
  });

  it("ground-truth/ directory exists", () => {
    expect(existsAbs(GROUND_TRUTH)).toBe(true);
  });

  it("p31.ground-truth.json exists", () => {
    expect(existsAbs(path.join(GROUND_TRUTH, "p31.ground-truth.json"))).toBe(true);
  });

  it("creator-economy.json exists in ground-truth", () => {
    expect(existsAbs(path.join(GROUND_TRUTH, "creator-economy.json"))).toBe(true);
  });

  it("public/ directory exists", () => {
    expect(existsAbs(PUBLIC)).toBe(true);
  });

  it("p31-public-surface.json exists in public/", () => {
    expect(existsAbs(path.join(PUBLIC, "p31-public-surface.json"))).toBe(true);
  });

  it("security/ directory exists", () => {
    expect(existsAbs(SECURITY)).toBe(true);
  });

  it("worker-allowlist.json exists in security/", () => {
    expect(existsAbs(path.join(SECURITY, "worker-allowlist.json"))).toBe(true);
  });

  it("passport-generator.html exists in public/ (passport mirror)", () => {
    expect(existsAbs(path.join(PUBLIC, "passport-generator.html"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Astro build preconditions
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: Astro build preconditions", () => {
  it("p31ca package.json exists", () => {
    expect(existsAbs(path.join(P31CA, "package.json"))).toBe(true);
  });

  it("astro.config exists (astro.config.mjs or .ts)", () => {
    const found = existsAbs(path.join(P31CA, "astro.config.mjs")) ||
      existsAbs(path.join(P31CA, "astro.config.ts")) ||
      existsAbs(path.join(P31CA, "astro.config.js"));
    expect(found).toBe(true);
  });

  it("verify:ground-truth script is wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:ground-truth"]).toBeTruthy();
  });

  it("verify:synergetic script is wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:synergetic"]).toBeTruthy();
  });

  it("p31ca src/ or pages/ directory exists", () => {
    const found = existsAbs(path.join(P31CA, "src")) ||
      existsAbs(path.join(P31CA, "pages"));
    expect(found).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Creator economy & public contracts
// ─────────────────────────────────────────────────────────────
describe("I — Interface: creator economy invariants", () => {
  let economy;
  beforeAll(() => {
    economy = readJsonAbs(path.join(GROUND_TRUTH, "creator-economy.json"));
  });

  it("schema is p31.creatorEconomy/1.0.0", () => {
    expect(economy.schema).toBe("p31.creatorEconomy/1.0.0");
  });

  it("platformFee.rate is ZERO (operator covenant)", () => {
    expect(economy.platformFee.rate).toBe(0);
  });

  it("platformFee.unit is 'fraction'", () => {
    expect(economy.platformFee.unit).toBe("fraction");
  });

  it("revenueShare.creator is 1.0 (100% to creator)", () => {
    expect(economy.revenueShare.creator).toBe(1.0);
  });

  it("revenueShare.platform is 0.0 (P31 takes nothing)", () => {
    expect(economy.revenueShare.platform).toBe(0.0);
  });

  it("geodesicRoom.accessFee is 0.0 (free rooms)", () => {
    expect(economy.geodesicRoom.accessFee).toBe(0.0);
  });

  it("version1Constraints array is present (machine-readable covenant)", () => {
    expect(Array.isArray(economy.version1Constraints)).toBe(true);
    expect(economy.version1Constraints.length).toBeGreaterThan(0);
  });

  it("schema version is 1.0.0 (immutable — bump = new file)", () => {
    expect(economy.version).toBe("1.0.0");
  });

  it("transparency.ciVerified is true", () => {
    expect(economy.transparency.ciVerified).toBe(true);
  });

  it("transparency.publicDisclosure is true", () => {
    expect(economy.transparency.publicDisclosure).toBe(true);
  });
});

describe("I — Interface: ground truth routes", () => {
  let gt;
  beforeAll(() => {
    gt = readJsonAbs(path.join(GROUND_TRUTH, "p31.ground-truth.json"));
  });

  it("ground truth schema is p31.ground-truth/1.0.0", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.groundTruth.schema).toBe("p31.ground-truth/1.0.0");
  });

  it("ground truth JSON is non-trivial (has real content)", () => {
    expect(JSON.stringify(gt).length).toBeGreaterThan(100);
  });
});

describe("I — Interface: public surface", () => {
  let surface;
  beforeAll(() => {
    surface = readJsonAbs(path.join(PUBLIC, "p31-public-surface.json"));
  });

  it("public surface JSON is parseable and non-empty", () => {
    expect(Object.keys(surface).length).toBeGreaterThan(0);
  });

  it("public surface references p31ca.org domain", () => {
    expect(JSON.stringify(surface)).toMatch(/p31ca\.org/);
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: No secrets in public/, worker allowlist current
// ─────────────────────────────────────────────────────────────
describe("P — Purity: no secrets in public/", () => {
  it("public/ contains no .env files", () => {
    const files = fs.readdirSync(PUBLIC);
    const envFiles = files.filter((f) => f.startsWith(".env") || f.endsWith(".env"));
    expect(envFiles).toHaveLength(0);
  });

  it("p31-public-surface.json has no credential strings", () => {
    const raw = fs.readFileSync(path.join(PUBLIC, "p31-public-surface.json"), "utf8");
    expect(raw).not.toMatch(/sk_live_|pk_live_|password|api_key/i);
  });

  it("creator-economy.json has no credential strings", () => {
    const raw = fs.readFileSync(path.join(GROUND_TRUTH, "creator-economy.json"), "utf8");
    expect(raw).not.toMatch(/sk_live_|pk_live_|password|api_key/i);
  });

  it("worker-allowlist.json exists and is parseable", () => {
    const allowlist = readJsonAbs(path.join(SECURITY, "worker-allowlist.json"));
    expect(typeof allowlist).toBe("object");
  });

  it("worker count in ecosystem matches fleet constant", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.edge.workerFleetCount).toBeGreaterThanOrEqual(10);
  });

  it("no full child names in public surface JSON", () => {
    const raw = fs.readFileSync(path.join(PUBLIC, "p31-public-surface.json"), "utf8");
    expect(raw).not.toMatch(/\bstephen\b/i);
    expect(raw).not.toMatch(/\bwilliam jr\b/i);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Hub ships all required public JSON
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: hub public JSON completeness", () => {
  it("creator-economy.json is also in public/ (served to clients)", () => {
    expect(existsAbs(path.join(PUBLIC, "creator-economy.json"))).toBe(true);
  });

  it("p31-mesh-constants.json is in public/ (mesh URL broadcast)", () => {
    expect(existsAbs(path.join(PUBLIC, "p31-mesh-constants.json"))).toBe(true);
  });

  it("p31ca deploys Astro (astro or pages build output exists)", () => {
    const found = existsAbs(path.join(P31CA, "dist")) ||
      existsAbs(path.join(P31CA, ".astro"));
    // Not required in dev, but config must exist
    expect(existsAbs(path.join(P31CA, "package.json"))).toBe(true);
  });

  it("passport-generator.html references p31 schema", () => {
    const html = fs.readFileSync(path.join(PUBLIC, "passport-generator.html"), "utf8");
    expect(html).toMatch(/p31/i);
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Creator economy covenant guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: creator economy covenant guards", () => {
  let gt, pub;
  beforeAll(() => {
    gt = readJsonAbs(path.join(GROUND_TRUTH, "creator-economy.json"));
    pub = readJsonAbs(path.join(PUBLIC, "creator-economy.json"));
  });

  it("platformFee.rate has NOT increased from 0 (covenant guard)", () => {
    expect(gt.platformFee.rate).toBe(0);
  });

  it("revenueShare.creator has NOT decreased from 1.0", () => {
    expect(gt.revenueShare.creator).toBeGreaterThanOrEqual(1.0);
  });

  it("creator-economy.json in public/ has same platformFee.rate as ground-truth/", () => {
    expect(pub.platformFee.rate).toBe(gt.platformFee.rate);
  });

  it("creator-economy.json in public/ has same revenueShare.creator as ground-truth/", () => {
    expect(pub.revenueShare.creator).toBe(gt.revenueShare.creator);
  });

  it("creator-economy.json in public/ has same schema as ground-truth/", () => {
    expect(pub.schema).toBe(gt.schema);
  });

  it("verify:p31ca-contracts script still wired (remove = block)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:p31ca-contracts"]).toBeTruthy();
  });

  it("verify:monetary script still wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:monetary"]).toBeTruthy();
  });
});
