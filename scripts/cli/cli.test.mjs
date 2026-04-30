import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { useFullBoot, useColor, stdoutIsTTY } from "./tty.mjs";

const cliRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const cliEntry = path.join(cliRoot, "scripts", "cli", "index.mjs");

describe("tty", () => {
  const origTTY = process.stdout.isTTY;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(process.stdout, "isTTY", { value: origTTY, configurable: true });
  });

  it("useFullBoot is false when P31_CLI_MINIMAL=1", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    vi.stubEnv("CI", "");
    vi.stubEnv("P31_CLI_MINIMAL", "1");
    expect(useFullBoot()).toBe(false);
  });

  it("useFullBoot is false when CI=true", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    vi.stubEnv("CI", "true");
    vi.stubEnv("P31_CLI_MINIMAL", "");
    expect(useFullBoot()).toBe(false);
  });

  it("useColor false when NO_COLOR set", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    vi.stubEnv("NO_COLOR", "1");
    vi.stubEnv("FORCE_COLOR", "");
    expect(useColor()).toBe(false);
  });

  it("stdoutIsTTY reflects process.stdout.isTTY", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    expect(stdoutIsTTY()).toBe(false);
  });
});

describe("cli entry", () => {
  it("connect --help reaches connection script (not top-level p31 help)", () => {
    const r = spawnSync(process.execPath, [cliEntry, "connect", "--help"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(0);
    const out = (r.stdout || "") + (r.stderr || "");
    expect(out).not.toMatch(/\bglobal:\s/i);
  });

  it("art exits 0", () => {
    const r = spawnSync(process.execPath, [cliEntry, "art"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1", CI: "" },
    });
    expect(r.status).toBe(0);
  });

  it("exits 1 with message on unknown command", () => {
    const r = spawnSync(process.execPath, [cliEntry, "not-a-real-subcommand"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(1);
    expect((r.stderr || "") + (r.stdout || "")).toMatch(/unknown command/);
  });

  it("open passport --print-only exits 0 with file URL", () => {
    const r = spawnSync(process.execPath, [cliEntry, "open", "passport", "--print-only"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(0);
    expect(r.stdout || "").toMatch(/^file:\/\//m);
  });

  it("facts exits 0 and runs verify:facts", () => {
    const r = spawnSync(process.execPath, [cliEntry, "facts"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(0);
    expect((r.stdout || "") + (r.stderr || "")).toMatch(/verify-facts: OK/);
  });

  it("connect exits 0 and prints CONNECTION spine", () => {
    const r = spawnSync(process.execPath, [cliEntry, "connect"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(0);
    const out = (r.stdout || "") + (r.stderr || "");
    expect(out).toMatch(/CONNECTION/i);
    expect(out).toMatch(/deployables|DEPLOY-CANON|p31\.connectionSummary/i);
  });

  it("budgets exits 0 and prints mesh SLO lines", () => {
    const r = spawnSync(process.execPath, [cliEntry, "budgets"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(0);
    const out = (r.stdout || "") + (r.stderr || "");
    expect(out).toMatch(/k4-personal/);
    expect(out).toMatch(/ecosystem-glass/);
  });

  it("hub-diff exits 0 when p31ca tree present", () => {
    const p31caPkg = path.join(cliRoot, "andromeda", "04_SOFTWARE", "p31ca", "package.json");
    if (!existsSync(p31caPkg)) return;
    const r = spawnSync(process.execPath, [cliEntry, "hub-diff"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1" },
    });
    expect(r.status).toBe(0);
    const out = (r.stdout || "") + (r.stderr || "");
    expect(out).toMatch(/verify-ground-truth: OK|verify:ground-truth/i);
  });

  it("effective-bar exits 0 and prints matrix", () => {
    const r = spawnSync(process.execPath, [cliEntry, "effective-bar"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1", CI: "true" },
    });
    expect(r.status).toBe(0);
    const out = (r.stdout || "") + (r.stderr || "");
    expect(out).toMatch(/P31 effective bar|verify:alignment/);
  });

  it("voice exits 0 and runs verify:public-voice", () => {
    const r = spawnSync(process.execPath, [cliEntry, "voice"], {
      cwd: cliRoot,
      encoding: "utf8",
      env: { ...process.env, P31_CLI_MINIMAL: "1", CI: "true" },
    });
    expect(r.status).toBe(0);
    const out = (r.stdout || "") + (r.stderr || "");
    expect(out).toMatch(/verify-public-voice: ok/i);
  });
});
