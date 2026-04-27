#!/usr/bin/env node
/**
 * Headless E2E: static server from repo root → physics-learn page boots, first lab renders,
 * first check accepts answer "5" (| (3,4) |) and XP updates.
 * Requires: root `playwright` devDependency, `npx playwright install chromium`.
 */
import net from "node:net";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageUrl = (port) => `http://127.0.0.1:${port}/docs/physics-learn/index.html`;

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["-V"], { stdio: "ignore" });
      return c;
    } catch (e) {
      void e;
    }
  }
  throw new Error("physics-learn-e2e: need python3 or python on PATH for http.server");
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
  throw new Error("http server not responding: " + u);
}

let server;

async function main() {
  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch (e) {
    console.error("physics-learn-e2e: install playwright: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }

  const port = await getPort();
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
  const nav = pageUrl(port);
  await waitForHttp(nav);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(nav, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("#pl-title").first().waitFor({ state: "attached", timeout: 30000 });
    const h2 = await page.locator("#pl-title").textContent();
    if (!h2 || h2 === "—" || !/vector|resultant/i.test(h2)) {
      throw new Error("unexpected #pl-title: " + h2);
    }
    await page.locator("canvas#pl-cv-vec").waitFor({ state: "attached", timeout: 30000 });
    await page.locator(".pl-inp").first().fill("5");
    await page.getByRole("button", { name: "Submit" }).click();
    await page.waitForFunction(
      () => {
        const el = document.getElementById("pl-xp");
        return el && el.textContent && el.textContent.trim() === "25";
      },
      { timeout: 20000 }
    );
    const passed = await page.locator("#pl-check .p31-muted").first().textContent();
    if (!passed || !/passed/i.test(passed)) {
      const ct = await page.locator("#pl-check").textContent();
      throw new Error("check section did not show passed: " + (ct || ""));
    }
  } finally {
    await browser.close();
  }
  console.log("physics-learn-e2e: ok — first unit lab + check + 25 XP in headless Chromium");
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
    console.error("physics-learn-e2e:", (e && e.message) || e);
    shutdown();
    process.exit(1);
  });
