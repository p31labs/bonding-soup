#!/usr/bin/env node
/**
 * P31 local command center: http://127.0.0.1 — whitelisted npm only (no shell input).
 * Grouped UI, human-in-the-loop confirms for long runs. Bind localhost only.
 *
 *   npm run command-center
 *   P31_CMD_CENTER_PORT=4000 npm run command-center
 */
import http from "node:http";
import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const andromeda = path.join(root, "andromeda");
const p31ca = path.join(andromeda, "04_SOFTWARE", "p31ca");
const port = Math.min(65535, Math.max(1024, Number(process.env.P31_CMD_CENTER_PORT) || 3131));
const host = "127.0.0.1";

const MAX_BUFFER = 32 * 1024 * 1024;

function hasAndromeda() {
  return fs.existsSync(path.join(andromeda, "package.json"));
}

function hasP31ca() {
  return fs.existsSync(path.join(p31ca, "package.json"));
}

/**
 * Whitelist only. Optional: slow, network, hitl for UI tags; confirm = browser confirm() message.
 * @type {Record<string, { title: string, cwd: string, cmd: string, args: string[], slow?: boolean, network?: boolean, hitl?: boolean, confirm?: string }>}
 */
const actions = {
  // —— Daily & diagnostics
  "home-doctor": {
    title: "Doctor (Node, remotes, gh, Andromeda origin)",
    cwd: root,
    cmd: "npm",
    args: ["run", "doctor"],
  },
  "home-verify": {
    title: "verify (default ship bar: alignment + passport + … + tsc)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify"],
    slow: true,
  },
  "home-verify-alignment": {
    title: "verify:alignment (registry + sources JSON)",
    cwd: root,
    cmd: "npm",
    args: ["run", "verify:alignment"],
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

  // —— CI-shaped
  "home-release-check": {
    title: "release:check (= p31-ci: verify + p31ca build if present)",
    cwd: root,
    cmd: "npm",
    args: ["run", "release:check"],
    slow: true,
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

/** Section order: { id, title, ids[] } */
const SECTIONS = [
  {
    id: "diagnostics",
    title: "Diagnostics & quick",
    ids: [
      "home-doctor",
      "home-verify-alignment",
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

function buildPageHtml() {
  const a = hasAndromeda();
  const p = hasP31ca();
  const sections = SECTIONS.map((sec) => {
    const ids = sec.ids.filter((id) => {
      if (id.startsWith("andromeda-") && !a) return false;
      if (id === "p31ca-hub-ci" && !p) return false;
      return true;
    });
    return { ...sec, ids };
  }).filter((s) => s.ids.length > 0);

  const metaJson = JSON.stringify(
    Object.fromEntries(Object.keys(actions).map((k) => [k, elicitMeta(k)]))
  );
  const sectionsJson = JSON.stringify(sections);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>G.O.D. / local P31 command center</title>
  <style>
    :root {
      --bg: #0a0a10;
      --panel: #12121a;
      --border: #2a2a3c;
      --text: #e8e8f0;
      --muted: #7a7a90;
      --accent: #5ee1a0;
      --warn: #e8b44c;
      --hitl: #7eb8ff;
      --net: #c4a5ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif;
      background: var(--bg); color: var(--text);
      padding: 1.25rem 1.25rem 3rem; line-height: 1.5;
    }
    h1 { font-size: 1.4rem; font-weight: 650; margin: 0 0 0.35rem; letter-spacing: -0.02em; }
    .lead { color: var(--muted); font-size: 0.9rem; max-width: 44rem; margin-bottom: 1.25rem; }
    .lead code { color: var(--warn); }
    .lead a { color: var(--accent); }
    .tags-legend { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 1rem; }
    .tags-legend span { margin-right: 1rem; }
    .tag-slow { color: var(--warn); }
    .tag-net { color: var(--net); }
    .tag-hitl { color: var(--hitl); }
    section { margin-bottom: 1.75rem; }
    h2 {
      font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted);
      margin: 0 0 0.6rem; font-weight: 600;
    }
    .grid { display: grid; gap: 0.5rem; max-width: 42rem; }
    button {
      display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem;
      width: 100%; text-align: left; padding: 0.7rem 0.85rem;
      background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
      color: var(--text); font-size: 0.88rem; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    button:hover:not(:disabled) { border-color: var(--accent); background: #16161f; }
    button:disabled { opacity: 0.5; cursor: wait; }
    .btn-title { flex: 1; min-width: 12rem; }
    .btn-meta { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; }
    .pill { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid var(--border); color: var(--muted); }
    .pill.slow { border-color: rgba(232, 180, 76, 0.45); color: var(--warn); }
    .pill.net { border-color: rgba(196, 165, 255, 0.4); color: var(--net); }
    .pill.hitl { border-color: rgba(126, 184, 255, 0.45); color: var(--hitl); }
    #out-wrap { margin-top: 1.75rem; max-width: 56rem; }
    #out {
      padding: 1rem; background: #06060a; border: 1px solid var(--border);
      border-radius: 10px; font-family: ui-monospace, monospace; font-size: 0.75rem; white-space: pre-wrap; word-break: break-word;
      min-height: 5rem; color: #b8d4c4; line-height: 1.4;
    }
    .hint { font-size: 0.78rem; color: var(--muted); margin-top: 1rem; max-width: 44rem; }
    .missing { color: var(--warn); font-size: 0.85rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>G.O.D. — local command center</h1>
  <p class="lead">Whitelisted <code>npm</code> / <code>pnpm</code> on this machine only · <code>${host}:${port}</code> · Ctrl+C stops the server.
  <a href="https://command-center.trimtab-signal.workers.dev/" rel="noopener" target="_blank">EPCP edge</a> ·
  <a href="https://p31ca.org/ops/" rel="noopener" target="_blank">p31ca /ops</a> ·
  <a href="https://p31ca.org/integrations/" rel="noopener" target="_blank">Integrations bridge</a> (OSS smart home / wearables catalog) ·
  <a href="http://127.0.0.1:8080/docs/doc-library/" rel="noopener" target="_blank">Document library</a> (with <code>npm run demo</code> on 8080)</p>
  <p class="lead" style="margin-top:-0.5rem;font-size:0.85rem">Passport: edit <code>cognitive-passport/</code> then run <strong>sync:passport</strong> in Diagnostics below (or Task P31: sync passport). After editing home <code>docs/*.md</code>, run <strong>build:doc-index</strong> in Verify slices (or full <code>verify</code>).</p>
  <p class="tags-legend">
    <span class="tag-slow">slow</span> = minutes ·
    <span class="tag-net">net</span> = live HTTP ·
    <span class="tag-hitl">hitl</span> = human-in-the-loop / writes state
  </p>
  <div id="sections"></div>
  ${!a ? '<p class="missing">No <code>andromeda/</code> next to this repo — Andromeda and p31ca sections are hidden.</p>' : !p ? '<p class="missing">p31ca path not found — <code>hub:ci</code> button hidden.</p>' : ""}
  <div id="out-wrap">
    <h2>Output</h2>
    <div id="out" aria-live="polite">Click an action — combined stderr + stdout here.</div>
  </div>
  <p class="hint">VS Code: <strong>Run Task</strong> → search <em>P31:</em>. Long jobs may fill this panel; copy from here or re-run in a terminal. Dangerous live deploy is intentionally not a button (use <code>ecosystem:plan</code> then env-gated CLI).</p>
  <script>
    const ACTION_META = ${metaJson};
    const SECTIONS = ${sectionsJson};
    function tagsHtml(id) {
      const m = ACTION_META[id] || {};
      const bits = [];
      if (m.slow) bits.push('<span class="pill slow">slow</span>');
      if (m.network) bits.push('<span class="pill net">net</span>');
      if (m.hitl) bits.push('<span class="pill hitl">hitl</span>');
      return bits.length ? '<span class="btn-meta">' + bits.join('') + '</span>' : '';
    }
    function go(id) {
      const m = ACTION_META[id];
      if (m && m.confirm) {
        if (!confirm(m.confirm)) return;
      }
      const out = document.getElementById("out");
      document.querySelectorAll("button").forEach((b) => (b.disabled = true));
      out.textContent = "Running " + id + "…";
      fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: id })
      })
        .then((r) => r.json())
        .then((j) => {
          out.textContent = (j.stderr || "") + (j.stdout || "") + (j.code ? "\\n[exit " + j.code + "]" : "");
        })
        .catch((e) => { out.textContent = String(e); })
        .finally(() => { document.querySelectorAll("button").forEach((b) => (b.disabled = false)); });
    }
    const hostEl = document.getElementById("sections");
    for (const sec of SECTIONS) {
      const s = document.createElement("section");
      const h = document.createElement("h2");
      h.textContent = sec.title;
      s.appendChild(h);
      const g = document.createElement("div");
      g.className = "grid";
      for (const id of sec.ids) {
        const b = document.createElement("button");
        b.type = "button";
        const title = (ACTION_META[id] && ACTION_META[id].title) || id;
        b.innerHTML = '<span class="btn-title"></span>' + tagsHtml(id);
        b.querySelector(".btn-title").textContent = title;
        b.addEventListener("click", () => go(id));
        g.appendChild(b);
      }
      s.appendChild(g);
      hostEl.appendChild(s);
    }
  </script>
</body>
</html>`;
}

const html = buildPageHtml();

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
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

server.listen(port, host, () => {
  const url = "http://" + host + ":" + port + "/";
  console.log("P31 command center: " + url + "  (Ctrl+C to stop)");
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
