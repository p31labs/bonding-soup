#!/usr/bin/env node
/**
 * Operator joy — calm lines, canon-aware, anti-FOMO.
 *   npm run fun
 *   npm run fun -- --many 5 --roll
 *   npm run fun -- --bowl
 *   node scripts/p31-fun.mjs --json
 * @see scripts/lib/operator-joy.mjs
 */
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asciiBowl, getOperatorJoyLines } from "./lib/operator-joy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseArgs() {
  const raw = process.argv.slice(2);
  let roll = false;
  let json = false;
  let bowl = false;
  let many = 1;
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a === "--roll") roll = true;
    else if (a === "--json") json = true;
    else if (a === "--bowl") bowl = true;
    else if (a === "--many") {
      const n = parseInt(raw[i + 1] || "3", 10);
      many = Number.isFinite(n) ? Math.min(20, Math.max(1, n)) : 3;
      i += 1;
    }
  }
  return { roll, json, bowl, many };
}

const { roll, json, bowl, many } = parseArgs();
const lines = getOperatorJoyLines(root, many, roll, false);

if (json) {
  console.log(
    JSON.stringify({
      ok: true,
      lines,
      roll,
      bowl,
      date: new Date().toISOString().slice(0, 10),
    })
  );
  process.exit(0);
}

if (bowl) {
  const art = asciiBowl();
  if (process.env.NO_COLOR) console.log("\n" + art + "\n");
  else console.log("\n\x1b[36m" + art + "\x1b[0m\n");
}

for (const line of lines) {
  if (process.env.NO_COLOR) {
    console.log("◆ " + line);
  } else {
    console.log(`\x1b[35m◆\x1b[0m ${line}`);
  }
}
console.log("");

if (process.env.NO_COLOR) {
  console.log(
    "Tip: npm run doctor -- --fun  ·  npm run fun:bowl  ·  npm run fun:shower  ·  P31_SKIP_JOY=1 silences joy on connection/setup"
  );
} else {
  console.log(
    "\x1b[90mTip:\x1b[0m npm run doctor -- --fun  ·  npm run fun:bowl  ·  npm run fun:shower  ·  \x1b[90mP31_SKIP_JOY=1\x1b[0m silences connection/setup tails"
  );
}
process.exit(0);
