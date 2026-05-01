/**
 * TRIPER: EPCP (Command Center)
 * Edge Persistent Command Protocol — operator dashboard, D1 audit, R2, auth gates.
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

function existsAny(...rels) {
  return rels.some((r) => exists(r));
}

// ─────────────────────────────────────────────────────────────
// T — TASK: Command center scripts & config
// ─────────────────────────────────────────────────────────────
describe("T — Task: command center structure", () => {
  it("scripts/command-center/ directory exists", () => {
    expect(exists("scripts/command-center")).toBe(true);
  });

  it("command-center/actions.registry.mjs exists", () => {
    expect(exists("scripts/command-center/actions.registry.mjs")).toBe(true);
  });

  it("command-center integration-local.mjs exists", () => {
    expect(existsAny(
      "scripts/command-center/integration-local.mjs",
      "scripts/command-center/integration.mjs"
    )).toBe(true);
  });

  it("command-center server-smoke.mjs exists", () => {
    expect(existsAny(
      "scripts/command-center/server-smoke.mjs",
      "scripts/command-center/smoke.mjs"
    )).toBe(true);
  });

  it("p31-local-command-center.mjs exists", () => {
    expect(exists("scripts/p31-local-command-center.mjs")).toBe(true);
  });

  it("test:command-center:integration script is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["test:command-center:integration"]).toBeTruthy();
  });

  it("command-center npm script opens local CC", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["command-center"]).toMatch(/p31-local-command-center/);
  });
});

// ─────────────────────────────────────────────────────────────
// R — RESILIENCE: Offline & smoke fallbacks
// ─────────────────────────────────────────────────────────────
describe("R — Resilience: offline & smoke paths", () => {
  it("command-center:auto script allows port 0 (random port fallback)", () => {
    const pkg = readJson("package.json");
    const script = pkg.scripts["command-center:auto"];
    expect(script).toMatch(/P31_CMD_CENTER_PORT=0/);
  });

  it("verify:command-center chains test:unit + server-smoke + integration", () => {
    const pkg = readJson("package.json");
    const script = pkg.scripts["verify:command-center"];
    expect(script).toMatch(/test:unit/);
    expect(script).toMatch(/server-smoke/);
    expect(script).toMatch(/integration/);
  });

  it("actions.registry.mjs is non-trivial", () => {
    const src = fs.readFileSync(
      path.join(ROOT, "scripts/command-center/actions.registry.mjs"), "utf8"
    );
    expect(src.length).toBeGreaterThan(100);
  });
});

// ─────────────────────────────────────────────────────────────
// I — INTERFACE: Protocol & action registry
// ─────────────────────────────────────────────────────────────
describe("I — Interface: action registry & protocol", () => {
  it("actions.registry.mjs exports or defines actions", () => {
    const src = fs.readFileSync(
      path.join(ROOT, "scripts/command-center/actions.registry.mjs"), "utf8"
    );
    expect(src).toMatch(/export|action|registry|handler/i);
  });

  it("command center has fleet portal alignment", () => {
    const pkg = readJson("package.json");
    // Fleet portal build must be in the pipeline
    expect(pkg.scripts["build:fleet-portal"]).toBeTruthy();
  });

  it("verify:command-center script is wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:command-center"]).toBeTruthy();
  });

  it("fleet portal HTML exists (command center surface)", () => {
    expect(exists("fleet-portal.html")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// P — PURITY: Operator auth, no exposed credentials
// ─────────────────────────────────────────────────────────────
describe("P — Purity: auth gates & clean config", () => {
  it("actions.registry.mjs has no hardcoded API keys", () => {
    const src = fs.readFileSync(
      path.join(ROOT, "scripts/command-center/actions.registry.mjs"), "utf8"
    );
    expect(src).not.toMatch(/sk_live_|pk_live_/);
  });

  it("fleet-portal.html has no raw secret values", () => {
    const html = fs.readFileSync(path.join(ROOT, "fleet-portal.html"), "utf8");
    expect(html).not.toMatch(/sk_live_|pk_live_/);
  });

  it("operator shift scripts are wired (shift-in / shift-out)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["operator:shift-in"]).toBeTruthy();
    expect(pkg.scripts["operator:shift-out"]).toBeTruthy();
  });

  it("fleet-portal.html has no full child names", () => {
    const html = fs.readFileSync(path.join(ROOT, "fleet-portal.html"), "utf8");
    expect(html).not.toMatch(/\bstephen\b/i);
    expect(html).not.toMatch(/\bwilliam jr\b/i);
  });
});

// ─────────────────────────────────────────────────────────────
// E — END-TO-END: Verify pipeline
// ─────────────────────────────────────────────────────────────
describe("E — End-to-end: verify pipeline", () => {
  it("verify:command-center is included in the root verify chain", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts.verify).toMatch(/verify:command-center/);
  });

  it("fleet portal build is in launch:sync script", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["launch:sync"]).toMatch(/build:fleet-portal/);
  });

  it("build:fleet-portal script exists", () => {
    expect(exists("scripts/build-fleet-portal.mjs")).toBe(true);
  });

  it("build:glass-box is wired (transparency terminal)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["build:glass-box"]).toBeTruthy();
  });

  it("verify:glass-box is wired", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:glass-box"]).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────
// R — REGRESSION: Known failure guards
// ─────────────────────────────────────────────────────────────
describe("R — Regression: known failure guards", () => {
  it("command-center scripts directory has not been deleted", () => {
    expect(exists("scripts/command-center")).toBe(true);
  });

  it("test:command-center:integration script has not been removed", () => {
    const pkg = readJson("package.json");
    expect(typeof pkg.scripts["test:command-center:integration"]).toBe("string");
  });

  it("verify:command-center includes verify:p31-mesh (mesh alignment)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:command-center"]).toMatch(/verify:p31-mesh/);
  });

  it("fleet-portal.html still exists", () => {
    expect(exists("fleet-portal.html")).toBe(true);
  });

  it("reports subsystem scripts are wired (daily ops)", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["reports:morning"]).toBeTruthy();
    expect(pkg.scripts["reports:evening"]).toBeTruthy();
  });
});
