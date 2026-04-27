#!/usr/bin/env node
/**
 * @fileoverview P31 local operator console — HTTP control plane on loopback only.
 *
 * **Security model:** `POST /api/run` accepts only keys from an in-memory whitelist (`actions`).
 * Each entry runs `execFile(cmd, args, { cwd })` — no shell, no user-controlled strings in argv.
 * Default bind: `127.0.0.1`. **LAN / iPhone on Wi‑Fi:** `P31_CMD_CENTER_LAN=1` or `P31_CMD_CENTER_HOST=0.0.0.0`
 * listens on all interfaces — anyone on the LAN can invoke whitelisted actions; use only on trusted networks.
 *
 * **UI:** Static assets in `scripts/command-center/` (`command-center.css`, `command-center.js`);
 * design tokens from `cognitive-passport/p31-style.css`. Boot payload is JSON in `#cc-boot`.
 *
 * @see {@link https://github.com/p31labs/bonding-soup} home repo
 *
 *   npm run command-center
 *   P31_CMD_CENTER_PORT=4000 npm run command-center
 */
import http from "node:http";
import os from "node:os";
import { execFile, execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertBootShape } from "./command-center/boot-shape.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
/** @type {string} Co-located presentation bundle (CSS + client JS). */
const commandCenterDir = path.join(__dirname, "command-center");
const andromeda = path.join(root, "andromeda");
const p31ca = path.join(andromeda, "04_SOFTWARE", "p31ca");
const port = Math.min(65535, Math.max(1024, Number(process.env.P31_CMD_CENTER_PORT) || 3131));
const listenHost =
  process.env.P31_CMD_CENTER_HOST === "0.0.0.0" || process.env.P31_CMD_CENTER_LAN === "1"
    ? "0.0.0.0"
    : process.env.P31_CMD_CENTER_HOST || "127.0.0.1";
const badgeHost = listenHost === "0.0.0.0" ? "LAN" : listenHost;

/** First non-internal IPv4 — for “open on phone” hints when bound to 0.0.0.0 */
function getLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net && net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

const MANIFEST_JSON = JSON.stringify({
  name: "P31 Operator Console",
  short_name: "P31 Console",
  description: "Whitelisted local automation — P31 home workspace",
  start_url: "/",
  display: "standalone",
  orientation: "portrait-primary",
  theme_color: "#0f1115",
  background_color: "#0f1115",
  categories: ["utilities", "developer"],
});

const MAX_BUFFER = 32 * 1024 * 1024;

function hasAndromeda() {
  return fs.existsSync(path.join(andromeda, "package.json"));
}

function hasP31ca() {
  return fs.existsSync(path.join(p31ca, "package.json"));
}

/**
 * Whitelist only. Optional: slow, network, hitl for UI tags; confirm = browser confirm() message.
 * @type {Record<string, { title: string, cwd: string, cmd: string, args: string[], slow?: boolean, network?: boolean, hitl?: boolean, confirm?: string, background?: boolean }>}
 */
const actions = {
  // —— Local static server (long-running; spawned detached)
  "home-demo": {
    title: "Start demo server (port 8080 — same as npm run demo)",
    cwd: root,
    cmd: "npm",
    args: ["run", "demo"],
    background: true,
    network: true,
    confirm:
      "Starts Python http.server on 8080 in the background (second click may fail if port busy). Continue?",
  },

  // —— Daily & diagnostics
  "home-doctor": {
    title: "Doctor (Node, remotes, gh, Andromeda origin)",
    cwd: root,
    cmd: "npm",
    args: ["run", "doctor"],
  },
  "home-verify": {
    title: "verify (default ship bar: alignment + facts + passport + … + tsc)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify"],
    slow: true,
  },
  "home-build": {
    title: "build (Soup only — tsc → dist/)",
    cwd: root,
    cmd: "npm",
    args: ["run", "build"],
  },
  "home-verify-alignment": {
    title: "verify:alignment (registry + sources JSON)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:alignment"],
  },
  "home-verify-facts": {
    title: "verify:facts (p31.facts/1.0.0 — mesh keys, paths, policy substring guard)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:facts"],
  },
  "home-mesh-budgets": {
    title: "mesh:budgets (k4-personal + glass row latency SLOs — no network)",
    cwd: root,
    cmd: "npm",
    args: ["run", "mesh:budgets"],
  },
  "home-build-fleet-portal": {
    title: "build:fleet-portal (live URL index → fleet-portal.html; polish copies to p31ca public)",
    cwd: root,
    cmd: "npm",
    args: ["run", "build:fleet-portal"],
  },
  "home-apply-constants": {
    title: "apply:constants (JSON → ground-truth fragments, generated TS)",
    cwd: root,
    cmd: "npm",
    args: ["run", "apply:constants"],
    hitl: true,
  },
  "home-sync-passport": {
    title: "sync:passport (cognitive-passport → p31ca mirror)",
    cwd: root,
    cmd: "npm",
    args: ["run", "sync:passport"],
  },
  "home-inventory-cf": {
    title: "inventory:cf (wrangler inventory markdown)",
    cwd: root,
    cmd: "npm",
    args: ["run", "inventory:cf"],
    network: true,
  },
  "home-build-doc-index": {
    title: "build:doc-index (markdown → docs/doc-library/index.json)",
    cwd: root,
    cmd: "npm",
    args: ["run", "build:doc-index"],
  },
  "home-verify-doc-index": {
    title: "verify:doc-index (fingerprint + Minisearch smoke + vendor + worker)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:doc-index"],
  },
  "home-test-doc-library-e2e": {
    title: "test:doc-library:e2e (Playwright — static server + headless search; install chromium once: npx playwright install chromium)",
    cwd: root,
    cmd: "npm",
    args: ["run", "test:doc-library:e2e"],
    slow: true,
  },
  "home-test-physics-learn-e2e": {
    title: "test:physics-learn:e2e (Playwright — first unit vector lab + check)",
    cwd: root,
    cmd: "npm",
    args: ["run", "test:physics-learn:e2e"],
    slow: true,
  },
  "home-test-k4market-smoke": {
    title: "test:k4market:smoke (k4market shell + WebGL; launch timeout 20s; P31_…_SKIP on fail in sandboxes)",
    cwd: root,
    cmd: "npm",
    args: ["run", "test:k4market:smoke"],
    slow: true,
  },

  // —— CI-shaped
  "home-release-check": {
    title: "release:check / p31:ci (verify + k4 + mesh + full p31ca Astro build)",
    cwd: root,
    cmd: "npm",
    args: ["run", "release:check"],
    slow: true,
    network: true,
  },
  "home-p31-ci-all": {
    title: "p31:ci:all (strict mesh + p31-ci + security)",
    cwd: root,
    cmd: "npm",
    args: ["run", "p31:ci:all"],
    slow: true,
    network: true,
    confirm: "Runs strict mesh + full p31-ci with security. Uses network (live mesh). Continue?",
  },
  "home-validate-full": {
    title: "validate:full (scorecard + extended audits → /tmp report)",
    cwd: root,
    cmd: "npm",
    args: ["run", "validate:full"],
    slow: true,
    network: true,
    confirm: "validate:full runs extended checks and may hit live services. Continue?",
  },
  "home-p31-all": {
    title: "p31:all (CI + validate:full + fleet + e2e + glass + semgrep soft)",
    cwd: root,
    cmd: "npm",
    args: ["run", "p31:all"],
    slow: true,
    network: true,
    confirm:
      "p31:all can take 15–30+ minutes (Playwright, mesh, probes). Stay on Wi‑Fi. Run only when you mean “full fleet”. Continue?",
  },

  // —— Verify slices
  "home-verify-monetary": {
    title: "verify:monetary (ecosystem + constants + economy)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:monetary"],
  },
  "home-verify-map": {
    title: "verify:map-pipeline (MAP / donate static checks)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:map-pipeline"],
  },
  "home-verify-mesh": {
    title: "verify:mesh (k4 bundle + live /api/*)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:mesh"],
    network: true,
  },
  "home-ecosystem-glass": {
    title: "ecosystem:glass (probes → table + /tmp/p31_glass_report.json)",
    cwd: root,
    cmd: "npm",
    args: ["run", "ecosystem:glass"],
    network: true,
  },
  "home-ecosystem-plan": {
    title: "ecosystem:plan (ordered deploy list — read-only plan)",
    cwd: root,
    cmd: "npm",
    args: ["run", "ecosystem:plan"],
  },

  // —— Operator shift (local HITL)
  "home-operator-shift-status": {
    title: "operator:shift-status (~/.p31/operator-shift.jsonl)",
    cwd: root,
    cmd: "npm",
    args: ["run", "operator:shift-status"],
    hitl: true,
  },
  "home-operator-shift-in": {
    title: "operator:shift-in (tag in — local log)",
    cwd: root,
    cmd: "npm",
    args: ["run", "operator:shift-in"],
    hitl: true,
  },
  "home-operator-shift-out": {
    title: "operator:shift-out (tag out — local log)",
    cwd: root,
    cmd: "npm",
    args: ["run", "operator:shift-out"],
    hitl: true,
  },

  // —— Polish & release
  "home-polish": {
    title: "polish (apply:constants + live-fleet + release:local + security — slow)",
    cwd: root,
    cmd: "npm",
    args: ["run", "polish"],
    slow: true,
    network: true,
    confirm: "polish runs release:local and security; may take several minutes. Continue?",
  },
  "home-frictionless": {
    title: "frictionless (doctor + release:local mesh loose)",
    cwd: root,
    cmd: "npm",
    args: ["run", "frictionless"],
    slow: true,
  },
  "home-release-public": {
    title: "release:public (verify + strict mesh + hub:ci + security)",
    cwd: root,
    cmd: "npm",
    args: ["run", "release:public"],
    slow: true,
    network: true,
    confirm: "release:public is a full public-release gate. Continue?",
  },

  // —— Git & PR
  "home-git-hooks": { title: "git:hooks (core.hooksPath = .githooks)", cwd: root, cmd: "npm", args: ["run", "git:hooks"] },
  "home-git-autopush-status": { title: "git:autopush:status", cwd: root, cmd: "npm", args: ["run", "git:autopush:status"] },
  "home-git-autopush-on": { title: "git:autopush:on", cwd: root, cmd: "npm", args: ["run", "git:autopush:on"] },
  "home-git-autopush-off": { title: "git:autopush:off", cwd: root, cmd: "npm", args: ["run", "git:autopush:off"] },
  "home-git-remotes": { title: "git:remotes (origin + andromeda)", cwd: root, cmd: "npm", args: ["run", "git:remotes"] },
  "home-pr": {
    title: "pr (ship branch, gh auto-merge if configured)",
    cwd: root,
    cmd: "npm",
    args: ["run", "pr"],
    hitl: true,
  },
  "home-fix-gh": { title: "fix:gh (gh auth setup-git)", cwd: root, cmd: "npm", args: ["run", "fix:gh"] },

  // —— Andromeda (repo root = andromeda/)
  "andromeda-git-hooks": { title: "Andromeda: git:hooks", cwd: andromeda, cmd: "npm", args: ["run", "git:hooks"] },
  "andromeda-prepush": { title: "Andromeda: prepush:check", cwd: andromeda, cmd: "npm", args: ["run", "prepush:check"] },
  "andromeda-pr": { title: "Andromeda: pnpm pr", cwd: andromeda, cmd: "pnpm", args: ["pr"], hitl: true },
  "andromeda-fix-gh": { title: "Andromeda: fix:gh", cwd: andromeda, cmd: "npm", args: ["run", "fix:gh"] },
  "andromeda-polish": {
    title: "Andromeda: polish (quality + p31ca hub:ci + security)",
    cwd: andromeda,
    cmd: "npm",
    args: ["run", "polish"],
    slow: true,
    network: true,
    confirm: "Andromeda polish can take a long time. Continue?",
  },
  "p31ca-hub-ci": {
    title: "p31ca only: hub:ci (about + verify + build + dist check)",
    cwd: p31ca,
    cmd: "npm",
    args: ["run", "hub:ci"],
    slow: true,
  },
};

/** When {@link hasP31ca} — paths under `andromeda/` for `npm run demo` (port 8080). */
const P31CA_PUBLIC_BASE = "http://127.0.0.1:8080/andromeda/04_SOFTWARE/p31ca/public";

/**
 * Open in browser when demo server is running (8080). Appends Create + Connect when p31ca tree exists.
 * @param {() => boolean} p31ca
 */
function getLocalPreviewLinks(p31ca) {
  const links = [
    { href: "http://127.0.0.1:8080/soup.html", label: "BONDING Soup" },
    { href: "http://127.0.0.1:8080/cognitive-passport/index.html", label: "Cognitive Passport" },
    { href: "http://127.0.0.1:8080/docs/doc-library/index.html", label: "Document library" },
    { href: "http://127.0.0.1:8080/docs/physics-learn/index.html", label: "Physics learn" },
  ];
  if (p31ca()) {
    links.push(
      { href: `${P31CA_PUBLIC_BASE}/initial-build.html`, label: "Create (initial build)" },
      { href: `${P31CA_PUBLIC_BASE}/connect.html`, label: "Connect (K₄)" },
    );
  }
  links.push(
    { href: "http://127.0.0.1:8080/poets-room.html", label: "Poets room" },
    { href: "http://127.0.0.1:8080/p31-personal-howto.html", label: "Personal how-to" },
  );
  return links;
}

/** Section order: { id, title, ids[] } */
const SECTIONS = [
  {
    id: "local",
    title: "Local previews (after demo server on 8080)",
    ids: ["home-demo"],
  },
  {
    id: "diagnostics",
    title: "Diagnostics & quick",
    ids: [
      "home-doctor",
      "home-build",
      "home-verify-alignment",
      "home-verify-facts",
      "home-mesh-budgets",
      "home-build-fleet-portal",
      "home-verify",
      "home-apply-constants",
      "home-sync-passport",
      "home-inventory-cf",
    ],
  },
  {
    id: "ci",
    title: "CI & full gates",
    ids: [
      "home-release-check",
      "home-p31-ci-all",
      "home-validate-full",
      "home-p31-all",
    ],
  },
  {
    id: "slices",
    title: "Verify slices",
    ids: [
      "home-verify-monetary",
      "home-verify-map",
      "home-verify-mesh",
      "home-build-doc-index",
      "home-verify-doc-index",
      "home-test-doc-library-e2e",
      "home-test-physics-learn-e2e",
      "home-test-k4market-smoke",
      "home-ecosystem-glass",
      "home-ecosystem-plan",
    ],
  },
  {
    id: "operator",
    title: "Operator shift (local HITL)",
    ids: ["home-operator-shift-status", "home-operator-shift-in", "home-operator-shift-out"],
  },
  {
    id: "ship",
    title: "Polish & release",
    ids: ["home-frictionless", "home-polish", "home-release-public"],
  },
  {
    id: "git",
    title: "Git & PR",
    ids: [
      "home-git-hooks",
      "home-git-autopush-status",
      "home-git-autopush-on",
      "home-git-autopush-off",
      "home-git-remotes",
      "home-pr",
      "home-fix-gh",
    ],
  },
  {
    id: "andromeda",
    title: "Andromeda (monorepo root)",
    ids: [
      "andromeda-git-hooks",
      "andromeda-prepush",
      "p31ca-hub-ci",
      "andromeda-polish",
      "andromeda-pr",
      "andromeda-fix-gh",
    ],
  },
];

function runAction(id) {
  const spec = actions[id];
  if (!spec) {
    return Promise.reject(new Error("unknown action"));
  }
  if (spec.cwd !== root && !fs.existsSync(spec.cwd)) {
    return Promise.resolve({ code: 1, stdout: "", stderr: "Tree missing: " + spec.cwd + "\n" });
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
          ").\nOpen http://127.0.0.1:8080/ — use the Open: … links below.\n",
        stderr: "",
      });
    } catch (e) {
      return Promise.resolve({ code: 1, stdout: "", stderr: e.message + "\n" });
    }
  }
  return new Promise((resolve) => {
    const child = execFile(
      spec.cmd,
      spec.args,
      {
        cwd: spec.cwd,
        maxBuffer: MAX_BUFFER,
        env: { ...process.env, FORCE_COLOR: "0" },
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

function elicitMeta(id) {
  const spec = actions[id];
  if (!spec) return { title: id, slow: false, network: false, hitl: false, confirm: null };
  return {
    title: spec.title,
    slow: !!spec.slow,
    network: !!spec.network,
    hitl: !!spec.hitl,
    confirm: spec.confirm || null,
  };
}

/**
 * Builds the HTML shell. Injects `ACTION_META` + `SECTIONS` into `#cc-boot` (JSON).
 * Escapes `<` for safe embedding in `<script type="application/json">`.
 */
function buildPageHtml() {
  const a = hasAndromeda();
  const p = hasP31ca();
  const lan = getLanIPv4();
  const sections = SECTIONS.map((sec) => {
    const ids = sec.ids.filter((id) => {
      if (id.startsWith("andromeda-") && !a) return false;
      if (id === "p31ca-hub-ci" && !p) return false;
      return true;
    });
    if (sec.id === "local") {
      return { ...sec, ids, links: getLocalPreviewLinks(hasP31ca) };
    }
    return { ...sec, ids };
  }).filter((s) => s.ids.length > 0 || (s.links && s.links.length > 0));

  const bootPayload = {
    ACTION_META: Object.fromEntries(Object.keys(actions).map((k) => [k, elicitMeta(k)])),
    SECTIONS: sections,
  };
  assertBootShape(bootPayload);
  const bootJson = JSON.stringify(bootPayload).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0f1115" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="P31 Console" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="description" content="P31 local operator console — whitelisted npm automation on loopback." />
  <title>P31 — operator console</title>
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/p31-style.css" />
  <link rel="stylesheet" href="/assets/command-center.css" />
  <script type="application/json" id="cc-boot">${bootJson}</script>
  <script src="/assets/command-center.js" defer></script>
</head>
<body class="p31-cc">
  <div class="p31-cc__grain" aria-hidden="true"></div>
  <div class="p31-cc__aurora" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="p31-cc__mesh" aria-hidden="true">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g class="p31-cc__mesh-rot">
        <!-- K₄ / tetra wire (6 edges) + orbit ring -->
        <line x1="50" y1="8" x2="86" y2="70" />
        <line x1="50" y1="8" x2="14" y2="70" />
        <line x1="50" y1="8" x2="50" y2="44" />
        <line x1="14" y1="70" x2="86" y2="70" />
        <line x1="14" y1="70" x2="50" y2="44" />
        <line x1="86" y1="70" x2="50" y2="44" />
        <circle cx="50" cy="48" r="38" />
      </g>
    </svg>
  </div>
  <div class="p31-cc__shell">
    <header class="p31-cc__top">
      <div class="p31-cc__brand">
        <div class="p31-cc__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L20 18H4L12 2Z" stroke="var(--p31-cyan)" stroke-width="1.5" fill="none"/>
            <circle cx="12" cy="14" r="2" fill="var(--p31-coral)" opacity="0.85"/>
          </svg>
        </div>
        <div>
          <p class="p31-cc__eyebrow">P31 labs · local control plane</p>
          <h1 class="p31-cc__title">Operator console</h1>
          <p class="p31-cc__sub">Whitelisted automation, zero shell injection — same tokens as the hub. One Node process; the surface is static assets + JSON boot.</p>
        </div>
      </div>
      <span class="p31-cc__badge" title="Bind address">${badgeHost}:${port}${
    listenHost === "0.0.0.0" && lan
      ? ` · phone: http://${lan}:${port}/`
      : ""
  }</span>
    </header>

    <div class="p31-cc__main">
      <div class="p31-cc__col p31-cc__col--body">
        <div class="p31-cc__filter-wrap">
          <input type="search" id="cc-filter" class="p31-cc__filter" placeholder="Filter actions…" autocomplete="off" spellcheck="false" aria-label="Filter actions" />
          <p class="p31-cc__filter-meta p31-cc__filter-meta--desktop"><kbd>/</kbd> focus · matches labels · <kbd>Esc</kbd> clear</p>
          <p class="p31-cc__filter-meta p31-cc__filter-meta--mobile">Tap field to search · matches labels</p>
        </div>

        <div class="p31-cc__callout">
          <p><strong>Ship bar, without the amnesia.</strong> From repo root: <code>npm run command-center</code> (or VS Code <strong>Run Task</strong> → <em>P31: local command center</em>). Under the hood: <code>execFile</code> whitelist only.</p>
          <p><strong>iPhone · same Wi‑Fi:</strong> <code>P31_CMD_CENTER_LAN=1 npm run command-center</code> — open the <strong>phone:</strong> URL in the header badge (LAN can run whitelisted actions; trusted networks only). Then Safari → <em>Add to Home Screen</em> for a standalone app tile. <code>127.0.0.1</code> preview links rewrite to your Mac’s LAN IP automatically.</p>
          <p>Passport → <strong>sync:passport</strong>. Home <code>docs/*.md</code> → <strong>build:doc-index</strong> or <code>verify</code>. Client bundle: <code>scripts/command-center/</code>.</p>
        </div>

        <p class="p31-cc__ribbon"><em>As above, so below</em> — same <code>demo</code> / <code>build:doc-index</code> bar as
          <a href="http://127.0.0.1:8080/soup.html" rel="noopener" target="_blank">BONDING Soup</a>,
          <a href="http://127.0.0.1:8080/p31-personal-howto.html" rel="noopener" target="_blank">How-to</a>,
          <a href="http://127.0.0.1:8080/poets-room.html" rel="noopener" target="_blank">Poets room</a>,
          <a href="http://127.0.0.1:8080/docs/doc-library/index.html" rel="noopener" target="_blank">Document library</a>
          (<a href="http://127.0.0.1:8080/docs/doc-library/index.html?q=mesh" rel="noopener" target="_blank"><code>?q=mesh</code></a>),
          <a href="http://127.0.0.1:8080/docs/physics-learn/index.html" rel="noopener" target="_blank">Physics learn</a>,
          <a href="http://127.0.0.1:8080/docs/PLAN-BONDING-SOUP-WHEN-SCALE.md" rel="noopener" target="_blank">When-scale plan</a>${
            p
              ? ` · <a href="${P31CA_PUBLIC_BASE}/initial-build.html" rel="noopener" target="_blank">Create</a> &amp; <a href="${P31CA_PUBLIC_BASE}/connect.html" rel="noopener" target="_blank">Connect</a> (local hub static)`
              : ""
          }.
          <span class="heart" title="love">&#9829;</span> <span aria-hidden="true">&lt;3</span>
        </p>

        <div class="p31-cc__chips" aria-label="Legend">
          <span class="p31-cc__chip"><b>slow</b> minutes</span>
          <span class="p31-cc__chip"><b>net</b> live HTTP</span>
          <span class="p31-cc__chip"><b>hitl</b> writes local state</span>
          <span class="p31-cc__chip"><b>Ctrl+C</b> stops server</span>
        </div>

        <div class="p31-cc__chips" style="margin-top:-1rem;margin-bottom:1.75rem">
          <a class="p31-cc__chip p31-cc__chip--link" href="https://command-center.trimtab-signal.workers.dev/" rel="noopener" target="_blank">EPCP edge →</a>
          <a class="p31-cc__chip p31-cc__chip--link" href="https://p31ca.org/ops/" rel="noopener" target="_blank">p31ca /ops →</a>
          <a class="p31-cc__chip p31-cc__chip--link" href="https://p31ca.org/integrations/" rel="noopener" target="_blank">Integrations →</a>
          <a class="p31-cc__chip p31-cc__chip--link" href="https://p31ca.org/build" rel="noopener" target="_blank">p31ca /build →</a>
          <a class="p31-cc__chip p31-cc__chip--link" href="https://p31ca.org/connect.html" rel="noopener" target="_blank">p31ca /connect →</a>
        </div>

        <div id="sections"></div>
        ${!a ? '<p class="p31-cc__missing">No <code>andromeda/</code> tree — Andromeda / p31ca actions are hidden. Clone the monorepo beside this repo to surface them.</p>' : !p ? '<p class="p31-cc__missing">p31ca package not found — <code>hub:ci</code> hidden.</p>' : ""}
      </div>

      <aside class="p31-cc__col p31-cc__col--aside" aria-label="Output">
        <div class="p31-cc__term-wrap" id="out-wrap">
          <h2>Process output</h2>
          <div class="p31-cc__term">
            <div class="p31-cc__term-chrome">
              <span class="p31-cc__term-dot p31-cc__term-dot--r"></span>
              <span class="p31-cc__term-dot p31-cc__term-dot--y"></span>
              <span class="p31-cc__term-dot p31-cc__term-dot--g"></span>
              <span class="p31-cc__term-hint">stderr + stdout</span>
              <span id="cc-term-status" class="p31-cc__term-status p31-cc__term-status--idle">idle</span>
            </div>
            <div id="out" aria-live="polite">— Ready.</div>
          </div>
        </div>
        <p class="p31-cc__aside-hint">Sticky on wide viewports — logs stay in sight while you scan actions.</p>
      </aside>
    </div>

    <p class="p31-cc__footer">VS Code / Cursor: <strong>Run Task</strong> → search <em>P31:</em>. Review client logic in <code>scripts/command-center/command-center.js</code>. Production deploy is intentionally not a button.</p>
  </div>

  <div id="cc-modal" class="p31-cc__modal" hidden role="dialog" aria-modal="true" aria-labelledby="cc-modal-title">
    <div class="p31-cc__modal-backdrop" data-cc-modal-dismiss></div>
    <div class="p31-cc__modal-panel">
      <p id="cc-modal-title" class="p31-cc__modal-title">Confirm</p>
      <p id="cc-modal-msg" class="p31-cc__modal-msg"></p>
      <div class="p31-cc__modal-actions">
        <button type="button" class="p31-cc__modal-btn p31-cc__modal-btn--ghost" id="cc-modal-cancel">Cancel</button>
        <button type="button" class="p31-cc__modal-btn p31-cc__modal-btn--primary" id="cc-modal-ok">Run</button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** @param {import('node:http').ServerResponse} res */
function sendAsset(res, absPath, contentType) {
  fs.readFile(absPath, (err, buf) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("not found: " + path.basename(absPath));
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    res.end(buf);
  });
}


const html = buildPageHtml();

const p31StylePath = path.join(root, "cognitive-passport", "p31-style.css");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }
  const assetBase = req.url && req.url.split("?")[0];
  if (req.method === "GET" && assetBase === "/assets/p31-style.css") {
    fs.readFile(p31StylePath, (err, buf) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("missing cognitive-passport/p31-style.css — run npm run apply:p31-style from repo root");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-store",
      });
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
  if (req.method === "GET" && assetBase === "/manifest.webmanifest") {
    res.writeHead(200, {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(MANIFEST_JSON);
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
        if (!id || !actions[id]) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 1, stderr: "bad action\n", stdout: "" }));
          return;
        }
        if (id.startsWith("andromeda-") && !hasAndromeda()) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 1, stderr: "andromeda/ not in this tree\n", stdout: "" }));
          return;
        }
        if (id === "p31ca-hub-ci" && !hasP31ca()) {
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
  console.log("P31 command center: " + urlLoop + "  (Ctrl+C to stop)");
  if (listenHost === "0.0.0.0") {
    console.warn(
      "P31 command center: listening on ALL interfaces — anyone on your LAN can run whitelisted actions. Trusted Wi‑Fi only."
    );
    const lan = getLanIPv4();
    if (lan) console.log("P31 command center (phone / same Wi‑Fi): http://" + lan + ":" + port + "/");
  }
  console.log("Hub integrations: https://p31ca.org/integrations/");
  if (process.env.P31_CMD_CENTER_NO_OPEN === "1") {
    return;
  }
  try {
    if (process.platform === "win32") {
      execFileSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
    } else if (process.platform === "darwin") {
      execFileSync("open", [url], { stdio: "ignore" });
    } else {
      execFileSync("xdg-open", [url], { stdio: "ignore" });
    }
  } catch {
    /* open browser failed */
  }
});
