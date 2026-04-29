#!/usr/bin/env node
/**
 * Propagates p31-constants.json → ground-truth, cognitive-passport index.html, src/p31-constants-generated.ts
 * Registry of coupled artefacts: p31-alignment.json + docs/P31-ALIGNMENT-SYSTEM.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalNumbering, buildMissionSnippet } from "./lib/p31-constants-fragment.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const constantsPath = path.join(root, "p31-constants.json");
const gtPath = path.join(root, "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json");
const passportHtml = path.join(root, "cognitive-passport", "index.html");
const genTs = path.join(root, "src", "p31-constants-generated.ts");

function main() {
  if (!fs.existsSync(constantsPath)) {
    console.error("apply-constants: missing", constantsPath);
    process.exit(1);
  }
  const c = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
  const sch = c.cognitivePassport.jsonSchema;
  const ed = c.cognitivePassport.longFormEdition;
  const fn = c.cognitivePassport.longFormFilename;
  const title = c.cognitivePassport.htmlGeneratorTitle || "P31 Cognitive Passport — Generator (v1)";

  if (fs.existsSync(gtPath)) {
    const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
    gt.schema = c.groundTruth.schema;
    gt.version = c.groundTruth.fileVersion;
    gt.updated = c.updated;
    gt.mission = buildMissionSnippet(c);
    gt.canonicalNumbering = buildCanonicalNumbering(c);
    fs.writeFileSync(gtPath, JSON.stringify(gt, null, 2) + "\n", "utf8");
    console.log("Wrote", path.relative(root, gtPath));
  } else {
    console.warn("apply-constants: skip ground-truth (missing):", gtPath);
  }

  const p31caRoot = path.join(root, "andromeda/04_SOFTWARE/p31ca");
  const p31caMeshJson = path.join(p31caRoot, "src/data/p31-mesh-constants.json");
  if (c.mesh && fs.existsSync(p31caRoot)) {
    fs.mkdirSync(path.dirname(p31caMeshJson), { recursive: true });
    const meshBody = JSON.stringify(c.mesh, null, 2) + "\n";
    fs.writeFileSync(p31caMeshJson, meshBody, "utf8");
    console.log("Wrote", path.relative(root, p31caMeshJson));
    const meshPublic = path.join(p31caRoot, "public/p31-mesh-constants.json");
    fs.mkdirSync(path.dirname(meshPublic), { recursive: true });
    fs.writeFileSync(meshPublic, meshBody, "utf8");
    console.log("Wrote", path.relative(root, meshPublic));
  } else if (c.mesh) {
    console.warn("apply-constants: skip p31-mesh-constants (no p31ca tree):", p31caMeshJson);
  }

  if (c.integrations && fs.existsSync(p31caRoot)) {
    const integBody = JSON.stringify(c.integrations, null, 2) + "\n";
    const integSrc = path.join(p31caRoot, "src/data/p31-integrations.json");
    const integPub = path.join(p31caRoot, "public/p31-integrations.json");
    fs.mkdirSync(path.dirname(integSrc), { recursive: true });
    fs.writeFileSync(integSrc, integBody, "utf8");
    console.log("Wrote", path.relative(root, integSrc));
    fs.mkdirSync(path.dirname(integPub), { recursive: true });
    fs.writeFileSync(integPub, integBody, "utf8");
    console.log("Wrote", path.relative(root, integPub));
  } else if (c.integrations) {
    console.warn("apply-constants: skip p31-integrations (no p31ca tree)");
  }

  /** dev-workbench `URLS` prop name → p31-constants.json `mesh` key */
  const devWorkbenchMeshKeys = [
    ["k4Personal", "k4PersonalWorkerUrl"],
    ["k4Cage", "k4CageWorkerUrl"],
    ["k4Hubs", "k4HubsWorkerUrl"],
    ["agentHub", "agentHubWorkerUrl"],
    ["orchestrator", "orchestratorWorkerUrl"],
    ["edgeLab", "edgeLabWorkerUrl"],
  ];
  const devWorkbench = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/dev-workbench.html");
  if (fs.existsSync(devWorkbench) && c.mesh) {
    let html = fs.readFileSync(devWorkbench, "utf8");
    let replaced = 0;
    for (const [prop, meshKey] of devWorkbenchMeshKeys) {
      const u = c.mesh[meshKey];
      if (!u) continue;
      const re = new RegExp(`(${prop}:\\s*")https?:\\/\\/[^"]+(")`, "m");
      if (!re.test(html)) {
        console.warn(`apply-constants: dev-workbench missing line for ${prop} — skip replace`);
        continue;
      }
      html = html.replace(re, `$1${u}$2`);
      replaced++;
    }
    if (replaced > 0) {
      fs.writeFileSync(devWorkbench, html, "utf8");
      console.log("Wrote", path.relative(root, devWorkbench));
    }
  }

  if (fs.existsSync(passportHtml)) {
    let html = fs.readFileSync(passportHtml, "utf8");
    html = html.replace(
      /P31 Cognitive Passport machine slice: Markdown, JSON \([^)]+, and agent block/,
      `P31 Cognitive Passport machine slice: Markdown, JSON (${sch}), and agent block`
    );
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/</g, "")}</title>`);
    html = html.replace(/<span class="badge">schema [^<]+<\/span>/, `<span class="badge">schema ${sch}</span>`);
    html = html.replace(
      /(<a [^>]+>)(v[0-9.]+)( life document<\/a>)/,
      (_, a, _v, b) => `${a}v${ed}${b}`
    );
    html = html.replace(/const SCHEMA = "p31\.cognitivePassport\/[^"]+"/, `const SCHEMA = "${sch}"`);
    html = html.replace(
      /full ground truth remains <code>P31 COGNITIVE PASSPORT [^<]+<\/code>/,
      `full ground truth remains <code>${fn}</code>`
    );
    fs.writeFileSync(passportHtml, html, "utf8");
    console.log("Wrote", path.relative(root, passportHtml));
  }

  const exportObj = {
    updated: c.updated,
    organization: c.organization,
    contact: c.contact,
    payment: c.payment,
    bonding: c.bonding,
    physics: c.physics,
    cognitivePassport: c.cognitivePassport,
    groundTruth: c.groundTruth,
    edge: c.edge,
    research: c.research,
    ...(c.mesh != null ? { mesh: c.mesh } : {}),
    ...(c.operations != null ? { operations: c.operations } : {}),
    ...(c.documentation != null ? { documentation: c.documentation } : {}),
    ...(c.integrations != null ? { integrations: c.integrations } : {}),
  };
  const tsBody = `/* eslint-disable */
/**
 * AUTO-GENERATED from p31-constants.json by: npm run apply:constants
 * Do not hand-edit. Source of truth: p31-constants.json
 * Cross-artefact map: p31-alignment.json (p31.alignment/1.0.0) — docs/P31-ALIGNMENT-SYSTEM.md
 */
export const P31_CONSTANTS = ${JSON.stringify(exportObj, null, 2)} as const;
`;
  if (!fs.existsSync(path.join(root, "src"))) {
    console.warn("apply-constants: no src/ — skip", path.relative(root, genTs));
  } else {
    fs.writeFileSync(genTs, tsBody, "utf8");
    console.log("Wrote", path.relative(root, genTs));
  }
  console.log("\nNext: npm run verify:constants && (optional) npm run sync:passport\n");
}

main();
