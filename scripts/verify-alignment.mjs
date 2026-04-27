#!/usr/bin/env node
/**
 * p31.alignment/1.0.0 — validate the alignment registry, paths, and (optional) run the verify pipeline.
 * Ephemeralization: one registry documents sources→sinks; failure lists what's broken and what to run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const regPath = path.join(root, "p31-alignment.json");

function die(msg, code = 1) {
  console.error("verify-alignment:", msg);
  process.exit(code);
}

function rel(p) {
  return path.relative(root, p);
}

function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv.map((a) => a.replace(/:+$/, "")));
  const runPipeline = args.has("--verify") || args.has("-v");
  const quiet = args.has("-q");

  if (!fs.existsSync(regPath)) die("missing p31-alignment.json", 1);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(regPath, "utf8"));
  } catch (e) {
    die("invalid JSON: " + (e && e.message), 1);
  }

  if (data.schema !== "p31.alignment/1.0.0") {
    die(`expected schema p31.alignment/1.0.0, got ${data.schema || "(none)"}`, 1);
  }

  /** Bonding-soup CI has no `andromeda/` tree (ignored submodule path); optional skips missing files. */
  function pathUnderAndromeda(rel) {
    if (!rel || typeof rel !== "string") return false;
    let n = rel.replace(/\\/g, "/").trim();
    if (n.startsWith("./")) n = n.slice(2);
    return n === "andromeda" || n.startsWith("andromeda/");
  }

  const badAndromeda = [];
  for (const s of data.sources || []) {
    if (!s.path) continue;
    if (pathUnderAndromeda(s.path) && !s.optional) badAndromeda.push(s);
  }
  if (badAndromeda.length) {
    console.error(
      'verify-alignment: FAIL — every source whose path is under andromeda/ must set "optional": true (bonding-soup CI partial clone):'
    );
    for (const s of badAndromeda) console.error("  -", s.id, "→", s.path);
    console.error(
      'verify-alignment: fix — add "optional": true to those registry rows, or move the canonical path under this repo root.'
    );
    process.exit(1);
  }

  let fail = 0;
  const missing = [];

  for (const s of data.sources || []) {
    if (!s.path) continue;
    const p = path.join(root, s.path);
    if (!fs.existsSync(p)) {
      if (s.optional) {
        if (!quiet) console.log("verify-alignment: optional source missing —", s.id, s.path);
      } else {
        missing.push(s);
        fail = 1;
      }
    }
  }

  if (missing.length) {
    console.error("verify-alignment: required source files missing (partial clone? wrong cwd?):");
    for (const s of missing) {
      console.error("  -", s.id, "→", s.path);
    }
  }

  if (fail) {
    console.error("verify-alignment: FAIL (registry sources)");
    process.exit(1);
  }

  if (!quiet) {
    console.log("verify-alignment: registry OK —", (data.sources || []).length, "sources declared");
    console.log("  ", data.ephemeralization || "(no epigraph)");
    console.log("verify-alignment: derivations —", (data.derivations || []).length, "edges documented");
  }

  if (runPipeline) {
    const vp = data.verifyPipeline || {};
    const pipe = vp.scripts || [];
    if (!pipe.length) {
      die("no verifyPipeline.scripts in registry", 1);
    }
    if (vp.prelude && !quiet) {
      console.log("verify-alignment: prelude (already satisfied this run):", vp.prelude);
    }
    console.log("verify-alignment: running verify pipeline (", pipe.length, "steps)…");
    for (const script of pipe) {
      if (script === "verify:alignment") {
        console.log("\n— skip", script, "(already running verify-alignment) —\n");
        continue;
      }
      console.log("\n— npm run", script, "—\n");
      execSync(`npm run ${script}`, { cwd: root, stdio: "inherit" });
    }
    console.log("\nverify-alignment: pipeline OK");
  } else {
    if (!quiet) {
      console.log(
        "verify-alignment: tip — run  npm run verify:alignment -- --verify  for full pipeline"
      );
    }
  }

  process.exit(0);
}

main();
