/**
 * Resolve Semgrep CLI — same logic as p31-all.mjs / CI (~/.local/bin after pip/pipx).
 * @returns {string | null}
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

function shOk(script) {
  return spawnSync("sh", ["-c", script], { stdio: "ignore" }).status === 0;
}

export function resolveSemgrepBin() {
  if (shOk("command -v semgrep")) {
    return "semgrep";
  }
  const userBin = path.join(homedir(), ".local/bin/semgrep");
  if (fs.existsSync(userBin)) {
    return userBin;
  }
  return null;
}
