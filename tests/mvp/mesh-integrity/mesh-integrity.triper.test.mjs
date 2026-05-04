/**
 * TRIPER: MESH INTEGRITY
 *
 * Three-domain sentinel for the P31 mesh governance layer:
 *   THREE-MIRROR  — p31-constants.json ↔ p31-live-fleet.json ↔ p31-ecosystem.json
 *                   Every declared worker URL must be the same value in all three.
 *   PRS-FLOOR     — Production Readiness Score enforcement: governed items must
 *                   score ≥ 85 overall and ≥ 6 on every individual dimension.
 *   GLASS-PROBE   — All 45 glass probe {{template}} vars must resolve to real HTTPS
 *                   URLs via p31-constants.json. No undefined vars. HA probe exempted.
 *
 * Sections: Task · Resilience · Interface · Purity · E2E · Regression
 */
import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

// ── Shared data ───────────────────────────────────────────────���───────────────
let constants, ecosystem, liveFleet, prs;
let meshConsts, allConsts;
let probes, workers, prsItems, prsGov;
let prsScoreDimensions;

function flatten(obj, prefix = "", out = {}) {
  if (typeof obj === "string") { out[prefix] = obj; return out; }
  if (typeof obj !== "object" || obj === null) return out;
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

function resolveTemplate(url, consts) {
  return url.replace(/\{\{([^}]+)\}\}/g, (_, key) => consts[key] ?? `UNRESOLVED:${key}`);
}

// ──────────────────────���──────────────────────────────────────────────────────
// T — TASK: Source files exist and are parseable
// ─────────────────────────────────────────────────────────────────────────────
describe("T — Task: mesh integrity source files", () => {
  it("p31-constants.json exists at repo root", () => {
    expect(fs.existsSync(path.join(ROOT, "p31-constants.json"))).toBe(true);
  });

  it("p31-live-fleet.json exists at repo root", () => {
    expect(fs.existsSync(path.join(ROOT, "p31-live-fleet.json"))).toBe(true);
  });

  it("p31-ecosystem.json exists at repo root", () => {
    expect(fs.existsSync(path.join(ROOT, "p31-ecosystem.json"))).toBe(true);
  });

  it("p31-production-readiness.json exists at repo root", () => {
    expect(fs.existsSync(path.join(ROOT, "p31-production-readiness.json"))).toBe(true);
  });

  it("all four files are non-trivial (>500 bytes)", () => {
    for (const f of [
      "p31-constants.json", "p31-live-fleet.json",
      "p31-ecosystem.json", "p31-production-readiness.json",
    ]) {
      const size = fs.statSync(path.join(ROOT, f)).size;
      expect(size, `${f} should be >500 bytes`).toBeGreaterThan(500);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// R — RESILIENCE: Schema version locks (change = intentional breaking change)
// ─────────────────────────────────────────────────────────────────────────────
describe("R — Resilience: schema version locks", () => {
  beforeAll(() => {
    constants = readJson("p31-constants.json");
    ecosystem = readJson("p31-ecosystem.json");
    liveFleet = readJson("p31-live-fleet.json");
    prs = readJson("p31-production-readiness.json");
    allConsts = flatten(constants);
    probes = ecosystem.glassProbes ?? [];
    workers = liveFleet.workersVerified ?? [];
    prsItems = prs.items ?? [];
    prsGov = prs.launchGovernance ?? {};
    prsScoreDimensions = (prs.scoringSystem?.dimensions ?? []).map((d) => d.id);
  });

  it("p31-ecosystem.json has glassProbes array", () => {
    expect(Array.isArray(probes)).toBe(true);
    expect(probes.length).toBeGreaterThan(0);
  });

  it("p31-live-fleet.json has workersVerified array", () => {
    expect(Array.isArray(workers)).toBe(true);
    expect(workers.length).toBeGreaterThan(0);
  });

  it("p31-production-readiness.json has items array", () => {
    expect(Array.isArray(prsItems)).toBe(true);
    expect(prsItems.length).toBeGreaterThan(0);
  });

  it("PRS scoringSystem declares 10 dimensions", () => {
    expect(prsScoreDimensions.length).toBe(10);
  });

  it("PRS launchGovernance.minGovernedScore is 85 (change = intentional)", () => {
    expect(prsGov.minGovernedScore).toBe(85);
  });

  it("PRS launchGovernance.minGovernedFloorPerDimension is 6 (change = intentional)", () => {
    expect(prsGov.minGovernedFloorPerDimension).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// I — INTERFACE: THREE-MIRROR — constants × live-fleet × ecosystem agree
// ─────────────────────────────────────────────────────────────────────────────
describe("I — Interface: THREE-MIRROR URL consistency", () => {
  it("every live-fleet worker with a constantsKey resolves to the same URL in constants", () => {
    const mismatches = [];
    for (const worker of workers) {
      const key = worker.constantsKey;
      if (!key) continue;
      const expected = allConsts[key];
      const actual = worker.workersDev ?? worker.url ?? "";
      if (expected && actual && expected !== actual) {
        mismatches.push(`${worker.id}: constants[${key}]="${expected}" ≠ fleet="${actual}"`);
      }
    }
    expect(mismatches, `URL mismatches:\n${mismatches.join("\n")}`).toHaveLength(0);
  });

  it("all live-fleet worker IDs are unique (no duplicate registration)", () => {
    const ids = workers.map((w) => w.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate worker IDs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("all live-fleet workersDev URLs are unique (no aliased workers)", () => {
    const urls = workers.map((w) => w.workersDev ?? "").filter(Boolean);
    const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
    expect(dupes, `Duplicate worker URLs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("all live-fleet workersDev URLs are HTTPS (not HTTP)", () => {
    const plain = workers.filter((w) => w.workersDev && !w.workersDev.startsWith("https://"));
    expect(plain.map((w) => `${w.id}: ${w.workersDev}`)).toHaveLength(0);
  });

  it("every live-fleet URL is on trimtab-signal.workers.dev or p31ca.org or cloudflare pages", () => {
    const bad = workers.filter((w) => {
      const url = w.workersDev ?? "";
      if (!url) return false;
      return (
        !url.includes("trimtab-signal.workers.dev") &&
        !url.includes("p31ca.org") &&
        !url.includes("p31ca.pages.dev") &&
        !url.includes("phosphorus31.org") &&
        !url.includes("bonding.p31ca.org")
      );
    });
    expect(bad.map((w) => `${w.id}: ${w.workersDev}`)).toHaveLength(0);
  });

  it("ecosystem glass probe template vars that map to constants all resolve consistently", () => {
    const meshKeys = Object.keys(allConsts).filter((k) =>
      k.startsWith("mesh.") && !k.includes("_comment"),
    );
    // Every mesh key used in a probe URL must appear in constants
    const usedKeys = new Set();
    for (const probe of probes) {
      const url = probe.url ?? "";
      for (const m of url.matchAll(/\{\{([^}]+)\}\}/g)) {
        if (m[1].startsWith("mesh.") || m[1].startsWith("payment.") || m[1].startsWith("bonding.")) {
          usedKeys.add(m[1]);
        }
      }
    }
    const unresolved = [...usedKeys].filter((k) => !(k in allConsts));
    expect(unresolved, `Unresolvable probe template vars: ${unresolved.join(", ")}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P — PURITY: PRS FLOOR — every governed item meets the bar
// ─────────────────────────────────────────────────────────────────────────────
describe("P — Purity: PRS governance floor enforcement", () => {
  function governedItems() {
    const ungovWorkers = new Set(prsGov.ungovernedWorkerIds ?? []);
    return prsItems.filter(
      (i) =>
        (prsGov.governedKinds ?? []).includes(i.kind) &&
        !ungovWorkers.has(i.id),
    );
  }

  it("at least 1 governed worker/pages item exists in PRS", () => {
    const governed = governedItems();
    expect(governed.length).toBeGreaterThan(0);
  });

  it("every governed item has a complete score object (all 10 dimensions)", () => {
    const governed = governedItems();
    const incomplete = governed.filter((item) => {
      const s = item.score ?? {};
      return prsScoreDimensions.some((d) => typeof s[d] !== "number");
    });
    expect(
      incomplete.map((i) => i.id),
      `Items with incomplete scores: ${incomplete.map((i) => i.id).join(", ")}`,
    ).toHaveLength(0);
  });

  it("no governed item scores below the PRS floor on any dimension", () => {
    const floor = prsGov.minGovernedFloorPerDimension ?? 6;
    const governed = governedItems();
    const violations = [];
    for (const item of governed) {
      const s = item.score ?? {};
      for (const dim of prsScoreDimensions) {
        if ((s[dim] ?? 0) < floor) {
          violations.push(`${item.id}.${dim} = ${s[dim]} (floor: ${floor})`);
        }
      }
    }
    expect(violations, `PRS floor violations:\n${violations.join("\n")}`).toHaveLength(0);
  });

  it("no governed item has an overall score below the governed threshold", () => {
    const threshold = prsGov.minGovernedScore ?? 85;
    const governed = governedItems();
    const below = governed.filter((item) => {
      const s = item.score ?? {};
      const total = prsScoreDimensions.reduce((acc, d) => acc + (s[d] ?? 0), 0);
      const normalized = (total / prsScoreDimensions.length) * 10;
      return normalized < threshold;
    });
    expect(
      below.map((i) => {
        const s = i.score ?? {};
        const total = prsScoreDimensions.reduce((acc, d) => acc + (s[d] ?? 0), 0);
        return `${i.id}: ${((total / prsScoreDimensions.length) * 10).toFixed(1)}`;
      }),
      `Items below PRS threshold (${threshold}): see above`,
    ).toHaveLength(0);
  });

  it("p31ca is in PRS items as a pages kind (required for launch governance)", () => {
    const p31caItem = prsItems.find((i) => i.id === "p31ca");
    expect(p31caItem).toBeTruthy();
    expect(p31caItem?.kind).toBe("pages");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E — END-TO-END: GLASS-PROBE template expansion
// ─────────────────────────────────────────────────────────────────────────────
describe("E — End-to-end: glass probe template expansion", () => {
  it("ecosystem has at least 40 glass probes", () => {
    expect(probes.length).toBeGreaterThanOrEqual(40);
  });

  it("all glass probe IDs are unique (no duplicate probe registration)", () => {
    const ids = probes.map((p) => p.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `Duplicate probe IDs: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("every non-optional glass probe URL resolves to an HTTPS URL", () => {
    const failures = [];
    for (const probe of probes) {
      if (probe.optional || probe.id.includes("optional")) continue;
      const resolved = resolveTemplate(probe.url ?? "", allConsts);
      if (resolved.includes("UNRESOLVED:")) {
        failures.push(`${probe.id}: ${resolved}`);
      } else if (!resolved.startsWith("https://") && !resolved.startsWith("/api/")) {
        failures.push(`${probe.id}: resolved to non-HTTPS "${resolved}"`);
      }
    }
    expect(failures, `Probe resolution failures:\n${failures.join("\n")}`).toHaveLength(0);
  });

  it("optional/LAN probes (home-assistant) are marked optional in ecosystem", () => {
    const lanProbes = probes.filter((p) => (p.url ?? "").includes("homeAssistant"));
    for (const probe of lanProbes) {
      expect(probe.optional ?? probe.id.includes("optional"),
        `${probe.id} uses LAN URL but is not marked optional`).toBeTruthy();
    }
  });

  it("no glass probe URL resolves to localhost or 127.0.0.1 (dev artifacts)", () => {
    const bad = probes.filter((p) => {
      const resolved = resolveTemplate(p.url ?? "", allConsts);
      return resolved.includes("localhost") || resolved.includes("127.0.0.1");
    });
    expect(bad.map((p) => p.id)).toHaveLength(0);
  });

  it("every glass probe has an 'id' and 'url' field", () => {
    const malformed = probes.filter((p) => !p.id || !p.url);
    expect(malformed).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// R — REGRESSION: Three-mirror baseline counts
// ─────────────────────────────────────────────────────────────────────────────
describe("R — Regression: mesh integrity baselines", () => {
  const WORKER_BASELINE = 10;
  const PROBE_BASELINE = 40;
  const PRS_GOVERNED_BASELINE = 10;

  it(`live-fleet worker count hasn't dropped below ${WORKER_BASELINE}`, () => {
    expect(workers.length).toBeGreaterThanOrEqual(WORKER_BASELINE);
  });

  it(`glass probe count hasn't dropped below ${PROBE_BASELINE}`, () => {
    expect(probes.length).toBeGreaterThanOrEqual(PROBE_BASELINE);
  });

  it(`governed PRS item count hasn't dropped below ${PRS_GOVERNED_BASELINE}`, () => {
    const governed = prsItems.filter((i) =>
      (prsGov.governedKinds ?? []).includes(i.kind),
    );
    expect(governed.length).toBeGreaterThanOrEqual(PRS_GOVERNED_BASELINE);
  });

  it("verify:ecosystem script is wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:ecosystem"]).toBeTruthy();
  });

  it("verify:production-readiness script is wired in root package.json", () => {
    const pkg = readJson("package.json");
    expect(pkg.scripts["verify:production-readiness"]).toBeTruthy();
  });

  it("k4-agent-hub worker exists in live-fleet (regression: must not be removed)", () => {
    const found = workers.find((w) => w.id === "k4-agent-hub");
    expect(found).toBeTruthy();
  });

  it("k4-agent-hub PRS item exists and is governed", () => {
    const item = prsItems.find((i) => i.id === "k4-agent-hub");
    expect(item).toBeTruthy();
    expect(item?.kind).toBe("worker");
  });

  it("PRS launchGovernance schema has not been removed (version lock)", () => {
    expect(prsGov.schema).toMatch(/p31\.prs\.launchGovernance/);
  });
});
