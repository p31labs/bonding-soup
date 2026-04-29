#!/usr/bin/env node
/**
 * Static + dynamic verify for the P31 Ollama MCP bridge.
 *
 * Static checks (always run):
 *   - server.mjs / package.json present and parse
 *   - models.json reachable; persona ids stable (10 entries, all p31-*)
 *   - tool name shape matches MCP regex `^[a-zA-Z0-9_-]{1,64}$`
 *
 * Dynamic check (runs only when @modelcontextprotocol/sdk is installed):
 *   - spawn `node server.mjs`
 *   - send JSON-RPC `initialize` then `tools/list`
 *   - assert tools.length === 10 and names match toolNameFor(persona)
 *
 * Skipped (with a clear "skip" reason) when node_modules is missing,
 * so the root ship bar never blocks waiting on `npm install`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const fleetRoot = path.join(repoRoot, "scripts", "p31-fleet-ten");
const modelsPath = path.join(fleetRoot, "models.json");
const serverPath = path.join(__dirname, "server.mjs");
const pkgPath = path.join(__dirname, "package.json");
const sdkInstalledPath = path.join(__dirname, "node_modules", "@modelcontextprotocol", "sdk", "package.json");

function fail(msg) {
  console.error("verify-ollama-mcp:", msg);
  process.exit(1);
}

function toolNameFor(personaId) {
  return personaId.replace(/-/g, "_");
}

async function staticChecks() {
  for (const p of [serverPath, pkgPath]) {
    if (!fs.existsSync(p)) fail(`missing ${path.relative(repoRoot, p)}`);
  }
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch (e) {
    fail(`package.json not valid JSON: ${e.message}`);
  }
  if (pkg.type !== "module") fail("package.json must be ESM (type: module)");
  if (!pkg.dependencies || !pkg.dependencies["@modelcontextprotocol/sdk"]) {
    fail("package.json missing dependency @modelcontextprotocol/sdk");
  }

  if (!fs.existsSync(modelsPath)) fail(`fleet models.json missing at ${modelsPath}`);
  const models = JSON.parse(fs.readFileSync(modelsPath, "utf8"));
  if (!Array.isArray(models) || models.length !== 10) fail("fleet models.json must contain 10 personas");
  const seen = new Set();
  for (const m of models) {
    if (!m.id || !m.id.startsWith("p31-")) fail(`bad persona id ${JSON.stringify(m.id)}`);
    const name = toolNameFor(m.id);
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) fail(`tool name ${name} does not match MCP regex`);
    if (seen.has(name)) fail(`duplicate tool name ${name}`);
    seen.add(name);
  }
  return { models };
}

async function dynamicCheck(models) {
  if (!fs.existsSync(sdkInstalledPath)) {
    console.log(
      "verify-ollama-mcp: skip dynamic (run `npm install` in scripts/ollama-mcp/ to enable JSON-RPC handshake)"
    );
    return;
  }

  const child = spawn(process.execPath, [serverPath], {
    cwd: __dirname,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, OLLAMA_HOST: "http://127.0.0.1:1" }, // unreachable on purpose: list_tools must not need Ollama
  });

  const stderrChunks = [];
  child.stderr.on("data", (b) => stderrChunks.push(b.toString("utf8")));

  let stdoutBuf = "";
  const pending = new Map();

  child.stdout.on("data", (chunk) => {
    stdoutBuf += chunk.toString("utf8");
    let idx;
    while ((idx = stdoutBuf.indexOf("\n")) !== -1) {
      const line = stdoutBuf.slice(0, idx).trim();
      stdoutBuf = stdoutBuf.slice(idx + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(`JSON-RPC error: ${JSON.stringify(msg.error)}`));
        else resolve(msg.result);
      }
    }
  });

  function rpc(method, params) {
    const id = pending.size + 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`timeout waiting for ${method}`));
        }
      }, 8000);
    });
  }

  let exitCode = null;
  child.on("exit", (code) => {
    exitCode = code;
  });

  try {
    await rpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "verify-ollama-mcp", version: "0.1.0" },
    });
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      }) + "\n"
    );
    const list = await rpc("tools/list", {});
    if (!list || !Array.isArray(list.tools)) fail("tools/list did not return a tools array");
    if (list.tools.length !== models.length) {
      fail(`tools/list returned ${list.tools.length} tools, expected ${models.length}`);
    }
    const expected = new Set(models.map((m) => toolNameFor(m.id)));
    for (const t of list.tools) {
      if (!expected.has(t.name)) fail(`unexpected tool ${t.name}`);
    }
    console.log(`verify-ollama-mcp: dynamic OK (${list.tools.length} tools registered)`);
  } catch (err) {
    fail(`dynamic check failed: ${err && err.message ? err.message : err}\nserver stderr:\n${stderrChunks.join("")}`);
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 50));
    if (exitCode === null) child.kill("SIGKILL");
  }
}

(async () => {
  const { models } = await staticChecks();
  console.log(`verify-ollama-mcp: static OK (${models.length} personas, tool names valid)`);
  await dynamicCheck(models);
})().catch((err) => fail(err && err.message ? err.message : String(err)));
