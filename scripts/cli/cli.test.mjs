import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
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
});
