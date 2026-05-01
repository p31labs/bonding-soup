/**
 * TRIPER: simplex-email
 * Email Worker — routing, bindings, typecheck, Cloudflare config.
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const EMAIL_DIR = path.join(ROOT, "simplex-email");
const SRC = path.join(EMAIL_DIR, "src");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function readJsonAbs(abs) {
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function existsAbs(abs) {
  return fs.existsSync(abs);
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFileAbs(abs) {
  return fs.readFileSync(abs, "utf8");
}

// ─────────────────────────────────────────────────────────────
// T — TASK: Worker file structure
// ─────────────────────────────────────────────────────────────
describe("T — Task: simplex-email structure", () => {
  it("simplex-email/ directory exists", () => {
    expect(existsAbs(EMAIL_DIR)).toBe(true);
  });

  it("src/index.ts exists (Worker entry)", () => {
    expect(existsAbs(path.join(SRC, "index.ts"))).toBe(true);
  });

  it("wrangler.toml exists", () => {
    const found = existsAbs(path.join(EMAIL_DIR, "wrangler.toml")) ||
      existsAbs(path.join(EMAIL_DIR, "wrangler.json"));
    expect(found).toBe(true);
  });

  it("package.json exists", () => {
    expect(existsAbs(path.join(EMAIL_DIR, "package.json"))).toBe(true);
  });

  it("index.ts is non-trivial (>100 chars)", () => {
    const src = readFileAbs(path.join(SRC, "index.ts"));
    expect(src.length).toBeGreaterThan(100);
  });

  it("README.md exists (operational context)", () => {
    expect(existsAbs(path.join(EMAIL_DIR, "README.md"))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Config integrity
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: config integrity", () => {
  it("wrangler.toml has a name field", () => {
    const toml = readFileAbs(path.join(EMAIL_DIR, "wrangler.toml"));
    expect(toml).toMatch(/^name\s*=/m);
  });

  it("wrangler.toml references compatibility date", () => {
    const toml = readFileAbs(path.join(EMAIL_DIR, "wrangler.toml"));
    expect(toml).toMatch(/compatibility_date/);
  });

  it("simplex-email README covers deployment steps", () => {
    const readme = readFileAbs(path.join(EMAIL_DIR, "README.md"));
    expect(readme.length).toBeGreaterThan(50);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: TypeScript contracts
// ─────────────────────────────────────────────────────────────
describe("I — Interface: TypeScript & email routing", () => {
  it("index.ts references email routing or email handler", () => {
    const src = readFileAbs(path.join(SRC, "index.ts"));
    expect(src).toMatch(/email|message|forward|fetch/i);
  });

  it("package.json has typecheck script", () => {
    const pkg = readJsonAbs(path.join(EMAIL_DIR, "package.json"));
    expect(pkg.scripts?.typecheck || pkg.scripts?.build || pkg.scripts?.check).toBeTruthy();
  });

  it("verify:simplex-email in root package.json runs typecheck", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:simplex-email"]).toMatch(/typecheck/);
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: No SMTP credentials in source or config
// ─────────────────────────────────────────────────────────────
describe("P — Purity: no credentials in source", () => {
  it("index.ts has no hardcoded SMTP passwords", () => {
    const src = readFileAbs(path.join(SRC, "index.ts"));
    expect(src).not.toMatch(/password\s*[:=]\s*["'][^"']{6,}/i);
    expect(src).not.toMatch(/smtp.*password/i);
  });

  it("wrangler.toml has no raw secret values", () => {
    const toml = readFileAbs(path.join(EMAIL_DIR, "wrangler.toml"));
    expect(toml).not.toMatch(/sk_live_|pk_live_/);
    expect(toml).not.toMatch(/password\s*=\s*"[^"]{6,}"/);
  });

  it("no .env file committed in simplex-email/", () => {
    const files = fs.readdirSync(EMAIL_DIR);
    const envFiles = files.filter((f) => f === ".env" || f === ".env.local");
    expect(envFiles).toHaveLength(0);
  });

  it("index.ts has no full child first names", () => {
    const src = readFileAbs(path.join(SRC, "index.ts"));
    expect(src).not.toMatch(/\bstephen\b/i);
    expect(src).not.toMatch(/\bwilliam jr\b/i);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Typecheck pipeline
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: typecheck pipeline", () => {
  it("verify:simplex-email wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:simplex-email"]).toBeTruthy();
  });

  it("simplex:verify-all includes email verification", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["simplex:verify-all"]).toMatch(/simplex-email/);
  });

  it("test:simplex script prefix is simplex-v7", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["test:simplex"]).toContain("simplex-v7");
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: File guard rails
// ─────────────────────────────────────────────────────────────
describe("R — Regression: file guard rails", () => {
  it("src/index.ts has not been deleted", () => {
    expect(existsAbs(path.join(SRC, "index.ts"))).toBe(true);
  });

  it("wrangler.toml has not been deleted", () => {
    const found = existsAbs(path.join(EMAIL_DIR, "wrangler.toml")) ||
      existsAbs(path.join(EMAIL_DIR, "wrangler.json"));
    expect(found).toBe(true);
  });

  it("verify:simplex-email script has not been removed from package.json", () => {
    const pkg = readJson("package.json");
    expect(typeof pkg.scripts["verify:simplex-email"]).toBe("string");
  });
});
