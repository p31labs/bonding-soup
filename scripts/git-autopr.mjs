#!/usr/bin/env node
/**
 * Opt-in: after post-commit auto-push, run ensure-pr (open PR if none).
 * Works with: npm run git:autopush:on  +  this marker (or P31_PR_EVERY_PUSH=1).
 *   npm run git:autopr:on  |  off  |  status
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31 = path.join(root, ".p31");
const marker = path.join(p31, "auto-pr");

const cmd = process.argv[2] || "status";

if (cmd === "on") {
  fs.mkdirSync(p31, { recursive: true });
  fs.writeFileSync(
    marker,
    "# P31: after auto-push, run ensure-pr. Remove or: npm run git:autopr:off\n",
    "utf8"
  );
  console.log("git-autopr: ON  — post-commit will run pr:ensure after each auto-push (needs gh auth)");
  process.exit(0);
}

if (cmd === "off") {
  try {
    fs.unlinkSync(marker);
  } catch {
    /* */
  }
  console.log("git-autopr: OFF");
  process.exit(0);
}

if (cmd === "status" || cmd === "-h" || cmd === "--help") {
  const env = process.env.P31_PR_EVERY_PUSH === "1";
  const file = fs.existsSync(marker);
  console.log(
    "P31 auto-PR after push: " +
      (env || file ? "enabled" : "off") +
      (env ? " (P31_PR_EVERY_PUSH=1)" : "") +
      (file ? " (.p31/auto-pr)" : "")
  );
  if (!env && !file) {
    console.log("  Enable:  npm run git:autopr:on   or   export P31_PR_EVERY_PUSH=1");
    console.log("  (GitHub: workflow p31-pr-on-push opens PR on every feature-branch push; no local setup.)");
  }
  process.exit(0);
}

console.error("Usage: npm run git:autopr:on | off | status");
process.exit(1);
