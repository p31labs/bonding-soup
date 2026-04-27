#!/usr/bin/env node
/**
 * p31.shipbox/1.0.0 — one JSON snapshot of this workspace for handoff / evidence.
 *   npm run p31:shipbox          → print JSON to stdout
 *   npm run verify:shipbox     → build + assert shape (no secrets; public constants only)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/**
 * @param {string} rel
 * @returns {boolean}
 */
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

export function buildShipbox() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const C = JSON.parse(fs.readFileSync(path.join(root, "p31-constants.json"), "utf8"));

  /** @type {{ head?: string; dirty?: boolean; error?: string }} */
  const git = {};
  try {
    git.head = execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim();
    const status = execSync("git status --porcelain", { cwd: root, encoding: "utf8" });
    git.dirty = status.length > 0;
  } catch {
    git.error = "git_unavailable";
  }

  const mustExist = [
    "p31-alignment.json",
    "p31-facts.json",
    "p31-constants.json",
    "soup.html",
    "scripts/p31-shipbox.mjs",
    "scripts/verify-facts.mjs",
  ];
  const filesPresent = {};
  for (const rel of mustExist) {
    filesPresent[rel] = exists(rel);
  }

  return {
    schema: "p31.shipbox/1.0.0",
    generatedAt: new Date().toISOString(),
    package: { name: pkg.name, version: pkg.version },
    git,
    constants: {
      updated: C.updated,
      organization: {
        legalName: C.organization?.legalName,
        ein: C.organization?.ein,
      },
      mesh: {
        k4PersonalWorkerUrl: C.mesh?.k4PersonalWorkerUrl,
        k4CageWorkerUrl: C.mesh?.k4CageWorkerUrl,
        k4HubsWorkerUrl: C.mesh?.k4HubsWorkerUrl,
        passkeyApiBasePath: C.mesh?.passkeyApiBasePath,
      },
      bonding: { testBaseline: C.bonding?.testBaseline, publicUrl: C.bonding?.publicUrl },
      physics: { larmorHz: C.physics?.larmorHz },
    },
    filesPresent,
  };
}

/** @param {unknown} s */
export function assertShipbox(s) {
  if (!s || typeof s !== "object") throw new Error("shipbox: not an object");
  const o = /** @type {Record<string, unknown>} */ (s);
  if (o.schema !== "p31.shipbox/1.0.0") throw new Error("shipbox: bad schema");
  if (typeof o.generatedAt !== "string") throw new Error("shipbox: missing generatedAt");
  const p = o.package;
  if (!p || typeof p !== "object") throw new Error("shipbox: package");
  const name = /** @type {Record<string, unknown>} */ (p).name;
  if (typeof name !== "string" || !name) throw new Error("shipbox: package.name");
  const c = o.constants;
  if (!c || typeof c !== "object") throw new Error("shipbox: constants");
  const org = /** @type {Record<string, unknown>} */ (c).organization;
  if (!org || typeof org !== "object") throw new Error("shipbox: organization");
  const ein = /** @type {Record<string, unknown>} */ (org).ein;
  if (typeof ein !== "string" || !/^\d{2}-\d{7}$/.test(ein)) throw new Error("shipbox: organization.ein");
  const mesh = /** @type {Record<string, unknown>} */ (c).mesh;
  if (!mesh || typeof mesh !== "object") throw new Error("shipbox: mesh");
  const k4 = /** @type {Record<string, unknown>} */ (mesh).k4PersonalWorkerUrl;
  if (typeof k4 !== "string" || !k4.startsWith("https://")) throw new Error("shipbox: mesh.k4PersonalWorkerUrl");
  const tb = /** @type {Record<string, unknown>} */ (c).bonding;
  if (tb && typeof tb === "object") {
    const bl = /** @type {Record<string, unknown>} */ (tb).testBaseline;
    if (!bl || typeof bl !== "object") throw new Error("shipbox: bonding.testBaseline");
    const t = /** @type {Record<string, unknown>} */ (bl).tests;
    const su = /** @type {Record<string, unknown>} */ (bl).suites;
    if (typeof t !== "number" || typeof su !== "number") throw new Error("shipbox: bonding testBaseline shape");
  } else {
    throw new Error("shipbox: bonding");
  }
  const fp = o.filesPresent;
  if (!fp || typeof fp !== "object") throw new Error("shipbox: filesPresent");
  for (const [k, v] of Object.entries(/** @type {Record<string, unknown>} */ (fp))) {
    if (v !== true) throw new Error("shipbox: missing or false file — " + k);
  }
}

function main() {
  const check = process.argv.includes("--check");
  const obj = buildShipbox();
  if (check) {
    try {
      assertShipbox(obj);
      console.log("verify-shipbox: OK — p31.shipbox/1.0.0, package " + (obj.package && obj.package.name) + " @" + (obj.git && obj.git.head ? obj.git.head : "?"));
    } catch (e) {
      const m = e && /** @type {Error} */ (e).message;
      console.error("verify-shipbox:", m || e);
      process.exit(1);
    }
  } else {
    process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
  }
}

main();
