#!/usr/bin/env node
/**
 * p31.facts/1.0.0 — verify declarative invariants in p31-facts.json against the tree.
 * Complements verify:constants (deeper p31-constants shape); this is the facts contract for external claims.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const regPath = path.join(root, "p31-facts.json");

function die(msg, code = 1) {
  console.error("verify-facts:", msg);
  process.exit(code);
}

function getPath(obj, dotted) {
  const parts = dotted.split(".");
  let o = obj;
  for (const p of parts) {
    if (o == null || typeof o !== "object") return undefined;
    o = o[p];
  }
  return o;
}

function isHttpsUrl(s) {
  if (typeof s !== "string" || s.length < 10) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function main() {
  if (!fs.existsSync(regPath)) die("missing p31-facts.json", 1);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(regPath, "utf8"));
  } catch (e) {
    die("invalid p31-facts.json: " + (e && e.message), 1);
  }

  if (data.schema !== "p31.facts/1.0.0") {
    die(`expected schema p31.facts/1.0.0, got ${data.schema || "(none)"}`, 1);
  }

  const constantsPath = data.constants?.path;
  if (!constantsPath || typeof constantsPath !== "string") {
    die("p31-facts: constants.path required", 1);
  }

  const cPath = path.join(root, constantsPath);
  if (!fs.existsSync(cPath)) die("constants file missing: " + constantsPath, 1);

  let C;
  try {
    C = JSON.parse(fs.readFileSync(cPath, "utf8"));
  } catch (e) {
    die("invalid " + constantsPath + ": " + (e && e.message), 1);
  }

  for (const key of data.constants.requiredStringPaths || []) {
    const v = getPath(C, key);
    if (typeof v !== "string" || v.trim() === "") {
      die(`p31-constants: required non-empty string at ${key}`, 1);
    }
  }

  for (const key of data.constants.pathsMustBeHttps || []) {
    const v = getPath(C, key);
    if (!isHttpsUrl(v)) {
      die(`p31-constants: must be https URL at ${key}`, 1);
    }
  }

  const org = data.constants.organization;
  if (org?.requiredStringPaths?.length) {
    const base = C.organization;
    if (!base || typeof base !== "object") die("p31-constants: organization object required", 1);
    for (const k of org.requiredStringPaths) {
      const v = base[k];
      if (typeof v !== "string" || v.trim() === "") {
        die(`p31-constants: organization.${k} must be a non-empty string`, 1);
      }
    }
  }

  for (const rel of data.pathsMustExist || []) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) {
      die("required path missing: " + rel, 1);
    }
  }

  for (const block of data.forbiddenSubstringsInFiles || []) {
    for (const rel of block.paths || []) {
      const p = path.join(root, rel);
      if (!fs.existsSync(p)) {
        continue;
      }
      const text = fs.readFileSync(p, "utf8");
      for (const sub of block.substrings || []) {
        if (text.includes(sub)) {
          die(`toxic substring in ${rel} (redact or remove): ${sub.slice(0, 40)}…`, 1);
        }
      }
    }
  }

  const passkey = getPath(C, "mesh.passkeyApiBasePath");
  if (typeof passkey === "string" && passkey.length > 0 && !passkey.startsWith("/")) {
    die("mesh.passkeyApiBasePath must be a same-origin path starting with /", 1);
  }

  const bud = data.mesh?.k4PersonalProbeBudgetMs;
  if (bud != null) {
    if (typeof bud !== "number" || !Number.isFinite(bud) || bud < 1000 || bud > 300_000) {
      die("p31-facts: mesh.k4PersonalProbeBudgetMs must be a number 1000..300000 (ms)", 1);
    }
  }
  const gb = data.mesh?.glassProbeBudgetMs;
  if (gb != null) {
    if (typeof gb !== "number" || !Number.isFinite(gb) || gb < 1000 || gb > 300_000) {
      die("p31-facts: mesh.glassProbeBudgetMs must be a number 1000..300000 (ms)", 1);
    }
  }

  const nOrg = (data.constants.organization?.requiredStringPaths || []).length;
  const meshNote =
    bud != null || gb != null
      ? `, mesh budget${bud != null ? ` k4=${bud}ms` : ""}${gb != null ? ` glass=${gb}ms` : ""}`
      : "";
  console.log(
    "verify-facts: OK —",
    (data.pathsMustExist || []).length,
    "paths,",
    (data.constants.requiredStringPaths || []).length,
    "required constant paths" + (nOrg ? `, ${nOrg} org fields` : "") + ", https mesh worker URLs" + meshNote
  );
  process.exit(0);
}

main();
