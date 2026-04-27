#!/usr/bin/env node
/**
 * Print effective mesh & glass latency budgets (p31-facts + env). No network.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveK4PersonalProbeBudgetMs, resolveGlassProbeBudgetMs } from "./lib/mesh-budgets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const k4 = resolveK4PersonalProbeBudgetMs(root);
const glass = resolveGlassProbeBudgetMs(root);

console.log("Mesh / glass latency budgets (see p31-facts.json → mesh, verify-facts, ecosystem-glass, verify-mesh-live)\n");
console.log(
  "  k4-personal (verify-mesh-live)  ",
  k4 != null ? `${k4} ms` : "(not set — no warn/fail on latency)",
  "  override: P31_MESH_PROBE_BUDGET_MS"
);
console.log(
  "  ecosystem-glass (per row)        ",
  glass > 0 ? `${glass} ms` : "(off — no * / [slow] marks)",
  "  override: P31_GLASS_BUDGET_MS"
);
console.log("\n  Strict: MESH_BUDGET_STRICT=1  |  P31_GLASS_BUDGET_STRICT=1 (with glass budget on)");
