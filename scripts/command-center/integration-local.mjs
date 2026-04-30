#!/usr/bin/env node
/**
 * Command center integration checks (default :3131, PORT=0, EADDRINUSE, ETag, npm wrappers).
 * Run: node scripts/command-center/integration-local.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const ccJs = path.join(root, "scripts", "p31-local-command-center.mjs");

/** @param {string} msg */
function log(msg) {
  console.log(msg);
}

/** @param {import('node:child_process').ChildProcessWithoutNullStreams} child */
function waitForCcUrlLine(child, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    let buf = "";
    const t = setTimeout(() => {
      cleanup();
      reject(new Error("timeout waiting for command center startup URL in stdout"));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(t);
      child.stdout?.removeAllListeners("data");
      child.stderr?.removeAllListeners("data");
    }
    function tryParse(chunk) {
      buf += chunk;
      const m = buf.match(/127\.0\.0\.1:(\d+)\//);
      if (m) {
        cleanup();
        resolve(Number.parseInt(m[1], 10));
      }
    }
    child.stdout.on("data", tryParse);
    child.stderr.on("data", tryParse);
    child.on("error", (e) => {
      cleanup();
      reject(e);
    });
  });
}

/**
 * @param {number} port
 * @param {string} pathname
 */
function httpGet(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: "127.0.0.1", port, path: pathname, timeout: 5000 },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("http timeout"));
    });
  });
}

/**
 * @param {number} port
 * @param {string} pathname
 * @param {string} body
 */
function httpPost(port, pathname, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 8000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("http timeout"));
    });
    req.write(body);
    req.end();
  });
}

function killAllCc() {
  try {
    spawnSync("pkill", ["-f", "scripts/p31-local-command-center.mjs"], { stdio: "ignore" });
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {import('node:child_process').SpawnOptions} opts
 * @param {number} timeoutMs
 */
function spawnWithTimeout(cmd, args, opts, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, opts);
    let out = "";
    let err = "";
    let settled = false;
    child.stdout?.on("data", (c) => {
      out += c;
    });
    child.stderr?.on("data", (c) => {
      err += c;
    });
    const t = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
      reject(new Error(`${cmd} ${args.join(" ")} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(t);
      reject(e);
    });
    child.on("exit", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(t);
      resolve({ code: code ?? 1, signal, stdout: out, stderr: err });
    });
  });
}

/**
 * @param {Record<string, string>} envExtra
 * @param {{ stdio?: import('node:child_process').StdioOptions }} [opts]
 */
function startCc(envExtra, opts = {}) {
  const child = spawn(process.execPath, [ccJs], {
    cwd: root,
    env: { ...process.env, P31_CMD_CENTER_NO_OPEN: "1", ...envExtra },
    stdio: opts.stdio || ["ignore", "pipe", "pipe"],
  });
  return child;
}

async function main() {
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T1: default :3131 + HTML + /api/health ===");
  {
    const child = startCc({});
    const port = await waitForCcUrlLine(child);
    if (port !== 3131) throw new Error(`expected 3131, got ${port}`);
    const page = await httpGet(port, "/");
    if (page.status !== 200) throw new Error(`GET / expected 200, got ${page.status}`);
    if (!page.body.includes("cc-aside__tabs")) throw new Error("missing cc-aside__tabs");
    if (!page.body.includes('id="cc-layout-debug"')) throw new Error("missing cc-layout-debug");
    if (!page.body.includes("p31-subject-prefs")) throw new Error("missing p31-subject-prefs");
    if (!page.body.includes("127.0.0.1:3131")) throw new Error("HTML should embed port 3131");
    if (!page.body.includes('id="cc-ecosystem-strip"')) throw new Error("missing cc-ecosystem-strip");
    if (!page.body.includes('href="/desk"')) throw new Error("missing link to operator desk");
    const desk = await httpGet(port, "/desk");
    if (desk.status !== 200) throw new Error("GET /desk status");
    if (!desk.body.includes('data-operator-desk="1"')) throw new Error("operator desk marker");
    if (!desk.body.includes('id="od-dl-github-org"')) throw new Error("operator desk github-org panel");
    const h = await httpGet(port, "/api/health");
    if (h.status !== 200) throw new Error("health status");
    const j = JSON.parse(h.body);
    if (!j.ok || j.name !== "p31-local-command-center") throw new Error("health shape");
    const atmo = await httpGet(port, "/assets/atmosphere/p31-atmosphere-routes.json");
    if (atmo.status !== 200) throw new Error("atmosphere routes asset status");
    const atj = JSON.parse(atmo.body);
    if (atj.schema !== "p31.atmosphereRoutes/1.0.0") throw new Error("atmosphere routes schema");
    const cs = await httpGet(port, "/api/connection-summary");
    if (cs.status !== 200) throw new Error("connection-summary status");
    const cj = JSON.parse(cs.body);
    if (cj.schema !== "p31.connectionSummary/1.0.1" || typeof cj.glassByGroup !== "object") {
      throw new Error("connection-summary shape");
    }
    const gs = await httpGet(port, "/api/glass-snapshot");
    if (gs.status !== 200) throw new Error("glass-snapshot status");
    const gj = JSON.parse(gs.body);
    if (typeof gj.ok !== "boolean") throw new Error("glass-snapshot shape");
    const og = await httpGet(port, "/api/github-org-status");
    if (og.status !== 200) throw new Error("github-org-status status");
    const oj = JSON.parse(og.body);
    if (oj.schema !== "p31.githubOrgStatus/1.0.0" || !oj.valve || typeof oj.valve.mode !== "string") {
      throw new Error("github-org-status shape");
    }
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T2: P31_CMD_CENTER_PORT=0 ephemeral !== 3131 ===");
  {
    const child = startCc({ P31_CMD_CENTER_PORT: "0" });
    const port = await waitForCcUrlLine(child);
    if (port === 3131) throw new Error("ephemeral port should not be 3131");
    const h = await httpGet(port, "/api/health");
    if (h.status !== 200) throw new Error("ephemeral health");
    const j = JSON.parse(h.body);
    if (!j.ok) throw new Error("ephemeral health ok");
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T3: invalid P31_CMD_CENTER_PORT -> 3131 ===");
  {
    const child = startCc({ P31_CMD_CENTER_PORT: "not-a-number" });
    const port = await waitForCcUrlLine(child);
    if (port !== 3131) throw new Error(`invalid env should default 3131, got ${port}`);
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T4: EADDRINUSE ===");
  {
    const a = startCc({});
    await waitForCcUrlLine(a);
    const dup = spawnSync(process.execPath, [ccJs], {
      cwd: root,
      env: { ...process.env, P31_CMD_CENTER_NO_OPEN: "1" },
      encoding: "utf8",
    });
    if (dup.status === 0) throw new Error("duplicate server should exit non-zero");
    if (!String(dup.stderr + dup.stdout).includes("in use")) throw new Error("expected 'in use' in stderr");
    a.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T5: ETag + 304 ===");
  {
    const child = startCc({});
    const port = await waitForCcUrlLine(child);
    const first = await httpGet(port, "/assets/command-center.css");
    if (first.status !== 200) throw new Error("css 200");
    const etag = String(first.headers.etag || "").trim();
    if (!etag) throw new Error("missing ETag");
    const second = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/assets/command-center.css",
          method: "GET",
          headers: { "If-None-Match": etag },
          timeout: 5000,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              status: res.statusCode || 0,
              body: Buffer.concat(chunks).toString("utf8"),
            })
          );
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("timeout"));
      });
      req.end();
    });
    if (second.status !== 304) throw new Error(`expected 304, got ${second.status}`);
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T6: package.json command-center:auto + runtime parity (npm does not forward child stdout) ===");
  {
    const pj = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const auto = pj.scripts["command-center:auto"];
    if (typeof auto !== "string" || !auto.includes("P31_CMD_CENTER_PORT=0") || !auto.includes("p31-local-command-center.mjs")) {
      throw new Error("package.json command-center:auto must set P31_CMD_CENTER_PORT=0 and run p31-local-command-center.mjs");
    }
    const openNpm = pj.scripts["command-center:open"];
    if (typeof openNpm !== "string" || !openNpm.includes("open cc")) {
      throw new Error('package.json command-center:open must invoke the CLI with "open cc"');
    }
    const openDeskNpm = pj.scripts["command-center:open-desk"];
    if (typeof openDeskNpm !== "string" || !openDeskNpm.includes("open desk")) {
      throw new Error('package.json command-center:open-desk must invoke the CLI with "open desk"');
    }
    const child = startCc({ P31_CMD_CENTER_PORT: "0" });
    const port = await waitForCcUrlLine(child);
    if (port === 3131) throw new Error("PORT=0 must not bind 3131 in this environment");
    const h = await httpGet(port, "/api/health");
    if (h.status !== 200) throw new Error("PORT=0 health");
    JSON.parse(h.body);
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T7: node scripts/cli/index.mjs open cc (npm wrapper is static-checked in T6) ===");
  {
    const cli = path.join(root, "scripts", "cli", "index.mjs");
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "p31-cc-open-"));
    try {
      if (process.platform === "linux") {
        const shimPath = path.join(shimDir, "xdg-open");
        fs.writeFileSync(shimPath, "#!/bin/sh\nexit 0\n", { encoding: "utf8", mode: 0o755 });
      }
      const pathEnv =
        process.platform === "linux"
          ? `${shimDir}${path.delimiter}${process.env.PATH || ""}`
          : process.env.PATH || "";
      const r = await spawnWithTimeout(
        process.execPath,
        [cli, "open", "cc", "-q"],
        {
          cwd: root,
          env: { ...process.env, PATH: pathEnv, BROWSER: "/bin/true" },
          stdio: ["ignore", "pipe", "pipe"],
        },
        45_000
      );
      if (r.code !== 0) throw new Error(`open cc exit ${r.code}: ${r.stderr}`);
      const url = String(r.stdout || "")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\/127\.0\.0\.1:\d+/.test(s))
        .pop();
      if (!url || !/^http:\/\/127\.0\.0\.1:3131/.test(url)) throw new Error(`open cc bad url: ${JSON.stringify(r.stdout)}`);
      const h = await httpGet(3131, "/api/health");
      if (h.status !== 200) throw new Error("cli open: health");
    } finally {
      try {
        fs.rmSync(shimDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T8: node scripts/cli/index.mjs open desk ===");
  {
    const cli = path.join(root, "scripts", "cli", "index.mjs");
    const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "p31-desk-open-"));
    try {
      if (process.platform === "linux") {
        const shimPath = path.join(shimDir, "xdg-open");
        fs.writeFileSync(shimPath, "#!/bin/sh\nexit 0\n", { encoding: "utf8", mode: 0o755 });
      }
      const pathEnv =
        process.platform === "linux"
          ? `${shimDir}${path.delimiter}${process.env.PATH || ""}`
          : process.env.PATH || "";
      const r = await spawnWithTimeout(
        process.execPath,
        [cli, "open", "desk", "-q"],
        {
          cwd: root,
          env: { ...process.env, PATH: pathEnv, BROWSER: "/bin/true" },
          stdio: ["ignore", "pipe", "pipe"],
        },
        45_000
      );
      if (r.code !== 0) throw new Error(`open desk exit ${r.code}: ${r.stderr}`);
      const url = String(r.stdout || "")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\/127\.0\.0\.1:\d+/.test(s))
        .pop();
      if (!url || !/^http:\/\/127\.0\.0\.1:3131\/desk/.test(url)) {
        throw new Error(`open desk bad url: ${JSON.stringify(r.stdout)}`);
      }
      const page = await httpGet(3131, "/desk");
      if (page.status !== 200) throw new Error("open desk: GET /desk status");
      if (!page.body.includes('data-operator-desk="1"')) throw new Error("open desk: missing desk marker");
    } finally {
      try {
        fs.rmSync(shimDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  }
  killAllCc();
  await new Promise((r) => setTimeout(r, 400));

  log("=== T9: POST /api/run guardrails (GET 404, bad JSON 500, bad action 400) ===");
  {
    const child = startCc({});
    const port = await waitForCcUrlLine(child);
    const getRun = await httpGet(port, "/api/run");
    if (getRun.status !== 404) throw new Error(`GET /api/run expected 404, got ${getRun.status}`);
    const badJson = await httpPost(port, "/api/run", "not-json");
    if (badJson.status !== 500) throw new Error(`invalid JSON expected 500, got ${badJson.status}`);
    const noAction = await httpPost(port, "/api/run", "{}");
    if (noAction.status !== 400) throw new Error(`missing action expected 400, got ${noAction.status}`);
    const noJ = JSON.parse(noAction.body);
    if (noJ.code !== 1 || !String(noJ.stderr || "").includes("bad action")) {
      throw new Error("missing action JSON shape");
    }
    const badAct = await httpPost(
      port,
      "/api/run",
      JSON.stringify({ action: "__not_whitelisted__" })
    );
    if (badAct.status !== 400) throw new Error(`bad action expected 400, got ${badAct.status}`);
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
  }
  killAllCc();

  log("=== ALL integration-local.mjs checks PASSED ===");
}

main().catch((e) => {
  console.error(e);
  killAllCc();
  process.exit(1);
});
