import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  escapeHtml,
  getOperatorJoyLine,
  getOperatorJoyLines,
  hashStr,
  loadCanon,
} from "./operator-joy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");

describe("operator-joy", () => {
  it("hashStr is deterministic", () => {
    expect(hashStr("same")).toBe(hashStr("same"));
    expect(hashStr("a")).not.toBe(hashStr("b"));
  });

  it("loadCanon returns numeric larmor", () => {
    const c = loadCanon(repoRoot);
    expect(typeof c.larmorHz).toBe("number");
    expect(c.larmorHz).toBeGreaterThan(0);
    expect(typeof c.bondingHint).toBe("string");
    expect(c.bondingHint.length).toBeGreaterThan(4);
  });

  it("getOperatorJoyLine substitutes placeholders", () => {
    const line = getOperatorJoyLine(repoRoot, { roll: false, short: false });
    expect(line).not.toMatch(/\{larmor\}/);
    expect(line).not.toMatch(/\{bonding\}/);
    expect(line.length).toBeGreaterThan(10);
  });

  it("getOperatorJoyLines returns distinct lines for same day (no roll)", () => {
    const lines = getOperatorJoyLines(repoRoot, 8, false, false);
    expect(lines.length).toBe(8);
    const set = new Set(lines);
    expect(set.size).toBe(8);
  });

  it("getOperatorJoyLines roll can differ from fixed-day order", () => {
    const a = getOperatorJoyLines(repoRoot, 5, false, false);
    const b = getOperatorJoyLines(repoRoot, 5, true, false);
    expect(a.length).toBe(5);
    expect(b.length).toBe(5);
  });

  it("escapeHtml escapes markup", () => {
    expect(escapeHtml(`a<b>"c"`)).toBe("a&lt;b&gt;&quot;c&quot;");
  });
});
