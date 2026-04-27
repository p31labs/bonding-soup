#!/usr/bin/env node
/**
 * Headless smoke: http.server with CWD = p31ca/public → oqe-icosa.html loads JSON,
 * face grid renders (20 buttons), banner copy present. No Three.js / unpkg.
 * Requires: root `playwright`, `npx playwright install chromium`.
 */
import net from "node:net";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p31caPublic = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");
const oqeHtml = path.join(p31caPublic, "oqe-icosa.html");

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["-V"], { stdio: "ignore" });
      return c;
    } catch (e) {
      void e;
    }
  }
  throw new Error("oqe-icosa-e2e: need python3 or python for http.server");
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
      throw new Error("oqe-icosa-e2e: http.server exited (code " + server.exitCode + ")");
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
  if (!fs.existsSync(oqeHtml)) {
    console.log("oqe-icosa-e2e: skip — p31ca public not in checkout");
    return;
  }

  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (e) {
    console.error("oqe-icosa-e2e: install playwright: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }

  const port = await getPort();
  const pageUrl = `http://127.0.0.1:${port}/oqe-icosa.html`;
  const base = `http://127.0.0.1:${port}/`;
  const py = resolvePython();
  server = spawn(py, ["-m", "http.server", String(port), "-b", "127.0.0.1"], {
    cwd: p31caPublic,
    stdio: "ignore",
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  await new Promise((r) => setTimeout(r, 200));
  if (server.exitCode != null) {
    throw new Error("http.server exited");
  }
  await waitForHttp(base);
  const jsonCheck = new URL("/p31-oqe-twenty.json", base);
  await waitForHttp(jsonCheck.href);

  const launchMs = Math.max(5000, Number(process.env.P31_OQE_ICOSA_E2E_LAUNCH_TIMEOUT_MS) || 20_000);
  const launchP = chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-setuid-sandbox"],
  });
  const timeoutP = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("P31_OQE_LAUNCH_TIMEOUT")), launchMs);
  });
  let browser;
  try {
    browser = await Promise.race([launchP, timeoutP]);
  } catch (e) {
    if (e && e.message === "P31_OQE_LAUNCH_TIMEOUT") {
      launchP.then(
        (b) => b.close().catch(() => {}),
        () => {}
      );
      if (process.env.P31_OQE_ICOSA_E2E_SKIP_ON_LAUNCH_FAIL === "1") {
        console.warn("oqe-icosa-e2e: skip — chromium launch timeout (P31_OQE_ICOSA_E2E_SKIP_ON_LAUNCH_FAIL=1)");
        return;
      }
      throw new Error("chromium.launch hung; try: npx playwright install chromium");
    }
    throw e;
  }
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60_000);
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const h1 = await page.locator("h1").first().innerText();
    if (!/OQE Icosa/i.test(h1)) {
      throw new Error("unexpected h1: " + h1);
    }
    const banner = await page.locator("#banner").innerText();
    const sub = await page.locator(".sub").first().innerText();
    if (!/Forensic/i.test(sub) || !/not legal advice/i.test(banner) || !/No randomness/i.test(banner)) {
      throw new Error("expected Forensic (sub) + legal banner + No randomness; sub=" + sub.slice(0, 120));
    }
    await page.waitForFunction(
      () => {
        const g = document.getElementById("grid");
        return g && g.querySelectorAll("button").length === 20;
      },
      { timeout: 30_000 }
    );
    const dTitle = (await page.locator("#d-title").innerText()).trim();
    if (dTitle === "Loading…") {
      throw new Error("detail stuck on Loading");
    }
    if (!/^Contradiction \d+$/i.test(dTitle)) {
      throw new Error("expected detail title 'Contradiction n', got: " + dTitle);
    }
  } finally {
    await browser.close();
  }
  console.log("oqe-icosa-e2e: ok — banner + 20 face buttons + JSON load (p31ca public root)");
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
    console.error("oqe-icosa-e2e:", (e && e.message) || e);
    shutdown();
    process.exit(1);
  });
