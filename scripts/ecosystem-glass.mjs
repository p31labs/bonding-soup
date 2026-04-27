#!/usr/bin/env node
/**
 * Glass box: live fetch each probe in p31-ecosystem.json, expand {{mesh.*}} from p31-constants.json.
 * Probes default to GET. Optional: skipIfEmpty — omit probe when expanded URL is empty or not http(s) (optional LAN URLs from p31-constants). method "POST", body, expectJsonKey as before.
 * Prints a table + writes /tmp/p31_glass_report.json (and optional --json stdout only).
 * Exit: 0 by default. P31_GLASS_STRICT=1 → exit 1 if any probe is "down" (not auth/warn).
 */
import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "p31-ecosystem.json");
const constantsPath = path.join(root, "p31-constants.json");
const reportPath = process.env.P31_GLASS_REPORT || "/tmp/p31_glass_report.json";
const strict = process.env.P31_GLASS_STRICT === "1";
const timeoutMs = parseInt(process.env.P31_GLASS_TIMEOUT_MS || "12000", 10);
const jsonOnly = process.argv.includes("--json");

function getNested(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function expandUrl(template, constants) {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const v = getNested(constants, key.trim());
    return v !== undefined && v !== null ? String(v) : "";
  });
}

function shiftState() {
  const logFile = path.join(homedir(), ".p31", "operator-shift.jsonl");
  if (!fs.existsSync(logFile)) {
    return { state: "unknown", last: null, logFile };
  }
  const lines = fs.readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean);
  let last = null;
  for (const line of lines) {
    try {
      last = JSON.parse(line);
    } catch {
      /* ignore */
    }
  }
  let state = "unknown";
  if (last) {
    if (last.action === "in") state = "in";
    else if (last.action === "out") state = "out";
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(lines[i]);
      if (e.action === "in" || e.action === "out") {
        state = e.action === "in" ? "in" : "out";
        break;
      }
    } catch {
      /* ignore */
    }
  }
  return { state, last, logFile };
}

async function probeOne(row) {
  const start = Date.now();
  let http = 0;
  let level = "down";
  let err = "";
  let bodySnippet = "";
  const method = String(row.method || "GET").toUpperCase();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    /** @type {RequestInit} */
    const init = {
      method,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { Accept: "application/json, text/html;q=0.9, */*;q=0.1" },
    };
    if (method === "POST") {
      init.headers["Content-Type"] = "application/json";
      init.body = row.body !== undefined ? row.body : "{}";
    }
    const r = await fetch(row.url, init);
    clearTimeout(t);
    http = r.status;
    const ct = r.headers.get("content-type") || "";
    if (r.ok) {
      if (row.expectJsonKey) {
        if (!ct.includes("application/json")) {
          level = "warn";
        } else {
          const txt = await r.text();
          bodySnippet = txt.slice(0, 240);
          try {
            const j = JSON.parse(txt);
            level =
              j && typeof j === "object" && Object.prototype.hasOwnProperty.call(j, row.expectJsonKey)
                ? "up"
                : "warn";
          } catch {
            level = "warn";
          }
        }
      } else {
        level = "up";
        if (ct.includes("application/json")) {
          const txt = await r.text();
          bodySnippet = txt.slice(0, 240);
        }
      }
    } else if (http === 401 || http === 403) {
      level = "auth";
      if (ct.includes("application/json")) {
        const txt = await r.text();
        bodySnippet = txt.slice(0, 240);
      }
    } else if (http >= 500) {
      level = "down";
    } else {
      level = "warn";
      if (ct.includes("application/json")) {
        const txt = await r.text();
        bodySnippet = txt.slice(0, 240);
      }
    }
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
    level = "down";
  }
  return {
    ...row,
    http,
    ms: Date.now() - start,
    level,
    err: err || undefined,
    bodySnippet: bodySnippet || undefined,
  };
}

async function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error("ecosystem-glass: missing", manifestPath);
    process.exit(1);
  }
  if (!fs.existsSync(constantsPath)) {
    console.error("ecosystem-glass: missing", constantsPath);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const constants = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
  const raw = manifest.glassProbes || [];
  /** @type {Array<{id: string, group: string, note?: string, url: string, method: string, body?: string, expectJsonKey?: string}>} */
  const probes = [];
  for (const p of raw) {
    const url = expandUrl(p.url, constants);
    if (p.skipIfEmpty) {
      if (!url || !/^https?:/i.test(String(url))) {
        continue;
      }
    }
    probes.push({
      id: p.id,
      group: p.group || "other",
      note: p.note,
      url,
      method: p.method || "GET",
      body: p.body,
      expectJsonKey: p.expectJsonKey,
    });
  }

  const bad = probes.filter((p) => !p.url || !p.url.startsWith("http"));
  if (bad.length) {
    console.error("ecosystem-glass: unresolved URL for:", bad.map((b) => b.id).join(", "));
    process.exit(1);
  }

  const results = [];
  for (const p of probes) {
    results.push(await probeOne(p));
  }

  const shift = shiftState();
  const summary = {
    up: results.filter((r) => r.level === "up").length,
    auth: results.filter((r) => r.level === "auth").length,
    warn: results.filter((r) => r.level === "warn").length,
    down: results.filter((r) => r.level === "down").length,
  };

  const report = {
    timestamp: new Date().toISOString(),
    schema: "p31.glassReport/1.0.0",
    summary,
    operatorShift: shift,
    probes: results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("\n\x1b[36m━━ P31 glass box\x1b[0m — live edge + pages (see also: p31ca npm run fleet:probe)\n");
    console.log(`Operator shift: \x1b[1m${shift.state}\x1b[0m  (log: ${shift.logFile})`);
    console.log(`Report file: ${reportPath}\n`);
    const w = (s, n) => String(s).slice(0, n).padEnd(n);
    console.log(`${w("LEVEL", 6)} ${w("HTTP", 5)} ${w("MS", 5)} ${w("GROUP", 14)} ${w("ID", 24)} URL`);
    for (const r of results) {
      const col =
        r.level === "up"
          ? "\x1b[32m"
          : r.level === "auth"
            ? "\x1b[33m"
            : r.level === "warn"
              ? "\x1b[35m"
              : "\x1b[31m";
      const line = `${col}${w(r.level.toUpperCase(), 6)}\x1b[0m ${w(r.http || "-", 5)} ${w(r.ms, 5)} ${w(r.group, 14)} ${w(r.id, 24)} ${r.url}`;
      console.log(line + (r.err ? ` \x1b[90m— ${r.err}\x1b[0m` : ""));
    }
    console.log(
      `\n\x1b[90mSummary: ${summary.up} up, ${summary.auth} auth (edge up, need Access/token), ${summary.warn} warn, ${summary.down} down\x1b[0m\n`
    );
  }

  const hardFailures = results.filter((r) => r.level === "down");
  if (strict && hardFailures.length) {
    console.error("ecosystem-glass: P31_GLASS_STRICT=1 and some probes are down");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("ecosystem-glass:", e);
  process.exit(strict ? 1 : 0);
});
