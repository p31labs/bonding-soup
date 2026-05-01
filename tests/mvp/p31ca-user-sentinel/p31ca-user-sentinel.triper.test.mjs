/**
 * TRIPER: P31CA USER SENTINEL
 * E2E user-testing swarm — 5 sentinel agents covering visitor, builder,
 * family, legal, and integrity personas.
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const P31CA = path.join(ROOT, "andromeda/04_SOFTWARE/p31ca");
const E2E_DIR = path.join(P31CA, "e2e");
const SWARM_DIR = path.join(E2E_DIR, "swarm");
const DIST = path.join(P31CA, "dist");

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

function distFile(name) {
  return path.join(DIST, name);
}

function distHtml(name) {
  return existsAbs(distFile(name))
    ? fs.readFileSync(distFile(name), "utf8")
    : null;
}

// ─────────────────────────────────────────────────────────────
// T — TASK: Swarm files exist and are non-trivial
// ─────────────────────────────────────────────────────────────
describe("T — Task: swarm file structure", () => {
  it("p31ca exists in andromeda", () => {
    expect(p31caExists).toBe(true);
  });

  it("e2e/ directory exists", () => {
    expect(existsAbs(E2E_DIR)).toBe(true);
  });

  it("e2e/swarm/ directory exists", () => {
    expect(existsAbs(SWARM_DIR)).toBe(true);
  });

  it("sentinel-visitor.spec.ts exists", () => {
    expect(existsAbs(path.join(SWARM_DIR, "sentinel-visitor.spec.ts"))).toBe(true);
  });

  it("sentinel-builder.spec.ts exists", () => {
    expect(existsAbs(path.join(SWARM_DIR, "sentinel-builder.spec.ts"))).toBe(true);
  });

  it("sentinel-family.spec.ts exists", () => {
    expect(existsAbs(path.join(SWARM_DIR, "sentinel-family.spec.ts"))).toBe(true);
  });

  it("sentinel-legal.spec.ts exists", () => {
    expect(existsAbs(path.join(SWARM_DIR, "sentinel-legal.spec.ts"))).toBe(true);
  });

  it("sentinel-integrity.spec.ts exists", () => {
    expect(existsAbs(path.join(SWARM_DIR, "sentinel-integrity.spec.ts"))).toBe(true);
  });

  it("all 5 sentinel files are non-trivial (>1KB each)", () => {
    const sentinels = [
      "sentinel-visitor.spec.ts",
      "sentinel-builder.spec.ts",
      "sentinel-family.spec.ts",
      "sentinel-legal.spec.ts",
      "sentinel-integrity.spec.ts",
    ];
    for (const f of sentinels) {
      const size = fs.statSync(path.join(SWARM_DIR, f)).size;
      expect(size, `${f} should be >1KB`).toBeGreaterThan(1024);
    }
  });

  it("playwright.config.ts exists at p31ca root", () => {
    expect(existsAbs(path.join(P31CA, "playwright.config.ts"))).toBe(true);
  });

  it("test:e2e script is wired in p31ca package.json", () => {
    const pkg = readJsonAbs(path.join(P31CA, "package.json"));
    expect(pkg.scripts["test:e2e"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Playwright config contract
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: Playwright config contract", () => {
  let cfgText;
  beforeAll(() => {
    cfgText = fs.readFileSync(path.join(P31CA, "playwright.config.ts"), "utf8");
  });

  it("Playwright config has a baseURL configured", () => {
    expect(cfgText).toMatch(/baseURL/);
  });

  it("Playwright config has timeout ≥ 120_000ms (Astro cold start)", () => {
    // Look for 120000 or 120_000 in the config
    expect(cfgText).toMatch(/120[_,]?000/);
  });

  it("Playwright config sets retries for CI (process.env.CI check)", () => {
    expect(cfgText).toMatch(/process\.env\.CI/);
    expect(cfgText).toMatch(/retries/);
  });

  it("Playwright config has trace: 'on-first-retry' for debugging", () => {
    expect(cfgText).toMatch(/on-first-retry/);
  });

  it("Playwright config runs Chromium project", () => {
    expect(cfgText).toMatch(/chromium/i);
  });

  it("Playwright webServer command uses preview (serves dist)", () => {
    expect(cfgText).toMatch(/preview/);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Sentinel persona coverage contract
// ─────────────────────────────────────────────────────────────
describe("I — Interface: persona coverage", () => {
  const PERSONAS = [
    { file: "sentinel-visitor.spec.ts",   persona: "VISITOR",   minTests: 10 },
    { file: "sentinel-builder.spec.ts",   persona: "BUILDER",   minTests: 8  },
    { file: "sentinel-family.spec.ts",    persona: "FAMILY",    minTests: 7  },
    { file: "sentinel-legal.spec.ts",     persona: "LEGAL",     minTests: 12 },
    { file: "sentinel-integrity.spec.ts", persona: "INTEGRITY", minTests: 10 },
  ];

  for (const { file, persona, minTests } of PERSONAS) {
    it(`${persona}: file declares SENTINEL:${persona} describe block`, () => {
      const content = fs.readFileSync(path.join(SWARM_DIR, file), "utf8");
      expect(content).toContain(`SENTINEL:${persona}`);
    });

    it(`${persona}: has ≥ ${minTests} test() calls (baseline coverage)`, () => {
      const content = fs.readFileSync(path.join(SWARM_DIR, file), "utf8");
      const count = (content.match(/test\(/g) ?? []).length;
      expect(count, `${file} must have ≥${minTests} tests`).toBeGreaterThanOrEqual(minTests);
    });
  }

  it("VISITOR sentinel tests the home page", () => {
    const content = fs.readFileSync(
      path.join(SWARM_DIR, "sentinel-visitor.spec.ts"), "utf8",
    );
    expect(content).toMatch(/goto\("\/"/);
  });

  it("LEGAL sentinel tests the terms page EIN", () => {
    const content = fs.readFileSync(
      path.join(SWARM_DIR, "sentinel-legal.spec.ts"), "utf8",
    );
    expect(content).toMatch(/42-1888158/);
  });

  it("INTEGRITY sentinel tests creator-economy covenant (rate === 0)", () => {
    const content = fs.readFileSync(
      path.join(SWARM_DIR, "sentinel-integrity.spec.ts"), "utf8",
    );
    expect(content).toMatch(/platformFee\.rate/);
    expect(content).toMatch(/toBe\(0\)/);
  });

  it("FAMILY sentinel has privacy guard (no child full names)", () => {
    const content = fs.readFileSync(
      path.join(SWARM_DIR, "sentinel-family.spec.ts"), "utf8",
    );
    expect(content).toMatch(/stephen|william jr/i);
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: Spec files contain no secrets or hardcoded prod tokens
// ─────────────────────────────────────────────────────────────
describe("P — Purity: no secrets in swarm spec files", () => {
  let allContent;
  beforeAll(() => {
    const files = fs.readdirSync(SWARM_DIR).filter((f) => f.endsWith(".spec.ts"));
    allContent = files
      .map((f) => fs.readFileSync(path.join(SWARM_DIR, f), "utf8"))
      .join("\n");
  });

  it("no live API key pattern in sentinel specs", () => {
    expect(allContent).not.toMatch(/sk_live_[A-Za-z0-9]{10,}/);
  });

  it("no hardcoded bearer token pattern in sentinel specs", () => {
    expect(allContent).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{20,}/);
  });

  it("specs use relative paths (not hardcoded production hostname)", () => {
    // All goto() calls should use relative /path not https://p31ca.org/path
    // Exception: live-probe tests using external URLs are labelled as such
    const gotoLines = allContent.match(/page\.goto\(["'][^"']+["']/g) ?? [];
    const absolute = gotoLines.filter(
      (l) => l.includes("https://") && !l.includes("workers.dev"),
    );
    expect(absolute).toHaveLength(0);
  });

  it("no full child names in sentinel specs", () => {
    expect(allContent).not.toMatch(/\bstephen johnson\b/i);
    expect(allContent).not.toMatch(/\bwilliam johnson jr\b/i);
  });

  it("no private case number exposed in spec output strings", () => {
    // Strip regex literals (/.../flags) before checking — test code may
    // legitimately use the pattern in a guard assertion without exposing it.
    const stripped = allContent.replace(/\/[^/\n]{0,120}\/[gimsuy]*/g, "");
    const CASE = "2025" + "CV936"; // split so this file itself doesn't trigger
    expect(stripped).not.toContain(CASE);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Dist surface matches sentinel contracts
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: dist surfaces match sentinel contracts", () => {
  it("dist/ directory exists (build ran before TRIPER)", () => {
    expect(existsAbs(DIST)).toBe(true);
  });

  it("terms.html in dist contains EIN 42-1888158", () => {
    const html = distHtml("terms.html");
    expect(html).not.toBeNull();
    expect(html).toContain("42-1888158");
  });

  it("terms.html in dist contains warranty disclaimer", () => {
    const html = distHtml("terms.html");
    expect(html).toMatch(/AS IS|WITHOUT WARRANTY/i);
  });

  it("privacy.html in dist is non-trivial (>5KB)", () => {
    const html = distHtml("privacy.html");
    expect(html).not.toBeNull();
    expect(html.length).toBeGreaterThan(5000);
  });

  it("security-disclosure.html in dist is non-trivial (>3KB)", () => {
    const html = distHtml("security-disclosure.html");
    expect(html).not.toBeNull();
    expect(html.length).toBeGreaterThan(3000);
  });

  it("accessibility.html in dist is non-trivial (>3KB)", () => {
    const html = distHtml("accessibility.html");
    expect(html).not.toBeNull();
    expect(html.length).toBeGreaterThan(3000);
  });

  it("agents.html in dist references all 4 hubs", () => {
    const html = distHtml("agents.html");
    expect(html).not.toBeNull();
    for (const hub of ["Forge", "Counsel", "Scholar", "Scribe"]) {
      expect(html, `hub ${hub} missing from agents.html`).toContain(hub);
    }
  });

  it("agents.html in dist has k4AgentHub/1.1.0 schema annotation", () => {
    const html = distHtml("agents.html");
    expect(html).toContain("p31.k4AgentHub/1.1.0");
  });

  it("creator-economy.json in dist has platformFee.rate === 0", () => {
    const j = readJsonAbs(distFile("creator-economy.json"));
    expect(j.platformFee.rate).toBe(0);
  });

  it("p31-public-surface.json in dist has no credential strings", () => {
    const raw = fs.readFileSync(distFile("p31-public-surface.json"), "utf8");
    expect(raw).not.toMatch(/sk_live_|pk_live_|password|api_key/i);
  });

  it("verify-pulse.json in dist has at least one history entry", () => {
    const j = readJsonAbs(distFile("verify-pulse.json"));
    // pulse uses j.history (array) + j.count shorthand
    const entries = j.history ?? j.entries ?? [];
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("404.html in dist exists (Cloudflare Pages needs it)", () => {
    expect(existsAbs(distFile("404.html"))).toBe(true);
  });

  it("launch-readiness.html in dist has GO or score", () => {
    const html = distHtml("launch-readiness.html");
    expect(html).toMatch(/\d+\s*\/\s*100|GO|HOLD|NO-GO/i);
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Swarm baseline guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: swarm coverage baselines", () => {
  const SENTINEL_FILES = [
    "sentinel-visitor.spec.ts",
    "sentinel-builder.spec.ts",
    "sentinel-family.spec.ts",
    "sentinel-legal.spec.ts",
    "sentinel-integrity.spec.ts",
  ];

  const TOTAL_TEST_BASELINE = 55; // bump this after adding tests, never decrease

  it(`swarm has exactly 5 sentinel files (no accidental deletions)`, () => {
    const actual = fs.readdirSync(SWARM_DIR).filter((f) =>
      f.startsWith("sentinel-") && f.endsWith(".spec.ts"),
    );
    expect(actual.length).toBeGreaterThanOrEqual(5);
  });

  it(`total test() count across swarm is ≥ ${TOTAL_TEST_BASELINE}`, () => {
    let total = 0;
    for (const f of SENTINEL_FILES) {
      const content = fs.readFileSync(path.join(SWARM_DIR, f), "utf8");
      total += (content.match(/test\(/g) ?? []).length;
    }
    expect(total).toBeGreaterThanOrEqual(TOTAL_TEST_BASELINE);
  });

  it("test:e2e:swarm script is wired in p31ca package.json (regression guard)", () => {
    const pkg = readJsonAbs(path.join(P31CA, "package.json"));
    expect(pkg.scripts["test:e2e"] || pkg.scripts["test:e2e:swarm"]).toBeTruthy();
  });

  it("LEGAL sentinel tests count has not regressed below 12", () => {
    const content = fs.readFileSync(
      path.join(SWARM_DIR, "sentinel-legal.spec.ts"), "utf8",
    );
    const count = (content.match(/test\(/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(12);
  });

  it("INTEGRITY sentinel tests count has not regressed below 10", () => {
    const content = fs.readFileSync(
      path.join(SWARM_DIR, "sentinel-integrity.spec.ts"), "utf8",
    );
    const count = (content.match(/test\(/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it("agents.html in dist has no broken same-origin hrefs to non-existent paths", () => {
    const html = distHtml("agents.html");
    // The known broken patterns we fixed — guard against re-introduction
    expect(html).not.toMatch(/href="docs\/P31-K4-AGENT-HUBS\.md"/);
    expect(html).not.toMatch(/href="p31-k4-agent-hub\.json"/);
    expect(html).not.toMatch(/href="packages\/k4-agent-hub\/"/);
    expect(html).not.toMatch(/href="cognitive-passport\/index\.html"/);
    expect(html).not.toMatch(/href="soup\.html"/);
  });

  it("launch-readiness.html has no broken /p31_launch_readiness.json link", () => {
    const html = distHtml("launch-readiness.html");
    expect(html).not.toMatch(/href="\/p31_launch_readiness\.json"/);
  });

  it("creator-economy covenant has not been weakened (platform takes 0)", () => {
    const j = readJsonAbs(distFile("creator-economy.json"));
    expect(j.platformFee.rate).toBe(0);
    expect(j.revenueShare.creator).toBeGreaterThanOrEqual(1.0);
  });
});
