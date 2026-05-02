#!/usr/bin/env node
/**
 * Static verifier for the P31 terminal surfaces.
 *
 * Confirms the three components are wired correctly so the
 * "cut out the middleman" promise is structurally sound:
 *
 * 1. Server: scripts/p31-local-command-center.mjs serves /term + exposes
 *    /api/personas (GET) and /api/persona-chat (POST) and refuses to
 *    treat operator-confidential personas any differently from others
 *    on this local-only surface (no cloud lane present at all here).
 * 2. Web TUI: command-center-terminal.html exists, references P31 canon
 *    accent colors, has mode tabs (chat/cmd), declares mobile viewport.
 * 3. CLI: scripts/p31-terminal-cli.mjs parses, exposes --persona, --prompt,
 *    --list, --cmd, --help; declares the same SENSITIVE persona set.
 *
 * Skip: P31_SKIP_P31_TERMINAL=1, or any of the three files missing
 * (partial clone).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

if (process.env.P31_SKIP_P31_TERMINAL === "1") {
  console.log("verify-p31-terminal: skip — P31_SKIP_P31_TERMINAL=1");
  process.exit(0);
}

const SERVER = path.join(root, "scripts", "p31-local-command-center.mjs");
const WEB = path.join(root, "command-center-terminal.html");
const CLI = path.join(root, "scripts", "p31-terminal-cli.mjs");

for (const f of [SERVER, WEB, CLI]) {
  if (!fs.existsSync(f)) {
    console.log("verify-p31-terminal: skip — " + path.relative(root, f) + " missing");
    process.exit(0);
  }
}

let fail = 0;
function ok(m) { console.log("  [ OK ]", m); }
function bad(m) { console.log("  [FAIL]", m); fail++; }

// Server
try { execSync("node --check " + SERVER, { stdio: "pipe" }); ok("server parses"); }
catch (e) { bad("server parse error: " + e.message); }

const serverSrc = fs.readFileSync(SERVER, "utf8");
if (serverSrc.includes('"/term"') && serverSrc.includes("command-center-terminal.html")) ok("server: /term route serves command-center-terminal.html");
else bad("server: /term route missing or doesn't serve correct file");

if (serverSrc.includes("/api/personas") && serverSrc.includes("handlePersonasList")) ok("server: GET /api/personas wired");
else bad("server: /api/personas not wired");

if (serverSrc.includes("/api/persona-chat") && serverSrc.includes("handlePersonaChat")) ok("server: POST /api/persona-chat wired");
else bad("server: /api/persona-chat not wired");

if (serverSrc.includes("SENSITIVE_PERSONAS") && ["p31-counsel","p31-triage","p31-phos"].every(p => serverSrc.includes('"'+p+'"'))) {
  ok("server: SENSITIVE_PERSONAS set declared (counsel/triage/phos)");
} else {
  bad("server: SENSITIVE_PERSONAS set incomplete");
}

if (!serverSrc.match(/api\.anthropic\.com|api\.openai\.com/)) {
  ok("server: no cloud LLM endpoints (local-only surface, as designed)");
} else {
  bad("server: cloud LLM endpoint detected — this surface must be local-only");
}

// Web TUI
const webSrc = fs.readFileSync(WEB, "utf8");
if (/viewport.*width=device-width.*initial-scale=1/.test(webSrc)) ok("web: mobile viewport meta declared");
else bad("web: mobile viewport meta missing");

if (webSrc.includes("--p31-teal") && webSrc.includes("--p31-paper") && webSrc.includes("--p31-coral")) {
  ok("web: P31 canon tokens present (teal/paper/coral)");
} else {
  bad("web: P31 canon tokens missing");
}

if (webSrc.includes('data-mode="chat"') && webSrc.includes('data-mode="cmd"')) ok("web: chat/cmd mode tabs present");
else bad("web: mode tabs missing");

if (webSrc.includes("/api/personas") && webSrc.includes("/api/persona-chat")) {
  ok("web: client wires both backend endpoints");
} else {
  bad("web: client missing one of the backend endpoints");
}

if (webSrc.includes("p31-counsel") && webSrc.includes("p31-triage") && webSrc.includes("p31-phos")) {
  ok("web: SENSITIVE persona ids referenced (matches server)");
} else {
  bad("web: SENSITIVE persona ids missing");
}

// CLI
try { execSync("node --check " + CLI, { stdio: "pipe" }); ok("cli parses"); }
catch (e) { bad("cli parse error: " + e.message); }

const cliSrc = fs.readFileSync(CLI, "utf8");
const cliFlags = ["--persona", "--prompt", "--list", "--cmd", "--help"];
const missingFlags = cliFlags.filter(f => !cliSrc.includes('"' + f + '"'));
if (missingFlags.length === 0) ok("cli: flags " + cliFlags.join(" ") + " present");
else bad("cli: missing flags: " + missingFlags.join(", "));

if (cliSrc.includes("SENSITIVE") && ["p31-counsel","p31-triage","p31-phos"].every(p => cliSrc.includes('"'+p+'"'))) {
  ok("cli: SENSITIVE persona set matches server");
} else {
  bad("cli: SENSITIVE persona set missing/mismatched");
}

if (!cliSrc.match(/api\.anthropic\.com|api\.openai\.com/)) {
  ok("cli: no cloud LLM endpoints (local-only)");
} else {
  bad("cli: cloud LLM endpoint detected");
}

console.log("");
if (fail > 0) {
  console.error("verify-p31-terminal: FAIL (" + fail + " issue(s))");
  process.exit(1);
}
console.log("verify-p31-terminal: OK");
