#!/usr/bin/env node
/**
 * p31 bookmark — append URL + timestamp; writes pulse consumed by local command center GET /api/mesh-pulse.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function runBookmark(argv) {
  const url = String(argv[0] || "").trim();
  if (!url || url === "-h" || url === "--help") {
    console.log("Usage: p31 bookmark <url>");
    console.log("Appends to ~/.p31/bookmarks.jsonl; pulse → http://127.0.0.1:3131/api/mesh-pulse (command center).");
    return 0;
  }
  let u;
  try {
    u = new URL(url);
  } catch {
    console.error("p31 bookmark: invalid URL");
    return 1;
  }
  const dir = path.join(os.homedir(), ".p31");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    url: u.href,
    cwd: process.cwd(),
  });
  const logFile = path.join(dir, "bookmarks.jsonl");
  fs.appendFileSync(logFile, line + "\n", "utf8");

  const pulse = path.join(dir, "mesh-touch-pulse.json");
  fs.writeFileSync(
    pulse,
    JSON.stringify({ type: "bookmark", ts: Date.now(), url: u.href }),
    "utf8"
  );

  console.log("bookmarked:", u.href);
  return 0;
}
