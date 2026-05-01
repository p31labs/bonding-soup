#!/usr/bin/env node
/**
 * Alignment Pre-commit Hook (Fast Path Validator)
 * Validates alignment files (<2s) before commit.
 * 
 * Install: Add to .git/hooks/pre-commit or use Husky
 * Usage: node alignment-pre-commit.mjs
 * 
 * Exit codes:
 *   0 - Success (no errors found)
 *   1 - Error (file not found, JSON parse error, etc.)
 *   2 - Validation errors found
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const ALIGNMENT_FILE = path.join(ROOT, "p31-alignment.json");
const CONSTANTS_FILE = path.join(ROOT, "p31-constants.json");
const FACTS_FILE = path.join(ROOT, "p31-facts.json");
const SUBSCRIPTIONS_FILE = path.join(ROOT, "p31-subscriptions.json");
const PRODUCTION_READINESS_FILE = path.join(ROOT, "p31-production-readiness.json");

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", { encoding: "utf8" });
    return output.split("\n").filter(Boolean).map(f => f.trim());
  } catch {
    return [];
  }
}

function isAlignmentFile(filepath) {
  return [
    "p31-alignment.json",
    "p31-constants.json",
    "p31-facts.json",
    "p31-production-readiness.json",
    "p31-subscriptions.json"
  ].includes(path.basename(filepath));
}

function validateJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf8");
    JSON.parse(content);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message, line: getLineNumber(content, e.position) };
  }
}

function getLineNumber(content, position) {
  if (position == null) return "?";
  return content.slice(0, position).split("\n").length;
}

function validateAlignment(filepath) {
  const content = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const errors = [];
  const warnings = [];
  
  // Schema check
  if (!content.schema) {
    errors.push("Missing 'schema' field");
  } else if (!content.schema.startsWith("p31.alignment")) {
    warnings.push(`Schema '${content.schema}' should start with 'p31.alignment'`);
  }
  
  // Sources
  if (content.sources) {
    const ids = [];
    for (const src of content.sources) {
      if (!src.path && !src.url) {
        errors.push(`Source '${src.id || "unnamed"}' missing 'path' or 'url'`);
      }
      if (!src.role) {
        warnings.push(`Source '${src.id}' missing 'role' field`);
      }
      ids.push(src.id);
    }
    
    // Check duplicates
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) {
      errors.push(`Duplicate source IDs: ${[...new Set(dupes)].join(", ")}`);
    }
    
    // Check required sources exist
    const required = ["p31-constants", "p31-facts"];
    for (const req of required) {
      if (!ids.includes(req)) {
        warnings.push(`Missing source: ${req}`);
      }
    }
  }
  
  // Derivations
  if (content.derivations) {
    for (const d of content.derivations) {
      if (!d.id) errors.push("Derivation missing 'id'");
      if (!d.from || d.from.length === 0) {
        warnings.push(`Derivation '${d.id}' has empty 'from' array`);
      }
      if (!d.to || d.to.length === 0) {
        warnings.push(`Derivation '${d.id}' has empty 'to' array`);
      }
      if (!d.verify) {
        warnings.push(`Derivation '${d.id}' missing 'verify' script`);
      } else {
        // Check if verify script exists in package.json
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
          const match = d.verify.match(/npm run ([\w:.-]+)/);
          if (match) {
            const scriptName = match[1];
            if (!pkg.scripts || !pkg.scripts[scriptName]) {
              errors.push(`Derivation '${d.id}' verify command '${d.verify}' not found in package.json scripts`);
            }
          }
        } catch {}
      }
    }
    
    // Check duplicate IDs
    const dids = content.derivations.map(d => d.id);
    const dupes = dids.filter((id, i) => dids.indexOf(id) !== i);
    if (dupes.length > 0) {
      errors.push(`Duplicate derivation IDs: ${[...new Set(dupes)].join(", ")}`);
    }
  }
  
  // Verify pipeline
  if (content.verifyPipeline) {
    if (!Array.isArray(content.verifyPipeline)) {
      errors.push("'verifyPipeline' must be an array");
    } else if (content.verifyPipeline.length === 0) {
      warnings.push("'verifyPipeline' is empty");
    }
  }
  
  return { errors, warnings };
}

function validateConstants(filepath) {
  const content = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const errors = [];
  
  if (!content.mesh) {
    errors.push("Missing 'mesh' section in constants");
  } else {
    const requiredMeshKeys = ["k4PersonalWorkerUrl", "k4CageWorkerUrl"];
    for (const key of requiredMeshKeys) {
      if (!content.mesh[key]) {
        errors.push(`Missing mesh.${key} in constants`);
      } else if (!content.mesh[key].startsWith("https://")) {
        errors.push(`mesh.${key} must be a valid HTTPS URL`);
      }
    }
  }
  
  if (!content.organization) {
    errors.push("Missing 'organization' section in constants");
  } else {
    if (!content.organization.ein || !content.organization.ein.includes("-")) {
      errors.push("organization.ein must be a valid EIN format (XX-XXXXXXX)");
    }
  }
  
  return { errors };
}

function checkSecrets(filepath) {
  const content = fs.readFileSync(filepath, "utf8");
  const patterns = [
    /sk_live_[a-zA-Z0-9]+/,
    /pk_live_[a-zA-Z0-9]+/,
    /password\s*[=:]\s*["'][^"']{3,}/i,
    /api_key\s*[=:]\s*["'][^"']{10,}/i,
    /secret\s*[=:]\s*["'][^"']{10,}/i,
  ];
  
  const found = [];
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      found.push(matches[0].substring(0, 20) + "...");
    }
  }
  
  return found;
}

function main() {
  let exitCode = 0;
  const start = Date.now();
  
  try {
    const staged = getStagedFiles();
    const alignmentStaged = staged.filter(isAlignmentFile);
    
    console.log("🔍 Alignment Pre-commit Check");
    console.log(`Staged files: ${staged.length}`);
    console.log(`Alignment files: ${alignmentStaged.length}\n`);
    
    if (alignmentStaged.length === 0) {
      console.log("✓ No alignment files modified, skipping");
      console.log(`⏱ ${Date.now() - start}ms`);
      process.exit(0);
    }
    
    let allErrors = [];
    let allWarnings = [];
    
    for (const file of alignmentStaged) {
      console.log(`Checking ${file}...`);
      const fullPath = path.join(ROOT, file);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        allErrors.push(`${file}: File not found`);
        continue;
      }
      
      // JSON syntax check
      let content;
      try {
        content = fs.readFileSync(fullPath, "utf8");
        JSON.parse(content); // Validate JSON
      } catch (e) {
        allErrors.push(`${file}: Invalid JSON — ${e.message} (line ${getLineNumber(content, e.position)})`);
        continue;
      }
      console.log(`  ✓ Valid JSON`);
      
      // Secrets check
      const secrets = checkSecrets(content);
      if (secrets.length > 0) {
        allErrors.push(`${file}: Potential secrets found: ${secrets.join(", ")}`);
        console.log(`  ❌ Secrets detected!`);
      } else {
        console.log(`  ✓ No secrets`);
      }
      
      // Semantic validation for specific files
      const basename = path.basename(file);
      if (basename === "p31-alignment.json") {
        const result = validateAlignment(JSON.parse(content));
        allErrors.push(...result.errors.map(e => `${file}: ${e}`));
        allWarnings.push(...result.warnings.map(w => `${file}: ${w}`));
        console.log(`  Validation: ${result.errors.length} errors, ${result.warnings.length} warnings`);
      } else if (basename === "p31-constants.json") {
        const result = validateConstants(JSON.parse(content));
        allErrors.push(...result.errors.map(e => `${file}: ${e}`));
        console.log(`  Validation: ${result.errors.length} errors`);
      } else {
        console.log(`  └ Skipped semantic checks`);
      }
    }
    
    // Check for file existence from alignment sources
    if (fs.existsSync(ALIGNMENT_FILE)) {
      try {
        const alignment = JSON.parse(fs.readFileSync(ALIGNMENT_FILE, "utf8"));
        if (alignment.sources) {
          for (const src of alignment.sources) {
            if (src.path && !fs.existsSync(path.join(ROOT, src.path))) {
              // Only warn for files that were supposed to be in this commit
              const relativeSrcPath = src.path;
              if (staged.includes(relativeSrcPath)) {
                allWarnings.push(`Source path '${src.path}' is staged but may be newly created`);
              }
            }
          }
        }
      } catch (e) {
        allWarnings.push(`Could not read alignment file for source validation: ${e.message}`);
      }
    }
    
    const elapsed = Date.now() - start;
    
    console.log("\n" + "=".repeat(60));
    if (allWarnings.length > 0) {
      console.log("⚠ Warnings:");
      for (const w of allWarnings.slice(0, 5)) {
        console.log(`  - ${w}`);
      }
      if (allWarnings.length > 5) {
        console.log(`  ... and ${allWarnings.length - 5} more`);
      }
      console.log();
    }
    
    if (allErrors.length > 0) {
      console.log("❌ Errors:");
      for (const e of allErrors) {
        console.log(`  - ${e}`);
      }
      console.log(`\n⏱ ${elapsed}ms`);
      console.log("\n✗ Pre-commit check FAILED");
      console.log("Fix errors and try again.");
      exitCode = 2;
    } else {
      console.log(`✓ All checks passed`);
      console.log(`⏱ ${elapsed}ms`);
      exitCode = 0;
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

// Export for use as module
export { validateAlignment, validateConstants };
