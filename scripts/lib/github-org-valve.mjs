/**
 * Gated valve for GitHub org automation (auto triggers + apply).
 * State: ~/.p31/github-org-valve.json — not in git.
 *
 * Modes:
 *   closed   — auto triggers noop; apply blocked unless P31_GITHUB_ORG_VALVE_BYPASS=1
 *   dry-run  — auto runs `github-org:plan` only; apply still needs bypass or mode apply
 *   apply    — apply allowed with --yes (still requires explicit human --yes on CLI)
 *
 * Env override (operator): P31_GITHUB_ORG_VALVE_MODE=closed|dry-run|apply
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const VALID = new Set(["closed", "dry-run", "apply"]);

function valvePath() {
  return path.join(os.homedir(), ".p31", "github-org-valve.json");
}

/**
 * @returns {{ mode: 'closed' | 'dry-run' | 'apply', updatedAt?: string, note?: string }}
 */
export function getGithubOrgValve() {
  const env = String(process.env.P31_GITHUB_ORG_VALVE_MODE || "").trim().toLowerCase();
  if (env && VALID.has(env)) {
    return { mode: /** @type {'closed' | 'dry-run' | 'apply'} */ (env), updatedAt: undefined, note: "env" };
  }
  const p = valvePath();
  if (!fs.existsSync(p)) {
    return { mode: "closed", updatedAt: undefined, note: undefined };
  }
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const m = j && typeof j.mode === "string" ? j.mode.trim().toLowerCase() : "";
    const mode = VALID.has(m) ? m : "closed";
    return {
      mode: /** @type {'closed' | 'dry-run' | 'apply'} */ (mode),
      updatedAt: typeof j.updatedAt === "string" ? j.updatedAt : undefined,
      note: typeof j.note === "string" ? j.note : undefined,
    };
  } catch {
    return { mode: "closed" };
  }
}

/**
 * @param {'closed' | 'dry-run' | 'apply'} mode
 * @param {string} [note]
 */
export function setGithubOrgValve(mode, note) {
  const m = String(mode).trim().toLowerCase();
  if (!VALID.has(m)) throw new Error(`invalid valve mode: ${mode}`);
  const dir = path.dirname(valvePath());
  fs.mkdirSync(dir, { recursive: true });
  const doc = {
    mode: m,
    updatedAt: new Date().toISOString(),
    ...(note ? { note: String(note).slice(0, 500) } : {}),
  };
  fs.writeFileSync(valvePath(), JSON.stringify(doc, null, 2) + "\n", "utf8");
  return doc;
}
