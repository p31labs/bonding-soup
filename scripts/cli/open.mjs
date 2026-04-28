/**
 * p31 open — open local P31 dev surfaces. Plain URL on stdout; narrative on stderr.
 * @see scripts/cli/index.mjs
 */
import process from "node:process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createConnection } from "node:net";
import fs from "node:fs";
import { bold, cyan, dim, yellow } from "./theme.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");

const LOCAL = Object.freeze({
  host: "127.0.0.1",
  port: { demo: 8080, cc: 3131 },
  waitMs: 20_000,
  pollMs: 100,
  socketTimeout: 500,
});

const buildDocIndexScript = path.join(root, "scripts", "build-doc-index.mjs");
const commandCenterScript = path.join(root, "scripts", "p31-local-command-center.mjs");
const docLibraryHtml = path.join(root, "docs", "doc-library", "index.html");
const docLibraryJson = path.join(root, "docs", "doc-library", "index.json");

/** @type {Record<string, { kind: "http" | "file"; href: string; desc: string; footnote?: string } | { alias: string }>} */
const TARGETS = {
  soup: {
    kind: "http",
    href: `http://${LOCAL.host}:${LOCAL.port.demo}/soup.html`,
    desc: "C.A.R.S. (soup.html); starts static :8080 if free",
    footnote: "WebSocket (optional): node spikes/mock-ws-server/server.js",
  },
  demo: { alias: "soup" },
  "doc-library": {
    kind: "file",
    href: docLibraryHtml,
    desc: "document library; builds index.json if missing",
  },
  docs: { alias: "doc-library" },
  passport: {
    kind: "file",
    href: path.join(root, "cognitive-passport", "index.html"),
    desc: "Cognitive Passport generator",
  },
  poets: {
    kind: "file",
    href: path.join(root, "poets-room.html"),
    desc: "Poets room lobby",
  },
  howto: {
    kind: "file",
    href: path.join(root, "p31-personal-howto.html"),
    desc: "interactive personal how-to",
  },
  "physics-learn": {
    kind: "file",
    href: path.join(root, "docs", "physics-learn", "index.html"),
    desc: "physics learn (local-only XP)",
  },
  cc: {
    kind: "http",
    href: `http://${LOCAL.host}:${LOCAL.port.cc}`,
    desc: "command center; starts :3131 if free",
  },
  "command-center": { alias: "cc" },
};

/**
 * @param {string} msg
 * @param {boolean} quiet
 */
function errDim(msg, quiet) {
  if (quiet) return;
  console.error(dim(msg));
}

/**
 * @param {string} href plain URL, no ANSI
 */
function writeUrlToStdout(href) {
  process.stdout.write(href + "\n");
}

/**
 * @param {string[]} argv
 * @returns {{ name?: string; printOnly: boolean; noServe: boolean; noBuild: boolean; quiet: boolean }}
 */
function parseOpenArgv(argv) {
  const positionals = [];
  let printOnly = false;
  let noServe = false;
  let noBuild = false;
  let quiet = false;
  for (const a of argv) {
    if (a === "--print-only") printOnly = true;
    else if (a === "--no-serve") noServe = true;
    else if (a === "--no-build") noBuild = true;
    else if (a === "-q" || a === "--quiet") quiet = true;
    else if (a === "-h" || a === "--help") positionals.push(a);
    else if (!a.startsWith("-")) positionals.push(a);
  }
  return {
    name: positionals[0],
    printOnly,
    noServe: noServe || process.env.P31_OPEN_NO_START === "1" || process.env.P31_OPEN_NO_START === "true",
    noBuild: noBuild || process.env.P31_OPEN_NO_BUILD === "1" || process.env.P31_OPEN_NO_BUILD === "true",
    quiet: quiet || process.env.P31_OPEN_QUIET === "1" || process.env.P31_OPEN_QUIET === "true",
  };
}

function resolveTarget(name) {
  const key = (name || "").toLowerCase().trim();
  if (!key) return null;
  let t = TARGETS[key];
  while (t && "alias" in t) {
    t = TARGETS[t.alias];
  }
  return t && "kind" in t ? t : null;
}

function listTargets() {
  return Object.keys(TARGETS)
    .filter((k) => "kind" in (TARGETS[k] || {}))
    .sort();
}

/**
 * @param {number} p
 * @param {string} host
 * @returns {Promise<boolean>}
 */
function portIsOpen(p, host = LOCAL.host) {
  return new Promise((resolve) => {
    const c = createConnection({ port: p, host, timeout: LOCAL.socketTimeout }, () => {
      c.end();
      resolve(true);
    });
    c.on("error", () => resolve(false));
  });
}

/**
 * @param {number} p
 * @param {string} host
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
function waitForPort(p, host = LOCAL.host, timeoutMs = LOCAL.waitMs) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tryConnect = () => {
      const c = createConnection({ port: p, host, timeout: 400 }, () => {
        c.end();
        resolve();
      });
      c.on("error", () => {
        if (Date.now() - t0 > timeoutMs) {
          reject(new Error(`${host}:${p} not ready in ${Math.round(timeoutMs / 1000)}s`));
        } else {
          setTimeout(tryConnect, LOCAL.pollMs);
        }
      });
    };
    tryConnect();
  });
}

/**
 * @returns {{ cmd: string; args: string[] } | null}
 */
function findPythonForHttpServer() {
  const withPort = String(LOCAL.port.demo);
  const rows = [
    { cmd: "python3", args: ["-m", "http.server", withPort] },
    { cmd: "python", args: ["-m", "http.server", withPort] },
  ];
  if (process.platform === "win32") {
    rows.push({ cmd: "py", args: ["-3", "-m", "http.server", withPort] });
  }
  for (const { cmd, args } of rows) {
    const r = spawnSync(cmd, ["-c", "import sys; sys.exit(0)"], { stdio: "ignore" });
    if (r.error || (r.status != null && r.status !== 0)) continue;
    return { cmd, args };
  }
  return null;
}

function isDocTarget(name) {
  const k = (name || "").toLowerCase();
  return k === "doc-library" || k === "docs";
}

function isSoupTarget(name) {
  const k = (name || "").toLowerCase();
  return k === "soup" || k === "demo";
}

function isCcTarget(name) {
  const k = (name || "").toLowerCase();
  return k === "cc" || k === "command-center";
}

function runBuildDocIndexInherit() {
  const r = spawnSync(process.execPath, [buildDocIndexScript], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  return r.status === 0 || r.status == null;
}

/**
 * @param {string} href
 * @param {boolean} quiet
 * @returns {Promise<void>}
 */
function openInSystemBrowser(href, quiet) {
  const opener = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const openArgs = process.platform === "win32" ? ["/c", "start", "", href] : [href];
  return new Promise((resolve) => {
    const child = spawn(opener, openArgs, {
      stdio: "ignore",
      detached: true,
      shell: process.platform === "win32",
    });
    child.on("error", (e) => {
      console.error(yellow("p31 open: ") + (opener + " — " + (e && e.message)));
      errDim("Use the URL on stdout, or open it manually.", quiet);
      resolve();
    });
    child.on("exit", (code) => {
      if (code !== 0 && code != null) {
        errDim("opener exit " + code + " — URL is on stdout", quiet);
      }
      resolve();
    });
    child.unref();
  });
}

/**
 * @param {string[]} argv after `open`
 */
export async function runOpen(argv) {
  const { name, printOnly, noServe, noBuild, quiet } = parseOpenArgv(argv);
  if (!name || name === "-h" || name === "--help") {
    const keys = listTargets();
    const col = Math.min(20, Math.max(12, ...keys.map((k) => k.length) + 2));
    const lines = keys.map((k) => {
      const t = TARGETS[k];
      const desc = t && "desc" in t ? t.desc : "";
      return "  " + k.padEnd(col) + (desc ? dim(desc) : "");
    });
    process.stdout.write(
      [
        bold("p31 open") + " — open a local P31 page (URL on " + dim("stdout") + ", log on " + dim("stderr") + ")",
        "",
        dim("Usage: ") + cyan("npx p31 open") + " <" + dim("target") + "> " + dim("[flags]"),
        "       " + cyan("npm run p31:open --") + " <" + dim("target") + "> " + dim("[…]") + "   " + dim("(same)"),
        "",
        dim("Flags: ") +
          cyan("--print-only") +
          "  " +
          dim("URL to stdout, no browser") +
          "   " +
          cyan("--no-serve") +
          "  " +
          dim("do not start :8080 / :3131") +
          "   " +
          cyan("--no-build") +
          "  " +
          dim("do not run doc index build") +
          "   " +
          cyan("-q") +
          "  " +
          dim("less stderr") +
          "   " +
          dim("P31_OPEN_NO_START / P31_OPEN_NO_BUILD"),
        "",
        dim(
          "When ports are free, " +
            cyan("soup") +
            " / " +
            cyan("cc") +
            " start the same servers as " +
            dim("npm run demo") +
            " and " +
            dim("command-center") +
            "."
        ),
        "",
        ...lines,
        "",
        dim("Examples: ") +
          cyan("npx p31 open doc-library") +
          "   " +
          cyan("npx p31 open soup -q") +
          "   " +
          cyan("npx p31 open cc --print-only"),
        "",
      ].join("\n")
    );
    return 0;
  }

  const spec = resolveTarget(name);
  if (!spec) {
    console.error(yellow("p31 open: ") + "unknown target " + JSON.stringify(name));
    console.error(dim("  one of: " + listTargets().join(", ")));
    return 1;
  }

  if (isDocTarget(name) && !noBuild && fs.existsSync(docLibraryHtml) && !fs.existsSync(docLibraryJson)) {
    errDim("doc index: running build:doc-index…", quiet);
    if (!runBuildDocIndexInherit()) {
      console.error(yellow("p31 open: ") + "build:doc-index failed");
      return 1;
    }
  }

  if (isDocTarget(name) && !fs.existsSync(docLibraryHtml)) {
    console.error(yellow("p31 open: ") + "doc library UI missing (restore from git): " + docLibraryHtml);
    return 1;
  }

  if (spec.kind === "file" && !fs.existsSync(spec.href)) {
    console.error(yellow("p31 open: ") + "missing: " + spec.href);
    if (isDocTarget(name) && !noBuild) {
      errDim("  hint: npm run build:doc-index", quiet);
    }
    return 1;
  }

  if (spec.kind === "http" && !printOnly && !noServe) {
    if (isSoupTarget(name)) {
      if (!(await portIsOpen(LOCAL.port.demo))) {
        const py = findPythonForHttpServer();
        if (!py) {
          console.error(
            yellow("p31 open: ") + "no python on PATH (python3 / python" + (process.platform === "win32" ? " / py -3" : "") + ")"
          );
          console.error(dim("  or run: npm run demo  ·  " + "P31_OPEN_NO_START=1  npx p31 open soup --print-only"));
          return 1;
        }
        errDim("demo server → " + LOCAL.host + ":" + LOCAL.port.demo + " (" + py.cmd + " -m http.server)…", quiet);
        const child = spawn(py.cmd, py.args, {
          cwd: root,
          detached: true,
          stdio: "ignore",
          env: process.env,
        });
        child.on("error", (e) => {
          console.error(yellow("p31 open: ") + (e && e.message));
        });
        child.unref();
        try {
          await waitForPort(LOCAL.port.demo);
        } catch (e) {
          console.error(yellow("p31 open: ") + ((e && e.message) || String(e)));
          errDim("  start manually: npm run demo", quiet);
          return 1;
        }
      }
    } else if (isCcTarget(name)) {
      if (!(await portIsOpen(LOCAL.port.cc))) {
        errDim("command center → " + LOCAL.host + ":" + LOCAL.port.cc + "…", quiet);
        const child = spawn(process.execPath, [commandCenterScript], {
          cwd: root,
          detached: true,
          stdio: "ignore",
          env: process.env,
        });
        child.on("error", (e) => {
          console.error(yellow("p31 open: ") + (e && e.message));
        });
        child.unref();
        try {
          await waitForPort(LOCAL.port.cc);
        } catch (e) {
          console.error(yellow("p31 open: ") + ((e && e.message) || String(e)));
          errDim("  start manually: npm run command-center", quiet);
          return 1;
        }
      }
    }
  }

  if (spec.kind === "http" && !printOnly) {
    if (isSoupTarget(name) && noServe) {
      if (!(await portIsOpen(LOCAL.port.demo))) {
        console.error(
          yellow("p31 open: ") + ":8080 is closed — drop " + cyan("--no-serve") + " to auto-start, or run " + dim("npm run demo")
        );
        return 1;
      }
    }
    if (isCcTarget(name) && noServe) {
      if (!(await portIsOpen(LOCAL.port.cc))) {
        console.error(
          yellow("p31 open: ") + ":3131 is closed — drop " + cyan("--no-serve") + " to auto-start, or run " + dim("npm run command-center")
        );
        return 1;
      }
    }
  }

  const href = spec.kind === "file" ? pathToFileURL(path.resolve(spec.href)).href : spec.href;

  if (spec.footnote && isSoupTarget(name) && !quiet) {
    errDim(spec.footnote, false);
  }

  writeUrlToStdout(href);

  if (printOnly) {
    return 0;
  }

  await openInSystemBrowser(href, quiet);
  return 0;
}
