/**
 * Append-only social / ops event log (~/.p31/p31-events.jsonl).
 * Subscribers: operator desk, bot fleet hooks, future mesh assistants.
 * Schema: p31.socialEvent/1.0.0
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCHEMA = "p31.socialEvent/1.0.0";
const MAX_FILE_BYTES = 512 * 1024;
const MAX_LINES_TAIL = 500;

function eventsPath() {
  return path.join(os.homedir(), ".p31", "p31-events.jsonl");
}

function ensureDir() {
  const d = path.dirname(eventsPath());
  fs.mkdirSync(d, { recursive: true });
}

/**
 * @param {{ kind: string, source?: string, payload?: unknown }} ev
 */
export function appendSocialEvent(ev) {
  const kind = String(ev.kind || "").trim();
  if (!kind) return;
  ensureDir();
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    schema: SCHEMA,
    kind,
    source: ev.source ? String(ev.source) : "unknown",
    payload: ev.payload !== undefined ? ev.payload : null,
  });
  try {
    const p = eventsPath();
    if (fs.existsSync(p) && fs.statSync(p).size > MAX_FILE_BYTES) {
      rotateTruncate(p);
    }
    fs.appendFileSync(p, line + "\n", "utf8");
  } catch {
    /* best-effort */
  }
}

function rotateTruncate(p) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const keep = lines.slice(-Math.floor(MAX_LINES_TAIL / 2));
    fs.writeFileSync(p, keep.join("\n") + "\n", "utf8");
  } catch {
    /* ignore */
  }
}

/**
 * @param {number} [maxLines]
 * @returns {object[]}
 */
export function readRecentSocialEvents(maxLines = 64) {
  const p = eventsPath();
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const slice = lines.slice(-maxLines);
    const out = [];
    for (const ln of slice) {
      try {
        out.push(JSON.parse(ln));
      } catch {
        /* skip bad line */
      }
    }
    return out;
  } catch {
    return [];
  }
}
