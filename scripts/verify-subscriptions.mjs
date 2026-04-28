#!/usr/bin/env node
/**
 * p31.subscriptions/1.0.0 — verify canonical AI subscription stack invariants.
 *
 * This is not a billing scraper. It's an alignment guard: the canonical "best trio"
 * + API budget stays explicit, totals stay sane, and redundancies are tracked.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const regPath = path.join(root, "p31-subscriptions.json");

function die(msg, code = 1) {
  console.error("verify-subscriptions:", msg);
  process.exit(code);
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function assertRange(obj, label) {
  if (!obj || typeof obj !== "object") die(`${label} must be an object`, 1);
  const { min, max } = obj;
  if (!isFiniteNumber(min) || !isFiniteNumber(max)) die(`${label}.min/max must be numbers`, 1);
  if (min < 0 || max < 0) die(`${label}.min/max must be >= 0`, 1);
  if (min > max) die(`${label}.min must be <= ${label}.max`, 1);
  return { min, max };
}

function sumRanges(ranges) {
  return ranges.reduce(
    (acc, r) => ({ min: acc.min + r.min, max: acc.max + r.max }),
    { min: 0, max: 0 }
  );
}

function main() {
  if (!fs.existsSync(regPath)) die("missing p31-subscriptions.json", 1);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(regPath, "utf8"));
  } catch (e) {
    die("invalid p31-subscriptions.json: " + (e && e.message), 1);
  }

  if (data.schema !== "p31.subscriptions/1.0.0") {
    die(`expected schema p31.subscriptions/1.0.0, got ${data.schema || "(none)"}`, 1);
  }

  const core = data.coreAiInfra;
  if (!core || typeof core !== "object") die("coreAiInfra required", 1);

  const subs = core.subscriptions;
  if (!Array.isArray(subs) || subs.length < 3) die("coreAiInfra.subscriptions must be an array (>=3)", 1);

  const api = core.apiBudgets;
  if (!Array.isArray(api) || api.length < 1) die("coreAiInfra.apiBudgets must be an array (>=1)", 1);

  const ids = new Set();
  for (const s of subs) {
    if (!s || typeof s !== "object") die("subscription entry must be an object", 1);
    if (typeof s.id !== "string" || !s.id.trim()) die("subscription.id must be a non-empty string", 1);
    if (ids.has(s.id)) die(`duplicate subscription id: ${s.id}`, 1);
    ids.add(s.id);
    assertRange(s.usdPerMonth, `subscriptions[${s.id}].usdPerMonth`);
  }

  for (const b of api) {
    if (!b || typeof b !== "object") die("api budget entry must be an object", 1);
    if (typeof b.id !== "string" || !b.id.trim()) die("apiBudgets[].id must be a non-empty string", 1);
    assertRange(b.usdPerMonthTarget, `apiBudgets[${b.id}].usdPerMonthTarget`);
  }

  // Trio invariants (best trio: Opus + Gemini + Composer 2).
  const required = ["claude-pro", "cursor-pro", "google-workspace"];
  for (const r of required) {
    if (!ids.has(r)) die(`missing required core subscription: ${r}`, 1);
  }

  const totals = sumRanges([
    ...subs.map((s) => s.usdPerMonth),
    ...api.map((b) => b.usdPerMonthTarget),
  ]);

  const expected = assertRange(core.expectedTotalUsdPerMonth, "coreAiInfra.expectedTotalUsdPerMonth");
  if (totals.min !== expected.min || totals.max !== expected.max) {
    die(
      `expectedTotalUsdPerMonth mismatch: expected ${expected.min}..${expected.max}, computed ${totals.min}..${totals.max}`,
      1
    );
  }

  const cancels = data.optimizationTargets?.cancellationsToConfirm;
  if (!Array.isArray(cancels) || cancels.length < 1) die("optimizationTargets.cancellationsToConfirm must be an array (>=1)", 1);
  for (const c of cancels) {
    if (!c || typeof c !== "object") die("cancellationsToConfirm entry must be an object", 1);
    if (typeof c.id !== "string" || !c.id.trim()) die("cancellationsToConfirm[].id must be a non-empty string", 1);
    if (typeof c.reason !== "string" || !c.reason.trim()) die(`cancellationsToConfirm[${c.id}].reason required`, 1);
  }

  console.log(
    "verify-subscriptions: OK — core AI infra $%s..$%s/mo (%s subs + %s api budgets)",
    totals.min,
    totals.max,
    subs.length,
    api.length
  );
  process.exit(0);
}

main();

