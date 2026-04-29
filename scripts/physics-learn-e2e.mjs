#!/usr/bin/env node
/**
 * Headless E2E: static server from repo root → Physics Learn (eight-room codec)
 * loads, rooms present, Larmor UI without autoplay, pointer paths respond,
 * prefers-reduced-motion adds html.pl-reduced-motion.
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

  const browser = await chromium.launch({ headless: true, timeout: 120000 });
  try {
    const page = await browser.newPage();
    await page.goto(nav, { waitUntil: "domcontentloaded", timeout: 60000 });

    const rooms = page.locator("[data-pl-room]");
    await rooms.first().waitFor({ state: "attached", timeout: 30000 });
    const n = await rooms.count();
    if (n !== 8) {
      throw new Error("expected 8 [data-pl-room] sections, got " + n);
    }

    const playBtn = page.locator("#codec-larmor-play");
    await playBtn.waitFor({ state: "visible", timeout: 15000 });
    const playedBefore = await playBtn.evaluate((el) => el.dataset.played || "");
    if (playedBefore === "1") {
      throw new Error("863 Hz control should not set data-played before user tap");
    }

    await page.locator("#codec-freq-slider").evaluate((el) => {
      el.value = "863";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const hitVisible = await page.locator("#codec-larmor-hit").isVisible();
    if (!hitVisible) {
      throw new Error("#codec-larmor-hit should show near 863 Hz");
    }

    await playBtn.click();
    await page.waitForFunction(
      () => {
        const b = document.getElementById("codec-larmor-play");
        return b && b.dataset.played === "1";
      },
      { timeout: 8000 }
    );

    const rig = page.locator("#codec-rigidity svg");
    const box = await rig.boundingBox();
    if (!box) throw new Error("rigidity svg bounding box");
    await page.mouse.move(box.x + 40, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 130);
    await page.mouse.up();

    await page.locator("#codec-spoon-acts button[data-cost='1']").first().click();
    const spoonsLeft = await page.locator("#codec-spoons-row").getAttribute("data-remaining");
    if (spoonsLeft !== "11") {
      throw new Error("expected 11 spoons after 1-spoon activity, got " + spoonsLeft);
    }

    await page.locator("#codec-serial-run").click();
    const wide = await page.locator("#codec-serial-pipe").evaluate((el) => el.classList.contains("is-wide"));
    if (!wide) throw new Error("serialization pipe should widen after toggle");

    await page.locator("#room-gray").scrollIntoViewIfNeeded();
    const expandRow = page.locator("#codec-gray-quiet [data-expand]").first();
    await expandRow.scrollIntoViewIfNeeded();
    await expandRow.hover({ force: true });
    const opened = await expandRow.evaluate((el) => el.classList.contains("is-open"));
    if (!opened) throw new Error("Gray Rock row should open on hover");

    const pageRm = await browser.newPage();
    await pageRm.emulateMedia({ reducedMotion: "reduce" });
    await pageRm.goto(nav, { waitUntil: "domcontentloaded", timeout: 60000 });
    const hasRm = await pageRm.evaluate(() => document.documentElement.classList.contains("pl-reduced-motion"));
    if (!hasRm) {
      throw new Error("expected html.pl-reduced-motion when prefers-reduced-motion is reduce");
    }
    const spin = pageRm.locator("#room-triangle .codec-spin").first();
    const anim = await spin.evaluate((el) => ({
      name: getComputedStyle(el).animationName,
      duration: getComputedStyle(el).animationDuration,
    }));
    const stopped = anim.name === "none" || anim.name === "" || anim.duration === "0s";
    if (!stopped) {
      throw new Error("reduced motion should stop .codec-spin; got " + JSON.stringify(anim));
    }
    await pageRm.close();
  } finally {
    await browser.close();
  }
  console.log("physics-learn-e2e: ok — eight rooms, Larmor tap-to-play, interactives, reduced-motion");
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
