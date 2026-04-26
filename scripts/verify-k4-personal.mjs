#!/usr/bin/env node
/**
 * k4-personal: `wrangler deploy --dry-run` (bundle + config). No deploy.
 * Skips if `andromeda/04_SOFTWARE/k4-personal` is missing.
 * Prefers local `wrangler` from k4-personal/node_modules (after `pnpm install` in 04_SOFTWARE).
 * Falls back to pinned `npx wrangler@<WRANGLER_PIN>` so CI/home works without monorepo install.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Keep in sync with `andromeda/04_SOFTWARE/k4-personal/package.json` devDependencies.wrangler */
const WRANGLER_PIN = "4.85.0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const k4p = path.join(root, "andromeda", "04_SOFTWARE", "k4-personal");

if (!fs.existsSync(k4p)) {
  console.log("verify-k4-personal: skip (no", path.relative(root, k4p) + ")");
  process.exit(0);
}

const wranglerToml = path.join(k4p, "wrangler.toml");
if (!fs.existsSync(wranglerToml) || !fs.existsSync(path.join(k4p, "src", "index.js"))) {
  console.error("verify-k4-personal: need wrangler.toml + src/index.js under k4-personal");
  process.exit(1);
}

const localWrangler = path.join(k4p, "node_modules", "wrangler", "bin", "wrangler.js");
const localBin = path.join(k4p, "node_modules", ".bin", "wrangler");
const hasPkg = fs.existsSync(path.join(k4p, "package.json"));
const useLocal = hasPkg && (fs.existsSync(localBin) || fs.existsSync(localWrangler));

if (useLocal) {
  execSync("npm run verify", { cwd: k4p, stdio: "inherit", env: process.env });
} else {
  console.log(
    "verify-k4-personal: using npx wrangler@" +
      WRANGLER_PIN +
      " (run `pnpm install` in andromeda/04_SOFTWARE for a local wrangler)"
  );
  execSync(`npx --yes wrangler@${WRANGLER_PIN} deploy --dry-run`, {
    cwd: k4p,
    stdio: "inherit",
    env: process.env,
  });
}
console.log("verify-k4-personal: OK");
