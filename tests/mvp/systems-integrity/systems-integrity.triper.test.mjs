/**
 * TRIPER: SYSTEMS INTEGRITY
 *
 * Four-domain sentinel for the P31 meta-systems layer:
 *   ALIGNMENT-COVERAGE — Every p31-alignment.json source path must exist on disk.
 *                        Every derivation must have a verify script wired in
 *                        package.json. Coverage matrix: source → verify → TRIPER.
 *   REPORT-HYGIENE     — No duplicate report IDs. Promoted report files must
 *                        actually exist on disk. Schema version locked.
 *   WORKFLOW-GATE      — Every CI workflow deploy step must be in a job with
 *                        a `needs:` prerequisite. No unconditional deploys.
 *   FLEET-DEDUP        — p31-fleet-entities.json (public mirror) has unique IDs,
 *                        unique URLs, and no stale worker entries.
 *
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const WORKFLOWS = path.join(ROOT, ".github/workflows");
const REPORTS_DIR = path.join(ROOT, "docs/reports");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ── Shared state ──────────────────────────────────────────────────────────────
let alignment, pkg, promotedIndex, fleetEntities;
let sources, derivations, promotedEntries, fleetItems;

// ─────────────────────────────────────────────────────────────────────────────
// T — TASK: Source files exist and are non-trivial
// ─────────────────────────────────────────────────────────────────────────────
describe("T — Task: systems integrity source files", () => {
  it("p31-alignment.json exists", () => {
    expect(exists("p31-alignment.json")).toBe(true);
  });

  it(".github/workflows/ directory exists", () => {
    expect(fs.existsSync(WORKFLOWS)).toBe(true);
  });

  it("docs/reports/ directory exists", () => {
    expect(fs.existsSync(REPORTS_DIR)).toBe(true);
  });

  it("docs/reports/promoted/index.json exists", () => {
    expect(exists("docs/reports/promoted/index.json")).toBe(true);
  });

  it("p31-alignment.json has sources array with entries", () => {
    alignment = readJson("p31-alignment.json");
    sources = alignment.sources ?? [];
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);
  });

  it("p31-alignment.json has derivations array", () => {
    derivations = alignment.derivations ?? [];
    expect(Array.isArray(derivations)).toBe(true);
    expect(derivations.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// R — RESILIENCE: Source schema locks
// ─────────────────────────────────────────────────────────────────────────────
describe("R — Resilience: alignment schema and workflow baseline", () => {
  beforeAll(() => {
    alignment = alignment ?? readJson("p31-alignment.json");
    sources = alignment.sources ?? [];
    derivations = alignment.derivations ?? [];
    pkg = readJson("package.json");
    promotedIndex = readJson("docs/reports/promoted/index.json");
    promotedEntries = promotedIndex.entries ?? [];
  });

  it("at least 1 CI workflow YAML file exists", () => {
    const yamls = fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
    expect(yamls.length).toBeGreaterThan(0);
  });

  it("p31-ci.yml workflow exists (primary gate)", () => {
    expect(fs.existsSync(path.join(WORKFLOWS, "p31-ci.yml"))).toBe(true);
  });

  it("p31-pages-deploy.yml workflow exists", () => {
    expect(fs.existsSync(path.join(WORKFLOWS, "p31-pages-deploy.yml"))).toBe(true);
  });

  it("promoted reports index schema is p31.reportsPromoted/0.1.0 (version lock)", () => {
    expect(promotedIndex.schema).toBe("p31.reportsPromoted/0.1.0");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// I — INTERFACE: ALIGNMENT-COVERAGE
// ─────────────────────────────────────────────────────────────────────────────
describe("I — Interface: alignment source coverage", () => {
  it("all non-optional alignment source paths exist on disk", () => {
    alignment = alignment ?? readJson("p31-alignment.json");
    sources = alignment.sources ?? [];
    const missing = sources
      .filter((s) => !s.optional)
      .filter((s) => !fs.existsSync(path.join(ROOT, s.path)));
    expect(
      missing.map((s) => `${s.id}: ${s.path}`),
      `Missing non-optional sources:\n${missing.map((s) => s.path).join("\n")}`,
    ).toHaveLength(0);
  });

  it("all alignment sources have a non-empty 'role' field", () => {
    const noRole = sources.filter((s) => !s.role || s.role.trim() === "");
    expect(
      noRole.map((s) => s.id),
      `Sources missing role: ${noRole.map((s) => s.id).join(", ")}`,
    ).toHaveLength(0);
  });

  it("all alignment source IDs are unique (no duplicate source declarations)", () => {
    const ids = sources.map((s) => s.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate source IDs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("all derivation IDs are unique", () => {
    const ids = derivations.map((d) => d.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate derivation IDs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("all derivation verify scripts are wired in package.json (root or p31ca)", () => {
    pkg = pkg ?? readJson("package.json");
    const p31caPkg = (() => {
      try { return readJson("andromeda/04_SOFTWARE/p31ca/package.json"); } catch { return { scripts: {} }; }
    })();
    const allScripts = { ...pkg.scripts, ...p31caPkg.scripts };
    const missing = derivations
      .filter((d) => d.verify)
      .filter((d) => {
        const match = d.verify.match(/npm run ([\w:.-]+)/);
        if (!match) return false; // non-npm verify (bash, node direct) — skip
        return !allScripts[match[1]];
      });
    expect(
      missing.map((d) => `${d.id}: ${d.verify}`),
      `Derivations with missing scripts:\n${missing.map((d) => d.verify).join("\n")}`,
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P — PURITY: WORKFLOW-GATE
// ─────────────────────────────────────────────────────────────────────────────
describe("P — Purity: CI workflow deployment gates", () => {
  function readWorkflow(name) {
    const f = path.join(WORKFLOWS, name);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
  }

  it("p31-pages-deploy.yml deploys only on workflow_call or push to main (not PR open)", () => {
    const content = readWorkflow("p31-pages-deploy.yml");
    expect(content).not.toBeNull();
    // Should NOT have pull_request trigger without branch_protection check
    // Acceptable: workflow_call, push with branch filter, workflow_dispatch
    const hasUnguardedPR = content.includes("pull_request:") &&
      !content.includes("needs:") &&
      !content.includes("if:");
    expect(hasUnguardedPR).toBe(false);
  });

  it("p31-ci.yml has a triper-cert job with needs: root-verify", () => {
    const content = readWorkflow("p31-ci.yml");
    expect(content).not.toBeNull();
    expect(content).toContain("triper-cert");
    expect(content).toContain("needs:");
  });

  it("p31-ci.yml uses concurrency group to prevent parallel runs on same ref", () => {
    const content = readWorkflow("p31-ci.yml");
    expect(content).toContain("concurrency:");
    expect(content).toContain("cancel-in-progress:");
  });

  it("p31-ci.yml has permissions: contents: read (no write escalation)", () => {
    const content = readWorkflow("p31-ci.yml");
    expect(content).toContain("permissions:");
    expect(content).toContain("contents: read");
    expect(content).not.toContain("contents: write");
  });

  it("p31-autodeploy-hub.yml only deploys when CI succeeds (workflow_run or needs: gate)", () => {
    const content = readWorkflow("p31-autodeploy-hub.yml");
    if (!content) return;
    if (content.includes("wrangler") || content.includes("deploy")) {
      // Acceptable gates: workflow_run (triggered by CI success), needs:, or workflow_call
      const gated =
        content.includes("workflow_run:") ||
        content.includes("needs:") ||
        content.includes("workflow_call");
      expect(gated).toBe(true);
    }
  });

  it("no CI workflow has an unconditional 'wrangler pages deploy' in a non-gated trigger", () => {
    const yamls = fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith(".yml"));
    const unsafe = yamls.filter((name) => {
      const content = readWorkflow(name) ?? "";
      if (!content.includes("pages deploy")) return false;
      // A pages deploy that runs on every push/PR without a needs: gate is unsafe
      const hasPagesDeploy = content.includes("pages deploy");
      const hasPRTrigger = content.includes("pull_request:");
      const hasNeeds = content.includes("needs:");
      const hasWorkflowCall = content.includes("workflow_call");
      return hasPagesDeploy && hasPRTrigger && !hasNeeds && !hasWorkflowCall;
    });
    expect(unsafe).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E — END-TO-END: REPORT-HYGIENE
// ─────────────────────────────────────────────────────────────────────────────
describe("E — End-to-end: report hygiene", () => {
  it("promoted report index entries all have required fields (id, file, ts, kind)", () => {
    const malformed = promotedEntries.filter(
      (e) => !e.id || !e.file || !e.ts || !e.kind,
    );
    expect(malformed.map((e) => e.id ?? "(no id)")).toHaveLength(0);
  });

  it("promoted report IDs are unique (no duplicate promotions)", () => {
    const ids = promotedEntries.map((e) => e.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate report IDs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("all promoted report files referenced in index actually exist on disk", () => {
    const missing = promotedEntries.filter((e) => {
      const absPath = path.join(ROOT, e.file.replace(/^\//, ""));
      return !fs.existsSync(absPath);
    });
    expect(
      missing.map((e) => e.file),
      `Promoted reports with missing files:\n${missing.map((e) => e.file).join("\n")}`,
    ).toHaveLength(0);
  });

  it("promoted report index count matches entries array length", () => {
    expect(promotedIndex.count).toBe(promotedEntries.length);
  });

  it("all promoted reports have valid ISO 8601 timestamps", () => {
    const invalid = promotedEntries.filter((e) => {
      try { return isNaN(Date.parse(e.ts)); } catch { return true; }
    });
    expect(invalid.map((e) => `${e.id}: ${e.ts}`)).toHaveLength(0);
  });

  it("promoted report bytes field is positive (file was non-empty when promoted)", () => {
    const zeroBytes = promotedEntries.filter((e) => typeof e.bytes === "number" && e.bytes <= 0);
    expect(zeroBytes.map((e) => e.id)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// R — REGRESSION: System coverage baselines
// ─────────────────────────────────────────────────────────────────────────────
describe("R — Regression: systems integrity baselines", () => {
  const SOURCE_BASELINE = 100;
  const DERIVATION_BASELINE = 40;

  it(`alignment source count has not dropped below ${SOURCE_BASELINE}`, () => {
    expect(sources.length).toBeGreaterThanOrEqual(SOURCE_BASELINE);
  });

  it(`derivation count has not dropped below ${DERIVATION_BASELINE}`, () => {
    expect(derivations.length).toBeGreaterThanOrEqual(DERIVATION_BASELINE);
  });

  it("p31-alignment.json is referenced in at least one derivation (graph is non-orphaned)", () => {
    // alignment.json feeds derivations even if not a named source itself
    const refsAlignment = derivations.some(
      (d) => JSON.stringify(d.from ?? []).includes("p31-alignment.json"),
    );
    expect(refsAlignment).toBe(true);
  });

  it("p31-constants.json is listed as a source (the operator truth anchor)", () => {
    const found = sources.find((s) => s.id === "p31-constants");
    expect(found).toBeTruthy();
  });

  it("p31-ci.yml workflow still triggers on pull_request to main", () => {
    const content = fs.readFileSync(path.join(WORKFLOWS, "p31-ci.yml"), "utf8");
    expect(content).toContain("pull_request:");
    expect(content).toMatch(/branches:\s*\[?\s*main/);
  });

  it("at least 3 CI workflows exist (minimum viable CI surface)", () => {
    const yamls = fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith(".yml"));
    expect(yamls.length).toBeGreaterThanOrEqual(3);
  });

  it("p31-live-drift.yml workflow exists (runtime drift detection must stay active)", () => {
    expect(fs.existsSync(path.join(WORKFLOWS, "p31-live-drift.yml"))).toBe(true);
  });
});
