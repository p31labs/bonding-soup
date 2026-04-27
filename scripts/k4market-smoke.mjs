#!/usr/bin/env node
/**
 * Headless smoke: repo-root static server → p31ca public k4market.html loads,
 * disclaimer + nav + (by default) WebGL canvas. Three.js loads from unpkg — outbound
 * HTTPS to unpkg is required for the canvas check. Linux headless: SwiftShader
 * launch flags. P31_K4MARKET_SMOKE_SKIP_CANVAS=1: shell + legal + nav only.
 * P31_K4MARKET_SMOKE_LAUNCH_TIMEOUT_MS: browser launch cap (default 20000; avoids hang).
 * P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1: exit 0 if launch times out (optional sandboxes only).
 * Requires: root `playwright`, `npx playwright install chromium`.
 */
import net from "node:net";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rel = "andromeda/04_SOFTWARE/p31ca/public/k4market.html";
const k4Path = path.join(root, rel);

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["-V"], { stdio: "ignore" });
      return c;
    } catch (e) {
      void e;
    }
  }
  throw new Error("k4market-smoke: need python3 or python for http.server");
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
  const n = maxTries || 30;
  for (let i = 0; i < n; i++) {
    if (server && server.exitCode != null) {
      throw new Error("k4market-smoke: http.server process exited (code " + server.exitCode + ")");
    }
    try {
      const r = await fetch(u, { method: "GET", signal: AbortSignal.timeout(1500) });
      if (r.ok) return;
    } catch (e) {
      void e;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("http server not responding: " + u);
}

let server;

async function main() {
  if (!fs.existsSync(k4Path)) {
    console.log("k4market-smoke: skip — " + rel + " not in checkout");
    return;
  }

  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (e) {
    console.error("k4market-smoke: install playwright: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }

  const port = await getPort();
  const pageUrl = `http://127.0.0.1:${port}/${rel.replace(/\\/g, "/")}`;
  const base = `http://127.0.0.1:${port}/`;
  const py = resolvePython();
  server = spawn(py, ["-m", "http.server", String(port), "-b", "127.0.0.1"], {
    cwd: root,
    stdio: "ignore",
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  await new Promise((r) => setTimeout(r, 200));
  if (server.exitCode != null) {
    throw new Error("http.server exited");
  }
  await waitForHttp(base);

  const skipCanvas = process.env.P31_K4MARKET_SMOKE_SKIP_CANVAS === "1";
  const launchMs = Math.max(5000, Number(process.env.P31_K4MARKET_SMOKE_LAUNCH_TIMEOUT_MS) || 20_000);
  const launchP = chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--use-gl=swiftshader",
    ],
  });
  const timeoutP = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("P31_K4_T_LAUNCH_TIMEOUT")), launchMs);
  });
  let browser;
  try {
    browser = await Promise.race([launchP, timeoutP]);
  } catch (e) {
    if (e && e.message === "P31_K4_T_LAUNCH_TIMEOUT") {
      launchP.then(
        (b) => b.close().catch(() => {}),
        () => {}
      );
      if (process.env.P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL === "1") {
        console.warn(
          "k4market-smoke: skip — chromium launch exceeded " + launchMs + "ms (P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1)"
        );
        return;
      }
      throw new Error(
        "chromium.launch hung past " +
          launchMs +
          "ms. Try: npx playwright install chromium, or a machine with a working headless stack. " +
          "P31_K4MARKET_SMOKE_SKIP_ON_LAUNCH_FAIL=1 to exit 0, or set P31_K4MARKET_SMOKE_LAUNCH_TIMEOUT_MS."
      );
    }
    throw e;
  }
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(90_000);
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
    const title = await page.title();
    if (!/K4\s*MARKET|k4\s*market/i.test(title)) {
      throw new Error("unexpected title: " + title);
    }
    await page.waitForSelector("#k4market-disclaimer", { timeout: 20_000 });
    const disc = await page.locator("#k4market-disclaimer").innerText();
    if (!/not financial advice|educational/i.test(disc)) {
      throw new Error("disclaimer text unexpected: " + disc.slice(0, 200));
    }
    if ((await page.locator('header a[href="/connect.html"]').count()) < 1) {
      throw new Error("missing header link to /connect.html");
    }
    if ((await page.locator('header a[href="/delta.html"]').count()) < 1) {
      throw new Error("missing header link to /delta.html");
    }
    if (!skipCanvas) {
      await page.waitForSelector("#mount canvas", { timeout: 60_000 });
    }
  } finally {
    await browser.close();
  }
  if (skipCanvas) {
    console.log("k4market-smoke: ok — disclaimer + nav + title (canvas skipped, P31_K4MARKET_SMOKE_SKIP_CANVAS=1)");
  } else {
    console.log("k4market-smoke: ok — disclaimer + WebGL + nav + title (headless Chromium)");
  }
}

function shutdown() {
  if (server && !server.killed) {
    try {
      server.kill("SIGTERM");
    } catch (e) {
      void e;
    }
  }
}

process.on("exit", shutdown);
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, function () {
    shutdown();
    process.exit(1);
  });
}

main()
  .then(() => {
    shutdown();
    process.exit(0);
  })
  .catch((e) => {
    console.error("k4market-smoke:", (e && e.message) || e);
    shutdown();
    process.exit(1);
  });
