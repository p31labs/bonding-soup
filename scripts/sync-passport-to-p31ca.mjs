#!/usr/bin/env node
/**
 * Copies cognitive-passport/index.html to p31ca/public/passport-generator.html
 * with p31ca-specific header/footer. Run: npm run sync:passport
 * Alignment: p31-alignment.json + verify:passport
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  canonicalPassportTransformPath,
  importPassportTransformModule,
} from "./passport-p31ca-transform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "cognitive-passport", "index.html");
const dest = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/passport-generator.html"
);

async function main() {
  if (!fs.existsSync(src)) {
    console.error("sync-passport: missing source", src);
    process.exit(1);
  }

  const mod = await importPassportTransformModule();
  if (!mod || typeof mod.toP31caMirror !== "function") {
    console.error(
      "sync-passport: missing transform — clone or link andromeda with p31ca:",
      canonicalPassportTransformPath
    );
    process.exit(1);
  }
  const { toP31caMirror } = mod;

  let html;
  try {
    html = toP31caMirror(fs.readFileSync(src, "utf8"));
  } catch (e) {
    console.error("sync-passport:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html, "utf8");
  console.log("sync-passport: wrote", path.relative(root, dest));

  const responsiveSrc = path.join(root, "cognitive-passport", "p31-responsive-surface.css");
  const responsiveDest = path.join(
    root,
    "andromeda/04_SOFTWARE/p31ca/public/p31-responsive-surface.css"
  );
  if (fs.existsSync(responsiveSrc) && fs.existsSync(path.dirname(responsiveDest))) {
    fs.copyFileSync(responsiveSrc, responsiveDest);
    console.log(
      "sync-passport: copied",
      path.relative(root, responsiveSrc),
      "→",
      path.relative(root, responsiveDest)
    );
  }
}

main().catch((e) => {
  console.error("sync-passport:", e instanceof Error ? e.message : e);
  process.exit(1);
});
