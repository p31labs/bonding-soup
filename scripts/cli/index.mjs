#!/usr/bin/env node
/**
 * P31 home CLI — boot, help, delegates (doctor, …).
 *
 *   npm run p31 -- --help
 *   P31_CLI_MINIMAL=1 npm run p31 -- boot
 *
 * @see scripts/cli/tty.mjs — TTY / CI / minimal matrix
 */
import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { runBoot } from "./boot.mjs";
import { runOpen } from "./open.mjs";
import { bold, cyan, dim } from "./theme.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const VERSION = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;

function printHelp() {
  console.log(
    [
      bold("P31 CLI") + " — home workspace control plane",
      "",
      dim("Usage:"),
      "  " + cyan("npm run p31 --") + " [" + dim("command") + "] [" + dim("args...") + "]",
      "",
      dim("Commands:"),
      "  " + cyan("boot") + "          staged boot (full art when TTY; else one line)",
      "  " + cyan("doctor") + "        run " + dim("scripts/p31-doctor.mjs") + " (pass-through args)",
      "  " + cyan("connect") + "       CONNECTION spine — " + dim("npm run connection") + " (deploy · ecosystem · env · ops)",
      "  " + cyan("verify") + "        " + dim("npm run verify") + " (pass-through after --)",
      "  " + cyan("facts") + "         " + dim("npm run verify:facts") + " (p31-facts.json invariants)",
      "  " + cyan("budgets") + "       " + dim("mesh + glass latency SLOs (p31-facts; no network)"),
      "  " + cyan("ci") + "            " + dim("npm run p31:ci") + " (release-style verify + hub when present)",
      "  " + cyan("command-center") + "  start local UI " + dim("(npm run command-center)"),
      "  " + cyan("cc") + "            alias for " + cyan("command-center"),
      "  " + cyan("open") + "         " + dim("open local dev pages; auto-starts :8080/:3131 & doc index — ") + dim("p31 open -h") + " " + dim("for details"),
      "  " + cyan("mesh") + "          " + dim("p31-mesh") + " CLI " + dim("(probe, fleet, agent, chat)"),
      "",
      dim("Flags:"),
      "  " + cyan("-h, --help") + "     this text",
      "  " + cyan("-V, --version") + "  print version",
      "",
      dim("Environment:"),
      "  " + cyan("P31_CLI_MINIMAL=1") + "  skip staged boot / banner",
      "  " + cyan("CI=true") + "           same as minimal for boot",
      "  " + cyan("NO_COLOR") + "          disable ANSI",
      "",
    ].join("\n")
  );
}

/**
 * @param {string} scriptRel relpath from repo root e.g. scripts/foo.mjs
 * @param {string[]} fwd
 * @returns {Promise<number>} exit code
 */
function runNodeScript(scriptRel, fwd) {
  const scriptPath = path.join(root, scriptRel);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...fwd], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

/**
 * @param {string} npmScript name in package.json `scripts`
 * @param {string[]} fwd passed after `--`
 * @returns {Promise<number>}
 */
function runNpmScript(npmScript, fwd) {
  const isWin = process.platform === "win32";
  const npmCmd = isWin ? "npm.cmd" : "npm";
  const args = ["run", npmScript, "--", ...fwd];
  return new Promise((resolve) => {
    const child = spawn(npmCmd, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
      shell: isWin,
    });
    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }
  if (argv.includes("--version") || argv.includes("-V")) {
    console.log("p31-cli " + VERSION);
    process.exit(0);
  }

  const cmd = argv[0];

  if (!cmd) {
    printHelp();
    process.exit(0);
  }

  if (cmd === "boot") {
    await runBoot();
    process.exit(0);
  }

  if (cmd === "doctor") {
    const code = await runNodeScript("scripts/p31-doctor.mjs", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "connect") {
    const code = await runNodeScript("scripts/p31-connection.mjs", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "command-center" || cmd === "cc") {
    const code = await runNodeScript("scripts/p31-local-command-center.mjs", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "mesh") {
    const code = await runNodeScript("packages/p31-mesh/src/cli.mjs", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "verify") {
    const code = await runNpmScript("verify", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "facts") {
    const code = await runNpmScript("verify:facts", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "budgets") {
    const code = await runNodeScript("scripts/print-mesh-budgets.mjs", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "ci") {
    const code = await runNpmScript("p31:ci", argv.slice(1));
    process.exit(code);
  }

  if (cmd === "open") {
    const code = await runOpen(argv.slice(1));
    process.exit(code);
  }

  console.error("p31: unknown command " + JSON.stringify(cmd) + " (try --help)");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
