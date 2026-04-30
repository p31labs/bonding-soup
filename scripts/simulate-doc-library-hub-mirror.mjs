#!/usr/bin/env node
/**
 * Dry-run hub mirror: sync to a temp `public/` tree, byte-compare to real p31ca/public.
 * Does not modify Andromeda. Fails on drift (same signal as verify:doc-library:p31ca-mirror, without git).
 *
 * Skips: no p31ca tree, or P31_SKIP_DOC_LIB_MIRROR=1.
 * Soft: P31_DOC_HUB_SIMULATE_SOFT=1 → print drift, exit 0.
 *
 * Hub `index.json` is kept in step with `build:doc-index` writes via auto `sync:doc-library:p31ca`
 * from `scripts/build-doc-index.mjs` (unless P31_DOC_INDEX_NO_AUTO_SYNC=1).
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DOC_LIBRARY_SYNC_PUBLIC_REL } from "./lib/doc-library-hub-mirror.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const realPublic = path.join(p31ca, "public");

function sha256File(abs) {
  const h = createHash("sha256");
  h.update(fs.readFileSync(abs));
  return h.digest("hex");
}

async function* walkFiles(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(p);
    else yield p;
  }
}

async function collectRelFiles(publicRoot, rel) {
  const abs = path.join(publicRoot, rel);
  if (!fs.existsSync(abs)) return [];
  const st = await fsp.stat(abs);
  if (st.isFile()) return [rel.replace(/\\/g, "/")];
  const out = [];
  for await (const f of walkFiles(abs)) {
    out.push(path.relative(publicRoot, f).replace(/\\/g, "/"));
  }
  return out.sort();
}

async function main() {
  if (process.env.P31_SKIP_DOC_LIB_MIRROR === "1") {
    console.log("simulate-doc-library-hub-mirror: skip — P31_SKIP_DOC_LIB_MIRROR=1");
    return;
  }
  if (!fs.existsSync(p31ca)) {
    console.log("simulate-doc-library-hub-mirror: skip — no p31ca tree");
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p31-doc-lib-sim-"));
  const simPublic = path.join(tmp, "public");
  await fsp.mkdir(simPublic, { recursive: true });

  let exitCode = 0;
  try {
    execSync("npm run sync:doc-library:p31ca", {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        P31_SYNC_DOC_LIB_PUBLIC_BASE: simPublic,
        P31_SYNC_DOC_LIB_SKIP_BUILD: "1",
      },
    });

    const expected = new Set();
    for (const rel of DOC_LIBRARY_SYNC_PUBLIC_REL) {
      for (const f of await collectRelFiles(simPublic, rel)) expected.add(f);
    }

    const soft = process.env.P31_DOC_HUB_SIMULATE_SOFT === "1";
    const drift = [];

    for (const rel of expected) {
      const a = path.join(simPublic, rel);
      const b = path.join(realPublic, rel);
      if (!fs.existsSync(b)) {
        drift.push({ rel, reason: "missing in hub public" });
        continue;
      }
      const sa = sha256File(a);
      const sb = sha256File(b);
      if (sa !== sb) drift.push({ rel, reason: "content differs" });
    }

    if (drift.length === 0) {
      console.log("simulate-doc-library-hub-mirror: OK — temp mirror matches p31ca/public (no git)");
    } else {
      console.error(
        "simulate-doc-library-hub-mirror: DRIFT — run npm run docs:prep:hub (or sync:doc-library:p31ca)"
      );
      for (const { rel, reason } of drift) console.error(" ", rel, "—", reason);
      if (!soft) exitCode = 1;
    }
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
  if (exitCode) process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
