/**
 * Unit tests for science-core.mjs — all assertions are formula-derivable.
 * Run: npx vitest run scripts/psych/science-core.test.mjs
 */
import { describe, it, expect } from "vitest";
import {
  fittsID, fittsMT, fittsCategory,
  hickRT, hickCategory,
  shannonEntropy, shannonNorm,
  relativeLuminance, wcagContrast, wcagContrastPass,
  cognitiveLoadIndex, intrinsicLoad, extraneousLoad, germaneLoad,
  millerCapacity,
  bayesUpdate,
  clsCategory, targetSizePass,
  ci95,
} from "./science-core.mjs";

const EPSILON = 1e-6;
const near = (a, b, e = 0.001) => Math.abs(a - b) < e;

describe("fittsID [MacKenzie1992]", () => {
  it("D=200 W=40 → log₂(200/40 + 1) = log₂(6)", () => {
    expect(near(fittsID(200, 40), Math.log2(6))).toBe(true);
  });
  it("W=0 guard → 0", () => expect(fittsID(100, 0)).toBe(0));
  it("D=0 → 0", () => expect(fittsID(0, 40)).toBe(0));
  it("increases with distance", () => {
    expect(fittsID(400, 40)).toBeGreaterThan(fittsID(200, 40));
  });
  it("decreases with target width", () => {
    expect(fittsID(200, 20)).toBeGreaterThan(fittsID(200, 40));
  });
});

describe("fittsMT [Fitts1954]", () => {
  it("a=200 b=100 D=200 W=40 → 200 + 100×log₂(6)", () => {
    const expected = 200 + 100 * Math.log2(6);
    expect(near(fittsMT(200, 40), expected)).toBe(true);
  });
  it("always ≥ a (initiation constant)", () => {
    expect(fittsMT(0, 40)).toBeGreaterThanOrEqual(200);
  });
});

describe("fittsCategory", () => {
  it("< 600 → comfortable", () => expect(fittsCategory(500)).toBe("comfortable"));
  it("600–1199 → slow", () => expect(fittsCategory(900)).toBe("slow"));
  it("≥ 1200 → difficult", () => expect(fittsCategory(1200)).toBe("difficult"));
});

describe("hickRT [Hick1952]", () => {
  it("n=0 → 0", () => expect(hickRT(0)).toBe(0));
  it("n=1 → 150 × log₂(2) = 150", () => expect(near(hickRT(1), 150)).toBe(true));
  it("n=7 → 150 × log₂(8) = 450ms", () => expect(near(hickRT(7), 450)).toBe(true));
  it("n=3 → 150 × log₂(4) = 300ms", () => expect(near(hickRT(3), 300)).toBe(true));
  it("increases monotonically", () => {
    expect(hickRT(5)).toBeGreaterThan(hickRT(3));
    expect(hickRT(10)).toBeGreaterThan(hickRT(5));
  });
});

describe("hickCategory", () => {
  it("< 300 → easy", () => expect(hickCategory(200)).toBe("easy"));
  it("300–599 → medium", () => expect(hickCategory(450)).toBe("medium"));
  it("≥ 600 → hard", () => expect(hickCategory(700)).toBe("hard"));
});

describe("shannonEntropy [Shannon1948]", () => {
  it("empty → 0", () => expect(shannonEntropy([])).toBe(0));
  it("all same → 0", () => expect(shannonEntropy(["a", "a", "a"])).toBe(0));
  it("two equal → 1 bit", () => expect(near(shannonEntropy(["a", "b"]), 1.0)).toBe(true));
  it("four equal → 2 bits", () => {
    expect(near(shannonEntropy(["a","b","c","d"]), 2.0)).toBe(true);
  });
  it("is non-negative", () => {
    expect(shannonEntropy(["x","y","y","z"])).toBeGreaterThan(0);
  });
});

describe("shannonNorm", () => {
  it("single token → 0", () => expect(shannonNorm(["a"])).toBe(0));
  it("all equal → 1", () => {
    expect(near(shannonNorm(["a","b","c","d"]), 1.0)).toBe(true);
  });
  it("all same → 0", () => {
    expect(shannonNorm(["x","x","x","x"])).toBe(0);
  });
  it("bounds [0, 1]", () => {
    const tokens = ["apple","banana","apple","cherry","date","apple"];
    const h = shannonNorm(tokens);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(1 + EPSILON);
  });
});

describe("relativeLuminance [WCAG22]", () => {
  it("black #000000 → 0", () => expect(near(relativeLuminance("#000000"), 0)).toBe(true));
  it("white #ffffff → 1", () => expect(near(relativeLuminance("#ffffff"), 1)).toBe(true));
  it("mid grey → between 0 and 1", () => {
    const L = relativeLuminance("#808080");
    expect(L).toBeGreaterThan(0);
    expect(L).toBeLessThan(1);
  });
});

describe("wcagContrast [WCAG22 1.4.3]", () => {
  it("black/white → 21:1", () => {
    expect(near(wcagContrast("#000000", "#ffffff"), 21, 0.1)).toBe(true);
  });
  it("identical colours → 1:1", () => {
    expect(near(wcagContrast("#4db8a8", "#4db8a8"), 1.0)).toBe(true);
  });
  it("is symmetric", () => {
    const a = wcagContrast("#0f1115", "#4db8a8");
    const b = wcagContrast("#4db8a8", "#0f1115");
    expect(near(a, b)).toBe(true);
  });
  it("P31 void + teal ≥ 4.5:1 (AA)", () => {
    expect(wcagContrast("#0f1115", "#4db8a8")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("wcagContrastPass", () => {
  it("black/white passes AA normal", () => {
    expect(wcagContrastPass("#000000", "#ffffff", "AA", false)).toBe(true);
  });
  it("black/white passes AAA normal", () => {
    expect(wcagContrastPass("#000000", "#ffffff", "AAA", false)).toBe(true);
  });
  it("low contrast fails AA", () => {
    expect(wcagContrastPass("#888888", "#999999", "AA", false)).toBe(false);
  });
  it("large text has lower threshold (3:1)", () => {
    // #777777/#ffffff = ~4.48:1 — fails AA normal (< 4.5) but passes AA large (≥ 3.0)
    const hex1 = "#777777", hex2 = "#ffffff";
    const ratio = wcagContrast(hex1, hex2);
    expect(ratio).toBeLessThan(4.5);
    expect(wcagContrastPass(hex1, hex2, "AA", false)).toBe(false);
    expect(wcagContrastPass(hex1, hex2, "AA", true)).toBe(true);
  });
});

describe("cognitiveLoadIndex [Sweller1988]", () => {
  it("sum of three loads", () => {
    expect(cognitiveLoadIndex(3, 2, 1)).toBe(6);
  });
  it("zero loads → 0", () => {
    expect(cognitiveLoadIndex(0, 0, 0)).toBe(0);
  });
});

describe("intrinsicLoad", () => {
  it("zero → 0", () => expect(intrinsicLoad(0, 0)).toBe(0));
  it("caps at 5", () => expect(intrinsicLoad(100, 100)).toBe(5));
  it("scales with headings + interactives", () => {
    expect(intrinsicLoad(3, 8)).toBeGreaterThan(intrinsicLoad(1, 4));
  });
});

describe("extraneousLoad", () => {
  it("zero → 0", () => expect(extraneousLoad(0, 0, 0)).toBe(0));
  it("caps at 6", () => expect(extraneousLoad(100, 10, 100)).toBe(6));
  it("animations contribute", () => {
    expect(extraneousLoad(5, 0, 0)).toBeGreaterThan(extraneousLoad(1, 0, 0));
  });
});

describe("germaneLoad", () => {
  it("perfect ARIA + hierarchy → ~0", () => {
    expect(germaneLoad(1.0, true)).toBe(0);
  });
  it("no ARIA + no hierarchy → max", () => {
    expect(germaneLoad(0, false)).toBeGreaterThan(2);
  });
});

describe("millerCapacity [Miller1956]", () => {
  it("no profile → 7", () => expect(millerCapacity()).toBe(7));
  it("ADHD=1.0 → 5  [Barkley1997]", () => expect(millerCapacity({ adhd: 1.0 })).toBe(5));
  it("ADHD=0.5 → 6", () => expect(millerCapacity({ adhd: 0.5 })).toBe(6));
  it("never below 3", () => {
    expect(millerCapacity({ adhd: 1.0, elderly: 1.0 })).toBe(3);
  });
  it("never above 9", () => {
    expect(millerCapacity({ adhd: -1 })).toBe(9);
  });
});

describe("bayesUpdate", () => {
  it("high likelihood raises frustration", () => {
    const updated = bayesUpdate(0.1, 0.9);
    expect(updated).toBeGreaterThan(0.1);
  });
  it("low likelihood reduces frustration", () => {
    const updated = bayesUpdate(0.5, 0.1);
    expect(updated).toBeLessThan(0.5);
  });
  it("prior=0, any likelihood → 0", () => {
    expect(bayesUpdate(0, 0.9)).toBe(0);
  });
  it("prior=1, any likelihood → 1", () => {
    expect(bayesUpdate(1, 0.1)).toBe(1);
  });
  it("output is in [0, 1]", () => {
    const v = bayesUpdate(0.3, 0.8);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});

describe("clsCategory [GoogleCLS]", () => {
  it("0.05 → good", () => expect(clsCategory(0.05)).toBe("good"));
  it("0.15 → needs-improvement", () => expect(clsCategory(0.15)).toBe("needs-improvement"));
  it("0.30 → poor", () => expect(clsCategory(0.30)).toBe("poor"));
});

describe("targetSizePass [WCAG22 SC 2.5.8]", () => {
  it("24×24 → passes", () => expect(targetSizePass(24, 24)).toBe(true));
  it("23×24 → fails", () => expect(targetSizePass(23, 24)).toBe(false));
  it("large targets → pass", () => expect(targetSizePass(48, 48)).toBe(true));
});

describe("ci95", () => {
  it("empty → fallback [0, 100]", () => {
    expect(ci95([])).toEqual([0, 100]);
  });
  it("single → ±10 fallback", () => {
    const [lo, hi] = ci95([80]);
    expect(lo).toBe(70);
    expect(hi).toBe(90);
  });
  it("tight cluster → narrow interval", () => {
    const scores = [90, 91, 89, 90, 90, 91, 89, 90];
    const [lo, hi] = ci95(scores);
    expect(hi - lo).toBeLessThan(5);
  });
  it("wide spread → wider interval", () => {
    const tight = ci95([90, 91, 89, 90]);
    const wide  = ci95([50, 80, 30, 95, 60, 40]);
    expect(wide[1] - wide[0]).toBeGreaterThan(tight[1] - tight[0]);
  });
  it("lo ≥ 0 and hi ≤ 100 always", () => {
    const [lo, hi] = ci95([0, 100, 50, 25, 75]);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(100);
  });
});
