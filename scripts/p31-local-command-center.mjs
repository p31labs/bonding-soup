#!/usr/bin/env node
/**
 * P31 local command center: http://127.0.0.1 — click buttons to run whitelisted git/verify
 * (no user shell input; bind localhost only). Ctrl+C to stop.
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
const port = Math.min(65535, Math.max(1024, Number(process.env.P31_CMD_CENTER_PORT) || 3131));
const host = "127.0.0.1";

function hasAndromeda() {
  return fs.existsSync(path.join(andromeda, "package.json"));
}

const actions = {
  "home-git-hooks": { title: "Install git hooks (P31 home)", cwd: root, cmd: "npm", args: ["run", "git:hooks"] },
  "home-git-autopush-on": { title: "Auto-push: ON (marker)", cwd: root, cmd: "npm", args: ["run", "git:autopush:on"] },
  "home-git-autopush-off": { title: "Auto-push: OFF", cwd: root, cmd: "npm", args: ["run", "git:autopush:off"] },
  "home-git-autopush-status": { title: "Auto-push: status", cwd: root, cmd: "npm", args: ["run", "git:autopush:status"] },
  "home-verify-monetary": { title: "Verify monetary (ecosystem + economy)", cwd: root, cmd: "npm", args: ["run", "verify:monetary"] },
  "home-verify-map": { title: "Verify MAP only (donate-api + donate page scan)", cwd: root, cmd: "npm", args: ["run", "verify:map-pipeline"] },
  "home-git-remotes": { title: "Git remotes (origin + andromeda)", cwd: root, cmd: "npm", args: ["run", "git:remotes"] },
  "home-pr": { title: "PR + auto-merge (P31 home)", cwd: root, cmd: "npm", args: ["run", "pr"] },
  "home-fix-gh": { title: "fix:gh (credential helper)", cwd: root, cmd: "npm", args: ["run", "fix:gh"] },
  "andromeda-git-hooks": { title: "Install git hooks (Andromeda)", cwd: andromeda, cmd: "npm", args: ["run", "git:hooks"] },
  "andromeda-prepush": { title: "Andromeda: prepush:check (gitci scrub)", cwd: andromeda, cmd: "npm", args: ["run", "prepush:check"] },
  "andromeda-pr": { title: "Andromeda: pnpm pr", cwd: andromeda, cmd: "pnpm", args: ["pr"] },
  "andromeda-fix-gh": { title: "Andromeda: fix:gh", cwd: andromeda, cmd: "npm", args: ["run", "fix:gh"] }
};

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
      { cwd: spec.cwd, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: "0" } },
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

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>G.O.D. / local P31 command center</title>
  <style>
    :root {
      --bg: #0c0c12;
      --panel: #14141c;
      --border: #2a2a3a;
      --text: #e8e8f0;
      --muted: #8888a0;
      --accent: #6ee7a8;
      --warn: #f0c14c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; font-family: ui-sans-serif, system-ui, sans-serif;
      background: var(--bg); color: var(--text);
      padding: 1.25rem; line-height: 1.5;
    }
    h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 0.35rem; letter-spacing: -0.02em; }
    .sub { color: var(--muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .sub code { color: var(--warn); }
    .grid { display: grid; gap: 0.75rem; max-width: 40rem; }
    button {
      display: block; width: 100%; text-align: left; padding: 0.9rem 1rem;
      background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
      color: var(--text); font-size: 0.95rem; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    button:hover:not(:disabled) { border-color: var(--accent); background: #18182a; }
    button:disabled { opacity: 0.55; cursor: wait; }
    button kbd { display: block; font-size: 0.8rem; color: var(--muted); margin-top: 0.25rem; }
    h2 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); margin: 1.25rem 0 0.5rem; }
    #out {
      margin-top: 1.5rem; max-width: 48rem; padding: 1rem; background: #08080c; border: 1px solid var(--border);
      border-radius: 10px; font-family: ui-monospace, monospace; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word;
      min-height: 4rem; color: #c0dcc8;
    }
    .hint { font-size: 0.8rem; color: var(--muted); margin-top: 1.25rem; }
  </style>
</head>
<body>
  <h1>G.O.D. — local command center</h1>
  <p class="sub">Grounded Operator Deck: same machine, whitelisted only. Binds <code>${host}:${port}</code> only. Stop the terminal to exit. <strong>Andromeda</strong> is hidden if <code>../andromeda</code> is missing. <strong>Edge EPCP</strong> (fleet): <a href="https://command-center.trimtab-signal.workers.dev/" rel="noopener" target="_blank" style="color:var(--accent)">G.O.D. / EPCP</a> · <strong>Hub</strong>: <a href="https://p31ca.org/ops/" rel="noopener" target="_blank" style="color:var(--accent)">p31ca/ops</a></p>

  <h2>P31 home (repo root)</h2>
  <div class="grid" id="home"></div>
  <h2>Andromeda</h2>
  <div class="grid" id="andromeda"></div>
  <div id="out" aria-live="polite">Click a button — output shows here.</div>
  <p class="hint">In Cursor/VS Code you can also use <strong>Terminal → Run Task…</strong> and search for <em>P31:</em>. This page avoids typing paths when you are in a nested clone.</p>
  <script>
    const andromeda = ${hasAndromeda() ? "true" : "false"};
    const homeActions = [
      "home-git-hooks", "home-git-autopush-status", "home-git-autopush-on", "home-git-autopush-off",
      "home-verify-monetary", "home-verify-map", "home-git-remotes", "home-pr", "home-fix-gh"
    ];
    const aActions = [ "andromeda-git-hooks", "andromeda-prepush", "andromeda-pr", "andromeda-fix-gh" ];
    async function go(id) {
      const out = document.getElementById("out");
      document.querySelectorAll("button").forEach((b) => (b.disabled = true));
      out.textContent = "Running " + id + "…";
      try {
        const r = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: id }) });
        const j = await r.json();
        out.textContent = (j.stderr || "") + (j.stdout || "") + (j.code ? "\\n[exit " + j.code + "]" : "");
      } catch (e) {
        out.textContent = String(e);
      } finally {
        document.querySelectorAll("button").forEach((b) => (b.disabled = false));
      }
    }
    const labels = {
      "home-git-hooks": "Install git hooks",
      "home-git-autopush-status": "Auto-push: show status",
      "home-git-autopush-on": "Auto-push: turn ON",
      "home-git-autopush-off": "Auto-push: turn OFF",
      "home-verify-monetary": "Verify monetary pipeline (full)",
      "home-verify-map": "Verify MAP / donate pipeline (fast, Andromeda)",
      "home-git-remotes": "Set / check git remotes",
      "home-pr": "Open PR + auto-merge (npm run pr)",
      "home-fix-gh": "fix:gh (gh auth / credentials)",
      "andromeda-git-hooks": "Install git hooks (Andromeda repo)",
      "andromeda-prepush": "prepush:check (gitci scrub)",
      "andromeda-pr": "pnpm pr (Andromeda)",
      "andromeda-fix-gh": "Andromeda fix:gh"
    };
    function addList(rootEl, ids) {
      for (const id of ids) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = labels[id] || id;
        b.addEventListener("click", () => go(id));
        rootEl.appendChild(b);
      }
    }
    addList(document.getElementById("home"), homeActions);
    const ar = document.getElementById("andromeda");
    if (andromeda) {
      addList(ar, aActions);
    } else {
      const p = document.createElement("p");
      p.className = "sub";
      p.textContent = "No andromeda/ in this tree — use P31 home only, or clone the monorepo under ./andromeda.";
      ar.appendChild(p);
    }
  </script>
</body>
</html>`;

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
    /* open browser failed — use URL in terminal */
  }
});
