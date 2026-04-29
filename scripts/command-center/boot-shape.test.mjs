import { describe, it, expect } from "vitest";
import { assertBootShape } from "./boot-shape.mjs";

const minimalValid = {
  VERSION: "2",
  ESSENTIAL_IDS: ["a1"],
  ACTION_META: {
    a1: {
      title: "One",
      slow: false,
      network: false,
      hitl: false,
      confirm: null,
      protocol: "npm run x",
    },
    a2: {
      title: "Two",
      slow: true,
      network: true,
      hitl: true,
      confirm: "Sure?",
      protocol: "npm run y",
    },
  },
  SECTIONS: [
    { id: "s1", title: "Block", ids: ["a1", "a2"], links: [{ href: "http://127.0.0.1/", label: "x" }] },
  ],
};

describe("assertBootShape", () => {
  it("accepts a minimal valid payload", () => {
    expect(() => assertBootShape(minimalValid)).not.toThrow();
  });

  it("allows extra JOY_SPIN array (operator joy)", () => {
    const x = { ...minimalValid, JOY_SPIN: ["one", "two"] };
    expect(() => assertBootShape(x)).not.toThrow();
  });

  it("rejects missing ACTION_META", () => {
    expect(() => assertBootShape({ SECTIONS: [] })).toThrow(/ACTION_META/);
  });

  it("rejects section id not in ACTION_META", () => {
    expect(() =>
      assertBootShape({
        ACTION_META: minimalValid.ACTION_META,
        SECTIONS: [{ id: "x", title: "X", ids: ["ghost"] }],
      })
    ).toThrow(/unknown action id/);
  });

  it("rejects bad meta field types", () => {
    const bad = structuredClone(minimalValid);
    bad.ACTION_META.a1.slow = "yes";
    expect(() => assertBootShape(bad)).toThrow(/\.slow/);
  });

  it("rejects non-object link entry", () => {
    expect(() =>
      assertBootShape({
        ACTION_META: minimalValid.ACTION_META,
        SECTIONS: [{ id: "s", title: "S", ids: ["a1"], links: [null] }],
      })
    ).toThrow(/links\[0\]/);
  });
});
