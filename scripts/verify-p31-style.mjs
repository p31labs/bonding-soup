#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");

if (!fs.existsSync(p31ca)) {
  console.log("verify-p31-style: skip — no p31ca");
  process.exit(0);
}

execSync("node scripts/verify-p31-style.mjs", { cwd: p31ca, stdio: "inherit" });

const hubCss = path.join(p31ca, "public", "p31-style.css");
const passCss = path.join(root, "cognitive-passport", "p31-style.css");
if (!fs.existsSync(passCss)) {
  console.error(
    "verify-p31-style: missing cognitive-passport/p31-style.css — run npm run apply:p31-style",
  );
  process.exit(1);
}
if (fs.readFileSync(hubCss, "utf8") !== fs.readFileSync(passCss, "utf8")) {
  console.error(
    "verify-p31-style: cognitive-passport/p31-style.css !== p31ca/public — run npm run apply:p31-style",
  );
  process.exit(1);
}
console.log("verify-p31-style: passport mirror OK");
