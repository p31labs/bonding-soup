#!/usr/bin/env node
/**
 * P31 home CLI — splash, boot, help, delegates.
 *
 *   npm run p31 -- --help
 *   P31_CLI_MINIMAL=1 npm run p31 -- boot
 *   P31_CLI_PLAIN=1     — no splash on empty / -h (same as --plain)
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
import { printSplash } from "./splash.mjs";
import { bold, cyan, dim } from "./theme.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const VERSION = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;

/** Strip global-only flags before dispatch (does not remove subcommand `--` args). */
function stripGlobals(argv) {
  const plain =
    argv.includes("--plain") ||
    argv.includes("--no-art") ||
    process.env.P31_CLI_PLAIN === "1";
  const rest = argv.filter((a) => a !== "--plain" && a !== "--no-art");
  return { argv: rest, plain };
}

function printHelp() {
  console.log(
    [
      bold("P31 CLI") + " — home workspace control plane",
      "",
      dim("Usage:"),
      "  " + cyan("npm run p31 --") + " [" + dim("command") + "] [" + dim("args...") + "]",
      "  " + cyan("global:") + " " + dim("npm link") + " in this repo → " + cyan("p31") + " on your " + dim("PATH"),
      "",
      dim("Commands:"),
      "  " +
        cyan("art") +
        ", " +
        cyan("banner") +
        "   splash only (" +
        dim("ignores P31_CLI_MINIMAL") +
        "; hidden when " +
        dim("CI=true") +
        ")",
      "  " + cyan("boot") + "          staged boot (banner + INIT/MESH/READY when TTY)",
      "  " + cyan("doctor") + "        run " + dim("scripts/p31-doctor.mjs") + " (pass-through args)",
      "  " + cyan("connect") + "       CONNECTION spine — " + dim("npm run connection"),
      "  " + cyan("verify") + "        " + dim("npm run verify"),
      "  " + cyan("facts") + "         " + dim("npm run verify:facts"),
      "  " + cyan("budgets") + "       mesh + glass SLOs (no network)",
      "  " + cyan("effective-bar") + "  which verify steps run/skip/degraded (partial clone matrix)",
      "  " + cyan("mirror-fixer") + " doc-library hub mirror — dry-run; pass " + dim("--apply") + " to stage git add",
      "  " + cyan("office-ready") + "  p31-office venv + doctor + zenodo script paths",
      "  " + cyan("ci") + "            " + dim("npm run p31:ci"),
      "  " + cyan("hub-diff") + "      p31ca " + dim("hub:diff") + " · needs " + dim("andromeda/"),
      "  " + cyan("command-center") + "  local operator UI (:3131)",
      "  " + cyan("cc") + "            alias for " + cyan("command-center"),
      "  " + cyan("open") + "         local demos / passport / lab / slicer — " + dim("p31 open -h"),
      "  " + cyan("mesh") + "          " + dim("p31-mesh") + " CLI",
      "",
      dim("Flags:"),
      "  " + cyan("-h, --help") + "     help " + dim("(only as first argument; subcommands keep their own -h)"),
      "  " + cyan("-V, --version") + "  version " + dim("(first argument)"),
      "  " + cyan("--plain") + ", " + cyan("--no-art") + "  no splash on empty / " + cyan("-h"),
      "",
      dim("Environment:"),
      "  " + cyan("P31_CLI_MINIMAL=1") + "  skip splash / staged boot art",
      "  " + cyan("P31_CLI_PLAIN=1") + "    same as " + cyan("--plain"),
      "  " + cyan("CI=true") + "           minimal boot/splash",
      "  " + cyan("NO_COLOR") + "          no ANSI",
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
  let argv = process.argv.slice(2);
  const { argv: stripped, plain } = stripGlobals(argv);
  argv = stripped;
  if (plain) process.env.P31_CLI_PLAIN = "1";

  const first = argv[0];

  if (first === "-h" || first === "--help") {
    await printSplash();
    printHelp();
    process.exit(0);
  }

  if (first === "-V" || first === "--version") {
    console.log("p31-cli " + VERSION);
    process.exit(0);
  }

  if (first == null) {
    await printSplash();
    printHelp();
    process.exit(0);
  }

  const cmd = first;
  const fwd = argv.slice(1);

  if (cmd === "art" || cmd === "banner") {
    await printSplash(process.stdout, { force: true });
    process.exit(0);
  }

  if (cmd === "boot") {
    await runBoot();
    process.exit(0);
  }

  if (cmd === "doctor") {
    const code = await runNodeScript("scripts/p31-doctor.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "connect") {
    const code = await runNodeScript("scripts/p31-connection.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "command-center" || cmd === "cc") {
    const code = await runNodeScript("scripts/p31-local-command-center.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "mesh") {
    const code = await runNodeScript("packages/p31-mesh/src/cli.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "verify") {
    const code = await runNpmScript("verify", fwd);
    process.exit(code);
  }

  if (cmd === "facts") {
    const code = await runNpmScript("verify:facts", fwd);
    process.exit(code);
  }

  if (cmd === "budgets") {
    const code = await runNodeScript("scripts/print-mesh-budgets.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "effective-bar") {
    const code = await runNodeScript("scripts/p31-effective-bar.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "mirror-fixer") {
    const code = await runNodeScript("scripts/p31-mirror-fixer.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "office-ready") {
    const code = await runNodeScript("scripts/office-ready.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "ci") {
    const code = await runNpmScript("p31:ci", fwd);
    process.exit(code);
  }

  if (cmd === "hub-diff") {
    const code = await runNpmScript("hub:diff:p31ca", fwd);
    process.exit(code);
  }

  if (cmd === "open") {
    const code = await runOpen(fwd);
    process.exit(code);
  }

  console.error("p31: unknown command " + JSON.stringify(cmd) + " (try --help)");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
