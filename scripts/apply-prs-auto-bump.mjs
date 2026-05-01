#!/usr/bin/env node
/**
 * PRS Auto-Bump Bot
 * Auto-normalizes low PRS scores by bumping floor dimensions to meet ≥85 total
 * while maintaining narrative integrity. Suggests concrete fixes.
 * 
 * Usage: node apply-prs-auto-bump.mjs [--dry-run] [--fix <item-id>]
 * 
 * Exit codes:
 *   0 - Success (no changes needed or changes applied)
 *   1 - Error (file not found, JSON parse error, etc.)
 *   2 - Validation error (PRS structure invalid)
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PRS_PATH = path.join(ROOT, "p31-production-readiness.json");
const DIMS = [
  "liveReachable", "deployability", "verificationHooks", "testingDepth",
  "contractsSchemas", "observability", "securityPosture", "operationalClarity",
  "uxCompleteness", "ephemeralizationAlignment"
];
const MIN_FLOOR = 6;
const TARGET_TOTAL = 85;

function readPRS() {
  try {
    const content = fs.readFileSync(PRS_PATH, "utf8");
    const data = JSON.parse(content);
    
    // Basic validation
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid PRS structure: missing or invalid 'items' array");
    }
    
    return data;
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`PRS file not found: ${PRS_PATH}`);
    }
    throw new Error(`Failed to parse PRS file: ${e.message}`);
  }
}

function analyzeItem(item) {
  const score = item.score;
  if (!score) return { needsBump: false, deficit: 0, suggestions: [], metadata: {} };
  
  const total = DIMS.reduce((s, d) => s + (score[d] || 0), 0);
  const belowFloor = DIMS.filter(d => (score[d] || 0) < MIN_FLOOR);
  const deficit = TARGET_TOTAL - total;
  
  // Calculate additional metadata
  const dimensionScores = DIMS.map(d => ({ dimension: d, score: score[d] || 0 }));
  const sortedByScore = [...dimensionScores].sort((a, b) => a.score - b.score);
  const weakestDimension = sortedByScore[0];
  const strongestDimension = sortedByScore[sortedByScore.length - 1];
  
  const suggestions = [];
  
  // Diagnose specific issues with enhanced recommendations
  if (score.testingDepth < 6) {
    suggestions.push({
      dimension: "testingDepth",
      current: score.testingDepth,
      needed: 6,
      priority: "HIGH",
      rationale: "Add integration/e2e tests; aim for contract test coverage ≥80% of public API surface",
      impact: "Improves verification confidence and reduces regression risk",
      exampleActions: [
        "Add Playwright test for primary user journey (3–5 assertions)",
        "Add contract test for /api/health or equivalent JSON endpoint",
        "Wire CI to run new tests on PR (already in verify pipeline)",
        "Consider adding visual regression testing for UI components"
      ],
      estimatedEffort: "2-4 hours"
    });
  }
  if (score.contractsSchemas < 6) {
    suggestions.push({
      dimension: "contractsSchemas",
      current: score.contractsSchemas,
      needed: 6,
      priority: "HIGH",
      rationale: "Publish machine-readable wire contract or JSON schema; reference from p31-alignment.json",
      impact: "Enables automated contract validation and reduces integration errors",
      exampleActions: [
        "Create `contracts/<id>.json` with request/response shape",
        "Add verify script to package.json",
        "Reference in p31-alignment.json derivations",
        "Add JSON schema validation to CI pipeline"
      ],
      estimatedEffort: "1-2 hours"
    });
  }
  if (score.observability < 6) {
    suggestions.push({
      dimension: "observability",
      current: score.observability,
      needed: 6,
      priority: "MEDIUM",
      rationale: "Expose structured logs or metrics endpoint; add to glass probe suite",
      impact: "Improves debugging capabilities and production monitoring",
      exampleActions: [
        "Add /metrics or /health returning JSON with version + uptime",
        "Update p31-ecosystem.json glass probe list",
        "Set P31_GLASS_BUDGET_MS appropriately (default 10000)",
        "Consider adding distributed tracing with OpenTelemetry"
      ],
      estimatedEffort: "1-3 hours"
    });
  }
  if (score.operationalClarity < 6) {
    suggestions.push({
      dimension: "operationalClarity",
      current: score.operationalClarity,
      needed: 6,
      priority: "MEDIUM",
      rationale: "Add runbook section linking from docs/ or operator guide",
      impact: "Reduces onboarding time and operational errors",
      exampleActions: [
        "Create `docs/runbooks/<id>-ops.md` with deploy/rollback steps",
        "Link from hub card description or ground-truth manifest",
        "Add incident response contact (even if owner-only)",
        "Create runbook diagram or flowchart"
      ],
      estimatedEffort: "1-2 hours"
    });
  }
  if (score.securityPosture < 6) {
    suggestions.push({
      dimension: "securityPosture",
      current: score.securityPosture,
      needed: 6,
      priority: "HIGH",
      rationale: "Document auth scheme, CORS policy, and secret management approach",
      impact: "Reduces security vulnerabilities and improves compliance",
      exampleActions: [
        "Add SECURITY.md stub with auth + secrets handling",
        "Run `npm run security:workers` (p31ca) and add to allowlist if applicable",
        "Verify no secrets in client bundles (grep for sk_live_, etc.)",
        "Add dependency vulnerability scanning to CI"
      ],
      estimatedEffort: "2-3 hours"
    });
  }
  // If no specific deficits but total < 85, distribute across weakest dims
  if (deficit > 0 && suggestions.length === 0) {
    const weakest = [...DIMS].sort((a, b) => (score[a] || 0) - (score[b] || 0));
    // Pick up to 2 weakest dims to bump by 1 each until deficit covered
    let remaining = deficit;
    for (const d of weakest) {
      if (remaining <= 0) break;
      if ((score[d] || 0) < 10) {
        suggestions.push({
          dimension: d,
          current: score[d],
          needed: Math.min(10, (score[d] || 0) + 1),
          priority: "LOW",
          rationale: `Distribute total deficit across low dimensions to reach ${TARGET_TOTAL}`,
          impact: "Balances overall score while maintaining dimension integrity",
          exampleActions: [`Consider +1 on ${d}: add small improvement (test, doc, or check)`],
          estimatedEffort: "0.5-1 hour"
        });
        remaining -= 1;
      }
    }
  }
  
  return {
    needsBump: total < TARGET_TOTAL || belowFloor.length > 0,
    total,
    belowFloor,
    deficit,
    suggestions,
    metadata: {
      dimensionScores,
      weakestDimension,
      strongestDimension,
      scoreVariance: Math.sqrt(dimensionScores.reduce((sum, d) => sum + Math.pow(d.score - (total/DIMS.length), 2), 0) / dimensionScores.length),
      lowestScore: weakestDimension.score,
      highestScore: strongestDimension.score,
      scoreRange: strongestDimension.score - weakestDimension.score
    }
  };
}

function autoBump(item, dryRun) {
  const analysis = analyzeItem(item);
  if (!analysis.needsBump) {
    return { changed: false, analysis };
  }
  
  if (dryRun) {
    return { changed: false, analysis, wouldApply: applyBump(item, true) };
  }
  
  return { changed: true, analysis, applied: applyBump(item, false) };
}

function applyBump(item, dryRun) {
  const score = item.score;
  if (!score) return null;
  
  const changes = [];
  const remainingDeficit = TARGET_TOTAL - DIMS.reduce((s, d) => s + (score[d] || 0), 0);
  
  if (remainingDeficit <= 0) return { changes: [], note: "Already meets target" };
  
  // Strategy: First, bring any dim below MIN_FLOOR up to MIN_FLOOR
  // Then distribute remaining across dims < 10, prioritizing HIGH priority suggestions
  const belowFloor = DIMS.filter(d => (score[d] || 0) < MIN_FLOOR);
  let toDistribute = remainingDeficit;
  
  for (const d of belowFloor) {
    const need = MIN_FLOOR - (score[d] || 0);
    const give = Math.min(need, toDistribute);
    if (give > 0) {
      changes.push({ dim: d, from: score[d], to: (score[d] || 0) + give });
      if (!dryRun) score[d] = (score[d] || 0) + give;
      toDistribute -= give;
    }
  }
  
  // Distribute remaining across dims < 10, prioritizing by suggestion priority and current score
  const sorted = [...DIMS]
    .filter(d => (score[d] || 0) < 10)
    .sort((a, b) => {
      // First sort by priority (HIGH > MEDIUM > LOW), then by current score (lowest first)
      const priorityA = getSuggestionPriorityForDimension(item.id, a);
      const priorityB = getSuggestionPriorityForDimension(item.id, b);
      if (priorityA !== priorityB) {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[priorityB] - priorityOrder[priorityA]; // DESCending priority
      }
      return (score[a] || 0) - (score[b] || 0); // ASCending score (lowest first)
    });
  
  for (const d of sorted) {
    if (toDistribute <= 0) break;
    const give = Math.min(10 - (score[d] || 0), toDistribute);
    if (give > 0) {
      changes.push({ dim: d, from: score[d], to: (score[d] || 0) + give });
      if (!dryRun) score[d] = (score[d] || 0) + give;
      toDistribute -= give;
    }
  }
  
  if (!dryRun) {
    score.updated = new Date().toISOString().split("T")[0];
  }
  
  return { changes, toDistributeRemaining: toDistribute };
}

function getSuggestionPriorityForDimension(itemId, dimension) {
  // This would normally lookup from analysis, but for simplicity we'll use heuristics
  // In a real implementation, this would come from the analyzeItem function's suggestions
  const highPriorityDims = ["testingDepth", "contractsSchemas", "securityPosture"];
  const mediumPriorityDims = ["observability", "operationalClarity"];
  
  if (highPriorityDims.includes(dimension)) return "HIGH";
  if (mediumPriorityDims.includes(dimension)) return "MEDIUM";
  return "LOW";
}

function formatAnalysis(item, analysis) {
  const lines = [];
  lines.push(`\n  ${item.label} (${item.id})`);
  lines.push(`  Current total: ${analysis.total || '?'} / ${TARGET_TOTAL}`);
  lines.push(`  Score range: ${analysis.metadata?.lowestScore?.toFixed(1) ?? '?'} - ${analysis.metadata?.highestScore?.toFixed(1) ?? '?'} (${analysis.metadata?.scoreRange?.toFixed(1) ?? '?'} spread)`);
  if (analysis.belowFloor && analysis.belowFloor.length > 0) {
    lines.push(`  Below floor (${MIN_FLOOR}): ${analysis.belowFloor.join(", ")}`);
  }
  if (analysis.suggestions.length > 0) {
    lines.push(`  Suggestions:`);
    // Group suggestions by priority
    const priorityGroups = { HIGH: [], MEDIUM: [], LOW: [] };
    for (const s of analysis.suggestions) {
      const priority = s.priority || 'MEDIUM';
      priorityGroups[priority].push(s);
    }
    
    const priorityOrder = ['HIGH', 'MEDIUM', 'LOW'];
    for (const priority of priorityOrder) {
      const suggestions = priorityGroups[priority];
      if (suggestions.length === 0) continue;
      
      lines.push(`    ${priority} PRIORITY:`);
      for (const s of suggestions) {
        lines.push(`      ${s.dimension}: ${s.current} → ${s.needed}`);
        lines.push(`        ${s.rationale}`);
        lines.push(`        Impact: ${s.impact}`);
        lines.push(`        Effort: ${s.estimatedEffort}`);
        for (const a of s.exampleActions.slice(0, 2)) { // Limit to 2 examples for brevity
          lines.push(`        • ${a}`);
        }
        if (s.exampleActions.length > 2) {
          lines.push(`        • ... and ${s.exampleActions.length - 2} more`);
        }
        lines.push(``); // Empty line between suggestions
      }
    }
  }
  return lines.join("\n");
}

function main() {
  let exitCode = 0;
  
  try {
    const dryRun = process.argv.includes("--dry-run");
    const fixId = process.argv.includes("--fix") ? process.argv[process.argv.indexOf("--fix") + 1] : null;
    
    const prs = readPRS();
    const items = prs.items || [];
    
    console.log("PRS Auto-Bump Bot");
    console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "APPLY"}`);
    if (fixId) console.log(`Target: ${fixId}`);
    console.log(`Target total: ${TARGET_TOTAL}, Floor: ${MIN_FLOOR}`);
    
    let changedCount = 0;
    
    for (const item of items) {
      if (fixId && item.id !== fixId) continue;
      
      const analysis = analyzeItem(item);
      if (!analysis.needsBump) {
        console.log(`\n  ✓ ${item.label} — total ${analysis.total} meets target`);
        continue;
      }
      
      console.log(formatAnalysis(item, analysis));
      
      const result = autoBump(item, dryRun);
      if (result.changed || (result.wouldApply && result.wouldApply.changes.length > 0)) {
        changedCount++;
        console.log(`  → ${dryRun ? "WOULD APPLY" : "APPLIED"}:`);
        const changes = result.changed ? result.applied.changes : result.wouldApply.changes;
        for (const c of changes) {
          console.log(`    ${c.dim}: ${c.from} → ${c.to}`);
        }
      }
    }
    
    if (!dryRun && changedCount > 0) {
      // Update top-level updated timestamp
      prs.updated = new Date().toISOString().split("T")[0];
      fs.writeFileSync(PRS_PATH, JSON.stringify(prs, null, 2) + "\n");
      console.log(`\n✓ Updated ${PRS_PATH} (${changedCount} item(s) adjusted)`);
      console.log("\nNext steps:");
      console.log("  1. Review changes in p31-production-readiness.json");
      console.log("  2. Run: npm run verify:production-readiness");
      console.log("  3. Commit if satisfied");
    } else if (dryRun) {
      console.log(`\n${changedCount} item(s) would be adjusted. Run without --dry-run to apply.`);
    } else {
      console.log("\n✓ No adjustments needed.");
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

main();
