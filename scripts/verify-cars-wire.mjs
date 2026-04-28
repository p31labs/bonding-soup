#!/usr/bin/env node
/**
 * p31.carsWire/0.1.0 — mock server + SoupEngine + @p31/shared/cars-wire.ts stay aligned.
 * Source of record: cars-contract/p31.carsWire.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const contractPath = path.join(root, "cars-contract", "p31.carsWire.json");
const sharedWirePath = path.join(
  root,
  "andromeda",
  "04_SOFTWARE",
  "packages",
  "shared",
  "src",
  "cars-wire.ts",
);

function die(msg, code = 1) {
  console.error("verify-cars-wire:", msg);
  process.exit(code);
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function hasSoupCase(soupTs, t) {
  const q = `case '${t}'`;
  const d = `case "${t}"`;
  return soupTs.includes(q) || soupTs.includes(d);
}

function hasServerTypeLine(serverJs, t) {
  const a = `type: '${t}'`;
  const b = `type: "${t}"`;
  return serverJs.includes(a) || serverJs.includes(b);
}

function hasClientOutbound(soupTs, t) {
  const patterns =
    t === "ping"
      ? [`type: 'ping'`, 'type: "ping"']
      : t === "playerState"
        ? [`type: 'playerState'`, 'type: "playerState"']
        : [`type: 'heartbeat'`, 'type: "heartbeat"']; // heartbeat
  return patterns.some((p) => soupTs.includes(p));
}

/**
 * Parsed array literal for `export const Name = [ ... ] as const` — bracket depth (not naive `.*?`)
 * avoids matching `(typeof Foo)[number]` tails later in the file.
 *
 * @param {string} src
 * @param {string} exportName
 * @returns {string[] | null}
 */
function extractAsConstStringArray(src, exportName) {
  const anchor = `export const ${exportName} = [`;
  const startIdx = src.indexOf(anchor);
  if (startIdx === -1) return null;
  let depth = 0;
  const openBracket = startIdx + anchor.length - 1;
  if (src[openBracket] !== "[") return null;
  depth = 1;
  let j = openBracket + 1;
  while (j < src.length && depth > 0) {
    const c = src[j];
    if (c === "[") depth++;
    else if (c === "]") depth--;
    j++;
  }
  if (depth !== 0) return null;
  const inner = src.slice(openBracket + 1, j - 1);
  const out = [];
  for (const m of inner.matchAll(/'([^']+)'|"([^"]+)"/g)) {
    out.push(m[1] || m[2]);
  }
  return out.length ? out : null;
}

/**
 * @param {string} a
 * @param {string} b
 */
function assertSameArray(a, labelA, b, labelB) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    die(`${labelA} ≠ ${labelB}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`, 1);
  }
}

function verifySharedParity(data, sharedSrc) {
  const schema = data.schema;
  const m = sharedSrc.match(
    /export const CARS_WIRE_SCHEMA = '(p31\.carsWire\/[^']+)'/,
  );
  if (!m || m[1] !== schema) {
    die(
      `@p31/shared cars-wire.ts must export CARS_WIRE_SCHEMA = '${schema}' (contract JSON)`,
      1,
    );
  }

  if (!sharedSrc.includes("export const CARS_WORLD_BOUNDS_PX = { width: 1600, height: 800 }")) {
    die("cars-wire.ts CARS_WORLD_BOUNDS_PX must be { width: 1600, height: 800 }", 1);
  }
  if (
    !sharedSrc.includes("export const CARS_HEARTBEAT_INTERVAL_MS = 5000") ||
    !sharedSrc.includes("export const CARS_MOLECULE_BROADCAST_INTERVAL_MS = 500")
  ) {
    die(
      "cars-wire.ts intervals must match contract heartbeatIntervalMs=5000, moleculeBroadcastIntervalMs=500",
      1,
    );
  }

  const inbound = data.soupEngine?.handlesIncomingTypes || [];
  const serverOut = data.mockServer?.sendsToClientTypes || [];
  const mockAccepts = data.mockServer?.acceptsClientParsingTypes || [];
  const clientOut = data.browserClientOutbound?.sendsTypes || [];

  const expInbound = extractAsConstStringArray(sharedSrc, "CARS_SOUP_ENGINE_INBOUND_TYPES");
  const expServer = extractAsConstStringArray(sharedSrc, "CARS_MOCK_SERVER_TO_CLIENT_TYPES");
  const expMockAcc = extractAsConstStringArray(sharedSrc, "CARS_MOCK_ACCEPTS_CLIENT_TYPES");
  const expBrowser = extractAsConstStringArray(sharedSrc, "CARS_BROWSER_CLIENT_OUTBOUND_TYPES");

  if (!expInbound || !expServer || !expMockAcc || !expBrowser) {
    die("cars-wire.ts missing one of the exported `as const` string arrays", 1);
  }

  assertSameArray(inbound, "contract soupEngine.handlesIncomingTypes", expInbound, "CARS_SOUP_ENGINE_INBOUND_TYPES");
  assertSameArray(
    serverOut,
    "contract mockServer.sendsToClientTypes",
    expServer,
    "CARS_MOCK_SERVER_TO_CLIENT_TYPES",
  );
  assertSameArray(
    mockAccepts,
    "contract mockServer.acceptsClientParsingTypes",
    expMockAcc,
    "CARS_MOCK_ACCEPTS_CLIENT_TYPES",
  );
  assertSameArray(
    clientOut,
    "contract browserClientOutbound.sendsTypes",
    expBrowser,
    "CARS_BROWSER_CLIENT_OUTBOUND_TYPES",
  );
}

function main() {
  if (!fs.existsSync(contractPath)) die("missing cars-contract/p31.carsWire.json", 1);
  let data;
  try {
    data = JSON.parse(read(contractPath));
  } catch (e) {
    die("invalid JSON: " + (e && e.message), 1);
  }
  if (!data.schema || !String(data.schema).startsWith("p31.carsWire/")) {
    die(`expected schema p31.carsWire/*, got ${data.schema || "(none)"}`, 1);
  }

  const soupPath = path.join(root, "src", "soup.ts");
  const serverPath = path.join(root, "spikes", "mock-ws-server", "server.js");
  if (!fs.existsSync(soupPath)) die("missing src/soup.ts", 1);
  if (!fs.existsSync(serverPath)) die("missing spikes/mock-ws-server/server.js", 1);

  const soupTs = read(soupPath);
  const serverJs = read(serverPath);

  const inbound = data.soupEngine?.handlesIncomingTypes || [];
  for (const t of inbound) {
    if (!hasSoupCase(soupTs, t)) {
      die(`soup.ts missing switch case for inbound type: "${t}"`, 1);
    }
  }

  const serverOut = data.mockServer?.sendsToClientTypes || [];
  for (const t of serverOut) {
    if (!hasServerTypeLine(serverJs, t)) {
      die(`mock server missing outbound type: "${t}"`, 1);
    }
  }

  const clientOut = data.browserClientOutbound?.sendsTypes || [];
  for (const t of clientOut) {
    if (!hasClientOutbound(soupTs, t)) {
      die(`soup.ts missing client send payload type: "${t}"`, 1);
    }
  }

  const w = data.moleculePayloadFields?.worldBoundsPx;
  if (!w || w.width !== 1600 || w.height !== 800) {
    die("moleculePayloadFields.worldBoundsPx must be { width: 1600, height: 800 } (match mock server WORLD_W/H)", 1);
  }

  if (
    !serverJs.includes("WORLD_W") ||
    !serverJs.includes("WORLD_H") ||
    !serverJs.includes("1600") ||
    !serverJs.includes("800")
  ) {
    die("mock server must retain WORLD_W/WORLD_H consistent with contract worldBoundsPx", 1);
  }

  if (!fs.existsSync(sharedWirePath)) {
    die(
      "missing andromeda/04_SOFTWARE/packages/shared/src/cars-wire.ts — clone Andromeda for @p31/shared parity",
      1,
    );
  }
  verifySharedParity(data, read(sharedWirePath));

  console.log(
    "verify-cars-wire: OK — contract",
    data.schema,
    "↔ soup.ts (",
    inbound.length,
    "in /",
    clientOut.length,
    "out)",
    "↔ mock server (",
    serverOut.length,
    "out)",
    "↔ @p31/shared/cars-wire.ts",
  );
}

main();
