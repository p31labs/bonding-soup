#!/usr/bin/env node
/**
 * Fails if p31.ground-truth.json drifts from p31-constants.json (no Cloudflare API).
 * When only Andromeda is checked out, skips if p31-constants.json is missing.
 * Part of p31.alignment: derivation constants-to-ground-truth-numbering; registry p31-alignment.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalNumbering, buildMissionSnippet } from "./lib/p31-constants-fragment.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const constantsPath = path.join(root, "p31-constants.json");
const gtPath = path.join(root, "andromeda/04_SOFTWARE/p31ca/ground-truth/p31.ground-truth.json");
const genTs = path.join(root, "src", "p31-constants-generated.ts");

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function main() {
  if (!fs.existsSync(constantsPath)) {
    console.log("verify-constants: skip — no p31-constants.json (partial clone?)");
    process.exit(0);
  }
  if (!fs.existsSync(gtPath)) {
    console.log("verify-constants: skip — no", gtPath);
    process.exit(0);
  }
  const c = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
  const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
  const expect = buildCanonicalNumbering(c);
  let fail = 0;
  if (!sameJson(gt.canonicalNumbering, expect)) {
    console.error("verify-constants: canonicalNumbering != p31-constants.json");
    console.error("Expected:", JSON.stringify(expect, null, 2));
    console.error("Got:     ", JSON.stringify(gt.canonicalNumbering, null, 2));
    fail = 1;
  }
  if (gt.schema !== c.groundTruth.schema) {
    console.error("verify-constants: ground-truth .schema should be", c.groundTruth.schema, "got", gt.schema);
    fail = 1;
  }
  if (gt.version !== c.groundTruth.fileVersion) {
    console.error("verify-constants: ground-truth .version should be", c.groundTruth.fileVersion, "got", gt.version);
    fail = 1;
  }
  if (c.payment) {
    const d = c.payment.donateApiHealthUrl;
    if (typeof d === "string" && d) {
      try {
        const u = new URL(d);
        if (u.protocol !== "https:") {
          console.error("verify-constants: payment.donateApiHealthUrl must use https");
          fail = 1;
        } else if (u.hostname !== "donate-api.phosphorus31.org" || u.pathname.replace(/\/$/, "") !== "/health") {
          console.error(
            "verify-constants: payment.donateApiHealthUrl must be https://donate-api.phosphorus31.org/health (MAP CWP-31 liveness contract)"
          );
          fail = 1;
        }
      } catch {
        console.error("verify-constants: payment.donateApiHealthUrl is not a valid URL");
        fail = 1;
      }
    }
    const wd = c.payment.donateApiWorkersDevUrl;
    if (typeof wd === "string" && wd) {
      try {
        const u = new URL(wd);
        if (u.protocol !== "https:") {
          console.error("verify-constants: payment.donateApiWorkersDevUrl must use https");
          fail = 1;
        } else if (u.hostname !== "donate-api.trimtab-signal.workers.dev" || u.pathname.replace(/\/$/, "") !== "") {
          console.error(
            "verify-constants: payment.donateApiWorkersDevUrl must be https://donate-api.trimtab-signal.workers.dev (no path; MAP fleet default subdomain)"
          );
          fail = 1;
        }
      } catch {
        console.error("verify-constants: payment.donateApiWorkersDevUrl is not a valid URL");
        fail = 1;
      }
    }
    const stripeH = c.payment.stripeApiHealthUrl;
    const host = c.payment.stripeWorkerHost;
    if (typeof stripeH === "string" && stripeH && typeof host === "string" && host) {
      try {
        const u = new URL(stripeH);
        if (u.protocol !== "https:") {
          console.error("verify-constants: payment.stripeApiHealthUrl must use https");
          fail = 1;
        } else if (u.hostname !== host || u.pathname.replace(/\/$/, "") !== "/health") {
          console.error(
            "verify-constants: payment.stripeApiHealthUrl must be https://" + host + "/health (MAP / API Worker liveness)"
          );
          fail = 1;
        }
      } catch {
        console.error("verify-constants: payment.stripeApiHealthUrl is not a valid URL");
        fail = 1;
      }
    }
  }
  if (buildMissionSnippet(c) !== gt.mission) {
    console.error("verify-constants: mission string out of date — run: npm run apply:constants");
    fail = 1;
  }
  if (fs.existsSync(genTs)) {
    const ts = fs.readFileSync(genTs, "utf8");
    if (!ts.includes(c.organization.ein) || !ts.includes(String(c.physics.larmorHz))) {
      console.error("verify-constants: src/p31-constants-generated.ts missing EIN or larmor — run: npm run apply:constants");
      fail = 1;
    }
    const payHealth = c.payment?.donateApiHealthUrl;
    if (typeof payHealth === "string" && payHealth && !ts.includes(payHealth)) {
      console.error("verify-constants: src/p31-constants-generated.ts missing payment.donateApiHealthUrl — run: npm run apply:constants");
      fail = 1;
    }
    const payWd = c.payment?.donateApiWorkersDevUrl;
    if (typeof payWd === "string" && payWd && !ts.includes(payWd)) {
      console.error(
        "verify-constants: src/p31-constants-generated.ts missing payment.donateApiWorkersDevUrl — run: npm run apply:constants"
      );
      fail = 1;
    }
    const stripeHealth = c.payment?.stripeApiHealthUrl;
    if (typeof stripeHealth === "string" && stripeHealth && !ts.includes(stripeHealth)) {
      console.error("verify-constants: src/p31-constants-generated.ts missing payment.stripeApiHealthUrl — run: npm run apply:constants");
      fail = 1;
    }
    for (const key of ["orchestratorWorkerUrl", "agentHubWorkerUrl"]) {
      const u = c.mesh?.[key];
      if (u && !ts.includes(u)) {
        console.error(
          `verify-constants: src/p31-constants-generated.ts missing mesh.${key} — run: npm run apply:constants`
        );
        fail = 1;
      }
    }
    const remembrance = c.mesh?.remembranceWarmWhite;
    if (typeof remembrance === "string" && remembrance.startsWith("#")) {
      const starfieldJs = path.join(root, "design-assets", "starfield", "p31-starfield.js");
      if (fs.existsSync(starfieldJs)) {
        const st = fs.readFileSync(starfieldJs, "utf8");
        if (!st.includes(remembrance)) {
          console.error(
            "verify-constants: mesh.remembranceWarmWhite must appear literally in design-assets/starfield/p31-starfield.js (P31_REMEMBRANCE_WARM_WHITE)"
          );
          fail = 1;
        }
      }
      const meshRem = path.join(root, "simplex-v7", "src", "lib", "mesh-remembrance.ts");
      if (fs.existsSync(meshRem)) {
        const mt = fs.readFileSync(meshRem, "utf8");
        if (!mt.includes(remembrance)) {
          console.error(
            "verify-constants: mesh.remembranceWarmWhite must appear in simplex-v7/src/lib/mesh-remembrance.ts (REMEMBRANCE_WARM_WHITE)"
          );
          fail = 1;
        }
      }
    }
    const mvp = c.documentation?.mvpInventory;
    if (mvp && !ts.includes(mvp)) {
      console.error(
        "verify-constants: generated TS missing documentation.mvpInventory path — run: npm run apply:constants"
      );
      fail = 1;
    }
  } else {
    console.warn("verify-constants: warn — no", genTs, "(run apply:constants once)");
  }
  if (c.mesh?.k4PersonalWorkerUrl) {
    const u = c.mesh.k4PersonalWorkerUrl;
    const meshStart = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/mesh-start.html");
    const hubsToml = path.join(root, "andromeda/04_SOFTWARE/k4-hubs/wrangler.toml");
    if (fs.existsSync(meshStart)) {
      const html = fs.readFileSync(meshStart, "utf8");
      if (!html.includes(u)) {
        console.error("verify-constants: mesh-start.html must include mesh.k4PersonalWorkerUrl from p31-constants.json");
        fail = 1;
      }
    }
    if (fs.existsSync(hubsToml)) {
      const toml = fs.readFileSync(hubsToml, "utf8");
      if (!toml.includes(u)) {
        console.error("verify-constants: k4-hubs/wrangler.toml PERSONAL_MESH_URL must match p31-constants mesh.k4PersonalWorkerUrl");
        fail = 1;
      }
    }
  }
  if (c.mesh && Object.keys(c.mesh).length > 0) {
    const meshJsonPath = path.join(root, "andromeda/04_SOFTWARE/p31ca/src/data/p31-mesh-constants.json");
    const meshPublicPath = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/p31-mesh-constants.json");
    if (fs.existsSync(meshJsonPath)) {
      const mj = JSON.parse(fs.readFileSync(meshJsonPath, "utf8"));
      for (const k of Object.keys(c.mesh)) {
        if (k === "_comment") continue;
        if (mj[k] !== c.mesh[k]) {
          console.error(
            `verify-constants: p31ca/src/data/p31-mesh-constants.json field ${k} out of date — run: npm run apply:constants`
          );
          fail = 1;
        }
      }
      if (!fs.existsSync(meshPublicPath)) {
        console.error(
          "verify-constants: missing p31ca/public/p31-mesh-constants.json — run: npm run apply:constants"
        );
        fail = 1;
      } else {
        const pub = fs.readFileSync(meshPublicPath, "utf8");
        const src = fs.readFileSync(meshJsonPath, "utf8");
        if (pub !== src) {
          console.error(
            "verify-constants: public/p31-mesh-constants.json must match src/data/p31-mesh-constants.json — run: npm run apply:constants"
          );
          fail = 1;
        }
      }
    }
    const workbench = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/dev-workbench.html");
    if (fs.existsSync(workbench)) {
      const wb = fs.readFileSync(workbench, "utf8");
      for (const k of Object.keys(c.mesh)) {
        if (k === "_comment") continue;
        const u = c.mesh[k];
        if (typeof u === "string" && u.startsWith("http") && !wb.includes(u)) {
          console.error(
            `verify-constants: dev-workbench.html must include mesh.${k} URL — run: npm run apply:constants`
          );
          fail = 1;
        }
      }
    }
  }
  if (c.mesh?.orchestratorWorkerUrl) {
    const dash = path.join(root, "andromeda/04_SOFTWARE/p31ca/src/components/OrchestratorDashboard.astro");
    if (fs.existsSync(dash)) {
      const s = fs.readFileSync(dash, "utf8");
      if (!s.includes("p31-mesh-constants.json")) {
        console.error("verify-constants: OrchestratorDashboard.astro should import p31-mesh-constants.json (orchestrator URL from constants pipeline)");
        fail = 1;
      }
    }
  }

  if (c.integrations) {
    if (c.integrations.schema !== "p31.integrationsBridge/1.0.0") {
      console.error("verify-constants: integrations.schema must be p31.integrationsBridge/1.0.0");
      fail = 1;
    }
    const cat = c.integrations.openCatalog;
    if (!Array.isArray(cat) || cat.length < 1) {
      console.error("verify-constants: integrations.openCatalog must be a non-empty array");
      fail = 1;
    } else {
      for (const row of cat) {
        if (!row.id || !row.label || !row.docsUrl) {
          console.error("verify-constants: each openCatalog row needs id, label, docsUrl");
          fail = 1;
          break;
        }
        try {
          const u = new URL(row.docsUrl);
          if (u.protocol !== "https:") {
            console.error("verify-constants: openCatalog docsUrl must use https —", row.id);
            fail = 1;
          }
        } catch {
          console.error("verify-constants: openCatalog invalid docsUrl —", row.id);
          fail = 1;
        }
      }
    }
    const ep = c.integrations.endpoints;
    const endpointUrlKeys = new Set([
      "homeAssistantLanBase",
      "mqttBrokerUrl",
      "nodeRedBase",
      "n8nBase",
      "prometheusBase",
      "grafanaBase",
    ]);
    if (ep && typeof ep === "object") {
      for (const [k, v] of Object.entries(ep)) {
        if (k.startsWith("_")) continue;
        if (v === null || v === undefined) continue;
        if (typeof v !== "string") {
          console.error("verify-constants: integrations.endpoints." + k + " must be string or empty");
          fail = 1;
          continue;
        }
        if (v === "") continue;
        if (!endpointUrlKeys.has(k)) continue;
        try {
          new URL(v);
        } catch {
          console.error("verify-constants: integrations.endpoints." + k + " must be empty or valid URL");
          fail = 1;
        }
      }
    }
    const bridge = c.integrations.meshBridge;
    if (bridge?.commandCenterEdge) {
      try {
        const u = new URL(bridge.commandCenterEdge);
        if (u.protocol !== "https:") {
          console.error("verify-constants: meshBridge.commandCenterEdge must be https");
          fail = 1;
        }
      } catch {
        console.error("verify-constants: meshBridge.commandCenterEdge invalid URL");
        fail = 1;
      }
    }
    const integSrc = path.join(root, "andromeda/04_SOFTWARE/p31ca/src/data/p31-integrations.json");
    if (fs.existsSync(integSrc)) {
      const ing = JSON.parse(fs.readFileSync(integSrc, "utf8"));
      if (JSON.stringify(ing) !== JSON.stringify(c.integrations)) {
        console.error("verify-constants: p31ca/src/data/p31-integrations.json out of date — run: npm run apply:constants");
        fail = 1;
      }
      const integPub = path.join(root, "andromeda/04_SOFTWARE/p31ca/public/p31-integrations.json");
      if (fs.existsSync(integPub)) {
        if (fs.readFileSync(integPub, "utf8") !== fs.readFileSync(integSrc, "utf8")) {
          console.error("verify-constants: public/p31-integrations.json must match src/data — run: npm run apply:constants");
          fail = 1;
        }
      }
    } else if (fs.existsSync(path.join(root, "andromeda/04_SOFTWARE/p31ca"))) {
      console.error("verify-constants: missing p31-integrations.json — run: npm run apply:constants");
      fail = 1;
    }
    if (fs.existsSync(genTs) && c.integrations.schema && !fs.readFileSync(genTs, "utf8").includes(c.integrations.schema)) {
      console.error("verify-constants: generated TS missing integrations.schema — run: npm run apply:constants");
      fail = 1;
    }
  }

  if (fail) {
    process.exit(1);
  }
  console.log("verify-constants: OK (aligned with p31-constants.json)");
}

main();
