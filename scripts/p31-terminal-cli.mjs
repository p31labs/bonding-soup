#!/usr/bin/env node
/**
 * P31 native terminal CLI — talks to the local command-center server
 * (http://127.0.0.1:3131 by default). Same backend as /term web TUI.
 *
 * Usage:
 *   node scripts/p31-terminal-cli.mjs              # interactive chat REPL
 *   node scripts/p31-terminal-cli.mjs --persona p31-quick
 *   node scripts/p31-terminal-cli.mjs --persona p31-mechanic --prompt "..."
 *   node scripts/p31-terminal-cli.mjs --list
 *   node scripts/p31-terminal-cli.mjs --cmd doctor       # run whitelisted action
 *
 * No deps. ANSI colors mirror P31 canon (teal accent, butter for warnings,
 * coral for errors, lavender for user voice).
 *
 * Wire as `npm run terminal:cli` and `p31 chat`.
 */
import readline from "node:readline";
import process from "node:process";

const BASE = process.env.P31_CMD_CENTER_URL || "http://127.0.0.1:3131";
const SENSITIVE = new Set(["p31-counsel","p31-triage","p31-phos"]);

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  teal: "\x1b[38;2;37;137;125m",
  paper: "\x1b[38;2;244;244;245m",
  cloud: "\x1b[38;2;148;163;184m",
  butter: "\x1b[38;2;221;181;103m",
  coral: "\x1b[38;2;217;95;95m",
  lavender: "\x1b[38;2;156;124;217m",
  phos: "\x1b[38;2;110;231;183m",
};

function paint(c, s) { return c + s + C.reset; }
function err(s) { console.error(paint(C.coral, s)); }
function info(s) { console.log(paint(C.cloud, s)); }

async function api(path, init) {
  try {
    const r = await fetch(BASE + path, init);
    if (!r.ok) return { __error: r.status + " " + r.statusText };
    return await r.json();
  } catch (e) {
    return { __error: e.message };
  }
}

async function listPersonas() {
  const j = await api("/api/personas");
  if (j.__error) { err("server unreachable: " + j.__error); err("start it: npm run command-center"); process.exit(2); }
  return j;
}

async function persona(personaId, prompt) {
  const j = await api("/api/persona-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona: personaId, prompt }),
  });
  return j;
}

function printResponse(j, personaId) {
  if (j.__error) { err("network: " + j.__error); return; }
  if (!j.ok) { err(personaId + " error: " + j.error); return; }
  const meta = personaId + " · " + j.seconds + "s" + (j.tokPerSec ? " · " + j.tokPerSec + " tok/s" : "");
  const sensitive = SENSITIVE.has(personaId);
  const tag = paint(C.teal + C.bold, "▌ " + personaId + " ") + (sensitive ? paint(C.butter, "🛡 LOCAL ONLY ") : "");
  console.log("\n" + tag);
  console.log(paint(C.paper, j.response || "(empty)"));
  console.log(paint(C.dim + C.cloud, "  " + meta) + "\n");
}

async function runAction(actionKey) {
  const j = await api("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: actionKey }),
  });
  if (j.__error) { err("server: " + j.__error); return; }
  if (j.stdout) console.log(j.stdout);
  if (j.stderr) console.error(paint(C.dim, j.stderr));
  console.log(paint(j.code === 0 ? C.phos : C.coral, "exit " + j.code));
}

async function repl(initialPersona) {
  const personasResp = await listPersonas();
  const materialized = personasResp.personas.filter(p => p.materialized);
  if (materialized.length === 0) {
    err("no personas materialized.");
    info("setup: ollama pull qwen2.5-coder:7b qwen3:8b phi4-mini:latest && npm run ollama:setup");
    info("ram:   " + personasResp.memAvailMiB + " MiB available — fleet needs ≥970 MiB for smallest persona");
    process.exit(2);
  }
  let current = initialPersona || materialized[0].id;
  if (!materialized.find(p => p.id === current)) {
    err("persona '" + current + "' not materialized. available: " + materialized.map(p => p.id).join(", "));
    process.exit(2);
  }

  console.log(paint(C.teal + C.bold, "\nP31 ▲ terminal"));
  info("server: " + BASE + "  ·  " + materialized.length + "/10 personas  ·  " + personasResp.memAvailMiB + " MiB free");
  info("commands: /persona <id>  /list  /cmd <key>  /quit  ·  blank line submits multi-line buffer");
  if (SENSITIVE.has(current)) info(paint(C.butter, "🛡 " + current + " is operator-confidential — local only."));
  console.log("");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "" });
  let buffer = [];

  function setPrompt() {
    rl.setPrompt(paint(C.lavender, "[" + current + "] ▶ "));
    rl.prompt();
  }
  setPrompt();

  rl.on("line", async (raw) => {
    const line = raw;
    if (line.startsWith("/")) {
      const [cmd, ...rest] = line.slice(1).split(/\s+/);
      const arg = rest.join(" ");
      if (cmd === "quit" || cmd === "q" || cmd === "exit") { rl.close(); return; }
      if (cmd === "list") {
        for (const p of personasResp.personas) {
          const tag = p.materialized ? paint(C.phos,"●") : paint(C.dim+C.cloud,"○");
          const sensitive = p.sensitive ? paint(C.butter," 🛡") : "";
          console.log("  " + tag + " " + p.id + sensitive);
        }
        setPrompt(); return;
      }
      if (cmd === "persona") {
        if (!arg) { err("/persona <id>"); setPrompt(); return; }
        const p = personasResp.personas.find(x => x.id === arg);
        if (!p) { err("unknown: " + arg); setPrompt(); return; }
        if (!p.materialized) { err(arg + " not materialized — run npm run ollama:setup"); setPrompt(); return; }
        current = arg;
        if (SENSITIVE.has(current)) info(paint(C.butter,"🛡 " + current + " is operator-confidential — local only."));
        setPrompt(); return;
      }
      if (cmd === "cmd") {
        if (!arg) { err("/cmd <action-key>  (e.g. doctor, verify, fleet:probe)"); setPrompt(); return; }
        await runAction(arg);
        setPrompt(); return;
      }
      err("unknown: /" + cmd + "  (try /list /persona /cmd /quit)");
      setPrompt(); return;
    }
    if (line === "" && buffer.length > 0) {
      const prompt = buffer.join("\n").trim();
      buffer = [];
      if (!prompt) { setPrompt(); return; }
      const j = await persona(current, prompt);
      printResponse(j, current);
      setPrompt();
      return;
    }
    if (line === "") { setPrompt(); return; }
    buffer.push(line);
    rl.setPrompt(paint(C.dim + C.lavender, "         · "));
    rl.prompt();
  });

  rl.on("close", () => { console.log(paint(C.cloud, "\n[goodbye]")); process.exit(0); });
}

async function main() {
  const args = process.argv.slice(2);
  let personaId = null, prompt = null, list = false, cmdKey = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--persona") personaId = args[++i];
    else if (a === "--prompt") prompt = args[++i];
    else if (a === "--list" || a === "-l") list = true;
    else if (a === "--cmd") cmdKey = args[++i];
    else if (a === "--help" || a === "-h") {
      console.log("usage: p31-terminal-cli.mjs [--persona <id>] [--prompt <text>] [--list] [--cmd <action>]");
      console.log("       (no args: interactive REPL)");
      process.exit(0);
    }
  }
  if (list) {
    const j = await listPersonas();
    for (const p of j.personas) console.log((p.materialized ? "●" : "○") + " " + p.id + (p.sensitive ? " 🛡" : ""));
    info(j.memAvailMiB + " MiB free · " + j.personas.filter(p=>p.materialized).length + "/10 materialized");
    return;
  }
  if (cmdKey) { await runAction(cmdKey); return; }
  if (personaId && prompt) {
    const j = await persona(personaId, prompt);
    printResponse(j, personaId);
    return;
  }
  await repl(personaId);
}

main().catch(e => { err("fatal: " + e.message); process.exit(1); });
