#!/usr/bin/env node
/**
 * Quantum egg hunt: docs/egg-hunt-manifest.json (p31.quantumEggHunt/*)
 * — file anchors, Pauli assertions, Larmor coherence vs p31-constants.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "docs", "egg-hunt-manifest.json");
const constantsPath = path.join(root, "p31-constants.json");
const ANDROMEDA = "andromeda/";

function lineAt(content, needle) {
  const i = content.indexOf(needle);
  if (i < 0) return null;
  return content.slice(0, i).split("\n").length;
}

function underAndromeda(rel) {
  return rel.startsWith(ANDROMEDA);
}

function hasAndromeda() {
  return fs.existsSync(path.join(root, "andromeda"));
}

function getByPath(obj, dotPath) {
  return dotPath.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

/** True in CI (logs without Unicode) or when QUANTUM_EGG_ASCII=1. */
function asciiOnly() {
  return (
    process.env.QUANTUM_EGG_ASCII === "1" ||
    process.env.CI === "true" ||
    process.env.GITHUB_ACTIONS === "true"
  );
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error("verify-egg-hunt: missing", path.relative(root, manifestPath));
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const { entries = [], assertions = [], coherence, schema } = raw;

  if (schema !== "p31.quantumEggHunt/1.0.0") {
    console.error("verify-egg-hunt: expected p31.quantumEggHunt/1.0.0, got", JSON.stringify(schema));
    process.exit(1);
  }

  const entryIds = new Set();
  for (const e of entries) {
    if (!e.id || !e.file || !Array.isArray(e.require) || e.require.length === 0) {
      console.error("verify-egg-hunt: bad entry", e?.id || "(no id)");
      process.exit(1);
    }
    if (entryIds.has(e.id)) {
      console.error("verify-egg-hunt: duplicate entry id", e.id);
      process.exit(1);
    }
    entryIds.add(e.id);
  }

  const assertIds = new Set();
  for (const a of assertions) {
    if (!a.id || !a.file) {
      console.error("verify-egg-hunt: bad assertion", a?.id || "(no id)");
      process.exit(1);
    }
    if (assertIds.has(a.id)) {
      console.error("verify-egg-hunt: duplicate assertion id", a.id);
      process.exit(1);
    }
    assertIds.add(a.id);
  }

  const andromeda = hasAndromeda();
  let skip = 0;
  let checkEntry = 0;
  let checkAssert = 0;
  let larmorCheck = 0;

  for (const e of entries) {
    if (underAndromeda(e.file) && !andromeda) {
      console.log("verify-egg-hunt: skip", e.id, "(no andromeda/)");
      skip++;
      continue;
    }
    const abs = path.join(root, e.file);
    if (!fs.existsSync(abs)) {
      console.error("verify-egg-hunt: missing file", e.id, "→", e.file);
      process.exit(1);
    }
    const body = fs.readFileSync(abs, "utf8");
    for (const frag of e.require) {
      if (!body.includes(frag)) {
        const hint = body.includes(frag.split(/\s+/)[0]) ? " (partial?)" : "";
        console.error("verify-egg-hunt:", e.id, "— missing anchor" + hint + ":", JSON.stringify(frag), "in", e.file);
        process.exit(1);
      }
    }
    checkEntry++;
  }

  for (const a of assertions) {
    if (underAndromeda(a.file) && !andromeda) {
      console.log("verify-egg-hunt: skip assertion", a.id, "(no andromeda/)");
      skip++;
      continue;
    }
    const abs = path.join(root, a.file);
    if (!fs.existsSync(abs)) {
      console.error("verify-egg-hunt: missing assertion file", a.id, "→", a.file);
      process.exit(1);
    }
    const body = fs.readFileSync(abs, "utf8");
    const bad = a.mustNotInclude;
    if (typeof bad !== "string") {
      console.error("verify-egg-hunt: assertion", a.id, "needs mustNotInclude");
      process.exit(1);
    }
    if (body.includes(bad)) {
      const line = lineAt(body, bad);
      console.error(
        "verify-egg-hunt: Pauli assertion",
        a.id,
        "forbidden substring",
        JSON.stringify(bad),
        "in",
        a.file,
        line != null ? `(~line ${line})` : ""
      );
      process.exit(1);
    }
    checkAssert++;
  }

  if (coherence?.larmor && andromeda) {
    const { fromConstants, requireDisplay, files: lFiles } = coherence.larmor;
    if (!fromConstants || !requireDisplay || !Array.isArray(lFiles)) {
      console.error("verify-egg-hunt: coherence.larmor is incomplete");
      process.exit(1);
    }
    if (!fs.existsSync(constantsPath)) {
      console.log("verify-egg-hunt: skip Larmor coherence (no p31-constants.json)");
      skip++;
    } else {
      const C = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
      const v = getByPath(C, fromConstants);
      if (typeof v !== "number" || !Number.isFinite(v)) {
        console.error("verify-egg-hunt: coherence.larmor: not a number at", fromConstants);
        process.exit(1);
      }
      const needle = requireDisplay.replace("{value}", String(v));
      for (const rel of lFiles) {
        if (underAndromeda(rel) && !andromeda) continue;
        const p = path.join(root, rel);
        if (!fs.existsSync(p)) {
          console.error("verify-egg-hunt: Larmor file missing", rel);
          process.exit(1);
        }
        const t = fs.readFileSync(p, "utf8");
        if (!t.includes(needle)) {
          console.error(
            "verify-egg-hunt: Larmor coherence —",
            JSON.stringify(needle),
            "not found in",
            rel,
            "(from",
            fromConstants,
            "=",
            v,
            ")"
          );
          process.exit(1);
        }
        larmorCheck++;
      }
    }
  } else if (coherence?.larmor && !andromeda) {
    console.log("verify-egg-hunt: skip Larmor coherence (no andromeda/)");
    skip++;
  }

  const bits = [
    `${checkEntry} operator${checkEntry === 1 ? "" : "s"}`,
    `${checkAssert} Pauli check${checkAssert === 1 ? "" : "s"}`,
  ];
  if (larmorCheck) {
    bits.push(asciiOnly() ? `Larmor Hz locked x${larmorCheck}` : `Larmor ⟨Hz⟩ locked ×${larmorCheck}`);
  }
  if (skip) bits.push(`${skip} skipped`);
  if (asciiOnly()) {
    console.log("verify-quantum-egg: OK " + bits.join(" | "));
  } else {
    console.log("verify-quantum-egg: ⟨ψ|complete⟩ — " + bits.join(" · "));
  }
}

main();
