import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");

describe("test harness consistency", () => {
  it("package.json exposes npm test and a full unit matrix", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(pkg.scripts.test).toMatch(/test:unit/);
    expect(pkg.scripts["test:unit"]).toBeTruthy();
    expect(pkg.scripts["test:matrix"]).toMatch(/test:unit/);
    expect(pkg.scripts["test:matrix"]).toMatch(/test:simplex/);
  });

  it("simplex-v7 has at least one Vitest file", () => {
    const dir = path.join(root, "simplex-v7", "tests");
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThan(0);
  });

  it("packages/p31-mesh and quantum-deck ship node:test files", () => {
    for (const rel of ["packages/p31-mesh/test", "packages/quantum-deck/test"]) {
      const dir = path.join(root, rel);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.mjs"));
      expect(files.length).toBeGreaterThan(0);
    }
  });
});
