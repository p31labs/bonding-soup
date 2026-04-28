#!/usr/bin/env node
/**
 * Lock: cognitive-passport/index.html SCHEMA constant ≡ @p31/shared cognitive-passport-schema.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "cognitive-passport", "index.html");
const sharedPath = path.join(
  root,
  "andromeda",
  "04_SOFTWARE",
  "packages",
  "shared",
  "src",
  "cognitive-passport-schema.ts",
);

function die(msg) {
  console.error("verify-cognitive-passport-schema:", msg);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(htmlPath)) die(`missing ${htmlPath}`);
  if (!fs.existsSync(sharedPath)) {
    console.log(
      "verify-cognitive-passport-schema: skip — no @p31/shared tree (partial clone)",
    );
    process.exit(0);
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const shared = fs.readFileSync(sharedPath, "utf8");

  const htmlM = html.match(
    /const SCHEMA = ["'](p31\.cognitivePassport\/[^"']+)["']/,
  );
  if (!htmlM) {
    die("cognitive-passport/index.html must declare const SCHEMA = \"p31.cognitivePassport/…\"");
  }
  const schema = htmlM[1];

  const sharedM = shared.match(
    /export const COGNITIVE_PASSPORT_SCHEMA = ['"](p31\.cognitivePassport\/[^'"]+)['"]/,
  );
  if (!sharedM || sharedM[1] !== schema) {
    die(
      `cognitive-passport-schema.ts must export COGNITIVE_PASSPORT_SCHEMA = '${schema}' (matches generator)`,
    );
  }

  console.log(
    "verify-cognitive-passport-schema: OK —",
    schema,
    "(html ≡ @p31/shared)",
  );
}

main();
