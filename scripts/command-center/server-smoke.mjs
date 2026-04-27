#!/usr/bin/env node
/**
 * Spawns the command center on a high port, GETs / and assets, exits 0 or throws.
 * Used from `npm run verify:command-center` (no manual server).
 */
import * as http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const port = Number(process.env.P31_CMD_CENTER_SMOKE_PORT) || 31331;
const bondingAppleTouch = path.join(root, "p31-bonding-icons", "apple-touch-180.png");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (c) => {
          body += c;
        });
        res.on("end", () => resolve({ status: res.statusCode || 0, body }));
      })
      .on("error", reject);
  });
}

function waitFor(predicate, maxMs, stepMs = 40) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    function tick() {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - t0 > maxMs) {
        reject(new Error("command-center smoke: timeout waiting for server"));
        return;
      }
      setTimeout(tick, stepMs);
    }
    tick();
  });
}

const child = spawn(process.execPath, [path.join(root, "scripts/p31-local-command-center.mjs")], {
  cwd: root,
  env: {
    ...process.env,
    P31_CMD_CENTER_NO_OPEN: "1",
    P31_CMD_CENTER_PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let bootLineSeen = false;
function markBoot(chunk) {
  if (String(chunk).includes("P31 command center:")) bootLineSeen = true;
}
child.stdout.on("data", markBoot);
child.stderr.on("data", markBoot);

async function main() {
  try {
    await waitFor(() => bootLineSeen, 8000);
    const mainPage = await httpGet(`http://127.0.0.1:${port}/`);
    if (mainPage.status !== 200) {
      throw new Error("command-center smoke: / status " + mainPage.status);
    }
    if (!mainPage.body.includes('id="cc-boot"')) {
      throw new Error("command-center smoke: missing #cc-boot");
    }
    if (!mainPage.body.includes("Operator console")) {
      throw new Error("command-center smoke: missing hero copy");
    }
    const js = await httpGet(`http://127.0.0.1:${port}/assets/command-center.js`);
    if (js.status !== 200) {
      throw new Error("command-center smoke: command-center.js " + js.status);
    }
    const css = await httpGet(`http://127.0.0.1:${port}/assets/command-center.css`);
    if (css.status !== 200) {
      throw new Error("command-center smoke: command-center.css " + css.status);
    }
    const rs = await httpGet(`http://127.0.0.1:${port}/assets/p31-responsive-surface.css`);
    if (rs.status !== 200) {
      throw new Error("command-center smoke: p31-responsive-surface.css " + rs.status);
    }
    const man = await httpGet(`http://127.0.0.1:${port}/manifest.webmanifest`);
    if (man.status !== 200) {
      throw new Error("command-center smoke: manifest " + man.status);
    }
    if (!man.body.includes("P31 Operator Console")) {
      throw new Error("command-center smoke: manifest body");
    }
    let manifestParsed;
    try {
      manifestParsed = JSON.parse(man.body);
    } catch {
      throw new Error("command-center smoke: manifest not JSON (early)");
    }
    if (manifestParsed.display !== "standalone") {
      throw new Error("command-center smoke: manifest display must be standalone");
    }
    if (manifestParsed.scope !== "/") {
      throw new Error("command-center smoke: manifest scope");
    }
    if (fs.existsSync(bondingAppleTouch)) {
      const touch = await httpGet(`http://127.0.0.1:${port}/apple-touch-icon.png`);
      if (touch.status !== 200) {
        throw new Error("command-center smoke: apple-touch-icon.png " + touch.status);
      }
      if (!mainPage.body.includes("apple-touch-icon")) {
        throw new Error("command-center smoke: HTML missing apple-touch-icon link");
      }
      const hasTouch =
        Array.isArray(manifestParsed.icons) &&
        manifestParsed.icons.some((/** @type {{ src?: string }} */ i) => i.src === "/apple-touch-icon.png");
      if (!hasTouch) {
        throw new Error("command-center smoke: manifest missing apple-touch icon entry");
      }
    }
    console.log("verify:command-center-smoke: OK");
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
}

main().catch((e) => {
  console.error(e.message || e);
  child.kill("SIGKILL");
  process.exit(1);
});
