#!/usr/bin/env node
/**
 * Headless smoke: static hub pages from `andromeda/04_SOFTWARE/p31ca/public/` load (200, title).
 * Uses Playwright Chromium. Skip: P31_SKIP_LAUNCH_LANE_SMOKE=1
 *
 * npm run test:launch-lane:smoke
 */
import net from "node:net";
import fs from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const REL_PATHS = [
  "andromeda/04_SOFTWARE/p31ca/public/connect.html",
  "andromeda/04_SOFTWARE/p31ca/public/planetary-onboard.html",
  "andromeda/04_SOFTWARE/p31ca/public/mesh-start.html",
  "andromeda/04_SOFTWARE/p31ca/public/quantum-deck.html",
  "andromeda/04_SOFTWARE/p31ca/public/quantum-composer.html",
  "andromeda/04_SOFTWARE/p31ca/public/donate.html",
];

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["-V"], { stdio: "ignore" });
      return c;
    } catch (e) {
      void e;
    }
  }
  throw new Error("launch-lane-smoke: need python3 on PATH");
}

function getPort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const a = s.address();
      const p = typeof a === "object" && a ? a.port : 0;
      s.close((err) => (err ? reject(err) : resolve(p)));
    });
  });
}

async function waitForHttp(u, maxTries) {
  const n = maxTries || 40;
  for (let i = 0; i < n; i++) {
    try {
      const r = await fetch(u, { method: "GET", signal: AbortSignal.timeout(2000) });
      if (r.ok) return;
    } catch (e) {
      void e;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("launch-lane-smoke: HTTP not ready " + u);
}

async function main() {
  if (process.env.P31_SKIP_LAUNCH_LANE_SMOKE === "1") {
    console.log("launch-lane-smoke: SKIP (P31_SKIP_LAUNCH_LANE_SMOKE=1)");
    process.exit(0);
  }

  const missing = REL_PATHS.map((rel) => path.join(root, rel)).filter((p) => !fs.existsSync(p));
  if (missing.length) {
    console.log(
      "launch-lane-smoke: SKIP — partial clone (missing:",
      missing.map((p) => path.relative(root, p)).join(", ") + ")",
    );
    process.exit(0);
  }

  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (e) {
    console.error("launch-lane-smoke: install playwright Chromium: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }

  const port = await getPort();
  const base = `http://127.0.0.1:${port}/`;
  const py = resolvePython();
  const server = spawn(py, ["-m", "http.server", String(port), "-b", "127.0.0.1"], {
    cwd: root,
    stdio: "ignore",
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  await new Promise((r) => setTimeout(r, 200));
  if (server.exitCode != null) {
    throw new Error("http.server exited");
  }

  await waitForHttp(base);

  const browser = await chromium.launch({ headless: true });
  try {
    for (const rel of REL_PATHS) {
      const url = encodeURI(`${base}${rel}`);
      const page = await browser.newPage();
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      const status = res?.status() ?? 0;
      if (status !== 200) {
        throw new Error(rel + ": HTTP " + status);
      }
      const title = (await page.title()) || "";
      if (title.trim().length < 2) {
        throw new Error(rel + ": empty title");
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }
  console.log("launch-lane-smoke: OK —", REL_PATHS.length, "routes");
}

main().catch((e) => {
  console.error("launch-lane-smoke: FAIL:", e.message || e);
  process.exit(1);
});
