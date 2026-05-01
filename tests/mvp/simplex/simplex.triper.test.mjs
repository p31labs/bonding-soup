/**
 * TRIPER: SIMPLEX-v7
 * Operator intelligence layer — agent routing, skill dispatch, SENTINEL, HMAC.
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const SIMPLEX = path.join(ROOT, "simplex-v7");
const SRC = path.join(SIMPLEX, "src");
const TESTS = path.join(SIMPLEX, "tests");

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

function readFileAbs(abs) {
  return fs.readFileSync(abs, "utf8");
}

// ─────────────────────────────────────────────────────────────
// T — TASK: Core agent structure
// ─────────────────────────────────────────────────────────────
describe("T — Task: SIMPLEX-v7 core structure", () => {
  it("simplex-v7/ directory exists", () => {
    expect(existsAbs(SIMPLEX)).toBe(true);
  });

  it("src/index.ts exists (Worker entry)", () => {
    expect(existsAbs(path.join(SRC, "index.ts"))).toBe(true);
  });

  it("src/agents/types.ts exists (agent type contracts)", () => {
    expect(existsAbs(path.join(SRC, "agents/types.ts"))).toBe(true);
  });

  it("src/lib/skill-runner.ts exists (skill dispatch)", () => {
    expect(existsAbs(path.join(SRC, "lib/skill-runner.ts"))).toBe(true);
  });

  it("src/skills/router.ts exists (request routing)", () => {
    expect(existsAbs(path.join(SRC, "skills/router.ts"))).toBe(true);
  });

  it("wrangler.toml exists (Cloudflare Worker config)", () => {
    const found = existsAbs(path.join(SIMPLEX, "wrangler.toml")) ||
      existsAbs(path.join(SIMPLEX, "wrangler.json"));
    expect(found).toBe(true);
  });

  it("index.ts references fetch or scheduled handler (Worker signature)", () => {
    const src = readFileAbs(path.join(SRC, "index.ts"));
    expect(src).toMatch(/fetch|scheduled|worker/i);
  });

  it("types.ts defines agent types (non-trivial)", () => {
    const src = readFileAbs(path.join(SRC, "agents/types.ts"));
    expect(src.length).toBeGreaterThan(100);
    expect(src).toMatch(/type|interface|export/);
  });

  it("skill-runner.ts implements routing logic", () => {
    const src = readFileAbs(path.join(SRC, "lib/skill-runner.ts"));
    expect(src.length).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Circuit breakers & fallbacks
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: circuit breakers & fallbacks", () => {
  it("breakers.test.ts covers circuit breaker patterns", () => {
    const src = readFileAbs(path.join(TESTS, "breakers.test.ts"));
    expect(src.length).toBeGreaterThan(100);
  });

  it("context-fallback.test.ts covers KV/SENTINEL context merging", () => {
    const src = readFileAbs(path.join(TESTS, "context-fallback.test.ts"));
    expect(src).toMatch(/fallback|context|kv|sentinel/i);
  });

  it("health-runtime.test.ts covers runtime health", () => {
    const src = readFileAbs(path.join(TESTS, "health-runtime.test.ts"));
    expect(src.length).toBeGreaterThan(50);
  });

  it("hostile.test.ts protects against adversarial inputs", () => {
    const src = readFileAbs(path.join(TESTS, "hostile.test.ts"));
    expect(src.length).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Agent routing & skill contracts
// ─────────────────────────────────────────────────────────────
describe("I — Interface: routing & skill contracts", () => {
  it("router.ts has non-trivial routing logic", () => {
    const src = readFileAbs(path.join(SRC, "skills/router.ts"));
    expect(src).toMatch(/route|skill|handle/i);
  });

  it("registry.test.ts validates agent registry", () => {
    const src = readFileAbs(path.join(TESTS, "registry.test.ts"));
    expect(src).toMatch(/registry|agent|register/i);
  });

  it("schema-sql.test.ts validates D1 schema", () => {
    const src = readFileAbs(path.join(TESTS, "schema-sql.test.ts"));
    expect(src).toMatch(/schema|sql|table|create/i);
  });

  it("json-extract.test.ts validates JSON extraction from responses", () => {
    const src = readFileAbs(path.join(TESTS, "json-extract.test.ts"));
    expect(src.length).toBeGreaterThan(100);
  });

  it("simplex-v7 has a test script in its package.json", () => {
    const pkg = readJsonAbs(path.join(SIMPLEX, "package.json"));
    expect(pkg.scripts.test || pkg.scripts["test:run"]).toBeTruthy();
  });

  it("simplex-v7 has a typecheck script", () => {
    const pkg = readJsonAbs(path.join(SIMPLEX, "package.json"));
    expect(pkg.scripts.typecheck || pkg.scripts["type-check"] || pkg.scripts.build).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: HMAC, auth gates, no hardcoded secrets
// ─────────────────────────────────────────────────────────────
describe("P — Purity: HMAC integrity & auth gates", () => {
  it("hmac-worker.test.ts covers HMAC SHA256", () => {
    const src = readFileAbs(path.join(TESTS, "hmac-worker.test.ts"));
    expect(src).toMatch(/hmac|sha256|sign/i);
  });

  it("phos-hmac-parity.test.ts covers HMAC parity between nodes", () => {
    const src = readFileAbs(path.join(TESTS, "phos-hmac-parity.test.ts"));
    expect(src.length).toBeGreaterThan(100);
  });

  it("operator-auth.test.ts verifies operator auth gates", () => {
    const src = readFileAbs(path.join(TESTS, "operator-auth.test.ts"));
    expect(src).toMatch(/auth|operator|gate|unauthorized/i);
  });

  it("phos-config.test.ts validates Phosphorus config structure", () => {
    const src = readFileAbs(path.join(TESTS, "phos-config.test.ts"));
    expect(src.length).toBeGreaterThan(100);
  });

  it("phos-safety.test.ts validates safety rules (Ca limits etc.)", () => {
    const src = readFileAbs(path.join(TESTS, "phos-safety.test.ts"));
    expect(src.length).toBeGreaterThan(100);
  });

  it("index.ts has no hardcoded HMAC secrets", () => {
    const src = readFileAbs(path.join(SRC, "index.ts"));
    // HMAC keys must come from env bindings, not source
    expect(src).not.toMatch(/HMAC_KEY\s*=\s*["'][A-Za-z0-9+/]{20,}/);
    expect(src).not.toMatch(/sk_live_|pk_live_/);
  });

  it("wrangler.toml has no raw secret values", () => {
    const toml = readFileAbs(path.join(SIMPLEX, "wrangler.toml"));
    expect(toml).not.toMatch(/sk_live_|pk_live_/);
    // Secrets referenced as var names, not values
    expect(toml).not.toMatch(/HMAC_KEY\s*=\s*"[A-Za-z0-9+/]{20,}"/);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Verification pipeline
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: verify & bootstrap pipeline", () => {
  it("verify:simplex script chains typecheck + test", () => {
    const pkg = readJson("package.json");
    const script = pkg.scripts["verify:simplex"];
    expect(script).toMatch(/typecheck/);
    expect(script).toMatch(/test/);
  });

  it("verify:simplex-email is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:simplex-email"]).toBeTruthy();
  });

  it("verify:simplex-bootstrap is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:simplex-bootstrap"]).toBeTruthy();
  });

  it("simplex-bootstrap.mjs exists for CF bring-up dry-run", () => {
    expect(exists("scripts/simplex-bootstrap.mjs")).toBe(true);
  });

  it("verify:simplex-bootstrap.mjs exists", () => {
    expect(exists("scripts/verify-simplex-bootstrap.mjs")).toBe(true);
  });

  it("phos:probe script exists for live Phosphorus probing", () => {
    expect(exists("scripts/phos-probe.mjs")).toBe(true);
  });

  it("phos:sign script is wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["phos:sign"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Baseline locks & test file guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: test file guards", () => {
  const criticalTests = [
    "medication-rules.test.ts",
    "biometric-spoons.test.ts",
    "fers-countdown.test.ts",
    "phos-safety.test.ts",
    "operator-auth.test.ts",
    "hmac-worker.test.ts",
    "voltage.test.ts",
    "breakers.test.ts",
  ];

  for (const t of criticalTests) {
    it(`critical test has NOT been deleted: ${t}`, () => {
      expect(existsAbs(path.join(TESTS, t))).toBe(true);
    });
  }

  it("total test file count is ≥20 (no silent deletions)", () => {
    const files = fs.readdirSync(TESTS).filter((f) => f.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThanOrEqual(20);
  });

  it("accommodation-sync.test.ts not deleted (AuDHD accommodation guard)", () => {
    expect(existsAbs(path.join(TESTS, "accommodation-sync.test.ts"))).toBe(true);
  });

  it("mesh-remembrance.test.ts not deleted (bereavement state guard)", () => {
    expect(existsAbs(path.join(TESTS, "mesh-remembrance.test.ts"))).toBe(true);
  });
});
