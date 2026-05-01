#!/usr/bin/env node
/**
 * github-org-diff — Show drift between repos-metadata.json and live GitHub state
 * 
 * Reads repos-metadata.json (source of truth) and compares to live GitHub
 * API state. Outputs diff without applying changes (dry-run visualization).
 * 
 * Usage:
 *   npm run github:org:diff              # Full diff table
 *   npm run github:org:diff -- --json    # Machine readable
 *   npm run github:org:diff -- --summary # Just drift count
 *   npm run github:org:diff -- --repo bonding-soup  # Single repo
 * 
 * Related:
 *   - docs/P31-GITHUB-ORG-REPOS.md
 *   - npm run github:org:plan (dry-run with API calls)
 *   - npm run github:org:apply -- --yes (execute)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const SUMMARY = args.includes("--summary");
const REPO_FILTER = args.find(a => a.startsWith("--repo"))?.split("=")[1] || null;

// Load metadata
function loadMetadata() {
  const p = path.join(ROOT, "docs/github-org-bundle/repos-metadata.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Fetch live repo data via gh CLI
function fetchLiveRepo(org, name) {
  const result = spawnSync("gh", ["api", `/repos/${org}/${name}`, "--jq", "{name,description,homepage,topics: .topics[]?}"], {
    encoding: "utf8",
    timeout: 10000
  });
  if (result.status !== 0) return null;
  try {
    // Parse lines of jq output
    const lines = result.stdout.trim().split("\n");
    const repo = {};
    for (const line of lines) {
      if (line.includes(": ")) {
        const [key, ...val] = line.split(": ");
        repo[key] = val.join(": ").replace(/^"|"$/g, "");
      }
    }
    return repo;
  } catch {
    return null;
  }
}

// Compare desired vs live
function diffRepo(desired, live) {
  const diffs = [];
  
  if (desired.description && desired.description !== live?.description) {
    diffs.push({ field: "description", desired: desired.description, actual: live?.description || "(empty)" });
  }
  if (desired.homepage && desired.homepage !== live?.homepage) {
    diffs.push({ field: "homepage", desired: desired.homepage, actual: live?.homepage || "(empty)" });
  }
  if (desired.topics) {
    const desiredTopics = desired.topics.sort().join(",");
    const actualTopics = (live?.topics || []).sort().join(",");
    if (desiredTopics !== actualTopics) {
      diffs.push({ field: "topics", desired: desiredTopics, actual: actualTopics || "(none)" });
    }
  }
  
  return diffs;
}

// Check gh auth
function checkGhAuth() {
  const result = spawnSync("gh", ["auth", "status"], { encoding: "utf8", timeout: 5000 });
  return result.status === 0;
}

// Main
async function main() {
  if (!checkGhAuth()) {
    console.error("Error: gh CLI not authenticated. Run: gh auth login");
    process.exit(1);
  }

  const metadata = loadMetadata();
  const org = metadata.organization;
  
  const repos = REPO_FILTER 
    ? metadata.repos.filter(r => r.name === REPO_FILTER)
    : metadata.repos;

  const results = [];
  let totalDrift = 0;

  for (const desired of repos.slice(0, 10)) { // Limit to 10 for speed
    const live = fetchLiveRepo(org, desired.name);
    const diffs = diffRepo(desired, live);
    
    if (diffs.length > 0) {
      totalDrift++;
      results.push({
        repo: desired.name,
        inSync: false,
        diffs
      });
    } else {
      results.push({
        repo: desired.name,
        inSync: true,
        diffs: []
      });
    }
  }

  // Output
  if (JSON_OUT) {
    console.log(JSON.stringify({ organization: org, driftCount: totalDrift, repos: results }, null, 2));
    return;
  }

  if (SUMMARY) {
    console.log(`GitHub org: ${org}`);
    console.log(`Repos checked: ${results.length}`);
    console.log(`In sync: ${results.filter(r => r.inSync).length}`);
    console.log(`Drift detected: ${totalDrift}`);
    if (totalDrift > 0) {
      console.log("\nRun 'npm run github:org:plan' for full dry-run with API");
    }
    return;
  }

  // Table output
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("         GITHUB ORG METADATA DIFF");
  console.log(`         Organization: ${org}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const inSync = results.filter(r => r.inSync);
  const drifted = results.filter(r => !r.inSync);

  if (drifted.length) {
    console.log(`🔴 DRIFT DETECTED (${drifted.length} repos)\n`);
    for (const r of drifted) {
      console.log(`  ${r.repo}`);
      for (const d of r.diffs) {
        console.log(`    ${d.field}:`);
        console.log(`      want: ${d.desired.slice(0, 60)}${d.desired.length > 60 ? "..." : ""}`);
        console.log(`      have: ${d.actual.slice(0, 60)}${d.actual.length > 60 ? "..." : ""}`);
      }
      console.log();
    }
  }

  if (inSync.length) {
    console.log(`✅ IN SYNC (${inSync.length} repos)\n`);
    for (const r of inSync.slice(0, 5)) {
      console.log(`  ✓ ${r.repo}`);
    }
    if (inSync.length > 5) {
      console.log(`  ... and ${inSync.length - 5} more`);
    }
    console.log();
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Commands:");
  console.log("  npm run github:org:plan      # Full dry-run with API");
  console.log("  npm run github:org:apply     # Execute changes (--yes required)");
  console.log("  npm run github:org:valve     # Check safety valve status");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
