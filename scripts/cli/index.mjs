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
      "  " + cyan("doctor") + "        run " + dim("scripts/p31-doctor.mjs") + " (pass-through args; try " + cyan("--fun") + " after green checks)",
      "  " +
        cyan("fun") +
        "           operator joy — " +
        dim("npm run fun") +
        " · " +
        cyan("--many N") +
        " · " +
        cyan("--bowl") +
        " · " +
        cyan("--roll") +
        " · " +
        dim("npm run fun:shower / fun:bowl") +
        "",
      "  " + cyan("connect") + "       CONNECTION spine — " + dim("npm run connection"),
      "  " + cyan("chat") + "          P31 terminal — chat with local personas + run whitelisted commands (alias: " + cyan("term") + ", " + cyan("terminal") + ")",
      "  " + cyan("triper") + "        MVP certification system — " + cyan("triper cert") + " · " + cyan("triper status") + " · " + cyan("triper exec") + " · " + cyan("triper <suite>"),
      "  " + cyan("verify") + "        " + dim("npm run verify"),
      "  " + cyan("launch") + "        market launch package — " + dim("npm run launch") + " · " + cyan("--dry-run") + " · " + cyan("--status") + " · " + cyan("--full") + dim(" (rainbows)"),
      "  " + cyan("facts") + "         " + dim("npm run verify:facts"),
      "  " + cyan("budgets") + "       mesh + glass SLOs (no network)",
      "  " + cyan("effective-bar") + "  which verify steps run/skip/degraded (partial clone matrix)",
      "  " + cyan("voice") + "         Tier B/C public copy guardrails — " + dim("npm run verify:public-voice"),
      "  " + cyan("delta-lang") + "    DELTA lexicon JSON + glossary (+ hub mirror when present) — " + dim("npm run verify:delta-language"),
      "  " +
        cyan("contracts") +
        "     contract registry — " +
        dim("npm run build:contract-registry") +
        " · " +
        cyan("--verify") +
        " · " +
        cyan("--print"),
      "  " + cyan("mirror-fixer") + " doc-library hub mirror — dry-run; pass " + dim("--apply") + " to stage git add",
      "  " + cyan("office-ready") + "  p31-office venv + doctor + zenodo script paths",
      "  " + cyan("ci") + "            " + dim("npm run p31:ci"),
      "  " + cyan("hub-diff") + "      p31ca " + dim("hub:diff") + " · needs " + dim("andromeda/"),
      "  " + cyan("command-center") + "  local operator UI (:3131)",
      "  " + cyan("cc") + "            alias for " + cyan("command-center"),
      "  " + cyan("cli") + "           interactive CLI dashboard — " + dim("p31 open cli"),
      "  " + cyan("open") + "         local demos / passport / lab / cc / desk — " + dim("p31 open -h"),
      "  " + cyan("bookmark") + "      save URL + pulse mesh chime (needs local command center :3131)",
      "  " +
        cyan("phos") +
        "          Phos child companion — " +
        cyan("phos sign") +
        " · " +
        cyan("phos probe") +
        " (" +
        dim("PHOS_HMAC_SECRET") +
        " · " +
        dim("PHOS_URL") +
        ")",
      "  " +
        cyan("remember") +
        "       remembrance mesh — " +
        cyan("remember status") +
        " · " +
        cyan("remember context") +
        " · " +
        cyan("remember vertex") +
        " (" +
        dim("OPERATOR_SECRET") +
        " · " +
        dim("SIMPLEX_API_URL") +
        ")",
      "  " +
        cyan("automation") +
        "   repo hygiene — " +
        cyan("automation autoclean") +
        " · " +
        cyan("automation autoclean apply") +
        " (" +
        dim("P31_AUTOCLEAN_BASE") +
        ")",
      "  " +
        cyan("github-org") +
        "  GitHub org map — " +
        cyan("check") +
        " · " +
        cyan("plan") +
        " · " +
        cyan("apply") +
        " · " +
        cyan("bootstrap") +
        " · valve (" +
        cyan("npm run github:org:valve") +
        ")",
      "  " + cyan("mesh") + "          " + dim("p31-mesh") + " CLI",
      "  " + cyan("agent-hub") + "     K₄ agent hubs — " + dim("keypair / dock / call / cross / topology / federation"),
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

  if (cmd === "fun") {
    const code = await runNodeScript("scripts/p31-fun.mjs", fwd);
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

  if (cmd === "chat" || cmd === "term" || cmd === "terminal") {
    const code = await runNodeScript("scripts/p31-terminal-cli.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "mesh") {
    const code = await runNodeScript("packages/p31-mesh/src/cli.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "agent-hub") {
    const code = await runNodeScript("scripts/cli/agent-hub.mjs", fwd);
    process.exit(code);
  }

  if (cmd === "verify") {
    const code = await runNpmScript("verify", fwd);
    process.exit(code);
  }

  if (cmd === "launch") {
    // p31 launch [--dry-run | --status | --full | --verbose]
    // Backed by scripts/p31-launch.mjs · docs/LAUNCH-PACKAGE-2026-05.md
    const args = fwd.filter((a) => a !== "--");
    if (args.includes("--status")) {
      const code = await runNpmScript("launch:status", args.filter((a) => a !== "--status"));
      process.exit(code);
    }
    const isFull = args.includes("--full");
    const isDry = args.includes("--dry-run") || args.includes("-n");
    const cleanArgs = args.filter((a) => a !== "--full" && a !== "--dry-run" && a !== "-n");
    if (isFull && isDry) {
      const code = await runNpmScript("launch:full:dry", cleanArgs);
      process.exit(code);
    }
    if (isFull) {
      const code = await runNpmScript("launch:full", cleanArgs);
      process.exit(code);
    }
    if (isDry) {
      const code = await runNpmScript("launch:dry", cleanArgs);
      process.exit(code);
    }
    const code = await runNpmScript("launch", args);
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

  if (cmd === "voice") {
    const code = await runNpmScript("verify:public-voice", fwd);
    process.exit(code);
  }

  if (cmd === "delta-lang") {
    const code = await runNpmScript("verify:delta-language", fwd);
    process.exit(code);
  }

  if (cmd === "contracts") {
    const args = fwd.filter((a) => a !== "--");
    if (args.includes("--verify")) {
      const code = await runNpmScript("verify:contract-registry", args.filter((a) => a !== "--verify"));
      process.exit(code);
    }
    if (args.includes("--print")) {
      const code = await runNodeScript("scripts/build-contract-registry.mjs", args);
      process.exit(code);
    }
    const code = await runNpmScript("build:contract-registry", args);
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

  if (cmd === "bookmark") {
    const { runBookmark } = await import("./bookmark.mjs");
    process.exit(runBookmark(fwd));
  }

  if (cmd === "phos") {
    const sub = fwd[0];
    const rest = fwd.slice(1);
    if (!sub || sub === "-h" || sub === "--help") {
      console.log(
        [
          bold("p31 phos") + " — sign JSON or probe live Worker",
          "",
          dim("Usage:"),
          "  " + cyan("npm run p31 -- phos sign") + "  [" + dim("body.json path forwarded to simplex-v7") + "]",
          "  " + cyan("npm run p31 -- phos probe") + " [" + dim("body.json") + "]",
          "",
          dim("Environment:"),
          "  " + cyan("PHOS_HMAC_SECRET") + "  required",
          "  " + cyan("PHOS_URL") + "        Worker base, default " + dim("https://api.phosphorus31.org"),
          "",
        ].join("\n")
      );
      process.exit(0);
    }
    if (sub === "sign") {
      const code = await runNpmScript("phos:sign", rest);
      process.exit(code);
    }
    if (sub === "probe") {
      const code = await runNodeScript("scripts/phos-probe.mjs", rest);
      process.exit(code);
    }
    console.error("p31 phos: unknown subcommand " + JSON.stringify(sub) + " (try phos --help)");
    process.exit(1);
  }

  if (cmd === "remember") {
    const sub = fwd[0];
    const rest = fwd.slice(1);
    if (!sub || sub === "-h" || sub === "--help") {
      console.log(
        [
          bold("p31 remember") + " — mesh remembrance (operator bearer)",
          "",
          dim("Usage:"),
          "  " + cyan("npm run p31 -- remember status"),
          "  " + cyan("npm run p31 -- remember context"),
          "  " + cyan("npm run p31 -- remember vertex") + " <uuid>",
          "",
          dim("Environment:"),
          "  " + cyan("OPERATOR_SECRET") + "   required",
          "  " + cyan("SIMPLEX_API_URL") + "  Worker base, default " + dim("https://api.phosphorus31.org"),
          "",
        ].join("\n")
      );
      process.exit(0);
    }
    if (sub === "status") {
      const code = await runNodeScript("scripts/remember-probe.mjs", ["status", ...rest]);
      process.exit(code);
    }
    if (sub === "context") {
      const code = await runNodeScript("scripts/remember-probe.mjs", ["context", ...rest]);
      process.exit(code);
    }
    if (sub === "vertex") {
      const code = await runNodeScript("scripts/remember-probe.mjs", ["vertex", ...rest]);
      process.exit(code);
    }
    console.error("p31 remember: unknown subcommand " + JSON.stringify(sub) + " (try remember --help)");
    process.exit(1);
  }

  if (cmd === "automation") {
    const sub = fwd[0];
    const rest = fwd.slice(1);
    if (!sub || sub === "-h" || sub === "--help") {
      console.log(
        [
          bold("p31 automation") + " — local repo hygiene (CI/CD: see docs/P31-AUTOMATION-PIPELINE.md)",
          "",
          dim("Usage:"),
          "  " + cyan("npm run p31 -- automation autoclean") + "        dry-run merged branches",
          "  " + cyan("npm run p31 -- automation autoclean apply") + "  delete merged locals",
          "",
          dim("Environment:"),
          "  " + cyan("P31_AUTOCLEAN_BASE") + "  base ref (default main)",
          "",
        ].join("\n")
      );
      process.exit(0);
    }
    if (sub === "autoclean") {
      const apply = rest[0] === "apply";
      const code = await runNodeScript("scripts/repo-autoclean.mjs", apply ? ["--apply"] : []);
      process.exit(code);
    }
    console.error("p31 automation: unknown subcommand " + JSON.stringify(sub) + " (try automation --help)");
    process.exit(1);
  }

  if (cmd === "github-org") {
    const sub = fwd[0];
    const rest = fwd.slice(1);
    if (!sub || sub === "-h" || sub === "--help") {
      console.log(
        [
          bold("p31 github-org") + " — align p31labs repos with bundle (strict check · dry-run · apply · valve)",
          "",
          dim("Usage:"),
          "  " + cyan("npm run p31 -- github-org check") + "   strict " + dim("repos-metadata.json") + " + REPOS.md (CI parity)",
          "  " + cyan("npm run p31 -- github-org plan") + "    check + clone .github + dry-run metadata/sync",
          "  " + cyan("npm run p31 -- github-org apply") + "   publish — " + cyan("--yes") + " + valve apply or " + cyan("P31_GITHUB_ORG_VALVE_BYPASS=1"),
          "  " + cyan("npm run p31 -- github-org bootstrap") + "  ensure " + dim(".p31-work/dotgithub-sync") + " clone",
          "  " + cyan("npm run github:org:auto") + "       cron-shaped plan only (" + dim("~/.p31/github-org-valve.json") + ")",
          "  " + cyan("npm run github:org:valve") + "      show | set closed|dry-run|apply",
          "",
          dim("See:") + " docs/github-org-bundle/README.md",
          "",
        ].join("\n")
      );
      process.exit(0);
    }
    if (sub === "check") {
      const code = await runNodeScript("scripts/github-org-run.mjs", ["check"]);
      process.exit(code);
    }
    if (sub === "plan") {
      const code = await runNodeScript("scripts/github-org-run.mjs", ["plan"]);
      process.exit(code);
    }
    if (sub === "apply") {
      const code = await runNodeScript("scripts/github-org-run.mjs", ["apply", ...rest]);
      process.exit(code);
    }
    if (sub === "bootstrap") {
      const code = await runNodeScript("scripts/github-org-bootstrap.mjs", rest);
      process.exit(code);
    }
    console.error("p31 github-org: unknown subcommand " + JSON.stringify(sub) + " (try github-org --help)");
    process.exit(1);
  }

  if (cmd === "triper") {
    const sub = fwd[0];
    const rest = fwd.slice(1);
    const SUITES = ["bonding", "cars", "personal", "hub", "mesh", "simplex", "email", "epcp", "geodesic"];
    if (!sub || sub === "-h" || sub === "--help") {
      console.log(
        [
          bold("p31 triper") + " — TRIPER MVP certification system (docs/P31-TRIPER-SYSTEM.md)",
          "",
          dim("Usage:"),
          "  " + cyan("npm run p31 -- triper cert") + "         structural cert (9 suites + combined gate + cert log)",
          "  " + cyan("npm run p31 -- triper status") + "       show latest cert status",
          "  " + cyan("npm run p31 -- triper status --json") + " machine-readable JSON",
          "  " + cyan("npm run p31 -- triper exec") + "         execution runner (actual test suites)",
          "  " + cyan("npm run p31 -- triper exec --soft") + "  non-blocking execution run",
          "  " + cyan("npm run p31 -- triper exec --skip-network") + "  skip network steps",
          "  " + cyan("npm run p31 -- triper full") + "         cert + exec (full certification)",
          "  " + cyan("npm run p31 -- triper <suite>") + "      single-suite structural check",
          "",
          dim("Suites:") + " " + SUITES.join(" · "),
          "",
          dim("Release gate:") + " " + dim("release:public") + " requires cert age <24h",
          "",
        ].join("\n")
      );
      process.exit(0);
    }
    if (sub === "cert") {
      const code = await runNpmScript("test:triper:cert", rest);
      process.exit(code);
    }
    if (sub === "status") {
      const code = await runNodeScript("scripts/triper-status.mjs", rest);
      process.exit(code);
    }
    if (sub === "exec") {
      const code = await runNodeScript("scripts/triper-exec.mjs", rest);
      process.exit(code);
    }
    if (sub === "full") {
      const code = await runNpmScript("triper:full", rest);
      process.exit(code);
    }
    if (SUITES.includes(sub)) {
      const code = await runNpmScript(`test:triper:${sub}`, rest);
      process.exit(code);
    }
    console.error("p31 triper: unknown subcommand " + JSON.stringify(sub) + " (try triper --help)");
    process.exit(1);
  }

  console.error("p31: unknown command " + JSON.stringify(cmd) + " (try --help)");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
