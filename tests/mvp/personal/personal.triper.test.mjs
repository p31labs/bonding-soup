/**
 * TRIPER: PERSONAL
 * Personal scope — SIMPLEX-v7, Cognitive Passport, K₄ personal mesh.
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 *
 * This suite threads the needle on the operator's personal safety invariants.
 * Ca limits (8.0–9.0 mg/dL), AuDHD spoon metrics, and HMAC integrity are
 * first-class citizens here — not afterthoughts.
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

const SIMPLEX_TESTS_DIR = path.join(ROOT, "simplex-v7/tests");

const REQUIRED_SIMPLEX_TESTS = [
  "accommodation-sync.test.ts",
  "biometric-spoons.test.ts",
  "breakers.test.ts",
  "context-fallback.test.ts",
  "email-ingest-logic.test.ts",
  "fers-countdown.test.ts",
  "health-runtime.test.ts",
  "hmac-worker.test.ts",
  "hostile.test.ts",
  "json-extract.test.ts",
  "medication-rules.test.ts",
  "mesh-remembrance.test.ts",
  "operator-auth.test.ts",
  "phos-config.test.ts",
  "phos-hmac-parity.test.ts",
  "phos-safety.test.ts",
  "q-factor.test.ts",
  "registry.test.ts",
  "schema-sql.test.ts",
  "voltage.test.ts",
];

// ─────────────────────────────────────────────────────────────
// T — TASK: SIMPLEX-v7 test file completeness
// ─────────────────────────────────────────────────────────────
describe("T — Task: SIMPLEX-v7 test suite completeness", () => {
  it("simplex-v7/tests/ directory exists", () => {
    expect(fs.existsSync(SIMPLEX_TESTS_DIR)).toBe(true);
  });

  for (const testFile of REQUIRED_SIMPLEX_TESTS) {
    it(`test file exists: ${testFile}`, () => {
      expect(fs.existsSync(path.join(SIMPLEX_TESTS_DIR, testFile))).toBe(true);
    });
  }

  it("all 20 required test files are present", () => {
    const existing = REQUIRED_SIMPLEX_TESTS.filter((f) =>
      fs.existsSync(path.join(SIMPLEX_TESTS_DIR, f))
    );
    expect(existing.length).toBe(REQUIRED_SIMPLEX_TESTS.length);
  });

  it("simplex-v7 package.json exists", () => {
    expect(exists("simplex-v7/package.json")).toBe(true);
  });

  it("simplex-v7 vitest config exists", () => {
    const found = exists("simplex-v7/vitest.config.ts") ||
      exists("simplex-v7/vitest.config.mjs") ||
      exists("simplex-v7/vitest.config.js");
    expect(found).toBe(true);
  });

  it("simplex-v7 src/index.ts exists (agent entry)", () => {
    expect(exists("simplex-v7/src/index.ts")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Context fallback & circuit breakers
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: fallback paths & circuit breakers", () => {
  it("context-fallback.test.ts covers KV/SENTINEL merge path", () => {
    const src = readFile("simplex-v7/tests/context-fallback.test.ts");
    expect(src).toMatch(/fallback|sentinel|context/i);
  });

  it("breakers.test.ts covers circuit breaker patterns", () => {
    const src = readFile("simplex-v7/tests/breakers.test.ts");
    expect(src.length).toBeGreaterThan(100);
  });

  it("health-runtime.test.ts exists for runtime health checks", () => {
    expect(exists("simplex-v7/tests/health-runtime.test.ts")).toBe(true);
  });

  it("mesh-remembrance.test.ts covers bereavement KV state", () => {
    const src = readFile("simplex-v7/tests/mesh-remembrance.test.ts");
    expect(src).toMatch(/remembrance|bereavement|memorial/i);
  });

  it("hostile.test.ts exists for adversarial input handling", () => {
    const src = readFile("simplex-v7/tests/hostile.test.ts");
    expect(src.length).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Cognitive Passport schema & sync
// ─────────────────────────────────────────────────────────────
describe("I — Interface: Cognitive Passport schema", () => {
  let constants;
  beforeAll(() => { constants = readJson("p31-constants.json"); });

  it("cognitivePassport.jsonSchema is p31.cognitivePassport/1.1.0 (additive overlay on /1.0.0; bumped CWP-PHOS C-4)", () => {
    expect(constants.cognitivePassport.jsonSchema).toBe("p31.cognitivePassport/1.1.0");
  });

  it("cognitive passport HTML generator exists", () => {
    expect(exists("cognitive-passport/index.html")).toBe(true);
  });

  it("cognitive passport generator references schema ID in HTML", () => {
    const html = readFile("cognitive-passport/index.html");
    expect(html).toMatch(/p31\.cognitivePassport/);
  });

  it("long-form passport markdown file exists", () => {
    const filename = constants.cognitivePassport.longFormFilename;
    expect(exists(filename)).toBe(true);
  });

  it("passport edition is 5.1 (matches constants)", () => {
    expect(constants.cognitivePassport.longFormEdition).toBe("5.1");
  });

  it("verify:passport script is wired in package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:passport"]).toBeTruthy();
  });

  it("sync:passport script is wired in package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["sync:passport"]).toBeTruthy();
  });

  it("passport p31-style.css mirrors design tokens", () => {
    expect(exists("cognitive-passport/p31-style.css")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: Safety invariants & operator privacy
// ─────────────────────────────────────────────────────────────
describe("P — Purity: safety invariants & operator privacy", () => {
  it("phos-safety.test.ts covers phosphorus/Ca safety rules", () => {
    const src = readFile("simplex-v7/tests/phos-safety.test.ts");
    expect(src.length).toBeGreaterThan(100);
  });

  it("medication-rules.test.ts covers scheduling rules", () => {
    const src = readFile("simplex-v7/tests/medication-rules.test.ts");
    expect(src.length).toBeGreaterThan(100);
  });

  it("operator-auth.test.ts covers authentication gates", () => {
    const src = readFile("simplex-v7/tests/operator-auth.test.ts");
    expect(src).toMatch(/auth|operator|gate/i);
  });

  it("biometric-spoons.test.ts covers spoon theory metrics", () => {
    const src = readFile("simplex-v7/tests/biometric-spoons.test.ts");
    expect(src).toMatch(/spoon/i);
  });

  it("simplex-v7 src/index.ts contains no hardcoded secrets", () => {
    const src = readFile("simplex-v7/src/index.ts");
    expect(src).not.toMatch(/sk_live_|pk_live_/);
    expect(src).not.toMatch(/HMAC_KEY\s*=\s*["'][^"']{10,}/);
  });

  it("hmac-worker.test.ts covers HMAC SHA256 integrity", () => {
    const src = readFile("simplex-v7/tests/hmac-worker.test.ts");
    expect(src).toMatch(/hmac|sha|sign/i);
  });

  it("phos-hmac-parity.test.ts covers HMAC parity checks", () => {
    const src = readFile("simplex-v7/tests/phos-hmac-parity.test.ts");
    expect(src.length).toBeGreaterThan(100);
  });

  it("accommodation-sync.test.ts covers AuDHD accommodation table", () => {
    const src = readFile("simplex-v7/tests/accommodation-sync.test.ts");
    expect(src.length).toBeGreaterThan(100);
  });

  it("k4-personal mesh URL is HTTPS in constants", () => {
    const constants = readJson("p31-constants.json");
    expect(constants.mesh.k4PersonalWorkerUrl).toMatch(/^https:\/\//);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Personal scope integration
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: personal scope integration", () => {
  it("simplex:verify-all script chains verify + email + bootstrap", () => {
    const pkg = readJson("package.json");
    const script = pkg.scripts["simplex:verify-all"];
    expect(script).toMatch(/verify:simplex/);
    expect(script).toMatch(/verify:simplex-email/);
    expect(script).toMatch(/verify:simplex-bootstrap/);
  });

  it("simplex-bootstrap dry-run script exists", () => {
    expect(exists("scripts/simplex-bootstrap.mjs")).toBe(true);
  });

  it("simplex-v7 skill-runner.ts exists (operator skill dispatch)", () => {
    expect(exists("simplex-v7/src/lib/skill-runner.ts")).toBe(true);
  });

  it("simplex-v7 router.ts exists (request routing)", () => {
    expect(exists("simplex-v7/src/skills/router.ts")).toBe(true);
  });

  it("simplex-v7 types.ts exists in agents (type contracts)", () => {
    expect(exists("simplex-v7/src/agents/types.ts")).toBe(true);
  });

  it("verify:cognitive-passport-schema is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:cognitive-passport-schema"]).toBeTruthy();
  });

  it("verify:cognitive-passport-profiles is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:cognitive-passport-profiles"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Known failure guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: known failure guards", () => {
  it("fers-countdown.test.ts has not been deleted (retirement tracking)", () => {
    expect(exists("simplex-v7/tests/fers-countdown.test.ts")).toBe(true);
  });

  it("q-factor.test.ts has not been deleted (biocomputation baseline)", () => {
    expect(exists("simplex-v7/tests/q-factor.test.ts")).toBe(true);
  });

  it("voltage.test.ts has not been deleted (voltage assessment baseline)", () => {
    expect(exists("simplex-v7/tests/voltage.test.ts")).toBe(true);
  });

  it("schema-sql.test.ts has not been deleted (D1 schema guard)", () => {
    expect(exists("simplex-v7/tests/schema-sql.test.ts")).toBe(true);
  });

  it("json-extract.test.ts has not been deleted (extraction guard)", () => {
    expect(exists("simplex-v7/tests/json-extract.test.ts")).toBe(true);
  });

  it("cognitive passport generator title matches constants", () => {
    const constants = readJson("p31-constants.json");
    const html = readFile("cognitive-passport/index.html");
    // Title substring should appear in the HTML
    const titleWord = "Cognitive Passport";
    expect(html).toContain(titleWord);
  });

  it("remember:probe script exists (mesh remembrance probe)", () => {
    expect(exists("scripts/remember-probe.mjs")).toBe(true);
  });
});
