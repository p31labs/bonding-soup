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
 * Read-first **operator desk** (no gate, no runs): `GET /desk` — same JSON APIs as the UI strips.
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
import { getConnectionSummary } from "./p31-connection.mjs";
import { getGithubOrgStatus } from "./lib/github-org-status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandCenterDir = path.join(__dirname, "command-center");

const CC_VERSION = "2.1.0";
const MAX_BUFFER = 32 * 1024 * 1024;
const GLASS_REPORT_MAX_BYTES = 65536;
/** Hardening: `X-Content-Type-Options: nosniff` on common response shapes (local loopback, defense in depth). */
/**
 * Security header baseline applied to every response.
 *
 * - CSP: self-only for connect/img/font; inline allowed for script/style
 *   because the TUI/desk pages embed both by design (no build step).
 *   Inline is acceptable here because (a) the server is local-only by
 *   default (127.0.0.1), (b) there is no untrusted user content rendered
 *   into HTML, and (c) blocking 'unsafe-inline' would break the static
 *   single-file deliverables we ship for mobile-first access.
 * - X-Frame-Options DENY: the command center must not be iframed.
 * - Referrer-Policy no-referrer: ops surface, no referrer leakage.
 * - Permissions-Policy: deny everything we don't use.
 * - Cross-Origin-Resource-Policy same-origin: prevent embedding.
 */
const SEC_HDR = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'",
};
const CC_HDR = {
  json: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...SEC_HDR,
  },
  html: {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    ...SEC_HDR,
  },
  jsonAction: {
    "Content-Type": "application/json; charset=utf-8",
    ...SEC_HDR,
  },
  text: {
    "Content-Type": "text/plain; charset=utf-8",
    ...SEC_HDR,
  },
  jsonManifest: {
    "Content-Type": "application/manifest+json; charset=utf-8",
    "Cache-Control": "no-store",
    ...SEC_HDR,
  },
  noContent: { "Cache-Control": "no-store", ...SEC_HDR },
};

/**
 * Same default as `scripts/ecosystem-glass.mjs` — only that filename, only under /tmp, os.tmpdir(), or ~/.p31/.
 * @returns {string | null}
 */
function resolveGlassReportPath() {
  const def = "/tmp/p31_glass_report.json";
  const p = path.resolve(String(process.env.P31_GLASS_REPORT || def).trim());
  if (path.basename(p) !== "p31_glass_report.json") return null;
  const dir = path.resolve(path.dirname(p));
  const bases = [path.resolve("/tmp"), path.resolve(os.tmpdir()), path.resolve(path.join(os.homedir(), ".p31"))];
  if (!bases.some((b) => dir === b)) return null;
  return p;
}
/** Canonical loopback port — matches AGENTS.md / startup docs (bookmark + SSH LocalForward). */
const DEFAULT_CMD_CENTER_PORT = 3131;

function clampPort(n) {
  return Math.min(65535, Math.max(0, n));
}

const portEnv = process.env.P31_CMD_CENTER_PORT;
const requestedPortRaw =
  portEnv === undefined || String(portEnv).trim() === "" ? NaN : Number(String(portEnv).trim());
/**
 * Unset or invalid → DEFAULT_CMD_CENTER_PORT (predictable URL).
 * Explicit `P31_CMD_CENTER_PORT=0` → OS auto-pick (CI/sandbox/port clashes).
 */
const requestedPort =
  requestedPortRaw === 0
    ? 0
    : Number.isFinite(requestedPortRaw) && requestedPortRaw > 0
      ? clampPort(requestedPortRaw)
      : DEFAULT_CMD_CENTER_PORT;
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
      {
        cwd: spec.cwd,
        maxBuffer: MAX_BUFFER,
        env: { ...process.env, FORCE_COLOR: "0", ...(spec.env && typeof spec.env === "object" ? spec.env : {}) },
      },
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
    /** Same object as `npm run connection -- --json` — deployables, glass groups, env catalog size. */
    CONNECTION: getConnectionSummary(),
    /** Extra lines for in-browser “Another line” (same daily pool as `npm run fun`). */
    JOY_SPIN: getOperatorJoyLines(repoRoot, 24, false, false),
  };
  assertBootShape(payload);
  return payload;
}

/**
 * @param {number} portForUi
 */
function buildPageHtml(portForUi) {
  const ha = hasAndromedaTree();
  const hp = hasP31caPackage();
  const lan = getLanIPv4();
  const k4SpinInline = buildK4SpinnersInlineHtml();
  const bootJson = JSON.stringify(buildBootPayload()).replace(/</g, "\\u003c");
  const joyLines = getOperatorJoyLines(repoRoot, 5, false, false);
  const joyListBlock = joyListHtml(joyLines);

  const phoneHint =
    listenHost === "0.0.0.0" && lan ? ` · phone: http://${lan}:${portForUi}/` : "";

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
  <link rel="icon" type="image/png" href="/favicon.png" sizes="192x192" />
  <link rel="shortcut icon" href="/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:ital,wght@0,400;0,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/p31-style.css" />
  <link rel="stylesheet" href="/assets/p31-shared-surface.css" />
  <link rel="stylesheet" href="/assets/p31-responsive-surface.css" />
  <link rel="stylesheet" href="/assets/command-center.css" />
  <link rel="stylesheet" href="/assets/p31-starfield.css" />
  <link rel="stylesheet" href="/assets/p31-larmor-fields.css" />
  <script src="/assets/p31-subject-prefs.js"></script>
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
          <p class="p31-host-mind">Host mind: <strong>Operator</strong> — instrument glass on the same night sky (static star plate).</p>
          <p class="cc-brand__sub">Whitelist only · <code>execFile</code> · no shell · <kbd>Ctrl+C</kbd> stops this Node process</p>
        </div>
      </div>
      <div class="cc-header__tools">
        <div class="cc-header__badge" title="Bind address">
          <span class="cc-mono">${badgeHost}:${portForUi}${phoneHint}</span>
        </div>
        <nav class="cc-header__nav" aria-label="Operator views">
          <a class="cc-header__link" href="/desk">Operator desk</a>
          <a class="cc-header__link" href="/term">Terminal (chat + cmd, mobile-first)</a>
          <a class="cc-header__link" href="/cli">CLI Dashboard</a>
        </nav>
      </div>
    </div>
  </header>

  <main id="cc-main" class="cc-layout">
    <div class="cc-layout__primary">

      <div class="cc-slot cc-slot--primary-top" id="cc-slot-primary-top">
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
          aria-label="SIMPLEX v7 status"
          title="SIMPLEX v7 via local proxy — set P31_SIMPLEX_ORIGIN to your Worker URL (no trailing slash)"
        >
          <span class="cc-simplex-strip__spin" aria-hidden="true"></span>
          <div class="cc-simplex-strip__col">
            <span class="cc-simplex-strip__text cc-mono">SIMPLEX · loading…</span>
            <span class="cc-simplex-strip__sub cc-mono" id="cc-simplex-sub" aria-live="polite"></span>
          </div>
        </div>

        <div
          id="cc-ecosystem-strip"
          class="cc-ecosystem-strip"
          data-loading="1"
          role="status"
          aria-live="polite"
          aria-label="CONNECTION and ecosystem registry summary"
          title="p31-ecosystem.json + p31-env-manifest — same JSON as npm run connection -- --json"
        >
          <span class="cc-ecosystem-strip__spin" aria-hidden="true"></span>
          <div class="cc-ecosystem-strip__col">
            <span class="cc-ecosystem-strip__text cc-mono">CONNECTION · loading…</span>
            <span class="cc-ecosystem-strip__sub cc-mono" id="cc-ecosystem-sub" aria-live="polite"></span>
          </div>
        </div>

        <section class="cc-essentials" aria-labelledby="cc-ess-heading">
          <h2 id="cc-ess-heading" class="cc-section-heading">Essentials</h2>
          <p class="cc-essentials__hint">Highest-signal shortcuts — Doctor, Ship bar (<code>verify</code>), CONNECTION.</p>
          <div id="cc-essential-buttons" class="cc-essentials__grid"></div>
        </section>
      </div>

      <div class="cc-slot cc-slot--primary-mid" id="cc-slot-primary-mid">
        <div class="cc-filter-row">
          <label class="cc-filter-label" for="cc-filter">Find an action</label>
          <input type="search" id="cc-filter" class="cc-filter p31-larmor-field" placeholder="Search by title…" autocomplete="off" spellcheck="false" />
          <p class="cc-filter-meta"><kbd>/</kbd> focus · <kbd>Esc</kbd> clear · <kbd>?</kbd> map · <kbd>g</kbd><kbd>s</kbd> SIMPLEX · <kbd>g</kbd><kbd>e</kbd> CONNECTION · <kbd>g</kbd><kbd>l</kbd> Layout</p>
        </div>

        <details class="cc-hotkeys" id="cc-hotkeys">
          <summary>Keyboard map (low-noise)</summary>
          <div class="cc-hotkeys__body">
            <ul class="cc-hotkeys__list">
              <li><kbd>/</kbd> — focus search</li>
              <li><kbd>Esc</kbd> — clear search (when focused)</li>
              <li><kbd>?</kbd> — toggle this panel</li>
              <li><kbd>g</kbd> then <kbd>s</kbd> — scroll to SIMPLEX strip</li>
              <li><kbd>g</kbd> then <kbd>e</kbd> — scroll to CONNECTION / ecosystem strip</li>
              <li><kbd>g</kbd> then <kbd>l</kbd> — open Layout tab + scroll to right panel</li>
            </ul>
          </div>
        </details>

        <details class="cc-primer" id="cc-primer">
          <summary>Ecosystem primer (links)</summary>
          <div class="cc-primer__body">
            <p><a href="https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DEPLOY-CANON.md" target="_blank" rel="noopener">Deploy canon</a>
            · <a href="https://p31ca.org/connect.html" target="_blank" rel="noopener">Create · Connect</a>
            · <a href="https://p31ca.org/ops/" target="_blank" rel="noopener">p31ca /ops</a>
            · <a href="https://command-center.trimtab-signal.workers.dev/" target="_blank" rel="noopener">EPCP edge Worker</a></p>
            <p><strong>CONNECTION strip</strong> (under SIMPLEX) mirrors <code>npm run connection -- --json</code> via <code>GET /api/connection-summary</code> — deploy spine, glass probe groups, env catalog size.</p>
            <p>Alignment registry: <code>p31-alignment.json</code>. Doc index + ship bar mirror <strong>fleet-portal.html</strong> and AGENTS §2.</p>
          </div>
        </details>

        <details class="cc-joy" id="cc-joy" open>
          <summary>Trim tab — moment of joy</summary>
          ${joyListBlock}
          <p class="cc-joy__slot" id="cc-joy-slot" hidden></p>
          <p class="cc-joy__draw-wrap">
            <button type="button" class="cc-btn cc-btn--ghost cc-joy__draw" id="cc-joy-draw" hidden>Another line</button>
          </p>
          <p class="cc-joy__meta">Pool rotates daily (UTC) · <code>npm run fun</code> · <code>npm run fun:shower</code> · <code>npm run doctor -- --fun</code> · <code>p31 fun --many 5 --roll</code></p>
        </details>
      </div>

      <div class="cc-slot cc-slot--primary-bottom" id="cc-slot-primary-bottom">
        <div id="sections"></div>

        ${!ha ? '<p class="cc-missing"><code>andromeda/</code> not present — monorepo actions hidden.</p>' : ""}
        ${!hp ? '<p class="cc-missing"><code>p31ca</code> package not found — hub ci/diff hidden.</p>' : ""}
      </div>
    </div>

    <aside class="cc-layout__aside" aria-label="Operator tools">
      <div class="cc-aside" id="cc-aside">
        <div class="cc-aside__tabs" role="tablist" aria-label="Right panel">
          <button type="button" class="cc-aside-tab" id="cc-tab-terminal" role="tab" aria-selected="true" aria-controls="cc-pane-terminal" data-cc-pane="terminal">Terminal</button>
          <button type="button" class="cc-aside-tab" id="cc-tab-history" role="tab" aria-selected="false" aria-controls="cc-pane-history" data-cc-pane="history">History</button>
          <button type="button" class="cc-aside-tab" id="cc-tab-simplex" role="tab" aria-selected="false" aria-controls="cc-pane-simplex" data-cc-pane="simplex">SIMPLEX</button>
          <button type="button" class="cc-aside-tab" id="cc-tab-layout" role="tab" aria-selected="false" aria-controls="cc-pane-layout" data-cc-pane="layout">Layout</button>
        </div>

        <section class="cc-aside-pane cc-aside-pane--terminal" id="cc-pane-terminal" role="tabpanel" aria-labelledby="cc-tab-terminal" data-cc-pane="terminal">
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
        </section>

        <section class="cc-aside-pane" id="cc-pane-history" role="tabpanel" aria-labelledby="cc-tab-history" data-cc-pane="history" hidden>
          <div class="cc-pane-head">
            <h2 class="cc-pane-title">Action history</h2>
            <div class="cc-pane-actions">
              <button type="button" class="cc-btn cc-btn--ghost" id="cc-history-clear">Clear</button>
            </div>
          </div>
          <div class="cc-pane-body" id="cc-history-body" aria-live="polite"></div>
        </section>

        <section class="cc-aside-pane" id="cc-pane-simplex" role="tabpanel" aria-labelledby="cc-tab-simplex" data-cc-pane="simplex" hidden>
          <div class="cc-pane-head">
            <h2 class="cc-pane-title">SIMPLEX</h2>
            <div class="cc-pane-actions">
              <button type="button" class="cc-btn cc-btn--ghost" id="cc-simplex-refresh">Refresh</button>
            </div>
          </div>
          <div class="cc-pane-body">
            <div class="cc-kv" id="cc-simplex-mini">
              <div class="cc-kv__row"><span class="cc-kv__k">Health</span><span class="cc-kv__v" id="cc-simplex-mini-health">—</span></div>
              <div class="cc-kv__row"><span class="cc-kv__k">Cron</span><span class="cc-kv__v" id="cc-simplex-mini-cron">—</span></div>
              <div class="cc-kv__row"><span class="cc-kv__k">Live</span><span class="cc-kv__v" id="cc-simplex-mini-live">—</span></div>
              <div class="cc-kv__row"><span class="cc-kv__k">Updated</span><span class="cc-kv__v" id="cc-simplex-mini-updated">—</span></div>
            </div>
            <p class="cc-pane-note">Uses local proxy endpoints (<code>/api/simplex-health</code>, <code>/api/simplex-state</code>).</p>
          </div>
        </section>

        <section class="cc-aside-pane" id="cc-pane-layout" role="tabpanel" aria-labelledby="cc-tab-layout" data-cc-pane="layout" hidden>
          <div class="cc-pane-head">
            <h2 class="cc-pane-title">Layout debugger</h2>
          </div>
          <div class="cc-pane-body">
            <pre class="cc-debug p31-larmor-field" id="cc-layout-debug" tabindex="0">—</pre>
            <p class="cc-pane-note">Shows detected device profile + slotting decisions.</p>
          </div>
        </section>
      </div>
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
  <script src="/assets/p31-return-ribbon.js" defer></script>
</body>
</html>`;
}

/**
 * Read-first operator surface: same JSON endpoints as the control plane, no gate, no POST /api/run.
 * @param {number} portForUi
 */
function buildOperatorDeskHtml(portForUi) {
  const lan = getLanIPv4();
  const phoneHint =
    listenHost === "0.0.0.0" && lan ? ` · phone: http://${lan}:${portForUi}/desk` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0a0c0f" />
  <meta name="description" content="P31 operator desk — CONNECTION, glass, SIMPLEX readout. Actions stay on the control plane." />
  <title>P31 — operator desk</title>
  ${hasBondingAppleTouch() ? '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />' : ""}
  ${fs.existsSync(bondingIcon192) ? '<link rel="icon" type="image/png" sizes="192x192" href="/p31-bonding-icon-192.png" />' : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:ital,wght@0,400;0,500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/p31-style.css" />
  <link rel="stylesheet" href="/assets/p31-shared-surface.css" />
  <link rel="stylesheet" href="/assets/operator-desk.css" />
  <script type="module" src="/assets/od-starfield-boot.js"></script>
  <script src="/assets/operator-desk.js" defer></script>
</head>
<body class="od-root" data-operator-desk="1" data-od-version="${CC_VERSION}">
  <canvas id="od-star-plate" class="od-star-plate" width="4" height="4" aria-hidden="true"></canvas>
  <a class="od-skip" href="#od-main">Skip to readouts</a>
  <header class="od-header">
    <div class="od-header__inner">
      <div>
        <p class="od-kicker">
          <span class="od-pill od-pill--surface">Operator desk</span>
          <span class="od-kicker__text">P31 labs · read-first plane</span>
        </p>
        <h1 class="od-title">Operator desk</h1>
        <p class="p31-host-mind">Host mind: <strong>Operator</strong> — read-only; same static star plate as the control room.</p>
        <p class="od-lead">Live CONNECTION counts, glass snapshot, and SIMPLEX proxy lines. Whitelisted runs and the automation gate live on the <a class="od-inline" href="/">control plane</a>.</p>
      </div>
      <div class="od-header__tools">
        <span class="od-mono" title="Bind address">${badgeHost}:${portForUi}${phoneHint}</span>
        <nav class="od-nav" aria-label="Switch view">
          <a class="od-inline" href="/">Control plane (actions)</a>
          <a
            class="od-inline"
            href="https://p31ca.org/ops/"
            target="_blank"
            rel="noopener noreferrer"
            title="Hub operator UI (new tab)">p31ca /ops</a>
        </nav>
      </div>
    </div>
  </header>
  <main id="od-main" class="od-main" role="main" aria-busy="false" aria-describedby="od-refresh-hint">
    <p id="od-error" class="od-foot od-foot--alert" hidden role="alert"></p>
    <div class="od-toolbar">
      <button type="button" class="od-btn" id="od-refresh" title="Refresh readouts (shortcut: R)" aria-keyshortcuts="R">Refresh</button>
      <p class="od-foot" id="od-refresh-hint" role="note">Updated <span id="od-stamp">—</span> · every <span id="od-poll-interval">30</span>s while this tab is visible · <kbd class="od-kbd">r</kbd> to refresh</p>
    </div>
    <section class="od-card" aria-labelledby="od-h-health">
      <h2 id="od-h-health">Control plane</h2>
      <dl class="od-dl" id="od-dl-health"></dl>
    </section>
    <section class="od-card" aria-labelledby="od-h-conn">
      <h2 id="od-h-conn">CONNECTION</h2>
      <dl class="od-dl" id="od-dl-connection"></dl>
    </section>
    <section class="od-card" aria-labelledby="od-h-glass">
      <h2 id="od-h-glass">Glass snapshot</h2>
      <dl class="od-dl" id="od-dl-glass"></dl>
    </section>
    <section class="od-card" aria-labelledby="od-h-sx">
      <h2 id="od-h-sx">SIMPLEX (proxy)</h2>
      <dl class="od-dl" id="od-dl-simplex"></dl>
    </section>
    <section class="od-card" aria-labelledby="od-h-org">
      <h2 id="od-h-org">GitHub org · social ops</h2>
      <p class="od-foot">Valve + event tail from <code class="od-mono">~/.p31</code> — automation gate for runs stays on the <a class="od-inline" href="/">control plane</a>.</p>
      <dl class="od-dl" id="od-dl-github-org"></dl>
    </section>
    <section class="od-card" aria-labelledby="od-h-dep">
      <h2 id="od-h-dep">Deploy spine (preview)</h2>
      <ul class="od-list" id="od-deploy-list"></ul>
    </section>
  </main>
  <script src="/assets/p31-return-ribbon.js" defer></script>
</body>
</html>`;
}

const manifestBody = buildManifestJson();
const p31StylePath = path.join(repoRoot, "cognitive-passport", "p31-style.css");
const p31SharedSurfacePath = path.join(repoRoot, "p31-shared-surface.css");
const p31ResponsiveSurfacePath = path.join(repoRoot, "cognitive-passport", "p31-responsive-surface.css");
const p31SubjectPrefsPath = path.join(repoRoot, "cognitive-passport", "lib", "p31-subject-prefs.js");
const p31ReturnRibbonPath = path.join(repoRoot, "cognitive-passport", "lib", "p31-return-ribbon.js");
const p31StaticStarPlatePath = path.join(repoRoot, "design-assets", "starfield", "p31-starfield-static-plate.js");
const p31AtmosphereDir = path.join(repoRoot, "design-assets", "atmosphere");
let boundPort = requestedPort || DEFAULT_CMD_CENTER_PORT;

function sendJson(res, status, obj) {
  res.writeHead(status, CC_HDR.json);
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

/** Proxies Worker `GET /api/health` for Command Center strip metadata (cron mode, etc.). */
async function proxySimplexHealth(res) {
  try {
    if (!simplexOrigin) {
      sendJson(res, 200, { ok: false, reason: "not_configured" });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    let upstream;
    try {
      upstream = await fetch(simplexOrigin + "/api/health", {
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
    sendJson(res, 200, { ok: true, health: body });
  } catch (e) {
    sendJson(res, 200, {
      ok: false,
      reason: "unreachable",
      detail: String(e && e.message ? e.message : e),
    });
  }
}

function sendAsset(res, req, absPath, contentType) {
  fs.readFile(absPath, (err, buf) => {
    if (err) {
      res.writeHead(404, CC_HDR.text);
      res.end("not found: " + path.basename(absPath));
      return;
    }
    let etag = "";
    try {
      const st = fs.statSync(absPath);
      etag = 'W/"' + st.mtimeMs + "-" + st.size + '"';
    } catch {
      etag = 'W/"' + buf.length + '"';
    }
    const inm = String((req && req.headers && req.headers["if-none-match"]) || "").trim();
    if (inm && etag && inm === etag) {
      res.writeHead(304, {
        ETag: etag,
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      });
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=0, must-revalidate",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(buf);
  });
}

const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://127.0.0.1:11434";
const SENSITIVE_PERSONAS = new Set(["p31-counsel", "p31-triage", "p31-phos"]);
const PERSONA_TIMEOUT_MS = Number(process.env.P31_PERSONA_TIMEOUT_MS || 120000);
const FLEET_PERSONAS = [
  "p31-mechanic","p31-firmware","p31-counsel","p31-narrator","p31-triage",
  "p31-quick","p31-phos","p31-scribe","p31-oracle","p31-debrief",
];

/**
 * Per-IP token bucket for /api/persona-chat. Loopback-only by default,
 * but if the operator opens LAN mode we still want to refuse a hammer.
 * Bucket: 6 tokens, refill 1 per 5s (≈12 req/min sustained, burst of 6).
 * Eviction: drop entries older than 10 minutes.
 */
const PERSONA_RATE = new Map();
const PERSONA_RATE_BURST = 6;
const PERSONA_RATE_REFILL_MS = 5000;
function takePersonaToken(ip) {
  const now = Date.now();
  const e = PERSONA_RATE.get(ip) || { tokens: PERSONA_RATE_BURST, last: now };
  const refill = Math.floor((now - e.last) / PERSONA_RATE_REFILL_MS);
  if (refill > 0) {
    e.tokens = Math.min(PERSONA_RATE_BURST, e.tokens + refill);
    e.last = now;
  }
  if (e.tokens <= 0) {
    PERSONA_RATE.set(ip, e);
    return false;
  }
  e.tokens -= 1;
  PERSONA_RATE.set(ip, e);
  if (PERSONA_RATE.size > 256) {
    const cutoff = now - 10 * 60 * 1000;
    for (const [k, v] of PERSONA_RATE) if (v.last < cutoff) PERSONA_RATE.delete(k);
  }
  return true;
}
function clientIp(req) {
  const ra = req.socket && req.socket.remoteAddress;
  return (ra || "unknown").replace(/^::ffff:/, "");
}

async function handlePersonasList(res) {
  res.writeHead(200, CC_HDR.json);
  let materialized = [];
  let memAvailMiB = null;
  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    memAvailMiB = Math.round(Number(meminfo.match(/MemAvailable:\s+(\d+)/)?.[1] || 0) / 1024);
  } catch { /* not Linux */ }
  try {
    const ctl = new AbortController();
    const tk = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch(OLLAMA_BASE + "/api/tags", { signal: ctl.signal });
    clearTimeout(tk);
    if (r.ok) {
      const j = await r.json();
      const names = (j.models || []).map((m) => (m.name || "").split(":")[0]);
      materialized = FLEET_PERSONAS.filter((p) => names.includes(p));
    }
  } catch { /* ollama down */ }
  const personas = FLEET_PERSONAS.map((id) => ({
    id,
    materialized: materialized.includes(id),
    sensitive: SENSITIVE_PERSONAS.has(id),
  }));
  res.end(JSON.stringify({
    schema: "p31.personas/1.0.0",
    personas,
    memAvailMiB,
    ollamaBase: OLLAMA_BASE,
    note: "sensitive personas (counsel/triage/phos) refuse cloud lane on the A/B harness; this UI is local-only and safe.",
  }));
}

async function handlePersonaChat(req, res) {
  const ip = clientIp(req);
  if (!takePersonaToken(ip)) {
    res.writeHead(429, { ...CC_HDR.json, "Retry-After": "5" });
    res.end(JSON.stringify({ error: "rate limited", retryAfterSeconds: 5 }));
    return;
  }
  let body = "";
  req.on("data", (chunk) => { body += chunk; if (body.length > 64 * 1024) req.destroy(); });
  req.on("end", async () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch {
      res.writeHead(400, CC_HDR.json); res.end(JSON.stringify({ error: "bad json" })); return;
    }
    const { persona, prompt } = parsed || {};
    if (!persona || typeof persona !== "string" || !FLEET_PERSONAS.includes(persona)) {
      res.writeHead(400, CC_HDR.json); res.end(JSON.stringify({ error: "unknown persona" })); return;
    }
    if (!prompt || typeof prompt !== "string" || prompt.length > 16000) {
      res.writeHead(400, CC_HDR.json); res.end(JSON.stringify({ error: "missing or oversized prompt (max 16000 chars)" })); return;
    }
    const t0 = Date.now();
    const ctl = new AbortController();
    const tk = setTimeout(() => ctl.abort(), PERSONA_TIMEOUT_MS);
    try {
      const r = await fetch(OLLAMA_BASE + "/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: persona, prompt, stream: false, keep_alive: 0 }),
        signal: ctl.signal,
      });
      const dt = (Date.now() - t0) / 1000;
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        res.writeHead(200, CC_HDR.json);
        res.end(JSON.stringify({ ok: false, persona, seconds: dt, error: r.status + " " + errBody.slice(0, 400) }));
        return;
      }
      const j = await r.json();
      res.writeHead(200, CC_HDR.json);
      res.end(JSON.stringify({
        ok: true, persona, seconds: Number(dt.toFixed(2)),
        response: j.response, evalCount: j.eval_count,
        tokPerSec: j.eval_count && j.eval_duration ? Number((j.eval_count / (j.eval_duration / 1e9)).toFixed(2)) : null,
      }));
    } catch (e) {
      res.writeHead(200, CC_HDR.json);
      res.end(JSON.stringify({ ok: false, persona, error: e.message }));
    } finally {
      clearTimeout(tk);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, CC_HDR.html);
    res.end(buildPageHtml(boundPort));
    return;
  }
  if (req.method === "GET" && req.url === "/cli") {
    const cliPath = path.join(repoRoot, "command-center-cli.html");
    if (fs.existsSync(cliPath)) {
      res.writeHead(200, CC_HDR.html);
      res.end(fs.readFileSync(cliPath, "utf8"));
    } else {
      res.writeHead(404, CC_HDR.text);
      res.end("CLI dashboard not found — run npm run dashboard");
    }
    return;
  }
  if (req.method === "GET" && (req.url === "/term" || req.url === "/terminal" || req.url === "/vibe")) {
    const termPath = path.join(repoRoot, "command-center-terminal.html");
    if (fs.existsSync(termPath)) {
      res.writeHead(200, CC_HDR.html);
      res.end(fs.readFileSync(termPath, "utf8"));
    } else {
      res.writeHead(404, CC_HDR.text);
      res.end("P31 terminal UI not found at command-center-terminal.html");
    }
    return;
  }
  if (req.method === "GET" && req.url === "/api/personas") {
    handlePersonasList(res);
    return;
  }
  if (req.method === "POST" && req.url === "/api/persona-chat") {
    handlePersonaChat(req, res);
    return;
  }
  // VIBE-3H — read-only operator doc viewer for the PiP CLI substrate
  // (command-center-terminal.html `view` tab). Allowlist + slug regex
  // prevent path traversal; never compose a path from user input.
  // CWP-P31-VIBE-2026-06 §18.
  const DOC_SLUG_ALLOWLIST = {
    "boot-up": "docs/operator/BOOT-UP-AND-USE.md",
    manifesto: "docs/P31-MANIFESTO.md",
    "vibe-cwp": "docs/CWP-P31-VIBE-2026-06.md",
    "peer-cwp": "docs/CWP-P31-PEER-COMP-2026-05.md",
    "weave-cwp": "docs/CWP-P31-WEAVE-2026-07.md",
    "morning-arc": "docs/MORNING-OPERATOR-ARC.md",
    agents: "AGENTS.md",
    "delta-language": "docs/P31-DELTA-LANGUAGE.md",
    "public-voice": "docs/PUBLIC-VOICE.md",
    "engineering-standard": "docs/P31-ENGINEERING-STANDARD.md",
    alignment: "docs/operator/CLAUDE-CODE-ALIGNMENT-2026-05-02.md",
    rewards: "docs/operator/REWARDS-FRAMEWORK-2026-05-02.md",
    crypto: "docs/operator/CRYPTO-POSITIONING-2026-05-02.md",
    "phos-training": "docs/operator/PHOS-TRAINING-DOCTRINE-2026-05-02.md",
    "peer-reflection": "docs/operator/PEER-CLAUDE-REFLECTION-2026-05-02.md",
  };
  const SLUG_RE = /^[a-z][a-z0-9-]{0,40}$/;
  if (req.method === "GET" && req.url && req.url.startsWith("/api/view-doc")) {
    const qIdx = req.url.indexOf("?");
    const params = new URLSearchParams(qIdx >= 0 ? req.url.slice(qIdx + 1) : "");
    const slug = (params.get("slug") || "").trim();
    if (!slug || !SLUG_RE.test(slug)) {
      res.writeHead(400, CC_HDR.text);
      res.end("bad slug\n");
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(DOC_SLUG_ALLOWLIST, slug)) {
      res.writeHead(403, CC_HDR.text);
      res.end("slug not allowlisted\n");
      return;
    }
    const docPath = path.join(repoRoot, DOC_SLUG_ALLOWLIST[slug]);
    if (!fs.existsSync(docPath)) {
      res.writeHead(404, CC_HDR.text);
      res.end("doc not found on disk\n");
      return;
    }
    try {
      const buf = fs.readFileSync(docPath, "utf8");
      res.writeHead(200, { ...CC_HDR.text, "Cache-Control": "no-store" });
      res.end(buf);
    } catch (e) {
      res.writeHead(500, CC_HDR.text);
      res.end("read error\n");
    }
    return;
  }
  const assetBase = req.url && req.url.split("?")[0];
  if (req.method === "GET" && (assetBase === "/desk" || assetBase === "/operator-desk")) {
    res.writeHead(200, CC_HDR.html);
    res.end(buildOperatorDeskHtml(boundPort));
    return;
  }
  if (req.method === "GET" && assetBase === "/api/mesh-pulse") {
    const pulsePath = path.join(os.homedir(), ".p31", "mesh-touch-pulse.json");
    if (!fs.existsSync(pulsePath)) {
      res.writeHead(204, CC_HDR.noContent);
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
      res.writeHead(200, CC_HDR.json);
      res.end(buf);
    } catch {
      res.writeHead(500, CC_HDR.text);
      res.end("pulse read error");
    }
    return;
  }
  if (req.method === "GET" && assetBase === "/api/health") {
    res.writeHead(200, CC_HDR.json);
    res.end(
      JSON.stringify({
        ok: true,
        name: "p31-local-command-center",
        version: CC_VERSION,
        actions: Object.keys(ACTIONS).length,
        bells: {
          simplex_strip_poll_s: 30,
          ecosystem_strip_poll_s: 120,
          starfield: true,
          joy: true,
        },
        shortcuts: {
          focus_search: "/",
          toggle_hotkeys: "?",
          jump_simplex: "g s",
          jump_ecosystem: "g e",
          jump_layout: "g l",
        },
      })
    );
    return;
  }
  if (req.method === "GET" && assetBase === "/api/connection-summary") {
    res.writeHead(200, CC_HDR.json);
    res.end(JSON.stringify(getConnectionSummary()));
    return;
  }
  if (req.method === "GET" && assetBase === "/api/github-org-status") {
    try {
      res.writeHead(200, CC_HDR.json);
      res.end(JSON.stringify(getGithubOrgStatus()));
    } catch {
      res.writeHead(200, CC_HDR.json);
      res.end(JSON.stringify({ ok: false, reason: "github_org_status_error" }));
    }
    return;
  }
  if (req.method === "GET" && assetBase === "/api/glass-snapshot") {
    const reportPath = resolveGlassReportPath();
    if (!reportPath || !fs.existsSync(reportPath)) {
      res.writeHead(200, CC_HDR.json);
      res.end(JSON.stringify({ ok: false, reason: "missing_file" }));
      return;
    }
    try {
      const st = fs.statSync(reportPath);
      if (!st.isFile() || st.size > GLASS_REPORT_MAX_BYTES) {
        res.writeHead(200, CC_HDR.json);
        res.end(JSON.stringify({ ok: false, reason: "too_large_or_not_file" }));
        return;
      }
      const raw = fs.readFileSync(reportPath, "utf8");
      const doc = JSON.parse(raw);
      const summary = doc && typeof doc === "object" && doc.summary && typeof doc.summary === "object" ? doc.summary : null;
      const ts = typeof doc.timestamp === "string" ? doc.timestamp : null;
      const schema = typeof doc.schema === "string" ? doc.schema : null;
      if (!summary) {
        res.writeHead(200, CC_HDR.json);
        res.end(JSON.stringify({ ok: false, reason: "bad_shape" }));
        return;
      }
      res.writeHead(200, CC_HDR.json);
      res.end(
        JSON.stringify({
          ok: true,
          schema,
          timestamp: ts,
          summary: {
            up: Number(summary.up) || 0,
            auth: Number(summary.auth) || 0,
            warn: Number(summary.warn) || 0,
            down: Number(summary.down) || 0,
            skipped: Number(summary.skipped) || 0,
          },
        })
      );
    } catch {
      res.writeHead(200, CC_HDR.json);
      res.end(JSON.stringify({ ok: false, reason: "read_error" }));
    }
    return;
  }
  if (req.method === "GET" && assetBase === "/api/simplex-state") {
    proxySimplexState(res).catch(() => {
      sendJson(res, 200, { ok: false, reason: "unreachable" });
    });
    return;
  }
  if (req.method === "GET" && assetBase === "/api/simplex-health") {
    proxySimplexHealth(res).catch(() => {
      sendJson(res, 200, { ok: false, reason: "unreachable" });
    });
    return;
  }
  if (
    req.method === "GET" &&
    assetBase &&
    assetBase.startsWith("/assets/atmosphere/") &&
    !assetBase.includes("..")
  ) {
    const rel = assetBase.slice("/assets/atmosphere/".length).replace(/^\/+/, "");
    if (!rel) {
      res.writeHead(404, CC_HDR.text);
      res.end("not found");
      return;
    }
    const abs = path.join(p31AtmosphereDir, rel);
    const rootResolved = path.resolve(p31AtmosphereDir) + path.sep;
    const absResolved = path.resolve(abs);
    if (!absResolved.startsWith(rootResolved)) {
      res.writeHead(403, CC_HDR.text);
      res.end("forbidden");
      return;
    }
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      res.writeHead(404, CC_HDR.text);
      res.end("not found — run npm run sync:atmosphere");
      return;
    }
    const ct = rel.endsWith(".json")
      ? "application/json; charset=utf-8"
      : "application/javascript; charset=utf-8";
    sendAsset(res, req, abs, ct);
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-responsive-surface.css") {
    sendAsset(res, req, p31ResponsiveSurfacePath, "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-shared-surface.css") {
    sendAsset(res, req, p31SharedSurfacePath, "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-style.css") {
    fs.readFile(p31StylePath, (err, buf) => {
      if (err) {
        res.writeHead(404, CC_HDR.text);
        res.end("missing cognitive-passport/p31-style.css — run npm run apply:p31-style");
        return;
      }
      let etag = "";
      try {
        const st = fs.statSync(p31StylePath);
        etag = 'W/"' + st.mtimeMs + "-" + st.size + '"';
      } catch {
        etag = 'W/"' + buf.length + '"';
      }
      const inm = String((req && req.headers && req.headers["if-none-match"]) || "").trim();
      if (inm && etag && inm === etag) {
        res.writeHead(304, {
          ETag: etag,
          "Cache-Control": "private, max-age=0, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        });
        res.end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "private, max-age=0, must-revalidate",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      });
      res.end(buf);
    });
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-subject-prefs.js") {
    sendAsset(res, req, p31SubjectPrefsPath, "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-return-ribbon.js") {
    sendAsset(res, req, p31ReturnRibbonPath, "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-starfield-static-plate.js") {
    sendAsset(res, req, p31StaticStarPlatePath, "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/od-starfield-boot.js") {
    sendAsset(res, req, path.join(commandCenterDir, "od-starfield-boot.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/command-center.css") {
    sendAsset(res, req, path.join(commandCenterDir, "command-center.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/command-center.js") {
    sendAsset(res, req, path.join(commandCenterDir, "command-center.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/operator-desk.css") {
    sendAsset(res, req, path.join(commandCenterDir, "operator-desk.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/operator-desk.js") {
    sendAsset(res, req, path.join(commandCenterDir, "operator-desk.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-starfield.js") {
    sendAsset(res, req, path.join(repoRoot, "design-assets", "starfield", "p31-starfield.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-mesh-touches.js") {
    sendAsset(res, req, path.join(repoRoot, "design-assets", "starfield", "p31-mesh-touches.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-starfield.css") {
    sendAsset(res, req, path.join(repoRoot, "design-assets", "starfield", "p31-starfield.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/p31-larmor-fields.css") {
    sendAsset(res, req, path.join(repoRoot, "design-assets", "starfield", "p31-larmor-fields.css"), "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/assets/cc-starfield-boot.js") {
    sendAsset(res, req, path.join(commandCenterDir, "cc-starfield-boot.js"), "application/javascript; charset=utf-8");
    return;
  }
  if (req.method === "GET" && assetBase === "/apple-touch-icon.png") {
    if (!hasBondingAppleTouch()) {
      res.writeHead(404, CC_HDR.text);
      res.end("missing apple-touch icon");
      return;
    }
    sendAsset(res, req, bondingAppleTouchPng, "image/png");
    return;
  }
  if (req.method === "GET" && assetBase === "/p31-bonding-icon-192.png") {
    if (!fs.existsSync(bondingIcon192)) {
      res.writeHead(404, CC_HDR.text);
      res.end("not found");
      return;
    }
    sendAsset(res, req, bondingIcon192, "image/png");
    return;
  }
  if (req.method === "GET" && (assetBase === "/favicon.ico" || assetBase === "/favicon.png")) {
    const faviconPath = fs.existsSync(path.join(repoRoot, "favicon.ico"))
      ? path.join(repoRoot, "favicon.ico")
      : fs.existsSync(path.join(repoRoot, "favicon.png"))
        ? path.join(repoRoot, "favicon.png")
        : bondingIcon192;
    if (!fs.existsSync(faviconPath)) {
      res.writeHead(204, CC_HDR.noContent);
      res.end();
      return;
    }
    sendAsset(res, req, faviconPath, "image/png");
    return;
  }
  if (req.method === "GET" && assetBase === "/p31-bonding-icon-512.png") {
    if (!fs.existsSync(bondingIcon512)) {
      res.writeHead(404, CC_HDR.text);
      res.end("not found");
      return;
    }
    sendAsset(res, req, bondingIcon512, "image/png");
    return;
  }
  if (req.method === "GET" && assetBase === "/manifest.webmanifest") {
    res.writeHead(200, CC_HDR.jsonManifest);
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
          res.writeHead(400, CC_HDR.jsonAction);
          res.end(JSON.stringify({ code: 1, stderr: "bad action\n", stdout: "" }));
          return;
        }
        if (id.startsWith("andromeda-") && !hasAndromedaTree()) {
          res.writeHead(200, CC_HDR.jsonAction);
          res.end(JSON.stringify({ code: 1, stderr: "andromeda/ not in this tree\n", stdout: "" }));
          return;
        }
        if ((id === "p31ca-hub-ci" || id === "p31ca-hub-diff") && !hasP31caPackage()) {
          res.writeHead(200, CC_HDR.jsonAction);
          res.end(JSON.stringify({ code: 1, stderr: "p31ca package not found\n", stdout: "" }));
          return;
        }
        const { code, stdout, stderr } = await runAction(id);
        res.writeHead(200, CC_HDR.jsonAction);
        res.end(JSON.stringify({ code, stdout, stderr }));
      } catch (e) {
        res.writeHead(500, CC_HDR.jsonAction);
        res.end(JSON.stringify({ code: 1, stdout: "", stderr: String(e) + "\n" }));
      }
    });
    return;
  }
  res.writeHead(404, CC_HDR.text);
  res.end("not found");
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(
      "P31 command center: port " +
        (requestedPort || boundPort) +
        " in use — free 3131 or run P31_CMD_CENTER_PORT=0 npm run command-center (auto port)"
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(requestedPort === 0 ? 0 : requestedPort, listenHost, () => {
  const addr = server.address();
  const actualPort =
    addr && typeof addr === "object" && typeof addr.port === "number"
      ? addr.port
      : requestedPort || DEFAULT_CMD_CENTER_PORT;
  boundPort = actualPort;
  const urlLoop = "http://127.0.0.1:" + actualPort + "/";
  const urlDesk = "http://127.0.0.1:" + actualPort + "/desk";
  console.log("P31 command center v" + CC_VERSION + ": " + urlLoop + "  (Ctrl+C to stop)");
  console.log("P31 operator desk: " + urlDesk);
  console.log("P31 terminal:      http://127.0.0.1:" + actualPort + "/term  (chat with personas + run commands · mobile-first)");
  console.log("P31 vibcoding:     http://127.0.0.1:" + actualPort + "/vibe  (alias of /term — PiP CLI for vibcoding spectrum · CWP-P31-VIBE-2026-06)");
  if (!hasBondingAppleTouch()) {
    console.warn("P31 command center: apple-touch missing — npm run generate:bonding-pwa-icons");
  }
  if (listenHost === "0.0.0.0") {
    console.warn("P31 command center: LAN bind — anyone on your network can hit whitelisted actions. Trusted Wi‑Fi only.");
    const lan = getLanIPv4();
    if (lan) console.log("P31 command center phone URL: http://" + lan + ":" + actualPort + "/");
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
