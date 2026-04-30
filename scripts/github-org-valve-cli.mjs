#!/usr/bin/env node
/**
 * Set or show ~/.p31/github-org-valve.json (gated automation for GitHub org sync).
 *
 *   node scripts/github-org-valve-cli.mjs show
 *   node scripts/github-org-valve-cli.mjs set closed|dry-run|apply [note...]
 */
import { getGithubOrgValve, setGithubOrgValve } from "./lib/github-org-valve.mjs";

const cmd = process.argv[2];
if (!cmd || cmd === "-h" || cmd === "--help") {
  console.log(`Usage:
  node scripts/github-org-valve-cli.mjs show
  node scripts/github-org-valve-cli.mjs set <closed|dry-run|apply> [note]

Env override: P31_GITHUB_ORG_VALVE_MODE (same modes; wins over file until unset)
`);
  process.exit(cmd ? 0 : 1);
}

if (cmd === "show") {
  const v = getGithubOrgValve();
  console.log(JSON.stringify(v, null, 2));
  process.exit(0);
}

if (cmd === "set") {
  const mode = process.argv[3];
  const note = process.argv.slice(4).join(" ").trim() || undefined;
  try {
    const doc = setGithubOrgValve(mode, note);
    console.log(JSON.stringify(doc, null, 2));
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
  process.exit(0);
}

console.error("unknown command:", cmd);
process.exit(1);
