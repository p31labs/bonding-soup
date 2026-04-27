#!/usr/bin/env node
/**
 * Standalone Semgrep SAST — same rules + paths as `p31-all.mjs` / `.github/workflows/p31-security.yml` SAST.
 * Usage: npm run semgrep:p31ca   (requires andromeda/04_SOFTWARE/p31ca)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSemgrepBin } from "./resolve-semgrep-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");

const bin = resolveSemgrepBin();
if (!bin) {
  console.error(
    "semgrep: CLI not found. Install: pipx install semgrep   (ensure ~/.local/bin is on PATH)"
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(p31ca, "package.json"))) {
  console.error("semgrep:p31ca: missing p31ca tree:", p31ca);
  process.exit(1);
}

const args = [
  "scan",
  "--config",
  "p/javascript",
  "--config",
  "p/typescript",
  "--config",
  "p/security-audit",
  "src",
  "workers",
];

const r = spawnSync(bin, args, { cwd: p31ca, stdio: "inherit" });
process.exit(r.status === null ? 1 : r.status);
