#!/usr/bin/env node
/**
 * @fileoverview P31 local operator **control plane** — HTTP on loopback by default.
 *
 * **Security:** `POST /api/run` only accepts keys in {@link ACTIONS}; `execFile` (no shell).
 * **Human in the loop:** The browser UI defaults to **locked**; the operator must arm
 * the session before any action runs (defense in depth — still whitelist-only on the server).
 *
 *   npm run command-center
 *
 * @module
 */
import http from "node:http";
import os from "node:os";
import { execFile, execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertBootShape } from "./command-center/boot-shape.mjs";
import {
  ACTIONS,
  repoRoot,
  filterSections,
  hasAndromedaTree,
  hasP31caPackage,
  ESSENTIAL_ACTION_IDS,
} from "./command-center/actions.registry.mjs";
import { getOperatorJoyLines, joyListHtml } from "./lib/operator-joy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandCenterDir = path.join(__dirname, "command-center");

const CC_VERSION = "2.0.0";
const MAX_BUFFER = 32 * 1024 * 1024;

const port = Math.min(65535, Math.max(1024, Number(process.env.P31_CMD_CENTER_PORT) || 3131));
const listenHost =
  process.env.P31_CMD_CENTER_HOST === "0.0.0.0" || process.env.P31_CMD_CENTER_LAN === "1"
    ? "0.0.0.0"
    : process.env.P31_CMD_CENTER_HOST || "127.0.0.1";
const badgeHost = listenHost === "0.0.0.0" ? "LAN" : listenHost;
/** Origin only (no path). Server-side proxy for UI — avoids browser CORS to SIMPLEX Worker. */
const simplexOrigin = String(process.env.P31_SIMPLEX_ORIGIN || "")
  .trim()
  .replace(/\/$/, "");
const cmdCenterLan = process.env.P31_CMD_CENTER_LAN === "1";

function getLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net && net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

const bondingAppleTouchPng = path.join(repoRoot, "p31-bonding-icons", "apple-touch-180.png");
const bondingIcon192 = path.join(repoRoot, "p31-bonding-icons", "icon-192.png");
const bondingIcon512 = path.join(repoRoot, "p31-bonding-icons", "icon-512.png");

function hasBondingAppleTouch() {
  return fs.existsSync(bondingAppleTouchPng);
}

function buildManifestJson() {
  const o = {
    name: "P31 Operator Control Plane",
    short_name: "P31 Ops",
    description: "Local whitelisted automation — P31 home workspace",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#0f1115",
    background_color: "#0f1115",
    categories: ["utilities", "developer"],
  };
  const icons = [];
  if (hasBondingAppleTouch()) {
    icons.push({ src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" });
  }
  if (fs.existsSync(bondingIcon192)) {
    icons.push({ src: "/p31-bonding-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" });
  }
  if (fs.existsSync(bondingIcon512)) {
    icons.push({ src: "/p31-bonding-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" });
  }
  if (icons.length) o.icons = icons;
  return JSON.stringify(o);
}

/**
 * @param {string} id
 */
function elicitMeta(id) {
  const spec = ACTIONS[id];
  if (!spec) {
    return {
      title: id,
      slow: false,
      network: false,
      hitl: false,
      confirm: null,
      protocol: "",
    };
  }
  const protocol = [spec.cmd, ...spec.args].join(" ");
  return {
    title: spec.title,
    slow: !!spec.slow,
    network: !!spec.network,
    hitl: !!spec.hitl,
    confirm: spec.confirm || null,
    protocol,
  };
}

function runAction(id) {
  const spec = ACTIONS[id];
  if (!spec) return Promise.reject(new Error("unknown action"));
  if (spec.cwd !== repoRoot && !fs.existsSync(spec.cwd)) {
    return Promise.resolve({
      code: 1,
      stdout: "",
      stderr: "Tree missing: " + spec.cwd + "\n",
    });
  }
  if (spec.background) {
    try {
      const child = spawn(spec.cmd, spec.args, {
        cwd: spec.cwd,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      return Promise.resolve({
        code: 0,
        stdout:
          "Background process started (pid " +
          child.pid +
          ").\nOpen http://127.0.0.1:8080/ after `npm run demo`.\n",
        stderr: "",
      });
    } catch (e) {
      return Promise.resolve({ code: 1, stdout: "", stderr: (e && e.message) + "\n" });
    }
  }
  return new Promise((resolve) => {
    const child = execFile(
      spec.cmd,
      spec.args,
      { cwd: spec.cwd, maxBuffer: MAX_BUFFER, env: { ...process.env, FORCE_COLOR: "0" } },
      (err, stdout, stderr) => {
        const code = err && typeof err.code === "number" ? err.code : err ? 1 : 0;
        resolve({ code, stdout: (stdout || "") + "", stderr: (stderr || "") + "" });
      }
    );
    child.on("error", (e) => {
      resolve({ code: 1, stdout: "", stderr: e.message + "\n" });
    });
  });
}

/**
 * Inline spinner SVGs from `design-assets/spinners/` (single source; command-center consumes).
 * @returns {string}
 */
function buildK4SpinnersInlineHtml() {
  const dir = path.join(repoRoot, "design-assets", "spinners");
  const triple = [
    ["wye", "wye-sequence.svg"],
    ["breath", "quantum-breath.svg"],
    ["ghost", "ghost-grid.svg"],
  ];
  const chunks = [];
  for (const [face, fname] of triple) {
    const fp = path.join(dir, fname);
    if (!fs.existsSync(fp)) continue;
    let raw = fs.readFileSync(fp, "utf8").replace(/^\s*<\?xml[^>]*>\s*/i, "").trim();
    raw = raw.replace(/^<svg\b/i, `<svg data-face="${face}" class="cc-k4-svg" role="presentation"`);
    chunks.push(raw);
  }
  return chunks.join("\n");
}

function buildBootPayload() {
  const ha = hasAndromedaTree();
  const hp = hasP31caPackage();
  const sections = filterSections(ha, hp);

  const payload = {
    VERSION: CC_VERSION,
    ESSENTIAL_IDS: [...ESSENTIAL_ACTION_IDS],
    ACTION_META: Object.fromEntries(Object.keys(ACTIONS).map((k) => [k, elicitMeta(k)])),
    SECTIONS: sections.map((s) => ({ id: s.id, title: s.title, ids: s.ids, links: s.links })),
    /** Extra lines for in-browser “Another line” (same daily pool as `npm run fun`). */
    JOY_SPIN: getOperatorJoyLines(repoRoot, 24, false, false),
  };
  assertBootShape(payload);
  return payload;
}

function buildPageHtml() {
  const ha = hasAndromedaTree();
  const hp = hasP31caPackage();
  const lan = getLanIPv4();
  const k4SpinInline = buildK4SpinnersInlineHtml();
  const bootJson = JSON.stringify(buildBootPayload()).replace(/</g, "\\u003c");
  const joyLines = getOperatorJoyLines(repoRoot, 5, false, false);
  const joyListBlock = joyListHtml(joyLines);

  const phoneHint =
    listenHost === "0.0.0.0" && lan ? ` · phone: http://${lan}:${port}/` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
  <meta name="theme-color" content="#0f1115" />
  <meta name="description" content="P31 local operator control plane — whitelisted npm automation; human-in-the-loop gate." />
  <title>P31 — operator control plane</title>
  <link rel="manifest" href="/manifest.webmanifest" />
  ${hasBondingAppleTouch() ? '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />' : ""}
  ${fs.existsSync(bondingIcon192) ? '<link rel="icon" type="image/png" sizes="192x192" href="/p31-bonding-icon-192.png" />' : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:ital,wght@0,400;0,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/p31-style.css" />
  <link rel="stylesheet" href="/assets/p31-responsive-surface.css" />
  <link rel="stylesheet" href="/assets/command-center.css" />
  <link rel="stylesheet" href="/assets/p31-starfield.css" />
  <link rel="stylesheet" href="/assets/p31-larmor-fields.css" />
  <script>
(function () {
  var r = document.documentElement;
  if (/[?&]alive=1(?:&|$)/.test(location.search)) {
    r.setAttribute("data-cc-alive-bypass", "1");
    return;
  }
  r.classList.add("cc-gray-rock");
  function wake() {
    r.classList.remove("cc-gray-rock");
  }
  document.addEventListener("pointerdown", wake, { once: true, capture: true });
  document.addEventListener("keydown", wake, { once: true, capture: true });
})();
  </script>
  <script type="application/json" id="cc-boot">${bootJson}</script>
  <script src="/assets/command-center.js" defer></script>
  <script type="module" src="/assets/cc-starfield-boot.js"></script>
</head>
<body class="cc-v2" data-cc-gate-armed="0" data-cc-version="${CC_VERSION}"${cmdCenterLan ? ' data-cc-lan="1"' : ""}>
  <canvas id="cc-starfield" class="cc-starfield-canvas" aria-hidden="true"></canvas>
  <a class="cc-skip-link" href="#cc-main">Skip to actions</a>

  <header class="cc-header">
    <div class="cc-header__inner">
      <div class="cc-brand">
        <span class="cc-brand__mark" aria-hidden="true"></span>
        <div>
          <p class="cc-brand__kicker">P31 labs · local control plane</p>
          <h1 class="cc-brand__title">Operator control plane</h1>
          <p class="cc-brand__sub">Whitelist only · <code>execFile</code> · no shell · <kbd>Ctrl+C</kbd> stops this Node process</p>
        </div>
      </div>
      <div class="cc-header__badge" title="Bind address">
        <span class="cc-mono">${badgeHost}:${port}${phoneHint}</span>
      </div>
    </div>
  </header>

  <main id="cc-main" class="cc-layout">
    <div class="cc-layout__primary">

      <section class="cc-safety" aria-labelledby="cc-safety-heading">
        <h2 id="cc-safety-heading" class="cc-safety__title">Automation gate</h2>
        <p class="cc-safety__lead">Defaults <strong>locked</strong>. Nothing runs until you consciously enable this browser tab.</p>
        <div class="cc-safety__row">
          <div class="cc-safety__state" id="cc-gate-indicator" aria-live="polite" data-state="locked">
            <span class="cc-safety__dot" aria-hidden="true"></span>
            <span id="cc-gate-label"><strong>Locked</strong> — actions disabled</span>
          </div>
          <div class="cc-safety__buttons">
            <button type="button" class="cc-btn cc-btn--safe" id="cc-gate-unlock">Unlock for this session</button>
            <button type="button" class="cc-btn cc-btn--danger" id="cc-gate-lock" disabled>Emergency lock (e‑stop)</button>
          </div>
        </div>
        <p class="cc-safety__hint">LAN bind (<code>P31_CMD_CENTER_LAN=1</code>) exposes the same whitelist to your network — trusted Wi‑Fi only.</p>
      </section>

      <div
        id="cc-simplex-strip"
        class="cc-simplex-strip"
        data-loading="1"
        role="status"
        aria-live="polite"
        title="SIMPLEX v7 via local proxy — set P31_SIMPLEX_ORIGIN to your Worker URL (no trailing slash)"
      >
        <span class="cc-simplex-strip__spin" aria-hidden="true"></span>
        <span class="cc-simplex-strip__text cc-mono">SIMPLEX · loading…</span>
      </div>

      <section class="cc-essentials" aria-labelledby="cc-ess-heading">
        <h2 id="cc-ess-heading" class="cc-section-heading">Essentials</h2>
        <p class="cc-essentials__hint">Highest-signal shortcuts — Doctor, Ship bar (<code>verify</code>), CONNECTION.</p>
        <div id="cc-essential-buttons" class="cc-essentials__grid"></div>
      </section>

      <div class="cc-filter-row">
        <label class="cc-filter-label" for="cc-filter">Find an action</label>
        <input type="search" id="cc-filter" class="cc-filter p31-larmor-field" placeholder="Search by title…" autocomplete="off" spellcheck="false" />
        <p class="cc-filter-meta"><kbd>/</kbd> focus · <kbd>Esc</kbd> clear</p>
      </div>

      <details class="cc-primer">
        <summary>Ecosystem primer (links)</summary>
        <div class="cc-primer__body">
          <p><a href="https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DEPLOY-CANON.md" target="_blank" rel="noopener">Deploy canon</a>
          · <a href="https://p31ca.org/connect.html" target="_blank" rel="noopener">Create · Connect</a>
          · <a href="https://p31ca.org/ops/" target="_blank" rel="noopener">p31ca /ops</a>
          · <a href="https://command-center.trimtab-signal.workers.dev/" target="_blank" rel="noopener">EPCP edge Worker</a></p>
          <p>Alignment registry: <code>p31-alignment.json</code>. Doc index + ship bar mirror <strong>fleet-portal.html</strong> and AGENTS §2.</p>
        </div>
      </details>

      <details class="cc-joy">
        <summary>Trim tab — moment of joy</summary>
        ${joyListBlock}
        <p class="cc-joy__slot" id="cc-joy-slot" hidden></p>
        <p class="cc-joy__draw-wrap">
          <button type="button" class="cc-btn cc-btn--ghost cc-joy__draw" id="cc-joy-draw" hidden>Another line</button>
        </p>
        <p class="cc-joy__meta">Pool rotates daily (UTC) · <code>npm run fun</code> · <code>npm run fun:shower</code> · <code>npm run doctor -- --fun</code> · <code>p31 fun --many 5 --roll</code></p>
      </details>

      <div id="sections"></div>

      ${!ha ? '<p class="cc-missing"><code>andromeda/</code> not present — monorepo actions hidden.</p>' : ""}
      ${!hp ? '<p class="cc-missing"><code>p31ca</code> package not found — hub ci/diff hidden.</p>' : ""}
    </div>

    <aside class="cc-layout__aside" aria-label="Process output">
      <div class="cc-terminal">
        <div class="cc-terminal__head">
          <h2 class="cc-terminal__title">stdout / stderr</h2>
          <div class="cc-terminal__actions">
            <button type="button" class="cc-btn cc-btn--ghost" id="cc-out-copy">Copy</button>
            <button type="button" class="cc-btn cc-btn--ghost" id="cc-out-clear">Clear</button>
          </div>
          <span id="cc-k4-spin" class="cc-k4-spin-host" hidden data-spin="wye" aria-hidden="true">${k4SpinInline}</span>
          <span id="cc-term-status" class="cc-term-status cc-term-status--idle" aria-live="polite">idle</span>
        </div>
        <pre id="out" class="cc-terminal__body p31-larmor-field" tabindex="0">— Ready.\n(No runs until you unlock the gate.)</pre>
      </div>
      <p class="cc-aside-note">Sticky on wide viewports.</p>
    </aside>
  </main>

  <footer class="cc-footer">
    <p>V2 shell · Assets in <code>scripts/command-center/</code> · Tasks: “P31: local command center” · Env: <code>npm run list:p31-env</code></p>
  </footer>

  <div id="cc-modal" class="cc-modal" hidden role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">
    <div class="cc-modal__backdrop" data-cc-modal-dismiss></div>
    <div class="cc-modal__panel">
      <p id="cc-modal-title" class="cc-modal__title">Confirm</p>
      <p id="cc-modal-msg" class="cc-modal__msg"></p>
      <div class="cc-modal__actions">
        <button type="button" class="cc-btn cc-btn--ghost" id="cc-modal-cancel">Cancel</button>
        <button type="button" class="cc-btn cc-btn--primary" id="cc-modal-ok">Run</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

const html = buildPageHtml();
const manifestBody = buildManifestJson();
const p31StylePath = path.join(repoRoot, "cognitive-passport", "p31-style.css");
const p31ResponsiveSurfacePath = path.join(repoRoot, "cognitive-passport", "p31-responsive-surface.css");

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

/**
 * Browser cannot call SIMPLEX Worker from arbitrary origins (Worker CORS allowlist).
 * Local command center proxies GET /api/state server-side when P31_SIMPLEX_ORIGIN is set.
 */
async function proxySimplexState(res) {
  try {
    if (!simplexOrigin) {
      sendJson(res, 200, { ok: false, reason: "not_configured" });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4500);
    let upstream;
    try {
      upstream = await fetch(simplexOrigin + "/api/state", {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
    } finally {
      clearTimeout(t);
    }
    const text = await upstream.text();
    if (!upstream.ok) {
      sendJson(res, 200, { ok: false, reason: "upstream_http", status: upstream.status });
      return;
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      sendJson(res, 200, { ok: false, reason: "upstream_bad_json" });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      state: body.state ?? null,
      health: body.health ?? null,
      briefing: body.briefing ?? null,
    });
  } catch (e) {
    sendJson(res, 200, {
      ok: false,
      reason: "unreachable",
      detail: String(e && e.message ? e.message : e),
    });
  }
}

function sendAsset(res, absPath, contentType) {
  fs.readFile(absPath, (err, buf) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("not found: " + path.basename(absPath));
      return;
    }
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
    return;
  }
  const assetBase = req.url && req.url.split("?")[0];
  if (req.method === "GET" && assetBase === "/api/mesh-pulse") {
    const pulsePath = path.join(os.homedir(), ".p31", "mesh-touch-pulse.json");
    if (!fs.existsSync(pulsePath)) {
      res.writeHead(204, { "Cache-Control": "no-store" });
      res.end();
      return;
    }
    try {
      const buf = fs.readFileSync(pulsePath, "utf8");
      try {
        fs.unlinkSync(pulsePath);
      } catch {
        /* ignore */
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(buf);
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("pulse read error");
    }
    return;
  }
  if (req.method === "GET" && assetBase === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(
      JSON.stringify({
        ok: true,
        name: "p31-local-command-center",
        version: CC_VERSION,
        actions: Object.keys(ACTIONS).length,
      })
    );
    return;
  }
  if (req.method === "GET" && assetBase === "/api/simplex-state") {
    proxySimplexState(res).catch(() => {
      sendJson(res, 200, { ok: false, reason: "unreachable" });
    });
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-responsive-surface.css") {
    sendAsset(res, p31ResponsiveSurfacePath, "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-style.css") {
    fs.readFile(p31StylePath, (err, buf) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("missing cognitive-passport/p31-style.css — run npm run apply:p31-style");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" });
      res.end(buf);
    });
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/command-center.css") {
    sendAsset(res, path.join(commandCenterDir, "command-center.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/command-center.js") {
    sendAsset(res, path.join(commandCenterDir, "command-center.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-starfield.js") {
    sendAsset(res, path.join(repoRoot, "design-assets", "starfield", "p31-starfield.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-mesh-touches.js") {
    sendAsset(res, path.join(repoRoot, "design-assets", "starfield", "p31-mesh-touches.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-starfield.css") {
    sendAsset(res, path.join(repoRoot, "design-assets", "starfield", "p31-starfield.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-larmor-fields.css") {
    sendAsset(res, path.join(repoRoot, "design-assets", "starfield", "p31-larmor-fields.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/cc-starfield-boot.js") {
    sendAsset(res, path.join(commandCenterDir, "cc-starfield-boot.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/apple-touch-icon.png") {
    if (!hasBondingAppleTouch()) {
      res.writeHead(404);
      res.end("missing apple-touch icon");
      return;
    }
    sendAsset(res, bondingAppleTouchPng, "image/png");
    return;
  }
  if (req.method === "GET" && assetBase === "/p31-bonding-icon-192.png") {
    if (!fs.existsSync(bondingIcon192)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    sendAsset(res, bondingIcon192, "image/png");
    return;
  }
  if (req.method === "GET" && assetBase === "/p31-bonding-icon-512.png") {
    if (!fs.existsSync(bondingIcon512)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    sendAsset(res, bondingIcon512, "image/png");
    return;
  }
  if (req.method === "GET" && assetBase === "/manifest.webmanifest") {
    res.writeHead(200, { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(manifestBody);
    return;
  }

  if (req.method === "POST" && req.url === "/api/run") {
    let body = "";
    req.on("data", (c) => {
      body += c;
    });
    req.on("end", async () => {
      try {
        const j = JSON.parse(body);
        const id = j && j.action;
        if (!id || !ACTIONS[id]) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 1, stderr: "bad action\n", stdout: "" }));
          return;
        }
        if (id.startsWith("andromeda-") && !hasAndromedaTree()) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 1, stderr: "andromeda/ not in this tree\n", stdout: "" }));
          return;
        }
        if ((id === "p31ca-hub-ci" || id === "p31ca-hub-diff") && !hasP31caPackage()) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 1, stderr: "p31ca package not found\n", stdout: "" }));
          return;
        }
        const { code, stdout, stderr } = await runAction(id);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code, stdout, stderr }));
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 1, stdout: "", stderr: String(e) + "\n" }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error("P31 command center: port " + port + " in use — try P31_CMD_CENTER_PORT=4000 npm run command-center");
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(port, listenHost, () => {
  const urlLoop = "http://127.0.0.1:" + port + "/";
  console.log("P31 command center v" + CC_VERSION + ": " + urlLoop + "  (Ctrl+C to stop)");
  if (!hasBondingAppleTouch()) {
    console.warn("P31 command center: apple-touch missing — npm run generate:bonding-pwa-icons");
  }
  if (listenHost === "0.0.0.0") {
    console.warn("P31 command center: LAN bind — anyone on your network can hit whitelisted actions. Trusted Wi‑Fi only.");
    const lan = getLanIPv4();
    if (lan) console.log("P31 command center phone URL: http://" + lan + ":" + port + "/");
  }
  if (process.env.P31_CMD_CENTER_NO_OPEN === "1") return;
  try {
    if (process.platform === "win32") {
      execFileSync("cmd", ["/c", "start", "", urlLoop], { stdio: "ignore" });
    } else if (process.platform === "darwin") {
      execFileSync("open", [urlLoop], { stdio: "ignore" });
    } else {
      execFileSync("xdg-open", [urlLoop], { stdio: "ignore" });
    }
  } catch {
    /* ignore */
  }
});
