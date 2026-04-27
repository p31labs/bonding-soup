#!/usr/bin/env node
/**
 * Integration probe: spawns the mock WebSocket on a free port, runs two clients,
 * asserts family-room playerState + roster + fullSnapshot behavior.
 * Usage: from repo root, `node scripts/bonding-mock-ws-probe.mjs`
 * Requires: devDependency `ws` (repo root)
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createConnection } from "node:net";
import WebSocket from "ws";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const serverPath = join(root, "spikes/mock-ws-server/server.js");
const port = 39000 + Math.floor(Math.random() * 2000);
const room = "go-big-probe";

function waitForPort(p, host = "127.0.0.1", timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tryConnect = () => {
      const c = createConnection({ port: p, host, timeout: 500 }, () => {
        c.end();
        resolve();
      });
      c.on("error", () => {
        if (Date.now() - t0 > timeoutMs) {
          reject(new Error(`Port ${p} not listening within ${timeoutMs}ms`));
        } else {
          setTimeout(tryConnect, 50);
        }
      });
    };
    tryConnect();
  });
}

function waitForMessage(ws, pred, label, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for: ${label}`));
    }, timeoutMs);
    const h = (raw) => {
      let m;
      try {
        m = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (pred(m)) {
        cleanup();
        resolve(m);
      }
    };
    const cleanup = () => {
      clearTimeout(t);
      ws.removeListener("message", h);
    };
    ws.on("message", h);
  });
}

function openSocket(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const t = setTimeout(() => {
      reject(new Error("WebSocket open timeout: " + url));
    }, 15000);
    ws.on("open", () => {
      clearTimeout(t);
      resolve(ws);
    });
    ws.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

let child = null;
async function main() {
  child = spawn(process.execPath, [serverPath], {
    cwd: root,
    env: { ...process.env, MOCK_WS_PORT: String(port) },
    stdio: "ignore",
  });
  child.on("error", (e) => {
    throw e;
  });
  await waitForPort(port);
  const uA = `ws://127.0.0.1:${port}/?room=${encodeURIComponent(
    room
  )}&name=ProbeA`;
  const uB = `ws://127.0.0.1:${port}/?room=${encodeURIComponent(
    room
  )}&name=ProbeB`;
  const a = await openSocket(uA);
  const initA = await waitForMessage(
    a,
    (m) => m.type === "connectionInit" && m.data && m.data.clientId,
    "A connectionInit"
  );
  const idA = initA.data.clientId;
  if (
    !initA.data.localRunbook ||
    initA.data.localRunbook.echo !== "as-above-so-below" ||
    typeof initA.data.localRunbook.port !== "number"
  ) {
    throw new Error(
      "connectionInit.localRunbook (as above / so below) missing or invalid"
    );
  }
  if (initA.data.roster && initA.data.roster.length !== 0) {
    throw new Error("Expected A to be first in room (empty roster at init)");
  }
  const b = await openSocket(uB);
  const initB = await waitForMessage(
    b,
    (m) => m.type === "connectionInit" && m.data && m.data.clientId,
    "B connectionInit"
  );
  const rb = initB.data.roster;
  if (!Array.isArray(rb) || !rb.some((x) => x.displayName === "ProbeA")) {
    throw new Error(
      "B connectionInit should list ProbeA in roster: " + JSON.stringify(rb)
    );
  }
  a.send(
    JSON.stringify({
      type: "playerState",
      molecules: [
        {
          id: "pm1",
          x: 100,
          y: 200,
          vx: 0,
          vy: 0,
          element: "O",
          personality: "mediator",
        },
      ],
    })
  );
  const upd = await waitForMessage(
    b,
    (m) =>
      m.type === "moleculeStateUpdate" &&
      m.data &&
      m.data.molecules &&
      m.data.molecules.length > 0 &&
      m.data.fullSnapshot === true,
    "B moleculeStateUpdate (fullSnapshot)"
  );
  const wantId = `${idA}/pm1`;
  if (!upd.data.molecules.some((mol) => mol.id === wantId)) {
    throw new Error(
      "Expected remote molecule id " +
        wantId +
        " got " +
        JSON.stringify(upd.data.molecules.map((m) => m.id))
    );
  }
  a.close();
  b.close();
  if (child) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
    child = null;
  }
  console.log("bonding-mock-ws-probe: OK (room", room, "port", port + ")");
  process.exit(0);
}

main().catch((err) => {
  console.error("bonding-mock-ws-probe: FAIL", err);
  if (child) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  process.exit(1);
});

process.on("exit", () => {
  if (child) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
});
