import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWorkspaceProbe, classifyVerifyStep, buildEffectiveBarReport } from "./p31-effective-bar.mjs";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");

describe("p31-effective-bar", () => {
  it("buildWorkspaceProbe returns booleans for this repo", () => {
    const w = buildWorkspaceProbe(root);
    expect(typeof w.hasAndromeda).toBe("boolean");
    expect(typeof w.hasP31ca).toBe("boolean");
    expect(typeof w.andromedaGit).toBe("boolean");
  });

  it("classifyVerifyStep marks map-pipeline skip without andromeda", () => {
    const w = { ...buildWorkspaceProbe(root), hasAndromeda: false, hasP31ca: false };
    expect(classifyVerifyStep("verify:map-pipeline", w).status).toBe("skip");
  });

  it("classifyVerifyStep marks runbooks as run", () => {
    const w = buildWorkspaceProbe(root);
    expect(classifyVerifyStep("verify:runbooks", w).status).toBe("run");
  });

  it("classifyVerifyStep marks delta-language as run", () => {
    const w = buildWorkspaceProbe(root);
    expect(classifyVerifyStep("verify:delta-language", w).status).toBe("run");
  });

  it("classifyVerifyStep marks public-voice as run", () => {
    const w = buildWorkspaceProbe(root);
    expect(classifyVerifyStep("verify:public-voice", w).status).toBe("run");
  });

  it("classifyVerifyStep marks atmosphere-ramp as run", () => {
    const w = buildWorkspaceProbe(root);
    expect(classifyVerifyStep("verify:atmosphere-ramp", w).status).toBe("run");
  });

  it("buildEffectiveBarReport includes verify:runbooks in order", () => {
    const r = buildEffectiveBarReport(root, {});
    const names = r.verifySteps.map((s) => s.script);
    expect(names).toContain("verify:runbooks");
    expect(names).toContain("verify:delta-language");
    expect(names).toContain("verify:public-voice");
    expect(names).toContain("verify:atmosphere-ramp");
    const iPoets = names.indexOf("verify:poets-room");
    const iRun = names.indexOf("verify:runbooks");
    const iDelta = names.indexOf("verify:delta-language");
    const iVoice = names.indexOf("verify:public-voice");
    const iAtmo = names.indexOf("verify:atmosphere-ramp");
    expect(iRun).toBeGreaterThan(iPoets);
    expect(iDelta).toBeGreaterThan(iRun);
    expect(iVoice).toBeGreaterThan(iDelta);
    expect(iAtmo).toBeGreaterThan(iVoice);
  });
});
