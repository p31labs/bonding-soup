#!/usr/bin/env node
/**
 * P31 home repo — static HTTP on 127.0.0.1 (Node only; no Python).
 * Same document root and port convention as scripts/demo-server.mjs:
 *   P31_DEMO_PORT (default 8080)
 *
 *   npm run server
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

if (!fs.existsSync(path.join(root, "soup.html"))) {
  console.error("server: expected soup.html at repo root:\n  " + root);
  process.exit(1);
}

const raw = String(process.env.P31_DEMO_PORT ?? "8080").trim();
const portN = Number.parseInt(raw, 10);
if (!Number.isFinite(portN) || portN < 1 || portN > 65535) {
  console.error(
    "server: P31_DEMO_PORT must be 1–65535 (got " + JSON.stringify(process.env.P31_DEMO_PORT) + ")"
  );
  process.exit(1);
}

/** @param {string} filePath */
function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".cjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".wasm": "application/wasm",
    ".webmanifest": "application/manifest+json",
    ".xml": "application/xml",
    ".map": "application/json",
  };
  return map[ext] || "application/octet-stream";
}

/**
 * Resolve URL path to a single file under `root`, or null.
 * @param {string} reqUrl
 */
function resolveFile(reqUrl) {
  let pathname;
  try {
    pathname = new URL(reqUrl, "http://127.0.0.1").pathname;
  } catch {
    return null;
  }
  if (pathname === "/" || pathname === "") {
    const soup = path.join(root, "soup.html");
    if (fs.existsSync(soup)) return soup;
    const idx = path.join(root, "index.html");
    return fs.existsSync(idx) ? idx : null;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("..")) return null;
  const rel = decoded.replace(/^\/+/, "");
  const full = path.resolve(path.join(root, rel));
  const rootResolved = path.resolve(root);
  if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) return null;
  let st;
  try {
    st = fs.statSync(full);
  } catch {
    return null;
  }
  if (st.isDirectory()) {
    const idx = path.join(full, "index.html");
    return fs.existsSync(idx) ? idx : null;
  }
  return full;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end();
    return;
  }
  const fp = resolveFile(req.url || "/");
  if (!fp) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  let buf;
  try {
    buf = fs.readFileSync(fp);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Read error");
    return;
  }
  res.writeHead(200, {
    "Content-Type": contentType(fp),
    "Content-Length": buf.length,
    "Cache-Control": "no-store",
  });
  if (req.method === "HEAD") res.end();
  else res.end(buf);
});

server.listen(portN, "127.0.0.1", () => {
  const base = "http://127.0.0.1:" + portN;
  console.log("");
  console.log("P31 static server  —  Node http, repo root");
  console.log("  " + root);
  console.log("  " + base + "/soup.html");
  if (portN === 8080) {
    console.log("  Port 8080 busy?  P31_DEMO_PORT=8090 npm run server");
  } else {
    console.log("  (P31_DEMO_PORT=" + portN + ")");
  }
  console.log("");
});

server.on("error", (err) => {
  console.error("server:", err.message);
  process.exit(1);
});
