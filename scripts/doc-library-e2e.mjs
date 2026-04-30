#!/usr/bin/env node
/**
 * Headless E2E: static server from repo root → doc-library loads, worker returns hits.
 * Requires: root `playwright` devDependency, then `npx playwright install --with-deps chromium` (or rely on p31:all / CI).
 */
import net from "node:net";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pageUrl = (port) => `http://127.0.0.1:${port}/docs/doc-library/index.html`;

function resolvePython() {
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["-V"], { stdio: "ignore" });
      return c;
    } catch (e) {
      void e;
    }
  }
  throw new Error("doc-library-e2e: need python3 or python on PATH for http.server");
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
    console.error("doc-library-e2e: install playwright: npm i playwright && npx playwright install chromium");
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
    // Worker MiniSearch load can exceed 20s on slow CI; search must be ready before "mesh" fill.
    await page.waitForSelector("main#main[aria-busy='false']", { timeout: 90000 });
    // Attached, not strict visibility — headless Chromium can treat the search box as not "visible"
    // (stacking / paint timing) while the DOM and worker are ready; same rationale as ol.hits below.
    await page.locator("input#q").waitFor({ state: "attached", timeout: 30000 });
    await page.locator("input#q").fill("mesh", { force: true });
    // Attached, not "visible" — headless Chromium can be flaky on opacity/animation gating
    // while cardIn runs; the DOM and counts are what we need to assert search works.
    await page.locator("ol.hits li").first().waitFor({ state: "attached", timeout: 20000 });
    const n = await page.locator("ol.hits li").count();
    if (n < 1) {
      throw new Error("expected >= 1 hit, got " + n);
    }
    const metaText = await page.locator("#meta").textContent();
    if (!metaText || !/Found|match|All \d+ document|Index /i.test(metaText)) {
      throw new Error("unexpected meta: " + metaText);
    }

    await page.locator("input#q").fill("", { force: true });
    await page.locator("input#q").fill("legal:", { force: true });
    await page.locator("ol.hits li").first().waitFor({ state: "attached", timeout: 20000 });
    const nTag = await page.locator("ol.hits li").count();
    if (nTag < 1) {
      throw new Error("expected >= 1 hit for legal: tag query, got " + nTag);
    }

    const nodeCount = await page.locator("#constellation-nodes *").count();
    if (nodeCount < 3) {
      throw new Error("constellation expected multiple nodes, got " + nodeCount);
    }

    await page.locator("#btn-view-list").click();
    await page.waitForFunction(() => document.body.classList.contains("doclib-mode-list"), {
      timeout: 10000,
    });
    await page.locator("#btn-view-constellation").click();
    await page.waitForFunction(() => !document.body.classList.contains("doclib-mode-list"), {
      timeout: 10000,
    });
  } finally {
    await browser.close();
  }
  console.log(
    "doc-library-e2e: ok — mesh + legal: + constellation + list/constellation toggle (headless Chromium)"
  );
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
    console.error("doc-library-e2e:", (e && e.message) || e);
    shutdown();
    process.exit(1);
  });
